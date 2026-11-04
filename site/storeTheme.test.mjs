// What is wrong with a store theme's CSS imports: only the CMS and its own files are allowed.
// Run with `node --test packages/editor/site/*.test.mjs` (part of npm run check).
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { storeImportProblems } from './storeTheme.mjs';

const F = 'styles/global.css';
const expected = (target) => `${F}: et tema i butikken må kun importere fra @morphemecms/cms og sine egne filer, ikke "${target}".`;

test('an import of the CMS is allowed', () => {
  const css = `@import '@morphemecms/cms/theme/styles/base.css';`;
  assert.deepEqual(storeImportProblems(css, F), []);
});

test('an npm package is not there', () => {
  const css = `@import '@fontsource-variable/outfit';`;
  assert.deepEqual(storeImportProblems(css, F), [expected('@fontsource-variable/outfit')]);
});

test('a font in the theme is allowed', () => {
  const css = `@font-face { src: url('../fonts/a.woff2') format('woff2'); }`;
  assert.deepEqual(storeImportProblems(css, F), []);
});

test('a path that leaves the theme is not there', () => {
  const css = `@font-face { src: url('../../x.woff2'); }`;
  assert.deepEqual(storeImportProblems(css, F), [expected('../../x.woff2')]);
});

test('a font from another host is not there', () => {
  const css = `@font-face { src: url(https://fonts.example/a.woff2); }`;
  assert.deepEqual(storeImportProblems(css, F), [expected('https://fonts.example/a.woff2')]);
});

test('a data URI is allowed', () => {
  const css = `@font-face { src: url(data:font/woff2;base64,AA); }`;
  assert.deepEqual(storeImportProblems(css, F), []);
});

test('two targets outside the theme are two problems', () => {
  const css = `@import 'https://a.example/x.css';\n@import url("other-package/x.css");`;
  assert.deepEqual(storeImportProblems(css, F), [expected('https://a.example/x.css'), expected('other-package/x.css')]);
});

test('the problems come in the order of the text', () => {
  const css = `@font-face { src: url(https://a.example/x); }\n@import 'b';`;
  assert.deepEqual(storeImportProblems(css, F), [expected('https://a.example/x'), expected('b')]);
});

test('an import in a comment is not there', () => {
  const css = `/* @import 'left-out'; */ @import './ui.css';`;
  assert.deepEqual(storeImportProblems(css, F), []);
});
