// Tests for lib/announce.ts: the editor's one announcer (two persistent live regions, clear then set in the next frame, removed after a few seconds).
// A tiny fake page stands in for the browser; Node strips the types. Exposes nothing.
import assert from 'node:assert/strict';
import test from 'node:test';

function fakePage() {
  const frames = [];
  const timers = [];
  const el = (tag) => {
    const node = {
      tag,
      attrs: {},
      dataset: {},
      children: [],
      textContent: '',
      isConnected: false,
      className: '',
      setAttribute(k, v) {
        node.attrs[k] = v;
      },
      append(...kids) {
        for (const k of kids) (node.children.push(k), (k.isConnected = node.isConnected));
      },
      remove() {
        node.isConnected = false;
        for (const k of node.children) k.isConnected = false;
      },
    };
    return node;
  };
  const body = el('body');
  body.isConnected = true;
  const origAppend = body.append;
  body.append = (...kids) => {
    for (const k of kids) {
      body.children.push(k);
      k.isConnected = true;
      for (const c of k.children) c.isConnected = true;
    }
  };
  void origAppend;
  globalThis.document = { body, createElement: el };
  globalThis.requestAnimationFrame = (fn) => frames.push(fn);
  globalThis.cancelAnimationFrame = (id) => {
    frames[id - 1] = () => {};
  };
  const realSet = globalThis.setTimeout;
  const realClear = globalThis.clearTimeout;
  globalThis.setTimeout = (fn, ms) => timers.push({ fn, ms, on: true });
  globalThis.clearTimeout = (id) => {
    if (id && timers[id - 1]) timers[id - 1].on = false;
  };
  return {
    body,
    frame: () => frames.splice(0).forEach((f) => f()),
    elapse: () => timers.splice(0).forEach((t) => t.on && t.fn()),
    restore() {
      globalThis.setTimeout = realSet;
      globalThis.clearTimeout = realClear;
    },
  };
}

async function load() {
  const page = fakePage();
  const mod = await import(`./announce.ts?${Math.random()}`);
  const [polite, assertive] = (mod.ensureAnnouncer(), page.body.children[0].children);
  return { page, mod, polite, assertive };
}

test('the two regions are made once, with their roles, before any message', async () => {
  const { page, mod, polite, assertive } = await load();
  assert.equal(polite.attrs.role, 'status');
  assert.equal(assertive.attrs.role, 'alert');
  assert.equal(polite.textContent, '');
  mod.ensureAnnouncer();
  mod.announce('Saved');
  assert.equal(page.body.children.length, 1, 'one host');
  page.restore();
});

test('a message is set in the next frame, not at once', async () => {
  const { page, mod, polite } = await load();
  mod.announce('Saved');
  assert.equal(polite.textContent, '');
  page.frame();
  assert.equal(polite.textContent, 'Saved');
  page.restore();
});

test('the same text twice is cleared between, so it is read twice', async () => {
  const { page, mod, polite } = await load();
  const seen = [];
  let value = '';
  Object.defineProperty(polite, 'textContent', {
    get: () => value,
    set(v) {
      value = v;
      seen.push(v);
    },
  });
  mod.announce('Saved');
  page.frame();
  mod.announce('Saved');
  page.frame();
  assert.deepEqual(seen, ['', 'Saved', '', 'Saved']);
  page.restore();
});

test('urgent goes to the assertive region and the rest to the polite one', async () => {
  const { page, mod, polite, assertive } = await load();
  mod.announce('Not saved', { urgent: true });
  mod.announce('Saving');
  page.frame();
  assert.equal(assertive.textContent, 'Not saved');
  assert.equal(polite.textContent, 'Saving');
  page.restore();
});

test('a newer message replaces one not yet set, and an empty text says nothing', async () => {
  const { page, mod, polite } = await load();
  mod.announce('Saving');
  mod.announce('Saved');
  mod.announce('   ');
  page.frame();
  assert.equal(polite.textContent, 'Saved');
  page.restore();
});

test('the text is taken away after a few seconds', async () => {
  const { page, mod, polite } = await load();
  mod.announce('Saved');
  page.frame();
  page.elapse();
  assert.equal(polite.textContent, '');
  page.restore();
});

test('the regions come back if the page lost them', async () => {
  const { page, mod } = await load();
  mod.resetAnnouncer();
  mod.announce('Saved');
  page.frame();
  assert.equal(page.body.children.at(-1).children[0].textContent, 'Saved');
  page.restore();
});

test('progressStep gives the last 25 % step, never each percent', async () => {
  const { progressStep } = await import('./announce.ts');
  assert.deepEqual([0, 0.1, 0.24, 0.25, 0.5, 0.74, 0.99, 1, 2, -1].map(progressStep), [0, 0, 0, 25, 50, 50, 75, 100, 100, 0]);
});
