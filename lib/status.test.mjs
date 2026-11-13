import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hiddenFromSearch, isUnlisted, migrateStatus, stateOf } from './status.mjs';

test('a stored unlisted page is published and hidden from search engines', () => {
  assert.equal(stateOf({ status: 'unlisted' }), 'published');
  assert.equal(hiddenFromSearch({ status: 'unlisted' }), true);
  assert.equal(hiddenFromSearch({ noindex: true }), true);
  assert.equal(hiddenFromSearch({}), false);
});

test('a post that is not on the blog is published and still open to search engines', () => {
  for (const data of [{ unlisted: true }, { unlisted: 'true' }, { status: 'unlisted' }]) {
    assert.equal(isUnlisted(data), true);
    assert.equal(stateOf(data), 'published');
    assert.equal(hiddenFromSearch(data, 'post'), false);
  }
  assert.equal(isUnlisted({}), false);
  assert.equal(isUnlisted({ unlisted: false }), false);
  assert.equal(hiddenFromSearch({ unlisted: true, noindex: true }, 'post'), true);
});

test('migrateStatus turns unlisted into noindex on a page and into unlisted: true on a post, and leaves the rest alone', () => {
  assert.deepEqual(migrateStatus({ title: 'a', status: 'unlisted' }), { title: 'a', noindex: true });
  assert.deepEqual(migrateStatus({ title: 'a', status: 'unlisted' }, 'post'), { title: 'a', unlisted: true });
  const draft = { status: 'draft' };
  assert.equal(migrateStatus(draft), draft);
  assert.equal(migrateStatus(draft, 'post'), draft);
});
