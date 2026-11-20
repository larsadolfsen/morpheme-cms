/**
 * Tests for the CMS version short form logic.
 * Exposes test cases for `shortVersion`.
 * Depends on `node:test`, `node:assert/strict`, and `./cmsVersionView.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { shortVersion } from './cmsVersionView.mjs';

test('strips build stamp from pre-release versions', () => {
  assert.equal(shortVersion('0.5.0-next-20261104200208'), '0.5.0-next');
});

test('strips build stamp from beta versions', () => {
  assert.equal(shortVersion('1.2.3-beta-7'), '1.2.3-beta');
});

test('keeps stable versions unchanged', () => {
  assert.equal(shortVersion('0.5.0'), '0.5.0');
});

test('keeps pre-release versions without build stamp unchanged', () => {
  assert.equal(shortVersion('0.5.0-next'), '0.5.0-next');
});

test('keeps versions with non-numeric build metadata unchanged', () => {
  assert.equal(shortVersion('0.5.0-rc.1'), '0.5.0-rc.1');
});

test('handles empty string', () => {
  assert.equal(shortVersion(''), '');
});
