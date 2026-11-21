// Side padding follows Material 3 (21 Nov 2026, 0.19.5): a 40 px button and the text button 16 dp (Buttons › Specs, md.comp.button.small.leading-space and
// trailing-space; 24 dp is the 56 px medium size), List - Expand and Q&A rows 16 dp (Lists › Specs "Label left padding 16dp"), a checklist row the list's own
// 16 dp, and a plain List - Expand draws no line between its items (Lists › Guidelines: dividers only where a stronger separation is needed).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const button = read('./tokens/material/comp/button.css');
const list = read('./tokens/material/comp/list.css');
const blocksList = read('./tokens/blocks/comp/list.css');
const listsTokens = read('./tokens/lists/comp/list.css');

test('the 40 px button and the text button have 16 dp side padding', () => {
  assert.match(button, /--mo-comp-button-medium-container-height: 2\.5rem;/);
  assert.match(button, /--mo-comp-button-padding: 1rem;/);
  assert.match(button, /--mo-comp-button-text-padding: 1rem;/);
});

test('a segmented List - Expand row has 16 dp with or without media', () => {
  assert.match(list, /\.mo-block-accordion__segmented \{[^}]*--mo-comp-list-expand-padding-inline: 1rem;/);
  assert.doesNotMatch(listsTokens, /:has\(\.mo-list__item-leading-avatar/);
});

test('Q&A rows keep the List - Expand padding at every width', () => {
  assert.doesNotMatch(blocksList, /--mo-comp-list-expand-padding-inline/);
});

test('a checklist row keeps the list item padding, not 0', () => {
  const check = blocksList.slice(blocksList.indexOf('.mo-block-checklist'));
  assert.doesNotMatch(check, /--mo-comp-list-item-padding-inline/);
});

test('a plain List - Expand has no line between items in Material', () => {
  assert.match(list, /--mo-comp-list-expand-divider-default-color: transparent;/);
  for (const p of ['./lists.css', './ui/list.css']) {
    assert.match(read(p), /var\(--mo-comp-list-expand-divider-default-color, var\(--mo-comp-list-expand-divider,/);
  }
});
