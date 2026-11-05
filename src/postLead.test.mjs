// Tests for isPostPage (draft.post) and leadFill (postLead.mjs).
// Run with: node --test src/postLead.test.mjs
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { isPostPage, leadFill } from './postLead.mjs';

test('a post with a paragraph first has a lead', () => {
  assert.deepEqual(leadFill('<p>Hi</p><h2>A</h2>', true), { lead: '<p>Hi</p>', rest: '<h2>A</h2>' });
});

test('a post with a heading first has no lead', () => {
  assert.deepEqual(leadFill('<h2>A</h2><p>Hi</p>', true), { lead: '', rest: '<h2>A</h2><p>Hi</p>' });
});

test('a page with a paragraph first stays unsplit', () => {
  assert.deepEqual(leadFill('<p>Hi</p><h2>A</h2>', false), { lead: '', rest: '<p>Hi</p><h2>A</h2>' });
});

test('a post without a picture, text starting with a paragraph, has a lead', () => {
  const isPost = isPostPage({ post: true });
  assert.deepEqual(leadFill('<p>Hi</p>', isPost), { lead: '<p>Hi</p>', rest: '' });
});

test('only a draft marked post is a post', () => {
  assert.equal(isPostPage({ post: true }), true);
  assert.equal(isPostPage({ post: false }), false);
  assert.equal(isPostPage({}), false);
});
