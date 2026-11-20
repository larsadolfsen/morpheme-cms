// Tests for sheetCopy.mjs: the hidden copy of a block's sheet below expanded. Run: node --test src/sheetCopy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { keep, take, drop, matches, KEEP_DAYS } from './sheetCopy.mjs';

// A storage like localStorage, in memory.
function memory() {
  const items = new Map();
  return {
    items,
    getItem: (k) => (items.has(k) ? items.get(k) : null),
    setItem: (k, v) => void items.set(k, String(v)),
    removeItem: (k) => void items.delete(k),
  };
}
// A storage that throws on every access (a private window, blocked site data).
const broken = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
  removeItem() {
    throw new Error('blocked');
  },
};

const DAY = 24 * 60 * 60 * 1000;
const block = { index: 2, type: 'faq', before: { title: 'Questions', max: 5 } };

test('keep then take gives the copy back, one per page', () => {
  const store = memory();
  keep('src/content/pages/about.md', block, { title: 'Questions and answers', max: 5 }, { store, now: 1000 });
  keep('src/content/pages/team.md', { ...block, index: 0 }, { title: 'Team' }, { store, now: 2000 });
  const copy = take('src/content/pages/about.md', { store });
  assert.deepEqual(copy, {
    page: 'src/content/pages/about.md',
    block,
    values: { title: 'Questions and answers', max: 5 },
    at: 1000,
  });
  assert.equal(take('src/content/pages/team.md', { store }).block.index, 0);
  assert.equal(store.items.size, 2);
});

test('a later keep replaces the page’s copy', () => {
  const store = memory();
  keep('p', block, { title: 'A' }, { store, now: 1 });
  keep('p', block, { title: 'AB' }, { store, now: 2 });
  assert.deepEqual(take('p', { store }).values, { title: 'AB' });
  assert.equal(store.items.size, 1);
});

test('drop deletes only that page’s copy', () => {
  const store = memory();
  keep('p', block, { title: 'A' }, { store });
  keep('q', block, { title: 'B' }, { store });
  drop('p', { store });
  assert.equal(take('p', { store }), null);
  assert.ok(take('q', { store }));
});

test('take gives null for no copy, a copy that is not JSON, or one of another shape', () => {
  const store = memory();
  assert.equal(take('p', { store }), null);
  store.setItem('editor-sheet-copy:p', '{not json');
  assert.equal(take('p', { store }), null);
  store.setItem('editor-sheet-copy:p', JSON.stringify({ page: 'p', block: { index: '2', type: 'faq' }, values: {}, at: 1 }));
  assert.equal(take('p', { store }), null);
  store.setItem('editor-sheet-copy:p', JSON.stringify({ page: 'other', block, values: {}, at: 1 }));
  assert.equal(take('p', { store }), null);
});

test('a storage that throws is ignored', () => {
  assert.doesNotThrow(() => keep('p', block, {}, { store: broken }));
  assert.equal(take('p', { store: broken }), null);
  assert.doesNotThrow(() => drop('p', { store: broken }));
});

test('no page: nothing kept', () => {
  const store = memory();
  keep('', block, { title: 'A' }, { store });
  assert.equal(store.items.size, 0);
  assert.equal(take('', { store }), null);
});

test('matches: the same index, type and props as before, younger than 7 days', () => {
  const copy = { page: 'p', block, values: { title: 'New' }, at: 0 };
  const here = { index: 2, type: 'faq', props: { max: 5, title: 'Questions' } };
  assert.equal(matches(copy, here, { now: DAY }), true, 'the order of the keys does not count');
  assert.equal(matches(copy, here, { now: (KEEP_DAYS - 1) * DAY }), true);
  assert.equal(matches(copy, here, { now: KEEP_DAYS * DAY }), false, '7 days old');
  assert.equal(matches(copy, { ...here, index: 3 }, { now: DAY }), false, 'another index');
  assert.equal(matches(copy, { ...here, type: 'list' }, { now: DAY }), false, 'another type');
  assert.equal(matches(copy, { ...here, props: { title: 'Changed', max: 5 } }, { now: DAY }), false, 'props changed since');
  assert.equal(matches(copy, null, { now: DAY }), false, 'no block there');
  assert.equal(matches(null, here, { now: DAY }), false, 'no copy');
});

test('matches compares nested props', () => {
  const before = { items: [{ q: 'A', a: 'B' }], crop: { x: 1, y: 2 } };
  const copy = { page: 'p', block: { index: 0, type: 'faq', before }, values: {}, at: 0 };
  assert.equal(matches(copy, { index: 0, type: 'faq', props: { crop: { y: 2, x: 1 }, items: [{ a: 'B', q: 'A' }] } }, { now: 1 }), true);
  assert.equal(matches(copy, { index: 0, type: 'faq', props: { crop: { y: 2, x: 1 }, items: [] } }, { now: 1 }), false);
});
