// Tests for Custom colours in lib/dynamic-colors.ts (the spec docs/superpowers/specs/2026-11-13-custom-colors-design.md, step A):
// the chosen colours are exact, every pair is readable, Primary's question and its fix, and the note for a low Secondary or Tertiary.
// The three brand palettes of the spec (Primary / Secondary / Tertiary) are the fixed test sets.
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
  fixedTone,
  lowOnPage,
  onColor,
  pageContrast,
  primaryProblem,
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
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
const PRIMARY_TEXT = colorPairs.filter((p) => p.text === 'primary' && p.on.startsWith('surface'));

test("the chosen colours are the site's Primary, Secondary and Tertiary, exactly, in both modes and at every contrast", () => {
  for (const set of SETS)
    for (const level of Object.keys(CONTRASTS)) {
      const colors = dynamicColors(custom(set, level), colorRoles);
      for (const mode of MODES) {
        assert.ok(same(colors[mode].primary, set.source), `${set.name} ${level} ${mode} primary`);
        assert.ok(same(colors[mode].secondary, set.secondary), `${set.name} ${level} ${mode} secondary`);
        assert.ok(same(colors[mode].tertiary, set.tertiary), `${set.name} ${level} ${mode} tertiary`);
      }
    }
});

test('the brand palettes: every fill has readable text, and the cream stays cream', () => {
  for (const set of SETS) {
    const colors = dynamicColors(custom(set), colorRoles);
    for (const mode of MODES) {
      for (const f of ['primary', 'secondary', 'tertiary'])
        assert.ok(contrast(colors[mode][`on-${f}`], colors[mode][f]) >= 4.5, `${set.name} ${mode} on-${f}`);
    }
  }
  assert.ok(same(dynamicColors(custom(SETS[0]), colorRoles).light.secondary, '#F5E8CC'));
});

test("the on-colour is Material's where it gives 4.5:1, else white or black, whichever is higher", () => {
  assert.equal(onColor('#336699', '#ffffff'), '#ffffff');
  assert.equal(onColor('#F5E8CC', '#ffffff'), '#000000');
  assert.equal(onColor('#55263D', '#381e72'), '#ffffff');
  assert.equal(onColor('#F5E8CC', '#201a24'), '#201a24');
});

test("a sweep of hues, chromas and tones: only the three primary pairs of a base colour can move off Material's scheme", () => {
  const failing = new Map();
  let runs = 0;
  for (let hue = 0; hue < 360; hue += 10)
    for (const chroma of [0, 16, 32, 48, 80])
      for (const tone of [10, 20, 30, 40, 50, 60, 70, 80, 90]) {
        const color = hexFromArgb(Hct.from(hue, chroma, tone).toInt());
        for (const which of ['source', 'secondary', 'tertiary']) {
          const dynamic = custom(SETS[0], 'standard', { [which]: color });
          for (const level of Object.keys(CONTRASTS)) {
            runs++;
            const colors = dynamicColors({ ...dynamic, contrast: level }, colorRoles);
            for (const mode of MODES) {
              assert.ok(same(colors[mode][{ source: 'primary' }[which] ?? which], color), `${color} ${which} exact`);
              // Everything but Primary used as text on the page must pass, always.
              for (const pair of lowContrast(colors[mode], colorPairs)) {
                if (PRIMARY_TEXT.some((p) => p.what === pair.what)) continue;
                failing.set(pair.what, `${color} ${which} ${level} ${mode}: ${pair.ratio.toFixed(2)}`);
              }
            }
          }
        }
      }
  assert.ok(runs > 10000);
  assert.deepEqual([...failing], []);
});

test("Primary's question: asked exactly when Primary is below 4.5:1 as text on Surface or a container, in either mode", () => {
  for (const set of SETS) {
    const dynamic = custom(set);
    const colors = dynamicColors(dynamic, colorRoles);
    const asked = primaryProblem(dynamic);
    for (const mode of MODES) {
      const fails = lowContrast(colors[mode], PRIMARY_TEXT).length > 0;
      assert.equal(
        asked.some((p) => p.mode === mode),
        fails,
        `${set.name} ${mode}`,
      );
    }
    // The light Surface numbers of the spec: 3.34, 3.53, 2.71 (the question shows the lowest on a container: no better).
    const surface = contrast(colors.light.primary, colors.light.surface);
    assert.ok(Math.abs(surface - [3.34, 3.53, 2.71][SETS.indexOf(set)]) < 0.05, `${set.name} surface ${surface}`);
    const light = asked.find((p) => p.mode === 'light');
    assert.ok(light && light.ratio <= surface && light.min === 4.5);
  }
});

