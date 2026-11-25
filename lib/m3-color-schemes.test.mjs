// The generator's roles equal Material Theme Builder's export for the source colour #006397, role by role: Tonal Spot at standard, medium and
// high contrast, light, and standard and medium contrast, dark (docs/superpowers/specs/2026-11-21-m3-color-schemes-design.md, the Figma
// export beside it). Dark high contrast is from the library until the owner adds Theme Builder's file (the file is checked against the
// library's own scheme, so it is the library's, not Figma's).
// Run: node --test lib/m3-color-schemes.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const entry = `
export { colorRoles } from './defaults/colors.ts';
export { dynamicColors } from './lib/dynamic-colors.ts';
export { DynamicScheme, Hct, SchemeTonalSpot, hexFromArgb, argbFromHex } from '@material/material-color-utilities';`;
const { outputFiles } = await build({
  stdin: { contents: entry, resolveDir: new URL('..', import.meta.url).pathname, loader: 'ts' },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { colorRoles, dynamicColors, Hct, SchemeTonalSpot, hexFromArgb, argbFromHex } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
);

const dir = new URL('../docs/superpowers/specs/2026-11-21-m3-color-schemes-figma/', import.meta.url);
const figma = (file) =>
  Object.fromEntries(
    [...readFileSync(new URL(file, dir), 'utf8').matchAll(/--md-sys-color-([\w-]+): rgb\((\d+) (\d+) (\d+)\)/g)].map(
      ([, name, r, g, b]) => [name, `#${[r, g, b].map((v) => Number(v).toString(16).padStart(2, '0')).join('')}`],
    ),
  );

const CASES = [
  ['light.css', 'light', 'standard'],
  ['light-medium-contrast.css', 'light', 'medium'],
  ['light-high-contrast.css', 'light', 'high'],
  ['dark.css', 'dark', 'standard'],
  ['dark-medium-contrast.css', 'dark', 'medium'],
];

test("every role equals Theme Builder's export for #006397 (Tonal Spot)", () => {
  for (const [file, mode, contrast] of CASES) {
    const expected = figma(file);
    const made = dynamicColors({ source: '#006397', variant: 'tonalSpot', contrast }, colorRoles)[mode];
    let compared = 0;
    for (const [name, hex] of Object.entries(expected)) {
      if (!(name in made)) continue;
      assert.equal(made[name].toLowerCase(), hex, `${file}: ${name}`);
      compared++;
    }
    assert.ok(compared > 35, `${file}: only ${compared} roles compared`);
  }
});

test("dark high contrast is the library's scheme", () => {
  const made = dynamicColors({ source: '#006397', variant: 'tonalSpot', contrast: 'high' }, colorRoles).dark;
  const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex('#006397')), true, 1);
  assert.equal(made.primary.toLowerCase(), hexFromArgb(scheme.primary).toLowerCase());
  assert.equal(made['on-surface'].toLowerCase(), hexFromArgb(scheme.onSurface).toLowerCase());
});
