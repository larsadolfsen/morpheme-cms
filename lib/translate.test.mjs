// Tests for lib/translate.mjs (translate, splitMissing, englishOf). Run: node --test lib/translate.test.mjs
// Danish letters are written as \u escapes.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { englishOf, splitMissing, translate } from './translate.mjs';

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

// splitMissing: a standard text with no translation stops the check, the site's own only warns.
test('splits the missing texts into the standard parts and the own', () => {
  const split = splitMissing(['Content', 'Alpha', 'Price'], new Set(['Content', 'Media']));
  assert.deepEqual(split, { standard: ['Content'], own: ['Alpha', 'Price'] });
});

test('has nothing to split when nothing is missing', () => {
  assert.deepEqual(splitMissing([], new Set(['Content'])), { standard: [], own: [] });
});

test('an own text of an English site with no Danish only warns', () => {
  const split = splitMissing(['Opening hours'], new Set(['Content']));
  assert.deepEqual(split, { standard: [], own: ['Opening hours'] });
});

test('a standard text whose Danish entry was removed stops the check', () => {
  // The standard set is built from the standard definitions, not from the Danish dictionary.
  const split = splitMissing(['Button text', 'Opening hours'], new Set(['Button text', 'Content']));
  assert.deepEqual(split, { standard: ['Button text'], own: ['Opening hours'] });
});

test("the way back from the standard parts' second language leads to the English text, and knows no app table", () => {
  const back = englishOf({ 'Add tag': 'Tag hinzufuegen', Heading: 'Kopf' });
  assert.equal(back.get('Kopf'), 'Heading');
  assert.equal(back.get('Tag hinzufuegen'), 'Add tag');
  // An app that writes "Thema hinzufuegen" and translates it to "Add tag" is not a way back: its text stays its own.
  assert.equal(back.get('Thema hinzufuegen'), undefined);
  assert.equal(back.get('Add tag'), undefined);
});
