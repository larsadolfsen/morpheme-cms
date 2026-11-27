// md.ref.palette.neutral-variant20, the navigation drawer's scrim colour, made from the site's source colour.
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { Hct, SchemeTonalSpot, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

const root = new URL('..', import.meta.url).pathname;
const { outputFiles } = await build({
  stdin: {
    contents: `export { neutralVariant20, primaryTones } from './lib/ref-palette.ts'; export { colorsCss } from './lib/colors.ts';`,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { neutralVariant20, primaryTones, colorsCss } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
);

test('#006397 gives tone 20 of the neutral variant palette of SchemeTonalSpot, the same in light and dark', () => {
  const tone = (dark) =>
    hexFromArgb(new SchemeTonalSpot(Hct.fromInt(argbFromHex('#006397')), dark, 0).neutralVariantPalette.tone(20)).toLowerCase();
  assert.equal(tone(false), tone(true));
  assert.equal(neutralVariant20('#006397'), tone(false));
  assert.equal(neutralVariant20('#006397'), '#2b3137');
});

test('no hex source, no tone', () => {
  assert.equal(neutralVariant20(undefined), undefined);
  assert.equal(neutralVariant20('red'), undefined);
});

test('colorsCss writes --mo-ref-palette-neutral-variant20 only for a file with a dynamic source', () => {
  const set = { surface: '#ffffff' };
  const css = colorsCss({ light: set, dark: set, dynamic: { source: '#006397', variant: 'tonalSpot', contrast: 'standard' } });
  assert.match(css, /^:root\{[^}]*--mo-ref-palette-neutral-variant20:#2b3137;/);
  assert.doesNotMatch(colorsCss({ light: set, dark: set }), /neutral-variant20/);
});

test('primaryTones gives tones 10, 30, 80 and 90 of the primary palette; colorsCss writes them with a dynamic source only', () => {
  const palette = new SchemeTonalSpot(Hct.fromInt(argbFromHex('#006397')), false, 0).primaryPalette;
  const tones = primaryTones('#006397');
  assert.deepEqual(Object.keys(tones).map(Number), [10, 30, 80, 90]);
  for (const [tone, hex] of Object.entries(tones)) assert.equal(hex, hexFromArgb(palette.tone(Number(tone))).toLowerCase());
  assert.equal(primaryTones('red'), undefined);
  const set = { surface: '#ffffff' };
  const css = colorsCss({ light: set, dark: set, dynamic: { source: '#006397', variant: 'tonalSpot', contrast: 'standard' } });
  assert.match(css, new RegExp(`--mo-ref-palette-primary80:${tones[80]};`));
  assert.doesNotMatch(colorsCss({ light: set, dark: set }), /palette-primary/);
});
