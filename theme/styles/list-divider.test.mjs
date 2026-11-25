// A plain list draws no line between its rows in Material: every line is the divider's (--mo-comp-divider-color and -thickness, M3's md.comp.divider),
// a list that asks for dividers (inset, middle-inset) draws it, and Material takes the colour off a plain list's and a List - Expand's lines (dividers.css).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const listCss = read('./ui/list.css');
const material = read('./material/dividers.css');
const line = 'border-top: var(--mo-comp-divider-thickness, 1px) solid var(--mo-comp-divider-color, var(--mo-comp-block-line));';

test('Material gives a plain list and a List - Expand no line', () => {
  assert.match(material, /\.mo-list:not\(\.mo-list__dividers-inset, \.mo-list__dividers-middle-inset\) > li \+ li/);
  assert.match(material, /\.mo-list__expand > li \+ li/);
  assert.match(material, /border-top-color: transparent;/);
});

test('a plain list and a list that asks for dividers draw the divider', () => {
  assert.ok(listCss.includes(`.mo-list > li + li {\n    ${line}`));
  const inset = listCss.slice(listCss.indexOf('.mo-list__dividers-middle-inset):not(.mo-list__segmented) > li + li::before'));
  assert.ok(inset.includes(line));
  assert.doesNotMatch(listCss, /comp-list-divider|comp-list-expand-divider/);
});
