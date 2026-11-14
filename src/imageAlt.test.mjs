import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAlt } from './imageAlt.mjs';

test('the use’s own text wins over the Library’s', () => {
  assert.deepEqual(resolveAlt({ alt: ' A dog ' }, { alt: 'An animal' }), { alt: 'A dog', decorative: false, from: 'use' });
});

test('without a text of its own the Library’s text is used', () => {
  assert.deepEqual(resolveAlt({}, { alt: 'An animal' }), { alt: 'An animal', decorative: false, from: 'library' });
  assert.deepEqual(resolveAlt({ alt: '  ' }, { alt: 'An animal' }), { alt: 'An animal', decorative: false, from: 'library' });
});

test('with no text anywhere there is none, and nothing is made up', () => {
  assert.deepEqual(resolveAlt({}, undefined), { alt: '', decorative: false, from: 'none' });
  assert.deepEqual(resolveAlt({ alt: '' }, { alt: ' ' }), { alt: '', decorative: false, from: 'none' });
});

test('a use marked decorative draws alt="" whatever the Library says', () => {
  assert.deepEqual(resolveAlt({ decorative: true, alt: 'A dog' }, { alt: 'An animal' }), { alt: '', decorative: true, from: 'use' });
});

test('a Library image marked decorative is decorative in a use with no text of its own, but not in one that has', () => {
  assert.deepEqual(resolveAlt({}, { decorative: true, alt: 'An animal' }), { alt: '', decorative: true, from: 'library' });
  assert.deepEqual(resolveAlt({ alt: 'A dog' }, { decorative: true }), { alt: 'A dog', decorative: false, from: 'use' });
});

test('libraryAltOf finds the record of an address without its format, crop and mark', async () => {
  const { libraryAltOf } = await import('./imageAlt.mjs');
  const records = [
    { record: { src: '/images/uploads/a.webp', alt: 'A beach' } },
    { record: { src: '/images/uploads/b.webp', decorative: true } },
    { record: { src: '/images/uploads/c.webp' } },
  ];
  assert.deepEqual(libraryAltOf(records, '/images/uploads/a.webp#format=16:9&crop=0,0,50,50'), { alt: 'A beach' });
  assert.deepEqual(libraryAltOf(records, '/images/uploads/b.webp'), { decorative: true });
  assert.equal(libraryAltOf(records, '/images/uploads/c.webp'), undefined);
  assert.equal(libraryAltOf(records, '/images/uploads/missing.webp'), undefined);
  assert.equal(libraryAltOf(records, undefined), undefined);
});

test('the Library’s text is shown greyed only while the field is empty and the image has a text', async () => {
  const { shownLibraryAlt } = await import('./imageAlt.mjs');
  assert.equal(shownLibraryAlt({ alt: ' An animal ' }, ''), 'An animal');
  assert.equal(shownLibraryAlt({ alt: 'An animal' }, '   '), 'An animal');
  assert.equal(shownLibraryAlt({ alt: 'An animal' }, 'A dog'), undefined);
  assert.equal(shownLibraryAlt({ decorative: true, alt: 'An animal' }, ''), undefined);
  assert.equal(shownLibraryAlt(undefined, ''), undefined);
});
