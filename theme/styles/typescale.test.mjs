// Every token of the type scale in ui.css (the classes that read them are in type.css) against Material 3's table
// (https://m3.material.io/styles/typography/type-scale-tokens, md.sys.typescale.<role>-<size>): size, line height and tracking
// in px, weight, the font, and the prominent weight of the labels. Values as M3 publishes them, not rounded.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
import { readdirSync } from 'node:fs';
/** A stylesheet and the token files it imports (tokens/<origin>/*.css, docs/theme-token-files.md), as one text. */
const withTokens = (name, origin) =>
  [
    read(name),
    ...readdirSync(new URL(`./tokens/${origin}/`, import.meta.url), { recursive: true })
      .filter((f) => f.endsWith('.css'))
      .sort()
      .map((f) => read(`./tokens/${origin}/${f}`)),
  ].join('\n');
const css = withTokens('./ui.css', 'ui');
const typeCss = readFileSync(new URL('./type.css', import.meta.url), 'utf8');
// The lead's --mo-sys-prose-space is a token, so it is in tokens/type/sys.css (docs/theme-token-files.md), under the same selector.
const typeTokens = readFileSync(new URL('./tokens/type/sys.css', import.meta.url), 'utf8');
const root = css; // the type scale's tokens are in tokens/ui/ref.css
const token = (name) => root.match(new RegExp(`--${name}: ([^;]+);`))?.[1];
const px = (value) => (value.endsWith('rem') ? parseFloat(value) * 16 : parseFloat(value));

// role-size: [size, line height, weight, tracking]
const M3 = {
  'display-large': [57, 64, 400, -0.25],
  'display-medium': [45, 52, 400, 0],
  'display-small': [36, 44, 400, 0],
  'headline-large': [32, 40, 400, 0],
  'headline-medium': [28, 36, 400, 0],
  'headline-small': [24, 32, 400, 0],
  'title-large': [22, 28, 400, 0],
  'title-medium': [16, 24, 500, 0.15],
  'title-small': [14, 20, 500, 0.1],
  'body-large': [16, 24, 400, 0.5],
  'body-medium': [14, 20, 400, 0.25],
  'body-small': [12, 16, 400, 0.4],
  'label-large': [14, 20, 500, 0.1],
  'label-medium': [12, 16, 500, 0.5],
  'label-small': [11, 16, 500, 0.5],
};

for (const [style, [size, lineHeight, weight, tracking]] of Object.entries(M3)) {
  test(`type-${style} is Material 3's md.sys.typescale.${style}`, () => {
    assert.equal(px(token(`mo-sys-typescale-${style}-size`)), size);
    assert.equal(px(token(`mo-sys-typescale-${style}-line-height`)), lineHeight);
    assert.equal(Number(token(`mo-sys-typescale-${style}-weight`)), weight);
    assert.equal(px(token(`mo-sys-typescale-${style}-tracking`)), tracking);
    assert.equal(token(`mo-sys-typescale-${style}-font`), 'var(--mo-ref-typeface-plain)');
  });
}

test('the labels have M3 prominent weight 700', () => {
  for (const size of ['large', 'medium', 'small']) assert.equal(Number(token(`mo-sys-typescale-label-${size}-prominent-weight`)), 700);
});

test('type.css has one class for each of the 15 roles and the lead, each reading its own four tokens', () => {
  const classes = [...typeCss.matchAll(/^ {2}\.(mo-type-[a-z-]+) \{\n([^}]*)\}/gm)];
  assert.deepEqual(
    classes.map((m) => m[1]),
    [...Object.keys(M3).map((s) => `mo-type-${s}`), 'mo-type-lead'].sort((a, b) => typeCss.indexOf(`.${a} {`) - typeCss.indexOf(`.${b} {`)),
  );
  for (const [, name, body] of classes) {
    const role = name.slice('mo-type-'.length);
    const lines = body
      .trim()
      .split('\n')
      .map((l) => l.trim());
    const want = [
      `font-size: var(--mo-sys-typescale-${role}-size);`,
      `line-height: var(--mo-sys-typescale-${role}-line-height);`,
      `font-weight: var(--mo-sys-typescale-${role}-weight);`,
      `letter-spacing: var(--mo-sys-typescale-${role}-tracking);`,
    ];
    assert.deepEqual(
      lines.filter((l) => !l.startsWith('--mo-sys-prose-space') && !l.startsWith('/*')),
      want,
      name,
    );
    assert.equal(
      new RegExp(`\\.${name} \\{[^}]*--mo-sys-prose-space: 1\\.5rem;`).test(typeTokens),
      role === 'lead',
      `${name} --mo-sys-prose-space`,
    );
  }
});

test('the classes sit in @layer utilities, as the Tailwind utilities did', () => {
  assert.match(typeCss, /^@layer utilities \{/m);
});
