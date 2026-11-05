// Tests for lib/word-at.mjs: the word around a place in a line of text. Run: node --test packages/editor/lib/*.test.mjs packages/editor/src/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wordAt } from './word-at.mjs';

test('inside a word', () => assert.deepEqual(wordAt('How saving works', 6), { from: 4, to: 10 }));
test('at the start of a word', () => assert.deepEqual(wordAt('How saving works', 4), { from: 4, to: 10 }));
test('at the end of a word', () => assert.deepEqual(wordAt('How saving works', 10), { from: 4, to: 10 }));
test('between two spaces', () => assert.equal(wordAt('How  saving', 4), null));
test('after a full stop', () => assert.equal(wordAt('works.', 6), null));
test('before a full stop', () => assert.deepEqual(wordAt('works.', 5), { from: 0, to: 5 }));
test('an apostrophe and a hyphen are inside a word', () => {
  assert.deepEqual(wordAt("don't", 2), { from: 0, to: 5 });
  assert.deepEqual(wordAt('e-mail', 1), { from: 0, to: 6 });
});
test('quotes around a word are not part of it', () => assert.deepEqual(wordAt("'hi'", 2), { from: 1, to: 3 }));
test('Danish letters', () => assert.deepEqual(wordAt('Gem ændringer', 6), { from: 4, to: 13 }));
test('a lone hyphen is no word', () => assert.equal(wordAt('a - b', 3), null));
test('an empty text', () => assert.equal(wordAt('', 0), null));
