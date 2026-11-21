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

test('a part that alerts a person, a horizontal padding and a text size that read density fail', () => {
  const f = real();
  // The snackbar's rules are in snackbar.css, so the rule that reads density is added there.
  f['theme/styles/ui/snackbar.css'] += '\n.mo-snackbar { min-height: calc(3rem + var(--mo-sys-density) * var(--mo-sys-density-step)); }\n';
  f['theme/styles/ui.css'] +=
    '\n.x {\npadding-inline: calc(1rem + var(--mo-sys-density) * 1px);\nfont-size: calc(1rem + var(--mo-sys-density) * 1px);\n}\n';
  const out = findProblems(f).join('\n');
  assert.match(out, /snackbar .* alerts a person/);
  assert.match(out, /horizontal padding never follows density/);
  assert.match(out, /text size never follows density/);
});

test('a menu item that drops its density term fails', () => {
  const f = real();
  f['theme/styles/ui/menus.css'] = f['theme/styles/ui/menus.css'].replaceAll(' + var(--mo-sys-density) * var(--mo-sys-density-step)', '');
  assert.match(findProblems(f).join('\n'), /menu item \(\.mo-menu__item\) ignores density/);
});

test('blocksOf finds a selector in a list and ignores comments', () => {
  assert.equal(blocksOf('/* .a { x: 1 } */ .b, .a { y: 2 }', '.a').length, 1);
});
