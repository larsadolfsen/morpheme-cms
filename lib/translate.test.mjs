// Tests for lib/translate.mjs (translate, joinDictionaries). Run: node --test lib/translate.test.mjs
// Danish letters are written as \u escapes.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { joinDictionaries, translate } from './translate.mjs';

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

// joinDictionaries: the Danish editor reads the standard parts' English -> Danish dictionary, any editor reads the
// site's and the apps' own texts. `standard` translates into da-DK.
const standardDa = (dictionary) => ({ language: 'da-DK', dictionary });

test('da-DK shows the Danish of a converted text', () => {
  const dictionary = joinDictionaries('da-DK', standardDa({ Content: 'Indhold' }));
  assert.equal(translate(dictionary, 'Content'), 'Indhold');
});

test('da-DK shows a text that is not converted yet as written', () => {
  const dictionary = joinDictionaries('da-DK', standardDa({}));
  assert.equal(translate(dictionary, 'Indhold'), 'Indhold');
});

test('en-US shows the English of a text that is not converted yet', () => {
  const dictionary = joinDictionaries('en-US', standardDa({ Content: 'Indhold' }), { Indhold: 'Content' });
  assert.equal(translate(dictionary, 'Indhold'), 'Content');
});

test('en-US shows a converted text as written', () => {
  const dictionary = joinDictionaries('en-US', standardDa({ Content: 'Indhold' }), {});
  assert.equal(translate(dictionary, 'Content'), 'Content');
});

test('a language that is neither gets only the own texts', () => {
  const dictionary = joinDictionaries('sv-SE', standardDa({ Content: 'Indhold' }), { Indhold: 'Innehåll' });
  assert.equal(translate(dictionary, 'Content'), 'Content');
  assert.equal(translate(dictionary, 'Indhold'), 'Innehåll');
});

test('an own text wins over the standard dictionary, a later own over an earlier', () => {
  const dictionary = joinDictionaries('da-DK', standardDa({ Content: 'Indhold' }), { Content: 'Tekst' }, undefined, {
    Content: 'Brødtekst',
  });
  assert.equal(translate(dictionary, 'Content'), 'Brødtekst');
});
