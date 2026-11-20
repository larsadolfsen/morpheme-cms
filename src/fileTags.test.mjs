// Tests for src/fileTags.mjs. Run: node --test packages/editor/src/*.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addTag, emptyRecord, inherit, isEmpty, removeTag, setTags, tagsFor } from './fileTags.mjs';

const S = '/images/uploads/2026/10/andromeda.webp';

/** Fails when a record has a slug in both lists. @param {{ categories: string[]; removed: string[] }} r */
const assertInvariant = (r) => {
  for (const tag of r.categories) assert.ok(!r.removed.includes(tag), `${tag} is in both lists`);
};

/** A record that cannot be changed, lists included. @param {{ src: string; categories: string[]; removed: string[] }} r */
const frozen = (r) => Object.freeze({ src: r.src, categories: Object.freeze([...r.categories]), removed: Object.freeze([...r.removed]) });

test('emptyRecord has no tags', () => {
  assert.deepEqual(emptyRecord(S), { src: S, categories: [], removed: [] });
});

test('tagsFor gives the page tags for a file without a record', () => {
  assert.deepEqual(tagsFor(undefined, ['a', 'b']), ['a', 'b']);
});

test('tagsFor gives the record tags first, then the page tags', () => {
  assert.deepEqual(tagsFor({ src: S, categories: ['x'], removed: [] }, ['a']), ['x', 'a']);
});

test('tagsFor does not repeat a tag the record already has', () => {
  assert.deepEqual(tagsFor({ src: S, categories: ['a'], removed: [] }, ['a', 'b']), ['a', 'b']);
});

test('tagsFor leaves out a page tag the owner removed', () => {
  assert.deepEqual(tagsFor({ src: S, categories: [], removed: ['a'] }, ['a', 'b']), ['b']);
});

test('tagsFor keeps the record tags even when the page has them removed', () => {
  assert.deepEqual(tagsFor({ src: S, categories: ['x'], removed: ['a'] }, []), ['x']);
});

test('tagsFor gives each page tag once', () => {
  assert.deepEqual(tagsFor(undefined, ['a', 'a']), ['a']);
});

test('addTag creates a record for a file without one', () => {
  assert.deepEqual(addTag(undefined, S, 'seo'), { src: S, categories: ['seo'], removed: [] });
});

test('addTag takes a tag out of removed', () => {
  assert.deepEqual(addTag({ src: S, categories: ['a'], removed: ['seo'] }, S, 'seo'), {
    src: S,
    categories: ['a', 'seo'],
    removed: [],
  });
});

test('addTag does nothing to a tag the file already has', () => {
  assert.deepEqual(addTag({ src: S, categories: ['a'], removed: [] }, S, 'a'), { src: S, categories: ['a'], removed: [] });
});

test('removeTag moves a tag to removed', () => {
  assert.deepEqual(removeTag({ src: S, categories: ['a', 'b'], removed: [] }, S, 'a'), {
    src: S,
    categories: ['b'],
    removed: ['a'],
  });
});

test('removeTag creates a record for a file without one', () => {
  assert.deepEqual(removeTag(undefined, S, 'a'), { src: S, categories: [], removed: ['a'] });
});

test('removeTag does not repeat a tag already removed', () => {
  assert.deepEqual(removeTag({ src: S, categories: [], removed: ['a'] }, S, 'a'), { src: S, categories: [], removed: ['a'] });
});

test('setTags moves the tags that left to removed and keeps the order of the new list', () => {
  assert.deepEqual(setTags({ src: S, categories: ['a', 'b'], removed: ['c'] }, S, ['b', 'c']), {
    src: S,
    categories: ['b', 'c'],
    removed: ['a'],
  });
});

test('setTags with no tags on a file without a record gives an empty record', () => {
  assert.deepEqual(setTags(undefined, S, []), { src: S, categories: [], removed: [] });
});

test('inherit adds the page tags that were not removed and keeps removed', () => {
  assert.deepEqual(inherit({ src: S, categories: ['x'], removed: ['a'] }, S, ['a', 'b']), {
    src: S,
    categories: ['x', 'b'],
    removed: ['a'],
  });
});

test('inherit gives the page tags to a file without a record', () => {
  assert.deepEqual(inherit(undefined, S, ['a']), { src: S, categories: ['a'], removed: [] });
});

test('isEmpty is true for a record with no tags and nothing removed', () => {
  assert.equal(isEmpty({ src: S, categories: [], removed: [] }), true);
});

test('isEmpty is false for a record with only a removed tag', () => {
  assert.equal(isEmpty({ src: S, categories: [], removed: ['a'] }), false);
});

test('every record result keeps categories and removed apart', () => {
  assertInvariant(addTag({ src: S, categories: ['a'], removed: ['seo'] }, S, 'seo'));
  assertInvariant(addTag(undefined, S, 'seo'));
  assertInvariant(removeTag({ src: S, categories: ['a', 'b'], removed: [] }, S, 'a'));
  assertInvariant(removeTag(undefined, S, 'a'));
  assertInvariant(setTags({ src: S, categories: ['a', 'b'], removed: ['c'] }, S, ['b', 'c']));
  assertInvariant(setTags(undefined, S, []));
  assertInvariant(inherit({ src: S, categories: ['x'], removed: ['a'] }, S, ['a', 'b']));
  assertInvariant(inherit(undefined, S, ['a']));
});

test('no function changes a frozen input record', () => {
  const record = frozen({ src: S, categories: ['a', 'b'], removed: ['c'] });
  assert.doesNotThrow(() => addTag(record, S, 'd'));
  assert.doesNotThrow(() => removeTag(record, S, 'a'));
  assert.doesNotThrow(() => setTags(record, S, ['b', 'c']));
  assert.doesNotThrow(() => inherit(record, S, ['c', 'e']));
  assert.doesNotThrow(() => tagsFor(record, ['c', 'e']));
  assert.deepEqual(record, { src: S, categories: ['a', 'b'], removed: ['c'] });
});

test('withAltText sets the text, mark and caption, drops empty ones and keeps tags and credit', async () => {
  const { withAltText, addTag, withCredit, isEmpty } = await import('./fileTags.mjs');
  const credit = { name: 'A', url: 'https://example.com/a', source: 'unsplash' };
  const base = withCredit(addTag(undefined, '/a.webp', 'sea'), '/a.webp', credit);
  const set = withAltText(base, '/a.webp', { alt: ' A beach ', decorative: false, caption: ' ' });
  assert.deepEqual(set, { src: '/a.webp', categories: ['sea'], removed: [], alt: 'A beach', credit });
  assert.deepEqual(withAltText(set, '/a.webp', {}), base);
  assert.equal(isEmpty(withAltText(undefined, '/a.webp', { decorative: true })), false);
  assert.equal(isEmpty(withAltText(undefined, '/a.webp', {})), true);
});

test('a change to the tags keeps the text, the mark and the caption', async () => {
  const { withAltText, addTag, removeTag, setTags, inherit } = await import('./fileTags.mjs');
  const record = withAltText(undefined, '/a.webp', { alt: 'A beach', decorative: true, caption: 'Dawn' });
  for (const next of [
    addTag(record, '/a.webp', 'sea'),
    removeTag(record, '/a.webp', 'sea'),
    setTags(record, '/a.webp', ['x']),
    inherit(record, '/a.webp', ['y']),
  ])
    assert.deepEqual([next.alt, next.decorative, next.caption], ['A beach', true, 'Dawn']);
});
