// Tests for src/fileTagFilter.mjs. Run: node --test packages/editor/src/*.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tagFilterOptions, tagIndex, withTag } from './fileTagFilter.mjs';

/**
 * A stored record for a file address, with its tags and removed tags.
 * @param {string} src
 * @param {string[]} categories
 * @param {string[]} removed
 * @returns {import('./fileRecords.mjs').StoredRecord}
 */
const rec = (src, categories, removed) => ({
  path: `src/data/files/${src.slice(1, -5)}.json`,
  oid: 'oid',
  record: { src, categories, removed },
});

const TAGS = [
  { value: 'design', label: 'Design' },
  { value: 'seo', label: 'SEO' },
];

test('tagIndex maps a file address to its tags', () => {
  const index = tagIndex([rec('/a.webp', ['seo'], []), rec('/b.webp', [], ['seo'])]);
  assert.deepEqual(index, new Map([['/a.webp', ['seo']]]));
});

test('tagFilterOptions gives only the tags some file has', () => {
  const index = new Map([['/a.webp', ['seo']]]);
  assert.deepEqual(tagFilterOptions(index, TAGS, ''), [{ value: 'seo', label: 'SEO' }]);
});

test('tagFilterOptions adds the chosen tag when it is among the tags', () => {
  const index = new Map([['/a.webp', ['seo']]]);
  assert.deepEqual(tagFilterOptions(index, TAGS, 'design'), TAGS);
});

test('tagFilterOptions leaves out a chosen tag that is not among the tags', () => {
  const index = new Map([['/a.webp', ['seo']]]);
  assert.deepEqual(tagFilterOptions(index, TAGS, 'gone'), [{ value: 'seo', label: 'SEO' }]);
});

test('withTag keeps only the files with the tag', () => {
  const index = new Map([['/a.webp', ['seo']]]);
  assert.deepEqual(withTag(['/a.webp', '/b.webp'], index, 'seo'), ['/a.webp']);
});

test('withTag keeps every file when the tag is empty', () => {
  const index = new Map([['/a.webp', ['seo']]]);
  assert.deepEqual(withTag(['/a.webp', '/b.webp'], index, ''), ['/a.webp', '/b.webp']);
});

test('withTag gives an empty list when no file has the tag', () => {
  const index = new Map([['/a.webp', ['seo']]]);
  assert.deepEqual(withTag(['/b.webp'], index, 'seo'), []);
});
