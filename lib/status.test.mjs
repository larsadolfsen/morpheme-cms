import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hiddenFromSearch, isUnlisted, migrateStatus, nofollowLinks, robotsContent, stateOf } from './status.mjs';

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

test('the robots content has all four combinations of noindex and nofollow, and is empty when both are off', () => {
  assert.equal(robotsContent({ noindex: false, nofollow: false }), '');
  assert.equal(robotsContent({}), '');
  assert.equal(robotsContent({ noindex: true, nofollow: false }), 'noindex');
  assert.equal(robotsContent({ noindex: false, nofollow: true }), 'nofollow');
  assert.equal(robotsContent({ noindex: true, nofollow: true }), 'noindex, nofollow');
});

test('nofollow is read from the page or post itself, and is off by default', () => {
  assert.equal(nofollowLinks({}), false);
  assert.equal(nofollowLinks({ nofollow: false }), false);
  assert.equal(nofollowLinks({ nofollow: true }), true);
  assert.equal(nofollowLinks({ nofollow: 'true' }), true);
  // A post that is only unlisted keeps its links followed.
  assert.equal(nofollowLinks({ unlisted: true }), false);
});
