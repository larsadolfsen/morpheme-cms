import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockedUpdate } from './cmsBlocked.mjs';

const status = (over = {}) => ({ running: '0.16.0', token: true, kv: true, checked: { latest: '0.18.0' }, ...over });
const problem = (p) => status({ checked: { latest: '0.18.0', problem: p } });

test('a site with nothing wrong shows nothing', () => {
  assert.equal(blockedUpdate(status()), null);
  assert.equal(blockedUpdate(null), null);
});

test('a missing KV or token always blocks, the KV first', () => {
  assert.deepEqual(blockedUpdate(status({ token: false, kv: false })), { kind: 'no-kv' });
  assert.deepEqual(blockedUpdate(status({ token: false, checked: null })), { kind: 'no-token' });
});

test('needs-npm, cannot-write and a contract hold block while a newer version waits', () => {
  assert.deepEqual(blockedUpdate(problem({ kind: 'needs-npm', detail: 'x' })), { kind: 'needs-npm', version: '0.18.0' });
  assert.deepEqual(blockedUpdate(problem({ kind: 'cannot-write' })), { kind: 'cannot-write', version: '0.18.0' });
  assert.deepEqual(blockedUpdate(problem({ kind: 'contract', item: 'theme', id: 'venus', why: 'incompatible' })), {
    kind: 'contract',
    version: '0.18.0',
    item: 'theme',
    id: 'venus',
    sure: true,
  });
  assert.equal(blockedUpdate(problem({ kind: 'contract', item: 'app', id: 'm', why: 'could-not-confirm' })).sure, false);
});

test('a problem with no newer version waiting, and the ones the Morpheme page explains, show nothing', () => {
  assert.equal(blockedUpdate(status({ checked: { latest: '0.16.0', problem: { kind: 'needs-npm' } } })), null);
  assert.equal(blockedUpdate(status({ checked: { problem: { kind: 'cannot-write' } } })), null);
  for (const kind of ['major', 'skipped', 'unreachable', 'not-managed']) assert.equal(blockedUpdate(problem({ kind })), null, kind);
  assert.equal(blockedUpdate(problem({ kind: 'contract' })), null);
  assert.equal(blockedUpdate(status({ running: '0.18.0-next-1' })), null);
});
