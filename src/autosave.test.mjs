// Tests for src/autosave.mjs with fake timers and a fake Worker. Run: node --test src/autosave.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { autosaveClient, createAutosave, watchLeaving } from './autosave.mjs';

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

test('with Faster editor off the state is notSaved and nothing more is sent', async () => {
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
  assert.deepEqual(log[1], ['/api/autosave/flush', 'POST', { path: 'src/content/a.md', id: 'waiting', text: 'x' }, true]);
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