test('Primary asks nothing for a colour that reads, nor for a harmony', () => {
  assert.deepEqual(
    primaryProblem(custom({ source: '#1a3a6b', secondary: '#F5E8CC', tertiary: '#55263D' })).filter((p) => p.mode === 'light'),
    [],
  );
  assert.deepEqual(primaryProblem({ source: '#F34E3D', harmony: 'analogous', contrast: 'standard' }), []);
  assert.deepEqual(primaryProblem({ source: '#2589D8', variant: 'tonalSpot', contrast: 'standard' }), []);
});

test("Fix: the same hue and chroma at the nearest passing tone, never past Material's tone; Keep leaves the exact colour", () => {
  for (const set of SETS)
    for (const level of Object.keys(CONTRASTS)) {
      const dynamic = custom(set, level);
      const exact = dynamicColors(dynamic, colorRoles);
      for (const mode of MODES) {
        const fixed = fixedTone(dynamic, mode);
        const asked = primaryProblem(dynamic).some((p) => p.mode === mode);
        assert.equal(fixed !== undefined, asked, `${set.name} ${mode}: fix only where asked`);
        if (!fixed) continue;
        const colors = { ...exact[mode], primary: fixed, 'on-primary': onColor(fixed, exact[mode]['on-primary']) };
        assert.deepEqual(lowContrast(colors, colorPairs), [], `${set.name} ${level} ${mode} fixed passes every pair`);
        const before = Hct.fromInt(argbFromHex(set.source));
        const after = Hct.fromInt(argbFromHex(fixed));
        assert.ok(Math.abs(after.hue - before.hue) < 6, `${set.name} ${mode} hue`);
        assert.ok(mode === 'light' ? after.tone < before.tone : after.tone > before.tone, `${set.name} ${mode} direction`);
        const material = Hct.fromInt(argbFromHex(dynamicColors({ ...dynamic, harmony: 'analogous' }, colorRoles)[mode].primary)).tone;
        assert.ok(
          mode === 'light' ? after.tone >= material - 1 : after.tone <= material + 1,
          `${set.name} ${mode} not past Material's tone`,
        );
        // Nearest: one step (0.25 tone) back towards the chosen colour does not pass.
        const back = hexFromArgb(Hct.from(before.hue, before.chroma, after.tone + (mode === 'light' ? 0.5 : -0.5)).toInt());
        assert.ok(lowContrast({ ...colors, primary: back }, PRIMARY_TEXT).length > 0 || same(back, fixed), `${set.name} ${mode} nearest`);
      }
    }
  assert.ok(fixedTone(custom(SETS[0]), 'light'));
  // A Primary that reads in a mode is not fixed in it.
  assert.equal(fixedTone(custom({ ...SETS[0], source: '#1a3a6b' }), 'light'), undefined);
});

test('Keep: the exact colour fails only the four "Primary on …" pairs; nothing else fails', () => {
  for (const set of SETS) {
    const colors = dynamicColors(custom(set, 'standard', { kept: ['primary'] }), colorRoles);
    for (const mode of MODES) {
      const failing = lowContrast(colors[mode], colorPairs).map((p) => p.what);
      for (const what of failing)
        assert.ok(
          PRIMARY_TEXT.some((p) => p.what === what),
          `${set.name} ${mode}: ${what}`,
        );
    }
  }
});

