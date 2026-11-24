import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectNames, scopeAppCss } from './appCss.mjs';

const run = (css, id = 'shop', mode = 'prefix', cms = new Set(['--mo-shared'])) =>
  scopeAppCss(css, { id, names: collectNames([css], id, cms), mode });

test('prefix mode: every selector gets the app scope with no added specificity, inside the layer', () => {
  const out = run('.mo-signup, .mo-signup a:hover { color: red }');
  assert.match(out, /^@layer mo-app \{/);
  assert.match(out, /:where\(\[data-mo-app="shop"\]\) \.mo-signup,\s*:where\(\[data-mo-app="shop"\]\) \.mo-signup a:hover/);
});

test('prefix mode: rules inside @media, @supports and @layer are scoped; the page subjects become the block', () => {
  const out = run('@media (width > 600px) { .a { top: 0 } } :root { --mo-x: 1 } body.dark .b { top: 1 } html { color: red }');
  assert.match(out, /@media \(width > 600px\) \{\s*:where\(\[data-mo-app="shop"\]\) \.a/);
  assert.match(out, /:where\(\[data-mo-app="shop"\]\) \{\s*--mo-app-shop-x: 1/);
  assert.match(out, /:where\(\[data-mo-app="shop"\]\)\.dark \.b/);
  assert.match(out, /:where\(\[data-mo-app="shop"\]\) \{\s*color: red/);
});

test('prefix mode: a nested rule follows its parent and is not prefixed again', () => {
  const out = run('.a { color: red; & .b { color: blue } }');
  assert.equal(out.match(/data-mo-app/g).length, 1);
});

test('scope mode: one @scope that stops at another app, the page subjects are :scope', () => {
  const out = run('.a { color: red } :root { color: blue }', 'shop', 'scope');
  assert.match(out, /@scope \(\[data-mo-app="shop"\]\) to \(\[data-mo-app\]:not\(\[data-mo-app="shop"\]\)\)/);
  assert.match(out, /:scope \{\s*color: blue/);
  assert.doesNotMatch(out, /:where/);
});

test('private custom properties are renamed where they are declared and read; the CMS ones keep their names', () => {
  const out = run(
    '.a { --mo-gap: 4px; --mo-shared: 1; padding: var(--mo-gap); color: var(--mo-sys-color-primary); margin: var(--mo-gap-big, var(--mo-gap)) }',
  );
  assert.match(out, /--mo-app-shop-gap: 4px/);
  assert.match(out, /padding: var\(--mo-app-shop-gap\)/);
  assert.match(out, /--mo-shared: 1/);
  assert.match(out, /var\(--mo-sys-color-primary\)/);
  assert.match(out, /var\(--mo-gap-big, var\(--mo-app-shop-gap\)\)/, 'a longer name is not caught by a shorter one');
});

test('@keyframes, @property, @font-face and @layer names are renamed with their uses, and global at-rules stay out of the scope', () => {
  const out = run(
    '@layer base, theme; @font-face { font-family: "Sans"; src: url(a.woff2) } @property --mo-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg } ' +
      '@keyframes fade { to { opacity: 1 } } .a { animation: fade 1s, other 2s; font-family: Sans, serif; rotate: var(--mo-angle) } @layer theme { .b { top: 0 } }',
    'shop',
    'scope',
  );
  assert.match(out, /@keyframes mo-app-shop-fade/);
  assert.match(out, /animation: mo-app-shop-fade 1s, other 2s/);
  assert.match(out, /font-family: "mo-app-shop-Sans"/);
  assert.match(out, /font-family: mo-app-shop-Sans, serif/);
  assert.match(out, /@property --mo-app-shop-angle/);
  assert.match(out, /@layer mo-app-shop-base, mo-app-shop-theme/);
  assert.match(out, /@layer mo-app-shop-theme \{/);
  assert.ok(out.indexOf('@keyframes') < out.indexOf('@scope'), 'keyframes sit outside @scope');
});

test('two apps with the same class, custom property and keyframes names do not touch each other', () => {
  const css = '.mo-signup { --mo-gap: 1px; animation: spin 1s } @keyframes spin { to { opacity: 0 } }';
  const a = run(css, 'alpha');
  const b = run(css, 'beta');
  assert.match(a, /mo-app-alpha-spin/);
  assert.match(b, /mo-app-beta-spin/);
  assert.doesNotMatch(a, /beta/);
  assert.match(b, /--mo-app-beta-gap/);
});

test('a name declared in another file of the same app is renamed in this one', () => {
  const names = collectNames(['.a { --mo-gap: 1px }', '.b { padding: var(--mo-gap) }'], 'shop');
  assert.match(scopeAppCss('.b { padding: var(--mo-gap) }', { id: 'shop', names }), /var\(--mo-app-shop-gap\)/);
});

test('@import stays first and outside the layer', () => {
  const out = run('.a { top: 0 } @import "x.css";');
  assert.ok(out.startsWith('@import "x.css"'));
});
