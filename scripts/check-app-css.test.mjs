import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { reportApp } from './check-app-css.mjs';

test('the report lists what would be renamed, refused or left unscoped, per app', () => {
  const dir = mkdtempSync(join(tmpdir(), 'app-css-report-'));
  mkdirSync(join(dir, 'blocks'), { recursive: true });
  writeFileSync(
    join(dir, 'a.css'),
    '@import "x.css";\n:root { --mo-gap: 1px }\n@keyframes fade { to { opacity: 1 } }\n.a { padding: var(--mo-gap) }\nbody { margin: 0 }',
  );
  writeFileSync(join(dir, 'blocks/View.tsx'), 'export default () => <i style={{ "--mo-gap": 1 }} />;');
  const r = reportApp(dir, 'shop', new Set());
  assert.deepEqual(r.renamed.vars, ['--mo-gap']);
  assert.deepEqual(r.renamed.keyframes, ['fade']);
  assert.ok(r.refused.some((l) => /a\.css:2: a rule on :root/.test(l)));
  assert.ok(r.refused.some((l) => /a\.css:5: a rule on body/.test(l)));
  assert.ok(r.refused.some((l) => /View\.tsx:1: a custom property in code/.test(l)));
  assert.ok(r.limits.some((l) => /@import/.test(l)));
});

import { chromium } from 'playwright';
import { siteProblems } from './check-app-css.mjs';
import { appCss } from '../site/appCss.mjs';

function appSite(apps) {
  const root = mkdtempSync(join(tmpdir(), 'app-css-site-'));
  for (const [id, { api, css, code }] of Object.entries(apps)) {
    const dir = join(root, 'src/apps', id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'app.json'), JSON.stringify({ api }));
    writeFileSync(join(dir, 'style.css'), css);
    if (code) writeFileSync(join(dir, 'View.tsx'), code);
  }
  return root;
}

test('an app written to the scoped contract is refused for a rule on :root, html or body, with file and line', () => {
  const root = appSite({ shop: { api: 8, css: '.mo-a { top: 0 }\n:root { --mo-gap: 1px }\nhtml { margin: 0 }' } });
  const problems = siteProblems(root, new Set());
  assert.equal(problems.length, 2);
  assert.match(problems[0], /^src\/apps\/shop\/style\.css:2: a rule on :root/);
  assert.match(problems[1], /style\.css:3: a rule on html/);
});

test('a private custom property in code and an attribute selector on data-mo-app are refused', () => {
  const root = appSite({
    shop: {
      api: 8,
      css: ':where(.mo-a) { --mo-gap: 1px }\n[data-mo-app="x"] .mo-b { top: 0 }',
      code: 'el.style.setProperty("--mo-gap", "2px");',
    },
  });
  const problems = siteProblems(root, new Set()).join('\n');
  assert.match(problems, /View\.tsx:1: a custom property in code/);
  assert.match(problems, /style\.css:2: an attribute selector on data-mo-app/);
});

test('an app written to an older contract is not refused: it keeps its global CSS', () => {
  const root = appSite({ shop: { api: 7, css: ':root { --mo-gap: 1px }' } });
  assert.deepEqual(siteProblems(root, new Set()), []);
});

test('two apps with the same class, custom property and keyframes names do not touch each other', async (t) => {
  const css = (color, ms) =>
    `@keyframes pulse { to { opacity: .5 } }\n.mo-box { --mo-size: ${ms}px; width: var(--mo-size); height: 10px; background: ${color}; animation: pulse 1s paused }`;
  const root = appSite({ one: { api: 8, css: css('rgb(255, 0, 0)', 100) }, two: { api: 8, css: css('rgb(0, 0, 255)', 200) } });
  const plugin = appCss({ cms: [] });
  const scoped = (id) =>
    plugin.transform.call({}, readFileSync(join(root, 'src/apps', id, 'style.css'), 'utf8'), join(root, 'src/apps', id, 'style.css')).code;
  const html = `<style>@layer mo-app;${scoped('one')}${scoped('two')}</style>
    <div data-mo-app="one"><i class="mo-box" id="a"></i></div><div data-mo-app="two"><i class="mo-box" id="b"></i></div>
    <div data-mo-app="one"><div data-mo-app="two"><i class="mo-box" id="c"></i></div></div>`;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }).catch(() => null);
  if (!browser) return t.skip('no Chromium here');
  try {
    const page = await browser.newPage();
    await page.setContent(html);
    const read = (id) =>
      page.$eval(`#${id}`, (e) => ({
        ...(({ width, backgroundColor, animationName }) => ({ width, backgroundColor, animationName }))(getComputedStyle(e)),
      }));
    const [a, b, c] = [await read('a'), await read('b'), await read('c')];
    assert.deepEqual([a.width, a.backgroundColor, a.animationName], ['100px', 'rgb(255, 0, 0)', 'mo-app-one-pulse']);
    assert.deepEqual([b.width, b.backgroundColor, b.animationName], ['200px', 'rgb(0, 0, 255)', 'mo-app-two-pulse']);
    assert.equal(c.backgroundColor, 'rgb(0, 0, 255)'); // the inner app's block keeps its own look (prefix mode: the outer app's rule may reach it, never wins here)
  } finally {
    await browser.close();
  }
});

test("an .astro file's <style> and <style is:global> blocks are read: refusals with their line, and said as not scoped", () => {
  const dir = mkdtempSync(join(tmpdir(), 'app-css-astro-'));
  writeFileSync(
    join(dir, 'a.astro'),
    '---\n---\n<div />\n<style is:global>\n  .calendly-inline-widget { height: 1px }\n  body { margin: 0 }\n</style>\n',
  );
  const r = reportApp(dir, 'cal', new Set());
  assert.deepEqual(r.refused, ['a.astro:6: a rule on body']);
  assert.ok(r.limits.some((l) => /a\.astro: a <style is:global> block is not scoped/.test(l)));
});
