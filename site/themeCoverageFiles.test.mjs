// Tests for themeOwnCss and coverageModule in site/themeCoverageFiles.mjs, on a temp folder.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { registerHooks } from 'node:module';

// theme.mjs imports this package by its name, which only works from an installed copy: point the name at this folder.
const PACKAGE = '@morphemecms/cms/';
const pkg = new URL('../', import.meta.url);
registerHooks({
  resolve: (specifier, context, next) =>
    specifier.startsWith(PACKAGE) ? next(new URL(specifier.slice(PACKAGE.length), pkg).href, context) : next(specifier, context),
});
const { coverageModule, themeOwnCss } = await import('./themeCoverageFiles.mjs');

const setup = (files) => {
  const dir = mkdtempSync(join(tmpdir(), 'coverage-'));
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), body);
  }
  return dir;
};

test('relative imports are followed in order', () => {
  const dir = setup({
    'styles/global.css': "@import './a.css';\n.g { color: red; }",
    'styles/a.css': "@import '../b/c.css';\n.a { color: red; }",
    'b/c.css': '.c { color: red; }',
  });
  const css = themeOwnCss(join(dir, 'styles/global.css'));
  const at = (s) => css.indexOf(s);
  assert.ok(at('.g') >= 0 && at('.a') >= 0 && at('.c') >= 0);
  assert.ok(at('.g {') < at('.a {') && at('.a {') < at('.c {'));
});

test('a package import is not read', () => {
  const dir = setup({ 'global.css': "@import '@morphemecms/cms/theme/styles/global.css';\n.g { color: red; }" });
  assert.match(themeOwnCss(join(dir, 'global.css')), /\.g \{/);
});

test('each file is read once', () => {
  const dir = setup({ 'global.css': "@import './a.css';\n@import './a.css';", 'a.css': '.only-once { color: red; }' });
  assert.equal(themeOwnCss(join(dir, 'global.css')).split('.only-once').length, 2);
});

test('a missing file throws with its name', () => {
  const dir = setup({ 'global.css': "@import './gone.css';" });
  assert.throws(() => themeOwnCss(join(dir, 'global.css')), /gone\.css/);
});

test('the standard theme has no coverage', () => {
  assert.equal(coverageModule('saturn'), 'export default null;');
});
