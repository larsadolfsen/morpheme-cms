// Tests for Custom colours in lib/dynamic-colors.ts (docs/superpowers/specs/2026-11-21-m3-color-schemes-design.md): Custom is Theme Builder's
// custom core colours, so each chosen colour gives its own palette and the roles take M3's tones from it (never the chosen colour itself);
// every pair is readable, and the note for a low Secondary or Tertiary. Three brand palettes (Primary / Secondary / Tertiary) are the sets.
// Run: node --test lib/custom-colors.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

// The engine and the site's pairs and roles, bundled as colors.test.mjs does (defaults/colors.ts imports without extensions).
const entry = `
export { colorPairs, colorRoles } from './defaults/colors.ts';
export { MODES, contrast, lowContrast } from './lib/colors.ts';
export * from './lib/dynamic-colors.ts';
export { Hct, argbFromHex, hexFromArgb } from '@material/material-color-utilities';`;
const { outputFiles } = await build({
  stdin: { contents: entry, resolveDir: new URL('..', import.meta.url).pathname, loader: 'ts' },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const {
  colorPairs,
  colorRoles,
  MODES,
  contrast,
  lowContrast,
  Hct,
  argbFromHex,
  hexFromArgb,
  CONTRASTS,
  dynamicColors,
  dynamicProblems,
  lowOnPage,
  pageContrast,
  toneOf,
  wheelColorAt,
  withBaseColor,
  completeColors,
} = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);

const SETS = [
  { name: 'set 1', source: '#F34E3D', secondary: '#F5E8CC', tertiary: '#55263D' },
  { name: 'set 2', source: '#2589D8', secondary: '#E9E5D6', tertiary: '#FF783D' },
  { name: 'set 3', source: '#FF6574', secondary: '#CCDCEF', tertiary: '#222526' },
];
const custom = (set, contrastName = 'standard', more = {}) => ({
  source: set.source,
  harmony: 'custom',
  secondary: set.secondary,
  tertiary: set.tertiary,
  contrast: contrastName,
  ...more,
});
const hct = (hex) => Hct.fromInt(argbFromHex(hex));
const hueGap = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

test("each core colour gives its own palette: Primary, Secondary and Tertiary take M3's tones, not the chosen colour", () => {
  for (const set of SETS)
    for (const contrastName of Object.keys(CONTRASTS)) {
      const { light, dark } = dynamicColors(custom(set, contrastName), colorRoles);
      for (const [role, key] of [
        ['primary', 'source'],
        ['secondary', 'secondary'],
        ['tertiary', 'tertiary'],
      ]) {
        const chosen = hct(set[key]);
        for (const [mode, expected] of [
          [light, 40],
          [dark, 80],
        ]) {
          const got = hct(mode[role]);
          // The palette is the chosen colour's hue and chroma; the tone is M3's (40 in light, 80 in dark at standard contrast).
          if (chosen.chroma > 12 && got.chroma > 6) assert.ok(hueGap(got.hue, chosen.hue) < 8, `${set.name} ${role} hue`);
          if (contrastName === 'standard') assert.ok(Math.abs(got.tone - expected) < 1.5, `${set.name} ${role} tone ${got.tone}`);
        }
      }
    }
  // A Primary at tone 95 is not kept as chosen: Primary is M3's tone 40.
  const cream = dynamicColors(custom({ ...SETS[0], source: '#F5E8CC' }), colorRoles).light.primary;
  assert.ok(hct(cream).tone < 45);
});

test("the neutrals and the error are M3's: from Primary's hue at fixed chroma, and the fixed error", () => {
  const { light } = dynamicColors(custom(SETS[1]), colorRoles);
  const tonal = dynamicColors({ source: SETS[1].source, variant: 'tonalSpot', contrast: 'standard' }, colorRoles).light;
  for (const role of ['surface', 'on-surface', 'outline', 'error', 'on-error', 'error-container'])
    assert.equal(light[role], tonal[role], role);
});

test("a scheme of M3's is the library's: Tonal spot from #006397 has M3's primary and tertiary", () => {
  const { light } = dynamicColors({ source: '#006397', variant: 'tonalSpot', contrast: 'standard' }, colorRoles);
  assert.equal(light.primary.toLowerCase(), '#2c638b');
  assert.equal(light.tertiary.toLowerCase(), '#67587a');
});

test('the brand palettes: every pair is readable in both modes and at every contrast', () => {
  for (const set of SETS)
    for (const contrastName of Object.keys(CONTRASTS)) {
      const colors = dynamicColors(custom(set, contrastName), colorRoles);
      for (const mode of MODES) assert.deepEqual(lowContrast(colors[mode], colorPairs), [], `${set.name} ${mode} ${contrastName}`);
    }
});

test('lowOnPage: true exactly when Surface gives below 3:1, light or dark', () => {
  for (let tone = 20; tone <= 80; tone += 2)
    for (const hue of [30, 140, 260]) {
      const color = hexFromArgb(Hct.from(hue, 40, tone).toInt());
      const set = { ...SETS[0], secondary: color };
      const { light, dark } = pageContrast(custom(set), 'secondary');
      assert.equal(lowOnPage(custom(set), 'secondary'), light < 3 || dark < 3);
    }
});

test('dynamicProblems: Custom needs both colours and only Custom has them; a harmony of the older generator is still read', () => {
  const ok = custom(SETS[0]);
  assert.deepEqual(dynamicProblems(ok), []);
  assert.deepEqual(dynamicProblems({ ...ok, secondary: undefined }), ['dynamic.secondary: null']);
  assert.deepEqual(dynamicProblems({ ...ok, tertiary: 'red' }), ['dynamic.tertiary: "red"']);
  assert.deepEqual(dynamicProblems({ ...ok, kept: ['primary'] }), []);
  assert.deepEqual(dynamicProblems({ ...ok, kept: ['secondary'] }), ['dynamic.kept: ["secondary"]']);
  assert.deepEqual(dynamicProblems({ ...ok, sourceLocked: true }), ['dynamic.sourceLocked: true']);
  assert.deepEqual(dynamicProblems({ ...ok, variant: 'tonalSpot' }), ['dynamic.variant: "tonalSpot"']);
  const harmony = { source: '#a3345a', harmony: 'analogous', contrast: 'standard' };
  assert.deepEqual(dynamicProblems(harmony), []);
  assert.deepEqual(dynamicProblems({ ...harmony, sourceLocked: true }), []);
  assert.deepEqual(dynamicProblems({ ...harmony, secondary: '#2f6f5e' }), ['dynamic.secondary: "#2f6f5e"']);
  assert.deepEqual(dynamicProblems({ source: '#a3345a', harmony: 'nope', contrast: 'standard' }), ['dynamic.harmony: "nope"']);
  assert.deepEqual(dynamicProblems({ source: '#a3345a', variant: 'tonalSpot', contrast: 'standard' }), []);
});

test('a file of the older generator is read as Tonal spot from its source colour', () => {
  const old = dynamicColors({ source: '#a3345a', harmony: 'triadic', contrast: 'standard' }, colorRoles);
  assert.deepEqual(old, dynamicColors({ source: '#a3345a', variant: 'tonalSpot', contrast: 'standard' }, colorRoles));
});

test('completeColors makes the missing roles of a Custom file from its choice', () => {
  const dynamic = custom(SETS[1]);
  const made = dynamicColors(dynamic, colorRoles);
  const trimmed = structuredClone(made);
  delete trimmed.light['surface-dim'];
  delete trimmed.dark['tertiary-fixed'];
  const done = completeColors({ ...trimmed, dynamic }, colorRoles);
  assert.deepEqual({ light: done.light, dark: done.dark }, made);
  assert.deepEqual(done.dynamic, dynamic);
});

test("a pen: Custom sets its own colour and nothing else; a scheme of M3's takes only the source colour and drops an older harmony", () => {
  const dynamic = custom(SETS[1]);
  assert.deepEqual(withBaseColor(dynamic, 'secondary', '#112233'), { ...dynamic, secondary: '#112233' });
  assert.deepEqual(withBaseColor(dynamic, 'source', '#112233'), { ...dynamic, source: '#112233' });
  const scheme = { source: '#a3345a', variant: 'vibrant', contrast: 'standard' };
  assert.deepEqual(withBaseColor(scheme, 'source', '#112233'), { ...scheme, source: '#112233' });
  assert.equal(withBaseColor(scheme, 'secondary', '#112233'), scheme);
  assert.deepEqual(
    withBaseColor({ source: '#a3345a', harmony: 'triadic', sourceLocked: true, contrast: 'standard' }, 'source', '#112233'),
    {
      source: '#112233',
      variant: 'tonalSpot',
      contrast: 'standard',
    },
  );
});

test('the wheel in Custom: a dragged dot keeps its tone, and its hue and chroma follow the point', () => {
  const cream = '#F5E8CC';
  const tone = toneOf(cream);
  assert.ok(tone > 85);
  for (const [x, y, hue] of [
    [0, -0.6, 0],
    [0.6, 0, 90],
    [0, 0.6, 180],
    [-0.6, 0, 270],
  ]) {
    const color = wheelColorAt(x, y, tone);
    const got = Hct.fromInt(argbFromHex(color));
    assert.ok(Math.abs(((got.hue - hue + 540) % 360) - 180) < 10 || got.chroma < 4, `${color} hue ${got.hue} for ${hue}`);
    assert.ok(got.tone > 55, `${color} tone ${got.tone}`);
  }
  assert.ok(Hct.fromInt(argbFromHex(wheelColorAt(0, 0, 50))).chroma < 2);
  assert.ok(Math.abs(toneOf(wheelColorAt(0, 0, 50)) - 50) < 1);
  const dynamic = custom(SETS[0]);
  const moved = withBaseColor(dynamic, 'tertiary', wheelColorAt(0.5, 0.5, toneOf(SETS[0].tertiary)));
  assert.equal(moved.source, dynamic.source);
  assert.equal(moved.secondary, dynamic.secondary);
  assert.notEqual(moved.tertiary, dynamic.tertiary);
});
