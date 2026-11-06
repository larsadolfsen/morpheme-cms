// Tests themeFilter.mjs: search words, the installed filter (also under a legacy id) and the order.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterThemes } from './themeFilter.mjs';

const list = [
  { id: 'b', name: 'Beta', words: 'beta calm' },
  { id: 'new-a', legacy: 'old-a', name: 'Alpha', words: 'alpha bold' },
];
const compare = (a, b) => a.localeCompare(b);
const base = { query: '', state: '', sort: 'az', installed: () => false, compare };
const ids = (x) => x.map((t) => t.id);

test('words must all be found, and the order is A-Z or Z-A', () => {
  assert.deepEqual(ids(filterThemes(list, base)), ['new-a', 'b']);
  assert.deepEqual(ids(filterThemes(list, { ...base, sort: 'za' })), ['b', 'new-a']);
  assert.deepEqual(ids(filterThemes(list, { ...base, query: 'calm be' })), ['b']);
});

test('a theme installed under its legacy id counts as installed', () => {
  const installed = (id, legacy) => id === 'old-a' || legacy === 'old-a';
  assert.deepEqual(ids(filterThemes(list, { ...base, state: 'installed', installed })), ['new-a']);
  assert.deepEqual(ids(filterThemes(list, { ...base, state: 'notInstalled', installed })), ['b']);
});
