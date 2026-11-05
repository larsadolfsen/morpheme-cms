// Tests of activeTheme and installedThemes (site/theme.mjs) with permanent theme ids.
// Run with `node --test site/activeTheme.test.mjs`; the site's root is the working directory, set before the import.
import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const PACKAGE = '@morphemecms/cms/';
const pkg = new URL('../', import.meta.url);
registerHooks({
  resolve: (specifier, context, next) =>
    specifier.startsWith(PACKAGE) ? next(new URL(specifier.slice(PACKAGE.length), pkg).href, context) : next(specifier, context),
});

const site = mkdtempSync(join(tmpdir(), 'site-'));
const theme = (name) => {
  mkdirSync(join(site, 'src/themes', name), { recursive: true });
  writeFileSync(join(site, 'src/themes', name, 'theme.json'), '{}');
};
const choose = (value) => {
  mkdirSync(join(site, 'src/data'), { recursive: true });
  writeFileSync(join(site, 'src/data/theme.json'), JSON.stringify({ theme: value }));
};
theme('theme_fa395ad84690acbd');
theme('own-theme');
process.chdir(site);
const { activeTheme, installedThemes } = await import('./theme.mjs');

test('a permanent theme id is accepted', () => {
  choose('theme_fa395ad84690acbd');
  assert.equal(activeTheme(), 'theme_fa395ad84690acbd');
});

test('the standard theme and a site-own theme are accepted', () => {
  choose('saturn');
  assert.equal(activeTheme(), 'saturn');
  choose('own-theme');
  assert.equal(activeTheme(), 'own-theme');
});

test('a theme id that is not a store id stops the build', () => {
  choose('theme_xyz');
  assert.throws(() => activeTheme(), /theme_xyz/);
});

test('a theme folder that looks like a store id but is not one stops the build, naming the folder', () => {
  assert.deepEqual(installedThemes(), ['saturn', 'own-theme', 'theme_fa395ad84690acbd']);
  theme('theme_xyz');
  assert.throws(() => installedThemes(), /src\/themes\/theme_xyz/);
});
