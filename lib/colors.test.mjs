// Tests for lib/colors.ts: the page colour, and withMaterialNames(), which reads a file of colours written with the names
// from before Material 3's roles (bg, ink, accent …) as the roles, so a site that is updated keeps its colours and builds.
// The two files in fixtures/colors/ are shaped as two real sites' files were: 0.12's starter file with the 13 colours
// the theme could make left out (19 per mode, no `dynamic`), and 0.14.2's demo file (32 per mode, with `dynamic`).
// Run: node --test lib/colors.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { build } from 'esbuild';
import { LEGACY_NAMES, colorProblems, lowContrast, pageColor, withMaterialNames } from './colors.ts';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const old19 = read('./fixtures/colors/old-19-keys.json');
const old32 = read('./fixtures/colors/old-32-keys-dynamic.json');
const current = read('../demo/src/data/colors.json');
const copy = (x) => structuredClone(x);

test('the page colour of the editor is Surface', () => {
  assert.equal(pageColor({ surface: '#f9f9ff', 'surface-container': '#ededf4' }), '#f9f9ff');
});

test('the fixtures are shaped as the two real files were', () => {
  assert.equal(Object.keys(old19.light).length, 19);
  assert.equal(Object.keys(old19.dark).length, 19);
  assert.equal(old19.dynamic, undefined);
  assert.equal(Object.keys(old32.light).length, 32);
  assert.equal(Object.keys(old32.dark).length, 32);
  assert.ok(old32.dynamic);
});

const GONE = ['bg', 'tint', 'ink', 'muted', 'line', 'accent', 'accent-hover', 'on-accent', 'accent-container', 'on-accent-container'];

test('a file with 19 old names per mode gets the new roles, each with the value it had', () => {
  const out = withMaterialNames(copy(old19));
  for (const mode of ['light', 'dark']) {
    const was = old19[mode];
    const set = out[mode];
    assert.equal(set.surface, was.bg, `${mode}: the page`);
    assert.equal(set['surface-container-lowest'], was.surface, `${mode}: the cards`);
    assert.equal(set['surface-container-high'], was.tint);
    assert.equal(set['on-surface'], was.ink);
    assert.equal(set['on-surface-variant'], was.muted);
    assert.equal(set['outline-variant'], was.line);
    assert.equal(set.primary, was.accent);
    assert.equal(set['on-primary'], was['on-accent']);
    assert.equal(set['primary-container'], was['accent-container']);
    assert.equal(set['on-primary-container'], was['on-accent-container']);
    for (const name of ['secondary', 'on-secondary', 'tertiary', 'on-tertiary-container']) assert.equal(set[name], was[name]);
    for (const name of GONE) assert.equal(Object.hasOwn(set, name), false, `${mode}: ${name} is gone`);
    assert.equal(Object.keys(set).length, 18, 'accent-hover, which has no role, is dropped');
  }
  assert.equal(out.dynamic, undefined);
});

test('a file with 32 old names and a dynamic block keeps its own containers, and its page is the old bg', () => {
  const out = withMaterialNames(copy(old32));
  for (const mode of ['light', 'dark']) {
    const was = old32[mode];
    const set = out[mode];
    assert.equal(set.surface, was.bg, `${mode}: the page keeps the colour it had`);
    // The file has its own Surface container lowest and high: the old cards' surface and tint do not replace them.
    assert.equal(set['surface-container-lowest'], was['surface-container-lowest']);
    assert.equal(set['surface-container-high'], was['surface-container-high']);
    assert.equal(set.primary, was.accent);
    assert.equal(set['on-surface'], was.ink);
    for (const name of GONE) assert.equal(Object.hasOwn(set, name), false, `${mode}: ${name} is gone`);
    assert.equal(Object.keys(set).length, 29);
  }
  assert.deepEqual(out.dynamic, old32.dynamic);
});

test('a file in the new names is returned as it is', () => {
  assert.equal(withMaterialNames(current), current);
  const colors = { light: { surface: '#f9f9ff', primary: '#435e91' }, dark: { surface: '#111318', primary: '#adc6ff' } };
  assert.equal(withMaterialNames(colors), colors);
});

test('a half-migrated file keeps its new names and takes an old name only where the new one is missing', () => {
  const half = {
    light: { surface: '#f9f9ff', primary: '#111111', accent: '#222222', ink: '#333333', 'on-surface': '#444444', muted: '#555555' },
    dark: { primary: '#aaaaaa', accent: '#bbbbbb' },
  };
  const out = withMaterialNames(copy(half));
  assert.equal(out.light.primary, '#111111', 'the new name wins');
  assert.equal(out.light['on-surface'], '#444444', 'the new name wins');
  assert.equal(out.light['on-surface-variant'], '#555555', 'taken where it was missing');
  assert.equal(out.light.surface, '#f9f9ff', 'a surface without a bg is the page already');
  assert.deepEqual(Object.keys(out.light).sort(), ['on-surface', 'on-surface-variant', 'primary', 'surface']);
  assert.deepEqual(out.dark, { primary: '#aaaaaa' });
});

