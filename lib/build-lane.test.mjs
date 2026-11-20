// Tests for lib/build-lane.mjs: the content or full lane from the changed files, including the paths that count as content
// and the reasons given. Run: node --test packages/editor/lib/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT_PATHS, laneFor } from './build-lane.mjs';

const on = { contentLane: true };

test('one content file takes the content lane', () => {
  const res = laneFor(['src/content/blog/a.md'], on);
  assert.equal(res.lane, 'content');
  assert.match(res.reason, /1 files/);
});

test('content, data and uploads take the content lane', () => {
  const res = laneFor(['src/content/pages/x.md', 'src/data/menu.json', 'public/images/uploads/a.jpg'], on);
  assert.equal(res.lane, 'content');
});

test('the build settings file is content', () => {
  const res = laneFor(['src/data/build.json'], on);
  assert.equal(res.lane, 'content');
});

test('editor code takes the full lane and names the file', () => {
  const res = laneFor(['packages/editor/src/ui.tsx'], on);
  assert.equal(res.lane, 'full');
  assert.equal(res.reason, 'code changed: packages/editor/src/ui.tsx');
});

test('content and a lockfile take the full lane', () => {
  const res = laneFor(['src/content/blog/a.md', 'package-lock.json'], on);
  assert.equal(res.lane, 'full');
  assert.equal(res.reason, 'code changed: package-lock.json');
});

test('the site config is code', () => {
  const res = laneFor(['src/site/config.ts'], on);
  assert.equal(res.lane, 'full');
});

test('a theme is code', () => {
  const res = laneFor(['src/themes/venus/styles/global.css'], on);
  assert.equal(res.lane, 'full');
});

test('only uploads under public are content', () => {
  const res = laneFor(['public/favicon.svg'], on);
  assert.equal(res.lane, 'full');
});

test('backslashes are normalised', () => {
  const res = laneFor(['src\\content\\blog\\a.md'], on);
  assert.equal(res.lane, 'content');
});

test('nothing changed takes the full lane', () => {
  const res = laneFor([], on);
  assert.deepEqual(res, { lane: 'full', reason: 'nothing changed since the live commit' });
});

test("unknown changes take the full lane with the caller's reason", () => {
  const res = laneFor(null, on, 'live commit unknown');
  assert.deepEqual(res, { lane: 'full', reason: 'live commit unknown' });
});

test('turned off in the editor takes the full lane', () => {
  const res = laneFor(['src/content/blog/a.md'], { contentLane: false });
  assert.deepEqual(res, { lane: 'full', reason: 'turned off in the editor' });
});

test('the content paths', () => {
  assert.deepEqual(CONTENT_PATHS, ['src/content/', 'src/drafts/', 'src/data/', 'public/images/uploads/']);
});

test('a change that holds only waiting versions in src/drafts takes the content lane', () => {
  const res = laneFor(['src/drafts/pages/about.md', 'src/drafts/blog/a/campaign.md'], on);
  assert.equal(res.lane, 'content');
});
