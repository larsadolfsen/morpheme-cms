import assert from 'node:assert/strict';
import test from 'node:test';
import { viewOfSaved } from './savedView.mjs';

test('a stored menu opens the menu view', () => {
  assert.equal(viewOfSaved('menu'), 'menu');
});

test('a stored list, nothing stored and anything else open the list view', () => {
  assert.equal(viewOfSaved('list'), 'list');
  assert.equal(viewOfSaved(null), 'list');
  assert.equal(viewOfSaved(undefined), 'list');
  assert.equal(viewOfSaved('other'), 'list');
});

// language-ok: 'liste' is the value an earlier version stored (Danish for list)
test('the old stored Danish value reads as the list view, the default, so nothing breaks when it is renamed', () => {
  assert.equal(viewOfSaved('liste'), 'list'); // language-ok
});
