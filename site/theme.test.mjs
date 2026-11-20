// Tests of allIconsModule (site/theme.mjs): all Phosphor's icons as one module, read one file at a time.
// Run with `node --test site/theme.test.mjs`.
import { strict as assert } from 'node:assert';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

// theme.mjs imports this package by its name, which only works from an installed copy: point the name at this folder.
const PACKAGE = '@morphemecms/cms/';
const pkg = new URL('../', import.meta.url);
registerHooks({
  resolve: (specifier, context, next) =>
    specifier.startsWith(PACKAGE) ? next(new URL(specifier.slice(PACKAGE.length), pkg).href, context) : next(specifier, context),
});
const { allIconsModule } = await import('./theme.mjs');

const PREFIX = '/node_modules/@phosphor-icons/core/assets/regular/';
const A = '<svg viewBox="0 0 1 1"><path d="A"/></svg>';
const B = '<svg viewBox="0 0 2 2"><path d="B"/></svg>';

const folder = mkdtempSync(join(tmpdir(), 'icons-'));
writeFileSync(join(folder, 'a.svg'), A);
writeFileSync(join(folder, 'b.svg'), B);
writeFileSync(join(folder, 'c.txt'), 'not an icon');

const parse = (code) => JSON.parse(code.slice('export const allIcons = '.length, -1));

test('the keys are the files, as import.meta.glob gave them', () => {
  assert.deepEqual(Object.keys(parse(allIconsModule(folder, {}))), [`${PREFIX}a.svg`, `${PREFIX}b.svg`]);
});

test("Phosphor's icons are the file text, unchanged", () => {
  assert.deepEqual(parse(allIconsModule(folder, {})), { [`${PREFIX}a.svg`]: A, [`${PREFIX}b.svg`]: B });
});

test("a theme's icon is in Phosphor's place", () => {
  const themed = '<svg viewBox="0 0 10 10"><path d="M0 0"/></svg>';
  const all = parse(allIconsModule(folder, { a: themed }));
  assert.equal(
    all[`${PREFIX}a.svg`],
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><path d="M0 0"/></svg>',
  );
  assert.equal(all[`${PREFIX}b.svg`], B);
});

test('a file that is not an svg has no key', () => {
  assert.ok(!Object.keys(parse(allIconsModule(folder, {}))).some((k) => k.endsWith('c.txt')));
});

test('the code is a module that exports allIcons', () => {
  assert.ok(allIconsModule(folder, {}).startsWith('export const allIcons = '));
});
