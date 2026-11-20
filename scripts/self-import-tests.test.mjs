// A test that loads a module which imports this package by its own name (`@morphemecms/cms/...`) must point the name at this folder
// (`registerHooks`, as site/theme.test.mjs does). Without it the test only passes where a demo build has written the package copy
// to node_modules/@morphemecms/cms, and fails in the CI job `static` of a docs-only pull request, which runs `npm test` before any build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const AREAS = ['defaults', 'lib', 'scripts', 'site', 'src', 'theme', 'worker'];
const SKIP = new Set(['node_modules', 'fixtures']);

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });

const named = /(?:from|import\()\s*['"]@morphemecms\/cms\//;
const relative = /(?:from|import\()\s*['"](\.{1,2}\/[^'"]+\.(?:mjs|js))['"]/g;

/** Whether this module, or a relative module it imports, imports the package by its own name. */
const usesName = (path, seen = new Set()) => {
  if (seen.has(path) || !existsSync(path)) return false;
  seen.add(path);
  const source = readFileSync(path, 'utf8');
  if (named.test(source)) return true;
  return [...source.matchAll(relative)].some((m) => usesName(resolve(dirname(path), m[1]), seen));
};

test('a test that reaches a by-name import points the name at this folder', () => {
  const tests = AREAS.flatMap((area) => files(join(root, area))).filter((path) => path.endsWith('.test.mjs'));
  const bad = tests.filter((path) => {
    const source = readFileSync(path, 'utf8');
    if (source.includes('registerHooks')) return false;
    return [...source.matchAll(relative)].some((m) => usesName(resolve(dirname(path), m[1])));
  });
  assert.deepEqual(
    bad.map((path) => path.slice(root.length)),
    [],
    'these tests load a module that imports @morphemecms/cms by name without registerHooks: add the hook, as site/theme.test.mjs does',
  );
});
