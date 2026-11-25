// The catalog's icon packs (catalogIconPacks): the ones written to a contract the editor reads, texts in its language.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validIconPack } from '../lib/storeEntries.mjs';
import { ICON_PACK_API, ICON_PACK_APIS } from '../lib/contracts.mjs';

const entry = (over = {}) => ({
  id: 'icons_0123456789abcdef',
  handle: 'morpheme/phosphor',
  version: '1.0.0',
  api: ICON_PACK_API,
  name: 'Phosphor',
  author: 'Phosphor Icons',
  license: 'MIT',
  samples: ['<svg/>'],
  files: [{ path: 'pack.json', oid: 'a'.repeat(40) }],
  ...over,
});

test('the editor reads the icon pack contract it is built with', () => {
  assert.ok(ICON_PACK_APIS.includes(ICON_PACK_API));
  assert.equal(validIconPack(entry(), ICON_PACK_APIS), true);
});

test('a pack of another contract is left out', () => {
  assert.equal(validIconPack(entry({ api: ICON_PACK_API + 1 }), ICON_PACK_APIS), false);
});
