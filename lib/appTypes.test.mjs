// Tests for lib/appTypes.mjs: the one-app categories and turning rivals off.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ONE_APP_TYPES, rivalsOf, withRivalsOff } from './appTypes.mjs';

describe('ONE_APP_TYPES', () => {
  it('lists redirects and links', () => assert.deepEqual(ONE_APP_TYPES, ['redirects', 'links']));
});

describe('rivalsOf', () => {
  it('finds an active app in the same category', () =>
    assert.deepEqual(rivalsOf({ id: 'b', category: 'redirects' }, [{ id: 'a', category: 'redirects' }], ['a']), ['a']));
  it('ignores apps that are not active', () =>
    assert.deepEqual(rivalsOf({ id: 'b', category: 'redirects' }, [{ id: 'a', category: 'redirects' }], []), []));
  it('gives none for a many-app category', () =>
    assert.deepEqual(rivalsOf({ id: 'b', category: 'payment' }, [{ id: 'a', category: 'payment' }], ['a']), []));
  it('gives none without a category', () => assert.deepEqual(rivalsOf({ id: 'b' }, [{ id: 'a' }], ['a']), []));
  it('excludes the app itself', () =>
    assert.deepEqual(rivalsOf({ id: 'a', category: 'redirects' }, [{ id: 'a', category: 'redirects' }], ['a']), []));
  it('sorts and keeps only the same category', () =>
    assert.deepEqual(
      rivalsOf(
        { id: 'c', category: 'redirects' },
        [
          { id: 'b', category: 'redirects' },
          { id: 'a', category: 'redirects' },
          { id: 'd', category: 'booking' },
        ],
        ['a', 'b', 'd'],
      ),
      ['a', 'b'],
    ));
  it('ignores other categories', () =>
    assert.deepEqual(rivalsOf({ id: 'b', category: 'redirects' }, [{ id: 'a', category: 'booking' }], ['a']), []));
  it('works for links', () => assert.deepEqual(rivalsOf({ id: 'b', category: 'links' }, [{ id: 'a', category: 'links' }], ['a']), ['a']));
});

describe('withRivalsOff', () => {
  it('turns a rival off', () =>
    assert.deepEqual(withRivalsOff({ installed: ['a', 'b'], off: [] }, ['a']), { installed: ['a', 'b'], off: ['a'] }));
  it('keeps the state without rivals', () =>
    assert.deepEqual(withRivalsOff({ installed: ['a', 'b'], off: ['a'] }, []), { installed: ['a', 'b'], off: ['a'] }));
  it('ignores rivals that are not installed', () =>
    assert.deepEqual(withRivalsOff({ installed: ['b'], off: [] }, ['x']), { installed: ['b'], off: [] }));
});
