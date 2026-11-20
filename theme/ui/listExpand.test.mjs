// The List "expand" kind (List.tsx, ui.css): React components cannot be imported by `node --test`, so this reads the sources the way
// the markup and the drawing meet: every class List.tsx gives a folding item has its rule in ui.css, the part draws a native
// <details>/<summary> (keyboard and screen readers from the browser), the FAQ is drawn on it and no longer by rules of its own, and
// the script that glides it finds the part's classes. `check:screens` measures the real thing (375 and 1280 px).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const list = read('./List.tsx');
const ui = read('../styles/ui/list.css');
const blocks = readdirSync(new URL('../styles/blocks/', import.meta.url))
  .map((f) => read(`../styles/blocks/${f}`))
  .join('\n');
const accordion = read('../blocks/expand/Accordion.tsx');
const script = read('../blocks/expand/script.ts');

test('every class of a folding item has a rule in list.css', () => {
  const classes = new Set(list.match(/\bmo-list__(?:item-)?expand[a-z-]*/g));
  for (const c of [
    'mo-list__expand',
    'mo-list__item-expand',
    'mo-list__item-expand-summary',
    'mo-list__item-expand-icon',
    'mo-list__item-expand-body',
  ]) {
    assert.ok(classes.has(c), `List.tsx gives no ${c}`);
  }
  for (const c of classes) assert.match(ui, new RegExp(`\\.${c}\\b`), `list.css has no rule for .${c}`);
});

test('the item is a details with its summary as the item (keyboard and screen readers)', () => {
  assert.match(list, /<details[\s\S]*?<summary className=\{`\$\{classes\} mo-list__item-expand-summary`\}/);
  assert.match(list, /name=\{expandName\}/);
  assert.match(list, /open=\{expandOpen\}/);
  assert.match(ui, /\.mo-list__item-expand\[open\] > \.mo-list__item-expand-summary \.mo-list__item-expand-icon\s*\{[^}]*rotate: 180deg/);
});

test("the state layers and the focus ring are the List's own tokens, the corner is M3's 16dp", () => {
  const summary = ui.slice(ui.indexOf('.mo-list__item-expand-summary {'));
  assert.match(summary, /--mo-comp-list-item-hover-surface/);
  assert.match(summary, /--mo-comp-list-item-focus-indicator-color/);
  assert.match(summary, /outline: 3px solid/);
  assert.match(ui, /\.mo-list__expand\s*\{[^}]*--mo-comp-list-expand-container-shape, var\(--mo-sys-shape-corner-large\)/);
});

test('the FAQ is drawn on the part, with no accordion rules of its own left', () => {
  assert.match(
    accordion,
    /<List\s+expand\s+className=\{segmented \? 'mo-block-accordion mo-block-accordion__segmented' : 'mo-block-accordion'\}[^>]*>/,
  );
  assert.match(accordion, /<ListItem[\s\S]*?\bexpand\b/);
  assert.doesNotMatch(accordion.replace(/^\/\/.*$/gm, ''), /<details|<summary/);
  for (const old of [
    '.block-accordion-label',
    '.block-accordion-row',
    '.block-accordion-icon',
    '.block-accordion-body',
    '.block-accordion-title',
  ]) {
    assert.ok(!blocks.includes(old), `the blocks' CSS still has ${old}`);
  }
});

test('the glide script finds the part', () => {
  assert.match(script, /details\.mo-list__item-expand/);
  assert.match(script, /\.mo-list__item-expand-body/);
  assert.ok(!script.includes('block-accordion-row'));
});

test('the reduced-motion rule stops the caret from turning', () => {
  assert.match(ui, /prefers-reduced-motion: reduce\)\s*\{\s*\.mo-list__item-expand-icon\s*\{\s*transition: none/);
});
