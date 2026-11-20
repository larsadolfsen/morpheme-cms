// Tests for scripts/already-checked.mjs: alreadyChecked() skips check:content in the build only when ci-build has run it
// for exactly this commit. Run: node --test packages/editor/scripts/*.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { alreadyChecked } from './already-checked.mjs';

const head = 'a'.repeat(40);

test('alreadyChecked is true for the same sha', () => {
  assert.equal(alreadyChecked(head, head), true);
});

test('alreadyChecked is false for another sha, an empty string or undefined', () => {
  assert.equal(alreadyChecked('b'.repeat(40), head), false);
  assert.equal(alreadyChecked('', head), false);
  assert.equal(alreadyChecked(undefined, head), false);
  assert.equal(alreadyChecked('', ''), false);
});
