// Tests for src/autosave.mjs with fake timers and a fake Worker. Run: node --test src/autosave.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { autosaveClient, createAutosave, deleteAutosave, loadAutosave, restorable, watchLeaving } from './autosave.mjs';

// A clock the test moves: timers run in order of their time.
function clock() {
  let now = 0;
  let next = 1;
  const timers = new Map();
  return {
    setTimer: (fn, ms) => (timers.set(next, { at: now + ms, fn }), next++),
    clearTimer: (id) => timers.delete(id),
    async tick(ms) {
      const end = now + ms;
      for (;;) {
        const due = [...timers].filter(([, t]) => t.at <= end).sort(([, a], [, b]) => a.at - b.at)[0];
        if (!due) break;
        timers.delete(due[0]);
        now = due[1].at;
        due[1].fn();
        await settle();
      }
      now = end;
    },
    pending: () => timers.size,
  };
}
const settle = () => new Promise((r) => setImmediate(r));
function make(answers = []) {
  const c = clock();
  const calls = [];
  const send = async (call) => {
    calls.push(call);
    return answers.length ? answers.shift() : { ok: true };
  };
  const a = createAutosave({ send, ...c, debounce: 100, idle: 10_000, retries: [10, 20] });
  const states = [];
  a.subscribe((s) => states.push(s));
  return { a, c, calls, states };
}

test('changes are sent once after the debounce, with the newest text', async () => {
  const { a, c, calls, states } = make();
  a.autosave('src/content/a.md', 'one');
  a.autosave('src/content/a.md', 'two');
  assert.equal(a.state(), 'saving');
  await c.tick(99);
  assert.equal(calls.length, 0);
  await c.tick(1);
  assert.deepEqual(calls, [{ action: 'put', path: 'src/content/a.md', id: 'waiting', text: 'two' }]);
  assert.equal(a.state(), 'saved');
  assert.deepEqual(states, ['saving', 'saved']);
});

test('a change while sending is sent after', async () => {
  const c = clock();
  const calls = [];
  let release;
  const send = (call) => (calls.push(call), new Promise((r) => (release = () => r({ ok: true }))));
  const a = createAutosave({ send, ...c, debounce: 100, idle: 10_000 });
  a.autosave('src/content/a.md', 'one');
  await c.tick(100);
  a.autosave('src/content/a.md', 'two');
  release();
  await settle();
  assert.equal(a.state(), 'saving');
  await c.tick(100);
  release();
  await settle();
  assert.deepEqual(
    calls.map((x) => x.text),
    ['one', 'two'],
  );
  assert.equal(a.state(), 'saved');
});

test('a failed send is tried again, then the state is notSaved until retry', async () => {
  const { a, c, calls } = make([{ ok: false }, { ok: false }, { ok: false }]);
  a.autosave('src/content/a.md', 'x');
  await c.tick(100);
  assert.equal(a.state(), 'saving');
  await c.tick(10);
  await c.tick(20);
  assert.equal(calls.length, 3);
  assert.equal(a.state(), 'notSaved');
  await a.retry();
  assert.equal(calls.length, 4);
  assert.equal(a.state(), 'saved');
});

test('a thrown send counts as a failure, and a new change tries again', async () => {
  const c = clock();
  let fail = true;
  const send = async () => {
    if (fail) throw new Error('offline');
    return { ok: true };
  };
  const a = createAutosave({ send, ...c, debounce: 100, idle: 10_000, retries: [] });
  a.autosave('src/content/a.md', 'x');
  await c.tick(100);
  assert.equal(a.state(), 'notSaved');
  fail = false;
  a.autosave('src/content/a.md', 'y');
  await c.tick(100);
  assert.equal(a.state(), 'saved');
});

test('with R2 caching off the state is notSaved and nothing more is sent', async () => {
  const { a, c, calls } = make([{ ok: false, off: true }]);
  a.autosave('src/content/a.md', 'x');
  await c.tick(100);
  assert.equal(a.state(), 'notSaved');
  a.autosave('src/content/a.md', 'y');
  await c.tick(20_000);
  assert.equal(calls.length, 1);
  assert.equal(await a.flush('src/content/a.md'), false);
});

test('after the idle time the text goes to git, with the change not yet sent', async () => {
  const { a, c, calls } = make();
  a.autosave('src/content/a.md', 'x');
  await c.tick(100);
  await c.tick(10_000);
  assert.deepEqual(
    calls.map((x) => [x.action, x.text]),
    [
      ['put', 'x'],
      ['flush', undefined],
    ],
  );
  assert.equal(a.state(), 'saved');
  assert.equal(c.pending(), 0);
});

