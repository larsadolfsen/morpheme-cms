// Icon packs installed from the store (src/icon-packs/<id>/): their folder, which pack is in use, and what a missing one does.
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// These modules import this package by its name, which only works from an installed copy: point the name at this folder.
const PACKAGE = '@morphemecms/cms/';
const pkg = new URL('../', import.meta.url);
registerHooks({
  resolve: (specifier, context, next) =>
    specifier.startsWith(PACKAGE) ? next(new URL(specifier.slice(PACKAGE.length), pkg).href, context) : next(specifier, context),
});
const { isStorePack, packInUse } = await import('./iconPacks.mjs');
const { packFolder } = await import('./icons.mjs');

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
