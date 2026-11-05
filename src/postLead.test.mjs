// Tests for isPostPage and leadFill (postLead.mjs).
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

test('a post is known by its lead slot, its picture slot or a picture in the draft', () => {
  const none = { hasLeadSlot: false, hasImageSlot: false, draftHasImage: false };
  assert.equal(isPostPage(none), false);
  assert.equal(isPostPage({ ...none, hasLeadSlot: true }), true);
  assert.equal(isPostPage({ ...none, hasImageSlot: true }), true);
  assert.equal(isPostPage({ ...none, draftHasImage: true }), true);
});
