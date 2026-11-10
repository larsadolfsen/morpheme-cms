// Tests for src/vagueLink.ts (the vague link texts of each language) and for the slugs of src/examples.ts and
// src/schema.ts. Run: node --test src/vagueLink.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { isVague, vagueLinksOf } from './vagueLink.ts';

const readMore = 'læs mere'; // Danish "read more"

test('a Danish site flags the Danish "read more" as vague', () => {
  assert.equal(isVague(readMore, vagueLinksOf('da-DK')), true);
  assert.equal(isVague('  Læs mere → ', vagueLinksOf('da-DK')), true);
});

test('an English site flags "read more" as vague', () => {
  assert.equal(isVague('read more', vagueLinksOf('en-US')), true);
  assert.equal(isVague('Read   more...', vagueLinksOf('en-US')), true);
});

test('an English site does not flag the Danish "read more"', () => {
  assert.equal(isVague(readMore, vagueLinksOf('en-US')), false);
});

test('a descriptive link text is not vague, and an unknown locale uses the Danish list', () => {
  assert.equal(isVague('Our prices for 2026', vagueLinksOf('en-US')), false);
  assert.equal(isVague(readMore, vagueLinksOf('fr-FR')), true);
});

// The slug helpers are private or need Vite (./i18n), so each one's source is read and evaluated as it stands.
const helper = (file, start) => {
  const src = readFileSync(new URL(file, import.meta.url), 'utf8');
  const from = src.indexOf(start);
  assert.notEqual(from, -1, `${start} is in ${file}`);
  const end = src.indexOf(';\n', from);
  const body = src
    .slice(from, end)
    .replace(/^(export )?const \w+ = /, '')
    .replace(/\((\w+): string\)/, '($1)');
  return new Function(`return ${body};`)();
};

test('the slug of "Søren Æblegaard" in examples.ts is the same as before', () => {
  const slug = helper('./examples.ts', 'const slug = (s: string)');
  assert.equal(slug('Søren Æblegaard'), 'soeren-aeblegaard');
});

test('the slug of "Søren Æblegaard" in schema.ts is the same as before', () => {
  const slugify = helper('./schema.ts', 'export const slugify = (title: string)');
  assert.equal(slugify('Søren Æblegaard'), 'soeren-aeblegaard');
});
