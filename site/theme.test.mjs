// Tests of themeIconsModule (site/theme.mjs): the icons of the theme and the pack in use as one module, by Material name.
// Run with `node --test site/theme.test.mjs`.
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
const { themeIconsModule } = await import('./theme.mjs');

const A = '<svg viewBox="0 0 10 10"><path d="M0 0"/></svg>';
const B = '<svg viewBox="0 -960 960 960"><path d="B"/></svg>';
const parse = (code) => JSON.parse(code.slice('export const themeIcons = '.length, -1));

test('the keys are the icons names, sorted', () => {
  assert.deepEqual(Object.keys(parse(themeIconsModule({ b: B, a: A, 'play_arrow-fill': A }))), ['a', 'b', 'play_arrow-fill']);
});

test('an icon is its svg in the text colour, in its own viewBox', () => {
  const all = parse(themeIconsModule({ a: A, b: B }));
  assert.equal(all.a, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><path d="M0 0"/></svg>');
  assert.equal(all.b, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="B"/></svg>');
});

test('a file that does not draw has no key', () => {
  assert.deepEqual(Object.keys(parse(themeIconsModule({ a: A, c: 'not an icon' }))), ['a']);
});

test('the code is a module that exports themeIcons', () => {
  assert.ok(themeIconsModule({}).startsWith('export const themeIcons = '));
});
