import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { themeTokenProblems } from './themeTokens.mjs';

function site(files) {
  const root = mkdtempSync(join(tmpdir(), 'theme-tokens-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

test('a theme declares and reads its own --mo-theme-* names', () => {
  const root = site({
    'src/themes/venus/styles/a.css': ':root { --mo-theme-gap: 1px } .mo-a { padding: var(--mo-theme-gap) }',
    'src/themes/venus/b.tsx': "x('--mo-theme-gap')",
  });
  assert.deepEqual(themeTokenProblems(root), []);
});

test('an app or the site reading or declaring a --mo-theme-* name is refused, with file and line', () => {
  const root = site({
    'src/apps/shop/a.css': '.mo-a {\n padding: var(--mo-theme-gap) }',
    'src/themes/venus/a.css': ':root { --mo-theme-gap: 1px }',
  });
  const [p, ...rest] = themeTokenProblems(root);
  assert.match(p, /^src\/apps\/shop\/a\.css:2: --mo-theme-gap belongs to a theme/);
  assert.equal(rest.length, 0);
});

test("a theme reading another theme's name is refused", () => {
  const root = site({ 'src/themes/a/a.css': ':root { --mo-theme-x: 1 }', 'src/themes/b/b.css': '.mo-b { top: var(--mo-theme-x) }' });
  assert.match(themeTokenProblems(root)[0], /b\.css:1: --mo-theme-x is read but this theme does not declare it/);
});
