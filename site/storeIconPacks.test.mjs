// Icon packs installed from the store (src/icon-packs/<id>/): their folder, which pack is in use, and what a missing one does.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isStorePack, packInUse } from './iconPacks.mjs';
import { packFolder } from './icons.mjs';

const ID = 'icons_0123456789abcdef';
const use = (chosen, installed) =>
  packInUse({ chosen, theme: 'saturn', icons: 'material-symbols', standardIcons: 'material-symbols', installed });

test('a store pack is its permanent id, and lives in src/icon-packs/<id>', () => {
  assert.equal(isStorePack(ID), true);
  for (const bad of ['phosphor', 'icons_phosphor', 'icons_0123', 'theme_0123456789abcdef', 'venus/own'])
    assert.equal(isStorePack(bad), false, bad);
  assert.equal(packFolder(ID), `src/icon-packs/${ID}`);
  assert.equal(packFolder('venus/own'), 'src/themes/venus/icon-packs/own');
});

test('an installed store pack that is chosen is the pack in use', () => {
  assert.equal(use(ID, ['material-symbols', ID]), ID);
});

test('a chosen store pack that is not installed draws Material Symbols, with no failure', () => {
  assert.equal(use(ID, ['material-symbols']), 'material-symbols');
});
