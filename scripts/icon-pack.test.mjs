import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { packInUse } from '../site/iconPacks.mjs';
import { MATERIAL, PHOSPHOR, acornProblem, glyphProblems, packName, previewReference } from './screens/support/icon-pack.mjs';

// What the screens check expects of the icons follows the icon pack in use, as the editor resolves it (packInUse).
const PHOSPHOR_TAG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">';
const MATERIAL_TAG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">';
const D = 'M224,72H208V64a24,24,0,0,0-24-24H40';

/** A fixture theme that declares Phosphor in its theme.json ("icons": "phosphor"), as Venus does, in a site folder of its own. */
function fixtureSite(icons) {
  const root = mkdtempSync(join(tmpdir(), 'icon-pack-'));
  mkdirSync(join(root, 'src/themes/fixture'), { recursive: true });
  writeFileSync(join(root, 'src/themes/fixture/theme.json'), JSON.stringify({ name: 'Fixture', ...(icons ? { icons } : {}) }));
  return root;
}
const packOf = (root, chosen) =>
  packInUse({
    chosen,
    theme: 'fixture',
    icons: JSON.parse(readFileSync(join(root, 'src/themes/fixture/theme.json'), 'utf8')).icons,
    standardIcons: MATERIAL,
    installed: ['material-symbols', 'phosphor', 'lucide'],
  });

test('The pack in use is the theme\'s "icons", else Material Symbols, and a chosen pack wins', () => {
  const phosphor = fixtureSite('phosphor');
  const plain = fixtureSite();
  try {
    assert.equal(packOf(phosphor), PHOSPHOR);
    assert.equal(packOf(plain), MATERIAL);
    assert.equal(packOf(phosphor, 'lucide'), 'lucide');
  } finally {
    rmSync(phosphor, { recursive: true, force: true });
    rmSync(plain, { recursive: true, force: true });
  }
});

test('Material Symbols in use: a Phosphor glyph is a finding (as strict as before), a Material glyph is not', () => {
  const found = glyphProblems(MATERIAL, '/about/', PHOSPHOR_TAG, D);
  assert.equal(found.length, 1);
  assert.match(found[0], /drawn as a Phosphor glyph .* while Material Symbols is the icon pack in use/);
  assert.deepEqual(glyphProblems(MATERIAL, '/about/', MATERIAL_TAG, 'M501-540Z'), []);
  assert.deepEqual(
    glyphProblems(MATERIAL, '/about/', PHOSPHOR_TAG, D, () => true),
    [],
    'an allowed own glyph is not a finding',
  );
  assert.equal(glyphProblems('lucide', '/about/', PHOSPHOR_TAG, D).length, 1, 'any pack but Phosphor');
});

test('Phosphor in use: Phosphor glyphs are right, a Material Symbols glyph is the finding', () => {
  assert.deepEqual(glyphProblems(PHOSPHOR, '/about/', PHOSPHOR_TAG, D), []);
  const found = glyphProblems(PHOSPHOR, '/about/', MATERIAL_TAG, 'M501-540Z');
  assert.equal(found.length, 1);
  assert.match(found[0], /Material Symbols glyph .* while Phosphor is the icon pack in use/);
  assert.deepEqual(glyphProblems(PHOSPHOR, '/about/', MATERIAL_TAG.replace('<svg', '<svg data-icon-fallback="x"'), 'M501-540Z'), []);
});

test('The search "acorn" finds Phosphor\'s icon only when Phosphor is the pack in use', () => {
  assert.match(acornProblem(MATERIAL, 'x', true), /found Phosphor's acorn, but Material Symbols is the icon pack in use/);
  assert.equal(acornProblem(MATERIAL, 'x', false), null);
  assert.equal(acornProblem(PHOSPHOR, 'x', true), null);
  assert.match(acornProblem(PHOSPHOR, 'x', false), /found no acorn, but Phosphor is the icon pack in use/);
  assert.equal(packName(MATERIAL), 'Material Symbols');
});

test("The Preview icon's reference is the pack in use's own devices file, and the two packs differ", () => {
  const root = new URL('../', import.meta.url).pathname;
  const material = previewReference('icons/material-symbols', root);
  const phosphor = previewReference('icons/phosphor', root);
  assert.ok(material && phosphor && material !== phosphor);
  assert.equal(previewReference('icons/nothing', root), undefined);
});
