// Tests movedRoutes.mjs: an old address opens the screen where it is now, others stay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { movedRoute } from './movedRoutes.mjs';

test('the old header screen opens Appearance › Header', () => {
  assert.equal(movedRoute('header'), 'udseende/header');
});

test('an address that has not moved stays', () => {
  assert.equal(movedRoute('udseende/header'), 'udseende/header');
  assert.equal(movedRoute('lister'), 'lister');
});

test('the extra moves come first', () => {
  assert.equal(movedRoute('butik', { butik: 'indstillinger/appstore' }), 'indstillinger/appstore');
  assert.equal(movedRoute('tema', { butik: 'x' }), 'udseende');
});
