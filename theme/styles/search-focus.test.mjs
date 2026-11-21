// The search field's ring is for the keyboard only (0.19.5 batch 22; owner, 21 Nov 2026). A text field matches :focus-visible after a mouse click too, and the
// search view puts the focus in its field when it opens, so the ring rules also ask that the keyboard was the last input (theme/ui/inputModality.ts sets
// data-mo-input on <html>). M3's search page prints no ring of its own for the field ("individual elements maintain their own interaction states").
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const css = read('./ui/search.css').replace(/\/\*[\s\S]*?\*\//g, '');

test('no ring on a search field is drawn by :focus-visible alone', () => {
  const rules = [...css.matchAll(/([^{}]*:has\([^)]*__input:focus-visible\)[^{}]*)\{/g)].map((m) => m[1].trim());
  assert.equal(rules.length, 2, 'the in-place bar and the view header are the two fields with a ring');
  for (const selector of rules) assert.match(selector, /^:root\[data-mo-input='keyboard'\] /, selector);
});

test('the search bar, the view and the script keep the input modality up to date', () => {
  assert.match(read('../ui/Search.tsx'), /useEffect\(trackInputModality, \[\]\)/);
  assert.match(read('../ui/search.script.ts'), /trackInputModality\(\);/);
});

test('the modality is the last of keyboard and pointer, set on <html>', async () => {
  const src = read('../ui/inputModality.ts');
  assert.match(src, /'keydown'/);
  assert.match(src, /'pointerdown'/);
  assert.match(src, /data-mo-input/);
});
