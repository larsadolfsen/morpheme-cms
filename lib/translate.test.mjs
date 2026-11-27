// Tests for lib/translate.mjs (translate, splitMissing, englishOf). Run: node --test lib/translate.test.mjs
// Danish letters are written as \u escapes.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appLacking, appLanguage, appNeeds, englishOf, splitMissing, translate } from './translate.mjs';

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

test('an app block translating a label in its texts.ts leaves no warning in the site bucket', async () => {
  const { lacking, siteWalkParts } = await import('./translate.mjs');
  const parts = [
    { id: 'company', texts: ['Company name'] },
    { id: 'help', texts: ['Heading (contact)'] },
  ];
  const siteTexts = { 'Company name': 'Firmanavn' };
  const blockTexts = { 'Heading (contact)': 'Translated heading' };
  const walked = siteWalkParts(parts, new Set(['help'])).flatMap((p) => p.texts);
  // The site bucket: nothing, though only the block's texts.ts translates the label.
  assert.deepEqual(lacking(walked, siteTexts), []);
  // The block's bucket checks against the site's texts and the block's own: translated, no warning.
  const help = parts.filter((p) => p.id === 'help').flatMap((p) => p.texts);
  assert.deepEqual(lacking(help, { ...siteTexts, ...blockTexts }), []);
});

test('the same label missing from the block texts.ts warns in the block bucket only', async () => {
  const { lacking, siteWalkParts } = await import('./translate.mjs');
  const parts = [
    { id: 'company', texts: ['Company name'] },
    { id: 'help', texts: ['Heading (contact)'] },
  ];
  const siteTexts = { 'Company name': 'Firmanavn' };
  const walked = siteWalkParts(parts, new Set(['help'])).flatMap((p) => p.texts);
  assert.deepEqual(lacking(walked, siteTexts), []);
  assert.deepEqual(lacking(['Heading (contact)'], siteTexts), ['Heading (contact)']);
});

test('a text the site itself owns is still walked', async () => {
  const { lacking, siteWalkParts } = await import('./translate.mjs');
  const parts = [
    { id: 'company', texts: ['Company name'] },
    { id: 'help', texts: ['x'] },
  ];
  const walked = siteWalkParts(parts, new Set(['help'])).flatMap((p) => p.texts);
  assert.deepEqual(lacking(walked, {}), ['Company name']);
});

// An app's default language and its texts (0.19.8, task 20).
const own = { defaultLanguage: 'da-DK' };
const store = { store: { id: 'shop' } };
const writtenIn = (language) => () => language;

test("1. a site's own Danish-only app gives no warning", () => {
  assert.deepEqual(
    appLacking(own, ['Prisliste', 'Save-da'], { 'da-DK': { Prisliste: 'Prisliste', Gem: 'Save-da' } }, writtenIn('da-DK')),
    [],
  );
  assert.equal(appLanguage(own), 'da-DK');
  assert.equal(appNeeds(own, 'en-US'), false);
});

test('2. one text missing its Danish gives one warning', () => {
  const texts = ['Prisliste', 'Opening hours'];
  const written = (text) => (text === 'Opening hours' ? 'en-US' : 'da-DK');
  assert.deepEqual(appLacking(own, texts, { 'da-DK': { Prisliste: 'Prisliste' } }, written), ['Opening hours']);
});

test('3. a store app with no en-US text still warns', () => {
  assert.deepEqual(appLacking(store, ['Prisliste'], {}, writtenIn('da-DK')), ['Prisliste']);
});

test('4. a store app with en-US only gives none', () => {
  assert.deepEqual(appLacking(store, ['Price list'], {}, writtenIn('en-US')), []);
  assert.equal(appNeeds(store, 'da-DK'), false);
});

test('5. a store app with en-US and da-DK gives none', () => {
  assert.deepEqual(appLacking(store, ['Price list'], { 'da-DK': { 'Price list': 'Prisliste' } }, writtenIn('en-US')), []);
});

test('an own app with no declared language needs en-US, and a store app ignores a declared one', () => {
  assert.equal(appLanguage({}), 'en-US');
  assert.equal(appLanguage({ ...store, defaultLanguage: 'da-DK' }), 'en-US');
});
