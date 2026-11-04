// Checks the tonal elevation tokens and rules of the base theme (spec: tonal elevation, Material 3).
// Reads theme/styles/ui.css (and later global.css) as text; no browser, no build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const uiCss = read('./ui.css');

const count = (text, part) => text.split(part).length - 1;

// The level tokens: the exact default declaration of each, once in ui.css.
const tokens = {
  '--elevation-0-surface': 'var(--bg)',
  '--elevation-1-surface': 'var(--surface-container-low, var(--block-surface))',
  '--elevation-2-surface': 'var(--surface-container, var(--block-surface))',
  '--elevation-3-surface': 'var(--surface-container-high, var(--block-surface))',
  '--elevation-4-surface': 'var(--surface-container-highest, var(--block-surface))',
  '--elevation-5-surface': 'var(--surface-container-highest, var(--block-surface))',
  '--elevation-1-rest-shadow': 'var(--elevation-1)',
  '--elevation-2-rest-shadow': 'var(--elevation-2)',
  '--elevation-3-rest-shadow': 'var(--elevation-3)',
  '--elevation-4-rest-shadow': 'var(--elevation-4)',
  '--elevation-5-rest-shadow': 'var(--elevation-5)',
};

for (const [name, value] of Object.entries(tokens)) {
  test(`ui.css declares ${name}`, () => {
    assert.equal(count(uiCss, `  ${name}: ${value};\n`), 1);
  });
}
