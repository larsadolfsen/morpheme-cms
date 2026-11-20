// Tests buildSettingsProblems (build-settings-problems.mjs): the build settings file passes when it is missing or an
// object with only boolean contentLane and paidBuilds, and is reported otherwise.
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSettingsProblems } from './build-settings-problems.mjs';

const PATH = 'src/data/build.json';

test('a missing file passes', () => {
  assert.deepEqual(buildSettingsProblems(PATH, undefined), []);
});

test('both keys, one key and an empty object pass', () => {
  assert.deepEqual(buildSettingsProblems(PATH, '{ "contentLane": true, "paidBuilds": false }'), []);
  assert.deepEqual(buildSettingsProblems(PATH, '{ "paidBuilds": true }'), []);
  assert.deepEqual(buildSettingsProblems(PATH, '{}'), []);
});

test('an unknown key is reported', () => {
  const problems = buildSettingsProblems(PATH, '{ "contentLane": true, "fastLane": true }');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /fastLane/);
  assert.match(problems[0], new RegExp(PATH));
});

test('a value that is not a boolean is reported', () => {
  const problems = buildSettingsProblems(PATH, '{ "contentLane": "yes", "paidBuilds": 1 }');
  assert.equal(problems.length, 2);
  assert.match(problems[0], /contentLane/);
  assert.match(problems[1], /paidBuilds/);
});

test('JSON that is not an object, or not JSON, is reported', () => {
  for (const text of ['[]', 'true', 'null', '"x"', '{ nope']) assert.equal(buildSettingsProblems(PATH, text).length, 1, text);
});
