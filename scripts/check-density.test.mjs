import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findProblems, blocksOf } from './check-density.mjs';

const real = () =>
  Object.fromEntries(
    ['theme/styles/ui.css', 'theme/styles/blocks.css', 'theme/styles/base.css', 'theme/styles/global.css', 'src/editor.css'].map((f) => [
      f,
      readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'),
    ]),
  );

test('the theme follows density today', () => assert.deepEqual(findProblems(real()), []));

test('a part that drops its density term fails', () => {
  const f = real();
  f['theme/styles/ui.css'] = f['theme/styles/ui.css'].replace(
    /min-height: calc\(var\(--button-box\)[^;]*;/,
    'min-height: var(--button-box);',
  );
  assert.match(findProblems(f).join('\n'), /button \(\.button\) ignores density/);
});

test('a focused part, a horizontal padding and a text size that read density fail', () => {
  const f = real();
  f['theme/styles/ui.css'] +=
    '\n.menu-item { min-height: calc(3rem + var(--mo-density) * var(--mo-density-step)); }\n.x {\npadding-inline: calc(1rem + var(--mo-density) * 1px);\nfont-size: calc(1rem + var(--mo-density) * 1px);\n}\n';
  const out = findProblems(f).join('\n');
  assert.match(out, /menu item .* focused part/);
  assert.match(out, /horizontal padding never follows density/);
  assert.match(out, /text size never follows density/);
});

test('blocksOf finds a selector in a list and ignores comments', () => {
  assert.equal(blocksOf('/* .a { x: 1 } */ .b, .a { y: 2 }', '.a').length, 1);
});
