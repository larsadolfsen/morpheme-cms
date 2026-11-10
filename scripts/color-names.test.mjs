// The theme's shared variables carry the prefix --mo-. The colours are Material 3's colour roles by their own names after
// it (--mo-primary, --mo-on-surface; m3.material.io/styles/color/roles), an elevation level has a colour and a shadow
// (--mo-elevation-2-color, --mo-elevation-2-shadow), and the rest of what a theme shares (corner steps, state layers) is
// --mo-… too. This scans the theme, the editor and the package's libraries for the names from before: a role with no
// prefix (var(--primary)), --md-… (Material's own prefix, which we do not use), --elevation-N, a name from before the
// colour roles (var(--accent)) or a Tailwind colour from then (text-muted). The values stored in a site's content (the
// section `tint`, the text colour class `color-muted`) are not colours of the theme and are not scanned for.
// Run: node --test scripts/color-names.test.mjs
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;
const ROLES = [
  'primary',
  'secondary',
  'tertiary',
  'error',
  'primary-container',
  'secondary-container',
  'tertiary-container',
  'error-container',
  'on-primary',
  'on-secondary',
  'on-tertiary',
  'on-error',
  'on-primary-container',
  'on-secondary-container',
  'on-tertiary-container',
  'on-error-container',
  'primary-fixed',
  'primary-fixed-dim',
  'on-primary-fixed',
  'on-primary-fixed-variant',
  'secondary-fixed',
  'secondary-fixed-dim',
  'on-secondary-fixed',
  'on-secondary-fixed-variant',
  'tertiary-fixed',
  'tertiary-fixed-dim',
  'on-tertiary-fixed',
  'on-tertiary-fixed-variant',
  'surface-dim',
  'surface',
  'surface-bright',
  'surface-container-lowest',
  'surface-container-low',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
  'on-surface',
  'on-surface-variant',
  'outline',
  'outline-variant',
  'inverse-surface',
  'inverse-on-surface',
  'inverse-primary',
  'scrim',
  'shadow',
];
// Names from before the colour roles (they are gone).
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
const END = '(?![A-Za-z0-9_-])';
// A variable with no prefix that is a role or an old name, one with Material's own prefix, or an elevation level as it was named.
const variable = new RegExp(`(?<![A-Za-z0-9_-])--(?:(?:${ROLES.concat(OLD).join('|')})|md-[a-z]|elevation-[0-9])${END}`);
const prefixes = 'text|bg|border(?:-[trblxyse])?|ring|fill|stroke|from|to|via|outline|divide|decoration|accent|caret|placeholder|shadow';
const utility = new RegExp(`(?<![A-Za-z0-9_-])(?:${prefixes})-(?:${OLD.filter((n) => n !== 'surface-default').join('|')})${END}`);
// A name built in code, so no scan of a line sees it whole: `--${name}`, `--elevation-${n}`.
const built = /`--\$\{|`--elevation-|`--md-/;

// The one module that holds the old names: LEGACY_NAMES and withMaterialNames, which read a site's colors.json in the old
// names as the roles (lib/colors.ts). Everywhere else the old names stay gone.
const LEGACY_MODULE = 'lib/colors.ts';

const files = execSync('git ls-files theme src pages site lib defaults demo starter bin scripts', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(
    (f) =>
      /\.(css|tsx?|mjs|astro)$/.test(f) &&
      !/\.test\.mjs$/.test(f) &&
      f !== 'scripts/color-names.test.mjs' &&
      f !== LEGACY_MODULE &&
      !f.startsWith('src/i18n/') &&
      !f.startsWith('defaults/i18n/'),
  );

test('no file uses a variable name from before the --mo- prefix', () => {
  const found = [];
  for (const f of files) {
    readFileSync(ROOT + f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (variable.test(line) || utility.test(line) || built.test(line)) found.push(`${f}:${i + 1}: ${line.trim().slice(0, 100)}`);
      });
  }
  assert.deepEqual(found, []);
});

test('a colour role is never a shadow: --mo-shadow is read only as a colour', () => {
  const found = [];
  for (const f of files) {
    readFileSync(ROOT + f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (/box-shadow\s*:[^;]*var\(--mo-shadow\)/.test(line)) found.push(`${f}:${i + 1}: ${line.trim().slice(0, 100)}`);
      });
  }
  assert.deepEqual(found, []);
});
