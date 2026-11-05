// Tests siteTypesConfig (site-types.mjs): the tsconfig that type-checks the package's source as a site does.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { siteTypesConfig } from './site-types.mjs';

const PACKAGE = '../../../node_modules/@morphemecms/cms';
const config = siteTypesConfig(PACKAGE);

test('extends the site tsconfig', () => {
  assert.equal(config.extends, './tsconfig.json');
});

test('includes the site first, then the package source', () => {
  assert.deepEqual(config.include.slice(0, 2), ['.astro/types.d.ts', '**/*']);
  assert.ok(config.include.includes(`${PACKAGE}/src/**/*.tsx`));
  assert.ok(config.include.includes(`${PACKAGE}/lib/**/*.ts`));
});

test('excludes dist and the package tests', () => {
  assert.deepEqual(config.exclude, ['dist', `${PACKAGE}/**/*.test.*`]);
});
