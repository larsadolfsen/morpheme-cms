// Tests for src/buildSettings.ts: the build settings read from and written to the text of src/data/build.json, so the
// editor's switches keep the file valid. Run: node --test packages/editor/src/*.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSettingsOf, withBuildSetting } from './buildSettings.ts';

test('a missing or broken file gives the defaults', () => {
  assert.deepEqual(buildSettingsOf(undefined), { contentLane: true, paidBuilds: false });
  assert.deepEqual(buildSettingsOf('{ nope'), { contentLane: true, paidBuilds: false });
});

test('a change on a missing file writes both settings', () => {
  assert.equal(withBuildSetting(undefined, 'contentLane', false), '{\n  "contentLane": false,\n  "paidBuilds": false\n}\n');
});

test('a change keeps the other setting', () => {
  const once = withBuildSetting(undefined, 'paidBuilds', true);
  assert.deepEqual(buildSettingsOf(once), { contentLane: true, paidBuilds: true });
  assert.deepEqual(buildSettingsOf(withBuildSetting(once, 'contentLane', false)), { contentLane: false, paidBuilds: true });
});
