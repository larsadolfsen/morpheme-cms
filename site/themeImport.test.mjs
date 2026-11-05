// Tests of importProblem (site/theme.mjs): every theme imports Material's global.css as its fallback.
// Run with `node --test site/themeImport.test.mjs`.
import { strict as assert } from 'node:assert';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// theme.mjs imports this package by its name, which only works from an installed copy: point the name at this folder.
const PACKAGE = '@morphemecms/cms/';
const pkg = new URL('../', import.meta.url);
registerHooks({
  resolve: (specifier, context, next) =>
    specifier.startsWith(PACKAGE) ? next(new URL(specifier.slice(PACKAGE.length), pkg).href, context) : next(specifier, context),
});
const { importProblem } = await import('./theme.mjs');

const GLOBAL = '@morphemecms/cms/theme/styles/global.css';

test('another theme that imports the standard theme is right', () => {
  assert.equal(importProblem('venus', `@import '${GLOBAL}';`), null);
  assert.equal(importProblem('venus', `@import "${GLOBAL}";`), null);
});

test('another theme that imports base.css is told to import global.css', () => {
  const problem = importProblem('venus', `@import '@morphemecms/cms/theme/styles/base.css';`);
  assert.ok(problem.includes(GLOBAL));
});

test('another theme that imports ui.css is told where', () => {
  const problem = importProblem('venus', `@import '@morphemecms/cms/theme/styles/ui.css';`);
  assert.ok(problem.includes('src/themes/venus/styles/global.css'));
});

test('another theme with no import has a problem', () => {
  assert.equal(typeof importProblem('venus', ':root { --radius: 1rem; }'), 'string');
});

test('the standard theme imports ./base.css', () => {
  assert.equal(importProblem('saturn', `@import './base.css';`), null);
  assert.ok(importProblem('saturn', ':root {}').includes('./base.css'));
});
