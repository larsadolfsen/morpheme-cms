// Tests levelStep.mjs: the modal main menu's second level as a step in the history, with a fake window whose history
// fires popstate as the browser's does (a step back on the same address: no hashchange).
// Run: node --test src/levelStep.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelStep } from './levelStep.mjs';

function fakeWindow(hash = '#list/pages') {
  const listeners = { popstate: new Set(), click: new Set() };
  const entries = [{ state: { at: 3, prev: '' }, hash }];
  let index = 0;
  const win = {
    location: {
      get hash() {
        return entries[index].hash;
      },
      set hash(next) {
        entries.splice(index + 1);
        entries.push({ state: null, hash: next });
        index += 1;
      },
    },
    history: {
      get state() {
        return entries[index].state;
      },
      pushState(state) {
        entries.splice(index + 1);
        entries.push({ state, hash: entries[index].hash });
        index += 1;
      },
      back() {
        index -= 1;
        for (const l of listeners.popstate) l();
      },
    },
    addEventListener: (type, l) => listeners[type].add(l),
    removeEventListener: (type, l) => listeners[type].delete(l),
    document: {
      addEventListener: (type, l) => listeners[type].add(l),
      removeEventListener: (type, l) => listeners[type].delete(l),
    },
  };
  const click = (href, extra = {}) => {
    const a = { getAttribute: (name) => (name === 'href' ? href : (extra[name] ?? null)) };
    const e = {
      button: 0,
      defaultPrevented: false,
      target: { closest: () => a },
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    for (const l of listeners.click) l(e);
    return e;
  };
  return { win, entries: () => entries.slice(0, index + 1), click, listeners };
}

test('the level shown adds a step with the same address and place', () => {
  const { win, entries } = fakeWindow();
  levelStep(win).set(true, () => {});
  assert.equal(entries().length, 2);
  assert.equal(entries()[1].hash, '#list/pages');
  assert.deepEqual(entries()[1].state, { at: 3, prev: '', level: true });
});

test('the back gesture on the level shows the first level and stays on the screen', () => {
  const { win, entries } = fakeWindow();
  let first = 0;
  levelStep(win).set(true, () => (first += 1));
  win.history.back();
  assert.equal(first, 1);
  assert.equal(entries().length, 1);
  assert.equal(win.location.hash, '#list/pages');
});

test('leaving the level another way takes the step out, without the first level called again', () => {
  const { win, entries } = fakeWindow();
  let first = 0;
  const step = levelStep(win);
  step.set(true, () => (first += 1));
  step.set(false, () => (first += 1));
  assert.equal(entries().length, 1);
  assert.equal(first, 0);
});

test('a link on the level is followed after the step is out: no empty step', () => {
  const { win, entries, click } = fakeWindow();
  const step = levelStep(win);
  step.set(true, () => {});
  const e = click('#list/posts');
  assert.equal(e.defaultPrevented, true);
  assert.deepEqual(
    entries().map((s) => s.hash),
    ['#list/pages', '#list/posts'],
  );
  // The drawer closes on the link: nothing more to take out.
  step.set(false, () => {});
  assert.equal(entries().length, 2);
});

test('links are left alone at the first level and in a new tab', () => {
  const { win, click } = fakeWindow();
  const step = levelStep(win);
  assert.equal(click('#list/posts').defaultPrevented, false);
  step.set(true, () => {});
  assert.equal(click('#list/posts', { target: '_blank' }).defaultPrevented, false);
});

test('stop takes the step out and stops listening', () => {
  const { win, entries, listeners } = fakeWindow();
  const step = levelStep(win);
  step.set(true, () => {});
  step.stop();
  assert.equal(entries().length, 1);
  assert.equal(listeners.popstate.size, 0);
  assert.equal(listeners.click.size, 0);
});
