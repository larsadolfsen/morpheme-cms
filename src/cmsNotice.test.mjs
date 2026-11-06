// Tests for src/cmsNotice.mjs: the notice for the CMS's newest update from npm. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cmsNotice } from './cmsNotice.mjs';

test('returns null for null or undefined', () => {
  assert.equal(cmsNotice(null), null);
  assert.equal(cmsNotice(undefined), null);
});

test('returns null when commit or to is missing', () => {
  assert.equal(cmsNotice({ to: '0.2.0' }), null);
  assert.equal(cmsNotice({ commit: 'abc' }), null);
});

test('returns null for waiting or undoing state', () => {
  assert.equal(cmsNotice({ commit: 'abc', to: '0.2.0', state: 'waiting' }), null);
  assert.equal(cmsNotice({ commit: 'abc', to: '0.2.0', state: 'undoing' }), null);
});

test('returns notice for done state', () => {
  assert.deepEqual(cmsNotice({ commit: 'abc', to: '0.2.0', state: 'done' }), {
    id: 'abc:done',
    key: 'notifyDone',
    version: '0.2.0',
    error: false,
  });
});

test('returns notice for undone state', () => {
  assert.deepEqual(cmsNotice({ commit: 'abc', to: '0.2.0', state: 'undone' }), {
    id: 'abc:undone',
    key: 'notifyUndone',
    version: '0.2.0',
    error: true,
  });
});

test('returns notice for stuck state', () => {
  assert.deepEqual(cmsNotice({ commit: 'abc', to: '0.2.0', state: 'stuck' }), {
    id: 'abc:stuck',
    key: 'notifyStuck',
    version: '0.2.0',
    error: true,
  });
});

test('returns null for any other state', () => {
  assert.equal(cmsNotice({ commit: 'abc', to: '0.2.0', state: 'unknown' }), null);
});
