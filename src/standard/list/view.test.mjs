// Tests what the List shows: the card (`card`, `design`) passes through the view. Run: node --test src/standard/list/view.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cardOf } from './card.mjs';

test('a List without a card has none in its view', () => {
  assert.deepEqual(cardOf({}), {});
  assert.deepEqual(cardOf({ design: 'filled' }), {});
});

test('a List in one card has the card and its style, outlined unless it says otherwise', () => {
  assert.equal(cardOf({ card: 'one' }).design, 'outlined');
  assert.equal(cardOf({ card: 'one', design: '' }).design, 'outlined');
  assert.equal(cardOf({ card: 'one', design: 'filled' }).design, 'filled');
  assert.equal(cardOf({ card: 'one', design: 'elevated' }).design, 'elevated');
  assert.equal(cardOf({ card: 'one', design: 'nonsense' }).design, 'outlined');
  assert.equal(cardOf({ card: 'one' }).card, 'one');
});
