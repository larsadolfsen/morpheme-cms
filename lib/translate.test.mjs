// Tests for lib/translate.mjs. Run: node --test lib/translate.test.mjs
// Danish letters are written as \u escapes.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { translate } from './translate.mjs';

test('takes the dictionary entry', () => {
  assert.equal(translate({ 'Read more': 'L\u00e6s mere' }, 'Read more'), 'L\u00e6s mere');
});

test('returns the text when there is no dictionary', () => {
  assert.equal(translate(undefined, 'Read more'), 'Read more');
});

test('fills in a value', () => {
  assert.equal(translate({}, 'Hi {name}', { name: 'Sara' }), 'Hi Sara');
});

test('fills in a value after the lookup', () => {
  assert.equal(translate({ 'Hi {name}': 'Hej {name}' }, 'Hi {name}', { name: 'Sara' }), 'Hej Sara');
});

test('keeps a name that has no value', () => {
  assert.equal(translate({}, 'Hi {name}', {}), 'Hi {name}');
});

test('turns a number into text', () => {
  assert.equal(translate({}, '{n} pages', { n: 3 }), '3 pages');
});

test('ignores inherited keys', () => {
  assert.equal(translate({}, 'toString'), 'toString');
});

test('keeps a name when no values are given', () => {
  assert.equal(translate({}, 'Hi {name}'), 'Hi {name}');
});