test('leaving sends the text with a flush in one request, for each page not yet in git', async () => {
  const { a, c, calls } = make();
  a.autosave('src/content/a.md', 'x');
  a.autosave('src/content/b.md', 'y', 'later');
  await a.leave();
  assert.deepEqual(
    calls.map((x) => [x.action, x.path, x.id, x.text, x.leaving]),
    [
      ['flush', 'src/content/a.md', 'waiting', 'x', true],
      ['flush', 'src/content/b.md', 'later', 'y', true],
    ],
  );
  assert.equal(a.state(), 'saved');
  assert.equal(c.pending(), 0);
  await a.leave();
  assert.equal(calls.length, 2);
});

test('a failed flush leaves the text to be sent again', async () => {
  const { a, c, calls } = make([{ ok: false }]);
  a.autosave('src/content/a.md', 'x');
  await a.leave();
  assert.equal(a.state(), 'notSaved');
  await a.retry();
  assert.deepEqual(
    calls.map((x) => x.action),
    ['flush', 'put'],
  );
  assert.equal(a.state(), 'saved');
  assert.equal(c.pending(), 1);
});

test('forget stops the timers and the state is saved', async () => {
  const { a, c } = make();
  a.autosave('src/content/a.md', 'x');
  a.forget('src/content/a.md');
  assert.equal(c.pending(), 0);
  assert.equal(a.state(), 'saved');
});

test('the client talks to /api/autosave and understands off, moved and a gone page', async () => {
  const log = [];
  let status = 200;
  let body = {};
  const fetcher = async (url, init) => (
    log.push([url, init.method, JSON.parse(init.body), init.keepalive]),
    { ok: status < 300, status, json: async () => body }
  );
  const c = clock();
  const a = autosaveClient(fetcher, { ...c, debounce: 10 });
  a.autosave('src/content/a.md', 'x');
  await c.tick(10);
  await a.flush('src/content/a.md', 'waiting', { leaving: true });
  assert.deepEqual(log[0].slice(0, 3), ['/api/autosave', 'PUT', { path: 'src/content/a.md', id: 'waiting', text: 'x' }]);
  assert.deepEqual(log[1], ['/api/autosave/flush', 'POST', { path: 'src/content/a.md', id: 'waiting' }, true]);
  status = 409;
  body = { error: 'moved' };
  a.autosave('src/content/a.md', 'y');
  await c.tick(10);
  assert.equal(a.state(), 'saving');
  status = 404;
  body = { error: 'page' };
  assert.equal(await a.flush('src/content/a.md'), true);
  status = 409;
  body = { error: 'off' };
  a.autosave('src/content/a.md', 'z');
  await c.tick(10);
  assert.equal(a.state(), 'notSaved');
});

test('watchLeaving calls leave when the page is hidden or left, and can stop', () => {
  const events = {};
  const target = {
    document: { visibilityState: 'visible', addEventListener: (n, f) => (events[n] = f), removeEventListener: (n) => delete events[n] },
    addEventListener: (n, f) => (events[n] = f),
    removeEventListener: (n) => delete events[n],
  };
  let left = 0;
  const stop = watchLeaving({ leave: () => left++ }, target);
  events.visibilitychange();
  assert.equal(left, 0);
  target.document.visibilityState = 'hidden';
  events.visibilitychange();
  events.pagehide();
  assert.equal(left, 2);
  stop();
  assert.deepEqual(Object.keys(events), []);
});

test('leaving flushes a text the Worker already has, without sending it again', async () => {
  const { a, c, calls } = make();
  a.autosave('src/content/a.md', 'x');
  await c.tick(100);
  assert.equal(a.state(), 'saved');
  await a.leave();
  assert.deepEqual(
    calls.map((x) => [x.action, x.text]),
    [
      ['put', 'x'],
      ['flush', undefined],
    ],
  );
  await a.leave();
  assert.equal(calls.length, 2);
});

test('onFlushed is called when git got a new version, not on leaving', async () => {
  const c = clock();
  const flushed = [];
  const a = createAutosave({
    send: async () => ({ ok: true, committed: true }),
    ...c,
    debounce: 100,
    idle: 1000,
    onFlushed: (d) => flushed.push(d),
  });
  a.autosave('src/content/a.md', 'x');
  await c.tick(100);
  await c.tick(1000);
  assert.deepEqual(flushed, [{ path: 'src/content/a.md', id: 'waiting' }]);
  a.autosave('src/content/a.md', 'y');
  await a.leave();
  assert.equal(flushed.length, 1);
});

test('what git got while the page was left is told to the form when the person is back, once', async () => {
  const flushed = [];
  const a = createAutosave({
    send: async () => ({ ok: true, committed: true, path: 'src/content/b.md' }),
    ...clock(),
    onFlushed: (d) => flushed.push(d),
  });
  a.autosave('src/content/a.md', 'x');
  await a.leave();
  assert.deepEqual(flushed, []);
  a.resume();
  a.resume();
  assert.deepEqual(flushed, [{ path: 'src/content/a.md', id: 'waiting', wrote: 'src/content/b.md' }]);
});

