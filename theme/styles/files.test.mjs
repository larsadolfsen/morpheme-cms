// Every CSS file base.css imports is listed in files.mjs (as a UI part or as another file), and every listed file exists and is imported:
// the readers of the CSS as text take their file lists from files.mjs, so a file missing from it would be a part nobody checks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { UI_PART_FILES, OTHER_BASE_FILES, MATERIAL_FILES } from './files.mjs';

const base = readFileSync(new URL('./base.css', import.meta.url), 'utf8');
/** The CSS files base.css imports from this folder or from blocks/ (the token files under tokens/ are listed by their folders). */
const imported = [...base.matchAll(/@import\s+'\.\/((?:blocks\/)?[^'/]+\.css)';/g)].map((m) => m[1]);

test('the lists have no file twice', () => {
  const all = [...UI_PART_FILES, ...OTHER_BASE_FILES];
  assert.deepEqual(
    all.filter((f, i) => all.indexOf(f) !== i),
    [],
  );
});

test('every CSS file base.css imports is in files.mjs', () => {
  const listed = new Set([...UI_PART_FILES, ...OTHER_BASE_FILES]);
  assert.deepEqual(
    imported.filter((f) => !listed.has(f)),
    [],
    'add it to UI_PART_FILES (a part of ui.css) or to OTHER_BASE_FILES in theme/styles/files.mjs',
  );
});

test('every file in files.mjs exists and base.css imports it', () => {
  for (const f of [...UI_PART_FILES, ...OTHER_BASE_FILES]) {
    assert.ok(existsSync(new URL(`./${f}`, import.meta.url)), `${f} does not exist`);
    assert.ok(imported.includes(f), `${f} is not imported by base.css`);
  }
});

test('every CSS file of this folder is imported by base.css, except base.css and global.css', () => {
  const here = [
    ...readdirSync(new URL('./', import.meta.url)).filter((f) => f.endsWith('.css') && !['base.css', 'global.css'].includes(f)),
    ...readdirSync(new URL('./blocks/', import.meta.url)).map((f) => `blocks/${f}`),
  ];
  assert.deepEqual(
    here.filter((f) => !imported.includes(f)),
    [],
    'a CSS file nothing imports',
  );
});

test('global.css imports exactly the files of MATERIAL_FILES, in order, and they exist', () => {
  const global = readFileSync(new URL('./global.css', import.meta.url), 'utf8');
  const importedByGlobal = [...global.matchAll(/@import\s+'\.\/(material\/[^']+\.css)';/g)].map((m) => m[1]);
  assert.deepEqual(importedByGlobal, MATERIAL_FILES);
  for (const f of MATERIAL_FILES) assert.ok(existsSync(new URL(`./${f}`, import.meta.url)), `${f} does not exist`);
  assert.ok(!imported.some((f) => f.startsWith('material/')), 'base.css must never import a material/ file');
});
