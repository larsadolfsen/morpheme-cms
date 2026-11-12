// Tests themeFilter.mjs: search words, the installed filter and the order.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterThemes } from './themeFilter.mjs';

const list = [
  { id: 'b', name: 'Beta', words: 'beta calm' },
  { id: 'a', name: 'Alpha', words: 'alpha bold' },
];
const compare = (a, b) => a.localeCompare(b);
const base = { query: '', state: '', sort: 'az', installed: () => false, compare };
const ids = (x) => x.map((t) => t.id);

test('words must all be found, and the order is A-Z or Z-A', () => {
  assert.deepEqual(ids(filterThemes(list, base)), ['a', 'b']);
  assert.deepEqual(ids(filterThemes(list, { ...base, sort: 'za' })), ['b', 'a']);
  assert.deepEqual(ids(filterThemes(list, { ...base, query: 'calm be' })), ['b']);
});

test('the installed filter keeps installed or not installed themes', () => {
  const installed = (id) => id === 'a';
  assert.deepEqual(ids(filterThemes(list, { ...base, state: 'installed', installed })), ['a']);
  assert.deepEqual(ids(filterThemes(list, { ...base, state: 'notInstalled', installed })), ['b']);
});
