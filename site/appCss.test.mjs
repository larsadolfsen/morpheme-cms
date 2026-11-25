import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { appCss } from './appCss.mjs';

function site(api) {
  const root = mkdtempSync(join(tmpdir(), 'app-css-'));
  const dir = join(root, 'src/apps/shop');
  mkdirSync(join(dir, 'blocks/x'), { recursive: true });
  writeFileSync(join(dir, 'app.json'), JSON.stringify({ api }));
  writeFileSync(join(dir, 'a.css'), '.mo-a { --mo-gap: 1px }');
  writeFileSync(join(dir, 'blocks/x/b.css'), '.mo-b { padding: var(--mo-gap) }');
  return dir;
}
const plugin = () => appCss({ cms: [] });
const run = (p, code, id) => p.transform.call({}, code, id);

test('a CSS file of an app written to the scoped contract is scoped, with the names of the whole app', () => {
  const dir = site(8);
  const out = run(plugin(), '.mo-b { padding: var(--mo-gap) }', `${dir}/blocks/x/b.css`);
  assert.match(out.code, /@layer mo-app/);
  assert.match(out.code, /\[data-mo-app="shop"\]/);
  assert.match(out.code, /var\(--mo-app-shop-gap\)/);
});

test('an app written to an older contract keeps its global CSS', () => {
  const dir = site(7);
  assert.equal(run(plugin(), '.a { top: 0 }', `${dir}/a.css`), null);
});

test('files outside src/apps, and ?raw or ?url imports, are left alone', () => {
  const dir = site(8);
  assert.equal(run(plugin(), '.a {}', '/site/src/site/style.css'), null);
  assert.equal(run(plugin(), '.a {}', `${dir}/a.css?raw`), null);
  assert.equal(run(plugin(), '.a {}', `${dir}/a.js`), null);
});

test('the plugin runs before Vite reads CSS', () => {
  assert.equal(plugin().enforce, 'pre');
});
