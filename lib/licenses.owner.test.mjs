// Tests ownerId in licenses.mjs: an app's and a theme's id among the licences, with their English kinds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownerId } from './licenses.mjs';

test('an owner id starts with the English kind', () => {
  assert.equal(ownerId('app', 'calendly'), 'app/calendly');
  assert.equal(ownerId('theme', 'saturn'), 'theme/saturn');
});
