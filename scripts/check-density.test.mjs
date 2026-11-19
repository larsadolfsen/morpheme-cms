import test from 'node:test';
import assert from 'node:assert/strict';
import { findProblems, blocksOf, readStyles } from './check-density.mjs';

const real = () => readStyles(new URL('../', import.meta.url));

test('the theme follows density today', () => assert.deepEqual(findProblems(real()), []));

test('a part that drops its density term fails', () => {
  const f = real();
  f['theme/styles/ui/buttons.css'] = f['theme/styles/ui/buttons.css'].replace(
    /min-height: calc\(var\(--mo-comp-button-box\)[^;]*;/,
    'min-height: var(--mo-comp-button-box);',
  );
  assert.match(findProblems(f).join('\n'), /button \(\.mo-button\) ignores density/);
});

test('a focused part, a horizontal padding and a text size that read density fail', () => {
  const f = real();
  // The menu item's rules are in menus.css (moved out of ui.css), so the focused part's rule is added there.
  f['theme/styles/ui/menus.css'] += '\n.mo-menu__item { min-height: calc(3rem + var(--mo-sys-density) * var(--mo-sys-density-step)); }\n';
  f['theme/styles/ui.css'] +=
    '\n.x {\npadding-inline: calc(1rem + var(--mo-sys-density) * 1px);\nfont-size: calc(1rem + var(--mo-sys-density) * 1px);\n}\n';
  const out = findProblems(f).join('\n');
  assert.match(out, /menu item .* focused part/);
  assert.match(out, /horizontal padding never follows density/);
  assert.match(out, /text size never follows density/);
});

test('blocksOf finds a selector in a list and ignores comments', () => {
  assert.equal(blocksOf('/* .a { x: 1 } */ .b, .a { y: 2 }', '.a').length, 1);
});
