// A plain list's row has its layer 16 dp past the text column at every width (M3 Lists › Specs: 16 dp leading and trailing space inside the item's container),
// by the row's inner padding and an equal negative margin of the list (21 Nov 2026). Compact keeps square corners; medium and wide use the theme's item corners.
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
    /\.mo-block-list:not\(\.mo-list__segmented\) \{\s*--mo-comp-list-item-padding-inline: var\(--mo-sys-block-list-layer-room\);/,
  );
  assert.doesNotMatch(base, /--mo-comp-list-item-padding-inline: 0;/);
  // The room is declared at every width, not only on compact (the bug: 0 padding at 1280).
  assert.match(outsideMedia(read('./tokens/lists/sys.css')), /--mo-sys-block-list-layer-room: 1rem;/);
});

test('a plain Accordion item has padding-inline > 0 at medium and wide', () => {
  const base = outsideMedia(tokens);
  assert.match(
    base,
    /\.mo-block-accordion:not\(\.mo-block-accordion__segmented\) \{\s*--mo-comp-list-expand-padding-inline: var\(--mo-sys-block-list-layer-room\);/,
  );
  assert.doesNotMatch(base, /--mo-comp-list-expand-padding-inline: 0;/);
});

test('the list moves out by the same room at every width, so the content stays on the text edges', () => {
  const base = outsideMedia(lists);
  assert.match(
    base,
    /\.mo-block-list:not\(\.mo-list__segmented\),\s*\.mo-block-accordion:not\(\.mo-block-accordion__segmented\) \{\s*margin-inline: calc\(-1 \* var\(--mo-sys-block-list-layer-room\)\);/,
  );
});

test('square layer corners stay on compact only', () => {
  const base = outsideMedia(tokens);
  assert.doesNotMatch(base, /item-hover-radius: 0;/);
  assert.match(tokens, /@media \(width < 37\.5rem\)[\s\S]*--mo-comp-list-item-hover-radius: 0;/);
});
