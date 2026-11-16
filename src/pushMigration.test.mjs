import assert from 'node:assert/strict';
import { test } from 'node:test';
import { oldEndpointToDrop, syncAction } from './pushMigration.mjs';

test('with permission granted and the device on (or never chosen), the editor signs up silently', () => {
  assert.equal(syncAction({ permission: 'granted', device: true }), 'sign-up');
  assert.equal(syncAction({ permission: 'granted', device: undefined }), 'sign-up');
});

test('it never asks: no permission, or "On the phone" off, signs off', () => {
  assert.equal(syncAction({ permission: 'default', device: true }), 'sign-off');
  assert.equal(syncAction({ permission: 'denied', device: undefined }), 'sign-off');
  assert.equal(syncAction({ permission: 'granted', device: false }), 'sign-off');
});

test('the old subscription is dropped once the new one is saved, never the new one itself', () => {
  assert.equal(oldEndpointToDrop('https://push/old', 'https://push/new'), 'https://push/old');
  assert.equal(oldEndpointToDrop(undefined, 'https://push/new'), null);
  assert.equal(oldEndpointToDrop('https://push/x', 'https://push/x'), null);
});
