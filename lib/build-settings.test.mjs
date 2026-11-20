// Tests for lib/build-settings.mjs: the build settings' defaults, what a missing or odd file falls back to, and the wait
// limit with and without paid builds. Run: node --test packages/editor/lib/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILD_SETTINGS_PATH, readBuildSettings, giveUpAfter } from './build-settings.mjs';

const defaults = { contentLane: true, paidBuilds: false };

test('a missing file gives the defaults', () => {
  assert.deepEqual(readBuildSettings(undefined), defaults);
});

test('an empty object gives the defaults', () => {
  assert.deepEqual(readBuildSettings({}), defaults);
});

test('contentLane can be turned off', () => {
  assert.deepEqual(readBuildSettings({ contentLane: false }), { contentLane: false, paidBuilds: false });
});

test('paidBuilds can be turned on', () => {
  assert.deepEqual(readBuildSettings({ paidBuilds: true }), { contentLane: true, paidBuilds: true });
});

test('a key that is not a boolean counts as missing', () => {
  assert.deepEqual(readBuildSettings({ contentLane: 'no', paidBuilds: 1 }), defaults);
});

test('null and an array give the defaults', () => {
  assert.deepEqual(readBuildSettings(null), defaults);
  assert.deepEqual(readBuildSettings([]), defaults);
});

test('the wait is 20 minutes on the free plan and 10 on the paid plan', () => {
  assert.equal(giveUpAfter(false), 1_200_000);
  assert.equal(giveUpAfter(true), 600_000);
});

test('the settings file is src/data/build.json', () => {
  assert.equal(BUILD_SETTINGS_PATH, 'src/data/build.json');
});