test('the old surface is the cards only beside a bg, and a bg is the page', () => {
  const out = withMaterialNames({
    light: { bg: '#f6f4f1', surface: '#ffffff', ink: '#111111' },
    dark: { bg: '#101010', surface: '#202020', ink: '#eeeeee' },
  });
  assert.deepEqual(out.light, { surface: '#f6f4f1', 'surface-container-lowest': '#ffffff', 'on-surface': '#111111' });
  assert.deepEqual(out.dark, { surface: '#101010', 'surface-container-lowest': '#202020', 'on-surface': '#eeeeee' });
});

test('an empty file, or one with empty modes, is returned as it is', () => {
  const empty = {};
  assert.equal(withMaterialNames(empty), empty);
  const modes = { light: {}, dark: {} };
  assert.equal(withMaterialNames(modes), modes);
});

test('a file with only light is renamed, and gets no dark', () => {
  const out = withMaterialNames({ light: { bg: '#f6f4f1', ink: '#111111', accent: '#a3345a' } });
  assert.deepEqual(out, { light: { surface: '#f6f4f1', 'on-surface': '#111111', primary: '#a3345a' } });
  assert.equal(Object.hasOwn(out, 'dark'), false);
});

test('only the mode that has old names is renamed', () => {
  const dark = { surface: '#101010', primary: '#aaaaaa' };
  const out = withMaterialNames({ light: { bg: '#f6f4f1', accent: '#a3345a' }, dark });
  assert.deepEqual(out.light, { surface: '#f6f4f1', primary: '#a3345a' });
  assert.equal(out.dark, dark);
});

test('the dynamic block and the other keys of a file are kept', () => {
  const dynamic = { source: '#a3345a', harmony: 'analogous', contrast: 'standard', sourceLocked: true };
  const out = withMaterialNames({ light: { bg: '#f6f4f1', accent: '#a3345a' }, dark: { bg: '#101010', accent: '#ffb0c8' }, dynamic });
  assert.deepEqual(out.dynamic, dynamic);
  assert.equal(out.light.primary, '#a3345a');
  assert.equal(out.dark.surface, '#101010');
});

test('it does not change the file it is given', () => {
  const before = copy(old19);
  withMaterialNames(old19);
  assert.deepEqual(old19, before);
});

test('it is idempotent', () => {
  for (const file of [
    old19,
    old32,
    current,
    { light: { bg: '#f6f4f1', accent: '#a3345a' } },
    {},
    { light: { surface: '#fff', ink: '#000' } },
  ]) {
    const once = withMaterialNames(copy(file));
    assert.deepEqual(withMaterialNames(copy(once)), once);
    assert.equal(withMaterialNames(once), once, 'a migrated file is a new file');
  }
});

test('every new role in LEGACY_NAMES is a colour the site has (colorFields)', async () => {
  const { colorFields } = await modules();
  const names = new Set(colorFields.map((f) => f.name));
  for (const [from, to] of Object.entries(LEGACY_NAMES)) assert.ok(to === null || names.has(to), `${from} → ${to}`);
});

// The two files through the build's reading: renamed, completed from the dynamic block or as the theme mixed them, and
// checked, as the content check, the build and the editor read a file.
let loaded;
async function modules() {
  loaded ??= (async () => {
    const entry = `export { completeColors } from './lib/dynamic-colors.ts'; export { colorFields, colorPairs, colorRoles } from './defaults/colors.ts';`;
    const { outputFiles } = await build({
      stdin: { contents: entry, resolveDir: new URL('..', import.meta.url).pathname, loader: 'ts' },
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'node',
    });
    return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
  })();
  return loaded;
}

for (const [name, file] of [
  ['19 keys, no dynamic block', old19],
  ['32 keys with a dynamic block', old32],
]) {
  test(`${name}: renamed and completed, every colour the editor needs is there, and it is readable`, async () => {
    const { completeColors, colorFields, colorPairs, colorRoles } = await modules();
    const colors = completeColors(withMaterialNames(copy(file)), colorRoles);
    assert.deepEqual(
      colorProblems(
        colors,
        colorFields.map((f) => f.name),
      ),
      [],
    );
    for (const mode of ['light', 'dark'])
      assert.deepEqual(
        lowContrast(colors[mode], colorPairs).map((p) => p.what),
        [],
        mode,
      );
    // The page is on the colour it was on (the old bg), in both modes.
    assert.equal(colors.light.surface, file.light.bg);
    assert.equal(colors.dark.surface, file.dark.bg);
  });

  test(`${name}: reading it twice gives the same colours`, async () => {
    const { completeColors, colorRoles } = await modules();
    const once = completeColors(withMaterialNames(copy(file)), colorRoles);
    assert.deepEqual(completeColors(withMaterialNames(copy(once)), colorRoles), once);
  });
}
