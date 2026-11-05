// Tests movedRoutes.mjs: an old address opens the screen where it is now, others stay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { movedRoute } from './movedRoutes.mjs';

test('the old header screen opens Appearance › Header', () => {
  assert.equal(movedRoute('header'), 'udseende/header');
});

test('the old footer form opens Appearance › Footer', () => {
  assert.equal(movedRoute('src/data/footer.json'), 'udseende/footer');
});

test('an address that has not moved stays', () => {
  assert.equal(movedRoute('udseende/header'), 'udseende/header');
  assert.equal(movedRoute('lister'), 'lister');
});

test('the extra moves come first', () => {
  assert.equal(movedRoute('butik', { butik: 'indstillinger/appstore' }), 'indstillinger/appstore');
  assert.equal(movedRoute('tema', { butik: 'x' }), 'udseende');
});

test('the old booking and newsletter settings open the apps by their permanent ids', () => {
  assert.equal(movedRoute('promovering/calendly'), 'apps/app_a030dfba69793996');
  assert.equal(movedRoute('promovering/mailchimp'), 'apps/app_5c4b6ba067ef127f');
});
