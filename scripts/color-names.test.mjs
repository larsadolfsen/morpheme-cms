// The colours are Material 3's colour roles by their own names (m3.material.io/styles/color/roles). This scans the
// theme, the editor and the package's libraries for the names they had before: a CSS variable (var(--accent)) or a
// Tailwind colour (text-muted) that is not Material's. The values stored in a site's content (the section `tint`, the
// text colour class `color-muted`) are not colours of the theme and are not scanned for.
// Run: node --test scripts/color-names.test.mjs
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;
const OLD = [
  'bg',
  'ink',
  'muted',
  'line',
  'accent',
  'tint',
  'accent-hover',
  'on-accent',
  'accent-container',
  'on-accent-container',
  'surface-default',
];
const variable = new RegExp(`--(${OLD.join('|')})(?![A-Za-z0-9_-])`);
const prefixes = 'text|bg|border(?:-[trblxyse])?|ring|fill|stroke|from|to|via|outline|divide|decoration|accent|caret|placeholder|shadow';
const utility = new RegExp(
  `(?<![A-Za-z0-9_-])(?:${prefixes})-(?:${OLD.filter((n) => n !== 'surface-default').join('|')})(?![A-Za-z0-9_-])`,
);

const files = execSync('git ls-files theme src pages site lib defaults demo starter bin', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(
    (f) => /\.(css|tsx?|mjs|astro)$/.test(f) && !/\.test\.mjs$/.test(f) && !f.startsWith('src/i18n/') && !f.startsWith('defaults/i18n/'),
  );

test('no file uses a colour name from before Material 3 roles', () => {
  const found = [];
  for (const f of files) {
    readFileSync(ROOT + f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (variable.test(line) || utility.test(line)) found.push(`${f}:${i + 1}: ${line.trim().slice(0, 100)}`);
      });
  }
  assert.deepEqual(found, []);
});
