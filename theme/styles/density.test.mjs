// Checks the spacing tokens and the density variables of the base theme (spec: 2026-11-13-density-design.md, PR 0).
// Reads theme/styles/base.css and global.css as text; no browser, no build. The browser check is in scripts/editor-screens.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const base = read('./base.css');
const global = read('./global.css');
const count = (text, part) => text.split(part).length - 1;

// M3's Space 0 to 900 in dp (m3.material.io/m3/pages/spacing; the audit of 2026-11-13, row 11).
const space = {
  0: 0,
  25: 2,
  50: 4,
  75: 6,
  100: 8,
  125: 10,
  150: 12,
  175: 14,
  200: 16,
  250: 20,
  300: 24,
  400: 32,
  450: 36,
  500: 40,
  600: 48,
  700: 56,
  800: 64,
  900: 72,
};
for (const [name, dp] of Object.entries(space))
  test(`base.css declares --mo-space-${name} as ${dp}px`, () => {
    assert.equal(count(base, `  --mo-space-${name}: ${dp}px;\n`), 1);
  });

const variables = {
  '--mo-density-base': '0',
  '--mo-density-user': '0',
  '--mo-density-step': '4px',
  '--mo-density': 'clamp(-3, calc(var(--mo-density-base) + var(--mo-density-user)), 1)',
  '--mo-density-layout': 'clamp(-1, calc(var(--mo-density-base) + var(--mo-density-user)), 1)',
  '--mo-density-focus': 'clamp(0, calc(var(--mo-density-base) + var(--mo-density-user)), 1)',
};
for (const [name, value] of Object.entries(variables))
  test(`base.css declares ${name}`, () => {
    assert.equal(count(base, `  ${name}: ${value};\n`), 1);
  });

test('data-density sets the person’s step: Large 1, Small -1, Medium none', () => {
  assert.equal(count(base, ":root[data-density='1'] {\n  --mo-density-user: 1;\n}"), 1);
  assert.equal(count(base, ":root[data-density='-1'] {\n  --mo-density-user: -1;\n}"), 1);
});

test('global.css sets Material’s own step to 0 (Medium)', () => {
  assert.equal(count(global, ':root {\n  --mo-density-base: 0;\n}'), 1);
});
