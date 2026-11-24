// A plain list draws no line between its rows in Material: M3's md.comp.list.divider.color is the colour of a divider a list asks for
// (inset, middle-inset), so it is `outline`, and the default line has a token of its own that Material sets to `transparent`
// (0.19.5 batch 6; a theme that sets neither keeps the block line).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const listCss = read('./ui/list.css');
const material = read('./tokens/material/comp/list.css');

test('Material gives a divider the outline role and a plain list no line', () => {
  assert.match(material, /--mo-comp-list-divider-color: var\(--mo-sys-color-outline\);/);
  assert.match(material, /--mo-comp-list-divider-default-color: transparent;/);
});

test('a plain list draws its default line, a list that asks for dividers draws M3 divider colour', () => {
  assert.ok(
    listCss.includes(
      '.mo-list > li + li {\n    border-top: 1px solid var(--mo-comp-list-divider-default-color, var(--mo-comp-list-divider-color, var(--mo-comp-block-line)));',
    ),
  );
  const inset = listCss.slice(listCss.indexOf('.mo-list__dividers-middle-inset):not(.mo-list__segmented) > li + li::before'));
  assert.ok(inset.includes('border-top: 1px solid var(--mo-comp-list-divider-color, var(--mo-comp-block-line));'));
});
