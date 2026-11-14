// The List "expand" kind (List.tsx, ui.css): React components cannot be imported by `node --test`, so this reads the sources the way
// the markup and the drawing meet: every class List.tsx gives a folding item has its rule in ui.css, the part draws a native
// <details>/<summary> (keyboard and screen readers from the browser), the FAQ is drawn on it and no longer by rules of its own, and
// the script that glides it finds the part's classes. `check:screens` measures the real thing (375 and 1280 px).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const list = read('./List.tsx');
const ui = read('../styles/ui.css');
const blocks = read('../styles/blocks.css');
const accordion = read('../blocks/faq/Accordion.tsx');
const script = read('../blocks/faq/script.ts');

test('every class of a folding item has a rule in ui.css', () => {
  const classes = new Set(list.match(/\blist-(?:item-)?expand[a-z-]*/g));
  for (const c of ['list-expand', 'list-item-expand', 'list-item-expand-summary', 'list-item-expand-icon', 'list-item-expand-body']) {
    assert.ok(classes.has(c), `List.tsx gives no ${c}`);
  }
  for (const c of classes) assert.match(ui, new RegExp(`\\.${c}\\b`), `ui.css has no rule for .${c}`);
});

test('the item is a details with its summary as the item (keyboard and screen readers)', () => {
  assert.match(list, /<details[\s\S]*?<summary className=\{`\$\{classes\} list-item-expand-summary`\}/);
  assert.match(list, /name=\{expandName\}/);
  assert.match(list, /open=\{expandOpen\}/);
  assert.match(ui, /\.list-item-expand\[open\] > \.list-item-expand-summary \.list-item-expand-icon\s*\{[^}]*rotate: 180deg/);
});

test("the state layers and the focus ring are the List's own tokens, the corner is M3's 16dp", () => {
  const summary = ui.slice(ui.indexOf('.list-item-expand-summary {'));
  assert.match(summary, /--list-item-hover-surface/);
  assert.match(summary, /--list-item-focus-indicator-color/);
  assert.match(summary, /outline: 3px solid/);
  assert.match(ui, /\.list-expand\s*\{[^}]*--list-expand-radius, var\(--mo-shape-large\)/);
});

test('the FAQ is drawn on the part, with no accordion rules of its own left', () => {
  assert.match(accordion, /<List expand className="block-accordion">/);
  assert.match(accordion, /<ListItem[\s\S]*?\bexpand\b/);
  assert.doesNotMatch(accordion.replace(/^\/\/.*$/gm, ''), /<details|<summary/);
  for (const old of [
    '.block-accordion-label',
    '.block-accordion-row',
    '.block-accordion-icon',
    '.block-accordion-body',
    '.block-accordion-title',
  ]) {
    assert.ok(!blocks.includes(old), `blocks.css still has ${old}`);
  }
});

test('the glide script finds the part', () => {
  assert.match(script, /details\.list-item-expand/);
  assert.match(script, /\.list-item-expand-body/);
  assert.ok(!script.includes('block-accordion-row'));
});

test('the reduced-motion rule stops the caret from turning', () => {
  assert.match(ui, /prefers-reduced-motion: reduce\)\s*\{\s*\.list-item-expand-icon\s*\{\s*transition: none/);
});