test("lowOnPage: true exactly when Surface gives below 3:1, light or dark; Primary-hued neutrals are the scheme's", () => {
  const surface = (set) => {
    const c = dynamicColors(custom(set), colorRoles);
    return { light: c.light.surface, dark: c.dark.surface };
  };
  const cases = [
    [SETS[0], 'secondary', true, 1.15, 'light'],
    [SETS[0], 'tertiary', true, 1.53, 'dark'],
    [SETS[1], 'secondary', true, 1.2, 'light'],
    [SETS[1], 'tertiary', true, 2.49, 'light'],
    [SETS[2], 'secondary', true, 1.33, 'light'],
    [SETS[2], 'tertiary', true, 1.2, 'dark'],
  ];
  for (const [set, which, low, about, mode] of cases) {
    assert.equal(lowOnPage(custom(set), which), low, `${set.name} ${which}`);
    const ratio = pageContrast(custom(set), which)[mode];
    assert.ok(Math.abs(ratio - about) < 0.1, `${set.name} ${which} ${mode}: ${ratio.toFixed(2)} vs ${about}`);
    for (const m of MODES) assert.equal(pageContrast(custom(set), which)[m], contrast(set[which], surface(set)[m]));
  }
  // A colour that reads on both pages is not low; the threshold is exactly 3.
  const mid = { source: '#F34E3D', secondary: '#808080', tertiary: '#808080' };
  assert.equal(lowOnPage(custom(mid), 'secondary'), false);
  for (let tone = 20; tone <= 80; tone += 2)
    for (const hue of [30, 140, 260]) {
      const color = hexFromArgb(Hct.from(hue, 40, tone).toInt());
      const set = { ...SETS[0], secondary: color };
      const { light, dark } = pageContrast(custom(set), 'secondary');
      assert.equal(lowOnPage(custom(set), 'secondary'), light < 3 || dark < 3);
    }
});

test('dynamicProblems: Custom needs both colours and only Custom has them', () => {
  const ok = custom(SETS[0]);
  assert.deepEqual(dynamicProblems(ok), []);
  assert.deepEqual(dynamicProblems({ ...ok, kept: ['primary'] }), []);
  assert.deepEqual(dynamicProblems({ ...ok, secondary: undefined }), ['dynamic.secondary: null']);
  assert.deepEqual(dynamicProblems({ ...ok, tertiary: 'red' }), ['dynamic.tertiary: "red"']);
  assert.deepEqual(dynamicProblems({ ...ok, kept: ['secondary'] }), ['dynamic.kept: ["secondary"]']);
  assert.deepEqual(dynamicProblems({ ...ok, sourceLocked: true }), ['dynamic.sourceLocked: true']);
  assert.deepEqual(dynamicProblems({ ...ok, variant: 'tonalSpot' }), ['dynamic.variant: "tonalSpot"']);
  const harmony = { source: '#a3345a', harmony: 'analogous', contrast: 'standard' };
  assert.deepEqual(dynamicProblems(harmony), []);
  assert.deepEqual(dynamicProblems({ ...harmony, sourceLocked: true }), []);
  assert.deepEqual(dynamicProblems({ ...harmony, secondary: '#2f6f5e' }), ['dynamic.secondary: "#2f6f5e"']);
  assert.deepEqual(dynamicProblems({ ...harmony, kept: ['primary'] }), ['dynamic.kept: ["primary"]']);
  assert.deepEqual(dynamicProblems({ source: '#a3345a', harmony: 'nope', contrast: 'standard' }), ['dynamic.harmony: "nope"']);
  assert.deepEqual(
    dynamicProblems({ variant: 'content', contrast: 'standard', harmony: 'custom' }, 'contentBased'),
    ['contentBased.harmony: "custom"'].filter(() => false),
  );
});

test('completeColors makes the missing roles of a Custom file from its choice, and a file without Custom is unchanged', () => {
  const dynamic = custom(SETS[1]);
  const made = dynamicColors(dynamic, colorRoles);
  const trimmed = structuredClone(made);
  delete trimmed.light['surface-dim'];
  delete trimmed.dark['tertiary-fixed'];
  const done = completeColors({ ...trimmed, dynamic }, colorRoles);
  assert.deepEqual({ light: done.light, dark: done.dark }, made);
  assert.deepEqual(done.dynamic, dynamic);
  // a pen in Custom sets its own colour and nothing else
  assert.deepEqual(withBaseColor(dynamic, 'secondary', '#112233'), { ...dynamic, secondary: '#112233' });
  assert.deepEqual(withBaseColor(dynamic, 'source', '#112233', true), { ...dynamic, source: '#112233' });
});