test('watchLeaving resumes the autosave when the page is shown again', () => {
  const events = {};
  const target = {
    document: { visibilityState: 'hidden', addEventListener: (n, f) => (events[n] = f), removeEventListener: (n) => delete events[n] },
    addEventListener: (n, f) => (events[n] = f),
    removeEventListener: (n) => delete events[n],
  };
  const log = [];
  watchLeaving({ leave: () => log.push('leave'), resume: () => log.push('resume') }, target);
  events.visibilitychange();
  target.document.visibilityState = 'visible';
  events.visibilitychange();
  events.pageshow();
  assert.deepEqual(log, ['leave', 'resume', 'resume']);
});

test('loadAutosave and deleteAutosave ask the Worker, and restorable compares with git', async () => {
  const log = [];
  const fetcher = async (url, init = {}) => (
    log.push([url, init.method ?? 'GET']),
    { ok: true, json: async () => ({ text: 't', savedAt: 5 }) }
  );
  assert.deepEqual(await loadAutosave('src/content/a.md', 'waiting', fetcher), { text: 't', savedAt: 5 });
  await deleteAutosave('src/content/a.md', 'waiting', fetcher);
  assert.deepEqual(log, [
    ['/api/autosave?path=src%2Fcontent%2Fa.md&id=waiting', 'GET'],
    ['/api/autosave?path=src%2Fcontent%2Fa.md&id=waiting', 'DELETE'],
  ]);
  assert.equal(await loadAutosave('p', 'waiting', async () => ({ ok: false })), null);
  assert.equal(
    await loadAutosave('p', 'waiting', async () => {
      throw new Error('x');
    }),
    null,
  );
  const stored = { text: 'new', savedAt: 1000 };
  assert.equal(restorable(stored, 'new', null), false);
  assert.equal(restorable(stored, 'old', null), true);
  assert.equal(restorable(stored, 'old', new Date(999)), true);
  assert.equal(restorable(stored, 'old', new Date(1000)), false);
});

test('a new page is sent with `create` and the file it is to be, and the flush tells where the file was made', async () => {
  const c = clock();
  const calls = [];
  const flushed = [];
  const send = async (call) => (
    calls.push(call),
    call.action === 'flush' ? { ok: true, committed: true, path: 'src/content/pages/about-2.md' } : { ok: true }
  );
  const a = createAutosave({ send, ...c, debounce: 100, idle: 10_000, onFlushed: (done) => flushed.push(done) });
  const key = 'src/content/pages/new-entry-ab12.md';
  a.autosave(key, 'one', 'waiting', { create: true, to: 'src/content/pages/about.md' });
  // The H1 changed before anything was sent: the newest name goes.
  a.autosave(key, 'two', 'waiting', { create: true, to: 'src/content/pages/about-us.md' });
  await c.tick(100);
  assert.deepEqual(calls, [{ action: 'put', path: key, id: 'waiting', text: 'two', create: true, to: 'src/content/pages/about-us.md' }]);
  await a.flush(key);
  assert.deepEqual(calls[1], {
    action: 'flush',
    path: key,
    id: 'waiting',
    create: true,
    to: 'src/content/pages/about-us.md',
    leaving: false,
  });
  assert.deepEqual(flushed, [{ path: key, id: 'waiting', wrote: 'src/content/pages/about-2.md' }]);
});

test('the client sends create and to, and reads the path of the file the Worker wrote', async () => {
  const log = [];
  const fetcher = async (url, init) => (
    log.push([url, JSON.parse(init.body)]),
    { ok: true, status: 200, json: async () => ({ committed: true, path: 'src/content/pages/x-2.md' }) }
  );
  const c = clock();
  const done = [];
  const a = autosaveClient(fetcher, { ...c, debounce: 10, onFlushed: (d) => done.push(d) });
  const key = 'src/content/pages/new-entry-1.md';
  a.autosave(key, 't', 'waiting', { create: true, to: 'src/content/pages/x.md' });
  await c.tick(10);
  await a.flush(key);
  assert.deepEqual(log[0][1], { path: key, id: 'waiting', text: 't', create: true, to: 'src/content/pages/x.md' });
  assert.deepEqual(log[1][1], { path: key, id: 'waiting', create: true, to: 'src/content/pages/x.md' });
  assert.equal(done[0].wrote, 'src/content/pages/x-2.md');
});

test('an entry changed back to a plain autosave drops create and to', async () => {
  const { a, c, calls } = make();
  a.autosave('src/content/pages/a.md', 'one', 'waiting', { to: 'src/content/pages/b.md' });
  a.autosave('src/content/pages/a.md', 'two');
  await c.tick(100);
  assert.deepEqual(calls, [{ action: 'put', path: 'src/content/pages/a.md', id: 'waiting', text: 'two' }]);
});
