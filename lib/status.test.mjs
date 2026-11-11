import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hiddenFromSearch, migrateStatus, stateOf } from './status.mjs';

test('a stored unlisted is published and hidden from search engines', () => {
  assert.equal(stateOf({ status: 'unlisted' }), 'published');
  assert.equal(hiddenFromSearch({ status: 'unlisted' }), true);
  assert.equal(hiddenFromSearch({ noindex: true }), true);
  assert.equal(hiddenFromSearch({}), false);
});

test('migrateStatus turns unlisted into noindex and leaves the rest alone', () => {
  assert.deepEqual(migrateStatus({ title: 'a', status: 'unlisted' }), { title: 'a', noindex: true });
  const draft = { status: 'draft' };
  assert.equal(migrateStatus(draft), draft);
});
