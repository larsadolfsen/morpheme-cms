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

test('a renamed segment is replaced anywhere in an address', () => {
  const renamed = { indstillinger: 'settings', dele: 'parts', liste: 'list' };
  assert.equal(movedRoute('indstillinger/appstore', {}, renamed), 'settings/appstore');
  assert.equal(movedRoute('udseende/dele/liste/kontakt', {}, renamed), 'udseende/parts/list/kontakt');
});

test('a segment that is not renamed stays', () => {
  assert.equal(movedRoute('settings/appstore'), 'settings/appstore');
  assert.equal(movedRoute('blog/mit-indlaeg'), 'blog/mit-indlaeg');
});

test('a moved address wins over a renamed segment', () => {
  assert.equal(movedRoute('tema', {}, { tema: 'x' }), 'udseende');
});
