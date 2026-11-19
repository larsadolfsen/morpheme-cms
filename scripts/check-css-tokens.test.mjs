import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cssOf, declared, findProblems, isRootSelector, readers, report } from './check-css-tokens.mjs';

const allow = JSON.parse(readFileSync(new URL('css-tokens-allowlist.json', import.meta.url), 'utf8'));
const none = { ...allow, files: {} };
const run = (cms, extensions = {}, a = none) => findProblems({ cms, extensions, allow: a });

test('the root is :root, html or body, also with a class or an attribute, never a descendant', () => {
  for (const s of [':root', 'html', 'body', ":root[data-theme='dark']", 'html.dark', 'body:not(.x)', '.a, :root'])
    assert.equal(isRootSelector(s), true, s);
  for (const s of ['.card', ':root .card', 'html body', 'main', '.a:root-ish']) assert.equal(isRootSelector(s), false, s);
});

test('declared tells the root and every other place apart, also in @layer and @media', () => {
  const d = declared(`
    :root { --a: 1; --mo-b: 2; }
    @layer base { @media (min-width: 40rem) { html { --c: 1; } } }
    .card { --d: 1; }
  `);
  assert.deepEqual([...d.root].sort(), ['--a', '--c', '--mo-b']);
  assert.equal(d.all.size, 4);
});

test('a prefixed name on :root passes, an unprefixed one fails', () => {
  assert.deepEqual(run({ 'a.css': ':root { --mo-card-gap: 8px; }' }), []);
  assert.match(run({ 'a.css': ':root { --sample-gap: 8px; }' }).join('\n'), /a\.css: 1 unprefixed custom property .* --sample-gap/);
});

test("an unprefixed name on a block, not on :root, is the block's own and passes", () => {
  assert.deepEqual(run({ 'a.css': '.card { --sample-gap: 8px; }' }), []);
});

test('count mode: a file may keep its count, never go over, and a new file gets none', () => {
  const css = ':root { --a: 1; --b: 2; }';
  const a = { ...allow, files: { 'a.css': { max: 2 } } };
  assert.deepEqual(run({ 'a.css': css }, {}, a), []);
  assert.deepEqual(run({ 'a.css': ':root { --a: 1; }' }, {}, a), []);
  assert.match(run({ 'a.css': css + 'html { --c: 1; }' }, {}, a).join('\n'), /3 unprefixed .* 2 allowed/);
  assert.match(run({ 'new.css': css }, {}, a).join('\n'), /new\.css: 2 unprefixed .* 0 allowed/);
  // The same name declared again (a dark value) is not a new name.
  assert.deepEqual(run({ 'a.css': css + ":root[data-theme='dark'] { --a: 3; }" }, {}, a), []);
});

test('no exemption for Tailwind: --tw-* and its old theme names on :root fail, and an @theme block is not read', () => {
  assert.match(run({ 'a.css': ':root { --tw-ring: 0; }' }).join('\n'), /--tw-ring/);
  assert.match(run({ 'a.css': ':root { --color-primary: red; }' }).join('\n'), /--color-primary/);
  assert.deepEqual(run({ 'a.css': '@theme { --my-thing: 1; }' }), []);
});

test('an app or theme that declares a name the CMS declares collides, on :root or on a block', () => {
  const cms = { 'theme.css': ':root { --mo-sys-color-primary: red; } .card { --sample-gap: 8px; }' };
  assert.match(
    run(cms, { 'apps/x/a.css': '.x { --mo-sys-color-primary: blue; }' }).join('\n'),
    /declares --mo-sys-color-primary, a name the CMS declares/,
  );
  assert.match(run(cms, { 'apps/x/a.css': '.x { --sample-gap: 1px; }' }).join('\n'), /--sample-gap/);
  assert.deepEqual(run(cms, { 'apps/x/a.css': '.x { --x-gap: 1px; }' }), []);
});

test('an app or theme declares nothing unprefixed on :root', () => {
  assert.match(run({}, { 'themes/t/a.css': ':root { --venus-gap: 1px; }' }).join('\n'), /--venus-gap on :root/);
  assert.deepEqual(run({}, { 'themes/t/a.css': ':root { --mo-brand: red; }' }), []);
});

test('the <style> of an .astro file is read, the markup is not', () => {
  const astro = '---\nconst a = 1;\n---\n<div style="--x: 1"></div>\n<style>:root { --astro-gap: 1px; }</style>';
  assert.equal(cssOf('Base.astro', astro), ':root { --astro-gap: 1px; }');
  assert.match(run({ 'Base.astro': cssOf('Base.astro', astro) }).join('\n'), /--astro-gap/);
});

test('the report lists :root names nothing reads and names one place reads', () => {
  const cms = { 'a.css': ':root { --lonely: 1; --sample-gap: 8px; --text-size: 1rem; --mo-x: 2; }' };
  const styles = {
    'a.css':
      cms['a.css'] +
      ' .card { gap: var(--sample-gap); } .card-b { gap: var(--sample-gap); } .chip { size: var(--text-size); } .badge { size: var(--text-size); }',
  };
  const r = report(cms, readers(styles, { 'x.tsx': "el.style.setProperty('--text-size', '1')" }));
  assert.deepEqual(r.unread, ['--lonely', '--mo-x']);
  assert.deepEqual(
    r.single.map(([n]) => n),
    [],
  );
  const one = report(
    { 'a.css': ':root { --sample-gap: 8px; }' },
    readers({ 'a.css': '.card { gap: var(--sample-gap); } .card:hover { gap: var(--sample-gap); }' }, {}),
  );
  assert.deepEqual(one.single, [['--sample-gap', 'a.css:card']]);
});

test('a declaration is not a read, a script string and a Tailwind (--x) are', () => {
  const reads = readers({ 'a.css': ':root { --a: 1; }' }, { 'a.tsx': 'className="px-(--b)" s(\'--c\')', 'b.css': '' });
  assert.equal(reads.has('--a'), false);
  assert.deepEqual([...reads.get('--b')], ['a.tsx']);
  assert.deepEqual([...reads.get('--c')], ['a.tsx']);
});

test('the repository passes today', () => {
  const out = execFileSync(process.execPath, [fileURLToPath(new URL('check-css-tokens.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.match(out, /none new, no collision/);
});
