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
