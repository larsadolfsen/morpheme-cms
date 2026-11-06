/**
 * Tests for the start screen's recent edits and updates since the last visit.
 * Exposes test cases for `nextRecent` and `changesSince`.
 * Depends on `node:test`, `node:assert/strict`, and `./startView.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { changesSince, continueShown, KEPT, latestEdits, nextRecent } from './startView.mjs';

const paths = (edits) => edits.map((e) => e.path);
const edits = (...ps) => ps.map((path, i) => ({ path, at: i }));

test('puts the saved paths first, each once, with the time of the save', () => {
  const next = nextRecent(edits('a', 'b', 'c'), ['c'], [], 99);
  assert.deepEqual(paths(next), ['c', 'a', 'b']);
  assert.deepEqual(next[0], { path: 'c', at: 99 });
  assert.deepEqual(paths(nextRecent(edits('a'), ['b', 'c', 'b'])), ['b', 'c', 'a']);
});

test('drops the removed paths', () => {
  assert.deepEqual(paths(nextRecent(edits('old', 'a'), ['new'], ['old'])), ['new', 'a']);
  assert.deepEqual(paths(nextRecent(edits('a', 'b'), [], ['a'])), ['b']);
});

test('keeps at most KEPT paths', () => {
  const all = edits(...Array.from({ length: KEPT }, (_, i) => `p${i}`));
  const next = paths(nextRecent(all, ['new']));
  assert.equal(next.length, KEPT);
  assert.equal(next[0], 'new');
  assert.ok(!next.includes(`p${KEPT - 1}`));
});

test('shows nothing at the first visit', () => {
  assert.deepEqual(changesSince(null, { cms: '1.0.0', apps: { a: '1.0.0' } }), []);
});

test('finds the CMS and the apps with another version', () => {
  const seen = { cms: '1.0.0', apps: { a: '1.0.0', b: '2.0.0' } };
  const now = { cms: '1.1.0', apps: { a: '1.0.0', b: '2.1.0' } };
  assert.deepEqual(changesSince(seen, now), [
    { id: 'cms', version: '1.1.0' },
    { id: 'b', version: '2.1.0' },
  ]);
});

test('an app installed since the last visit is not an update', () => {
  assert.deepEqual(changesSince({ cms: '1.0.0', apps: {} }, { cms: '1.0.0', apps: { a: '1.0.0' } }), []);
});

test("merges this browser's edits with the site's history, newest first", () => {
  const merged = latestEdits(
    [
      { path: 'a', at: 5 },
      { path: 'b', at: 1 },
    ],
    { b: 9, c: 3 },
  );
  assert.deepEqual(merged, [
    { path: 'b', at: 9 },
    { path: 'a', at: 5 },
    { path: 'c', at: 3 },
  ]);
  assert.deepEqual(latestEdits([], {}), []);
});

test('the card shows until closed, and again after a newer save', () => {
  assert.equal(continueShown(null, undefined), true);
  assert.equal(continueShown(10, 5), false);
  assert.equal(continueShown(10, undefined), false);
  assert.equal(continueShown(10, 11), true);
});
