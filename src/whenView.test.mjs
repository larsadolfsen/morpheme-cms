/**
 * Tests for `whenParts`: its short form is what the start screen's top bar shows ("Updated 1:42 PM"), so it must stay short.
 * Depends on `node:test`, `node:assert/strict` and `./whenView.mjs`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { whenParts } from './whenView.mjs';

const words = { today: 'today', yesterday: 'yesterday' };
const now = new Date(2026, 10, 13, 9, 0);
const at = (y, m, d) => new Date(y, m, d, 23, 42);
const parts = (date) => whenParts(date, 'en-US', words, now);

test('short form today is only the time', () => {
  assert.equal(parts(at(2026, 10, 13)).short, '11:42 PM');
});

test('short form yesterday is only the date, never "yesterday at"', () => {
  assert.equal(parts(at(2026, 10, 12)).short, 'Nov 12');
  assert.equal(parts(at(2026, 10, 12)).shown, 'yesterday');
});

test('short form another year keeps the year, and no short form has a day word or a time of day with it', () => {
  assert.equal(parts(at(2025, 11, 30)).short, 'Dec 30, 2025');
  for (const d of [at(2026, 10, 12), at(2026, 9, 1), at(2025, 0, 5)]) {
    const { short } = parts(d);
    assert.doesNotMatch(short, /yesterday|today| at |\d:\d\d/);
    assert.ok(short.length <= 14, short);
  }
});

test('the Danish locale gives a 24 hour time today', () => {
  assert.equal(whenParts(at(2026, 10, 13), 'da-DK', words, now).short, '23.42');
});
