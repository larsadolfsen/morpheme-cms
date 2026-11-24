// A plain list's row has its layer 16 dp past the text column at every width (M3 Lists › Specs: 16 dp leading and trailing space inside the item's container),
// by the row's inner padding and an equal negative margin of the list (21 Nov 2026). The layer keeps M3's shapes at every width.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const tokens = read('./tokens/lists/comp/list.css');
const lists = read('./lists.css');

// The rules outside any media query (they apply at medium and wide as well as compact).
const outsideMedia = (css) => css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');

test('a plain list row has padding-inline > 0 at medium and wide, not only on compact', () => {
  const base = outsideMedia(tokens);
  assert.match(
    base,
    /\.mo-block-list:not\(\.mo-list__segmented\) \{\s*--mo-comp-list-list-item-leading-space: var\(--mo-comp-block-list-layer-room\);\s*--mo-comp-list-list-item-trailing-space: var\(--mo-comp-block-list-layer-room\);/,
  );
  assert.doesNotMatch(base, /--mo-comp-list-list-item-leading-space: 0;\s*--mo-comp-list-list-item-trailing-space: 0;/);
  // The room is declared at every width, not only on compact (the bug: 0 padding at 1280).
  assert.match(outsideMedia(read('./tokens/lists/sys.css')), /--mo-comp-block-list-layer-room: 1rem;/);
});

test('a plain Accordion item has padding-inline > 0 at medium and wide', () => {
  const base = outsideMedia(tokens);
  assert.match(
    base,
    /\.mo-block-accordion:not\(\.mo-block-accordion__segmented\) \{\s*--mo-comp-list-expand-padding-inline: var\(--mo-comp-block-list-layer-room\);/,
  );
  assert.doesNotMatch(base, /--mo-comp-list-expand-padding-inline: 0;/);
});

test('the list moves out by the same room at every width, so the content stays on the text edges', () => {
  const base = outsideMedia(lists);
  assert.match(
    base,
    /\.mo-block-list:not\(\.mo-list__segmented\),\s*\.mo-block-accordion:not\(\.mo-block-accordion__segmented\) \{\s*margin-inline: calc\(-1 \* var\(--mo-comp-block-list-layer-room\)\);/,
  );
});

test('the layer and an open item keep M3 shapes at every width, none is squared on compact', () => {
  assert.doesNotMatch(tokens, /item-(hover|pressed|selected)-radius: 0;/);
  assert.doesNotMatch(tokens, /expand-(open-radius|container-shape): 0;/);
  assert.doesNotMatch(tokens, /@media \(width < 37\.5rem\)/);
  const material = read('./tokens/material/comp/list.css');
  assert.match(material, /--mo-comp-list-list-item-hovered-container-expressive-shape: var\(--mo-sys-shape-corner-medium\);/);
  assert.match(material, /--mo-comp-list-list-item-pressed-container-expressive-shape: var\(--mo-sys-shape-corner-large\);/);
  assert.match(material, /--mo-comp-list-list-item-selected-container-expressive-shape: var\(--mo-sys-shape-corner-large\);/);
  assert.match(outsideMedia(lists), /--mo-comp-list-expand-open-radius: var\(--mo-sys-shape-corner-large\);/);
});
