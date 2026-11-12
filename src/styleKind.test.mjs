import { test } from 'node:test';
import assert from 'node:assert/strict';
import { styleKindOf } from './styleKind.mjs';

test('outside the text the style button shows the generic icon, whatever the cursor was in', () => {
  assert.equal(styleKindOf(['check'], false), 'generic');
  assert.equal(styleKindOf([], false), 'generic');
});

test('in the text it shows the style of the block, as the menu marks it', () => {
  for (const kind of ['large', 'medium', 'small', 'label', 'bullet', 'check', 'ordered', 'quote'])
    assert.equal(styleKindOf([kind, 'strong'], true), kind);
});

test('in a heading it shows Body large, the first of the list', () => {
  assert.equal(styleKindOf(['h2'], true), 'large');
});
