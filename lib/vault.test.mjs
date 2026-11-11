// Tests for lib/vault.mjs: a secret text sealed with a Worker secret, and opened only with the same one.
import assert from 'node:assert/strict';
import test from 'node:test';
import { open, seal } from './vault.mjs';

test('opens what it sealed', async () => {
  const sealed = await seal('key-one', 'gho_token');
  assert.equal(await open('key-one', sealed), 'gho_token');
});

test('the sealed text does not show the secret text, and differs each time', async () => {
  const a = await seal('key-one', 'gho_token');
  const b = await seal('key-one', 'gho_token');
  assert.ok(!a.includes('gho_token'));
  assert.notEqual(a, b);
});

test('another key, a changed text or rubbish opens to null', async () => {
  const sealed = await seal('key-one', 'gho_token');
  assert.equal(await open('key-two', sealed), null);
  assert.equal(await open('key-one', `${sealed.slice(0, -2)}AA`), null);
  assert.equal(await open('key-one', 'rubbish'), null);
  assert.equal(await open('key-one', ''), null);
});

test('no key is an error, not a weak seal', async () => {
  await assert.rejects(() => seal('', 'x'));
  assert.equal(await open('', 'x.y'), null);
});
