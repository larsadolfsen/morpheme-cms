// Tests for lib/appTypes.mjs: apps of a one-app category (redirects, links) are rivals; a rival is turned off.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ONE_APP_TYPES, rivalsOf, withRivalsOff } from './appTypes.mjs';

describe('ONE_APP_TYPES', () => {
  it('lists redirects and links', () => {
    assert.deepEqual(ONE_APP_TYPES, ['redirects', 'links']);
  });
});

describe('rivalsOf', () => {
  it('finds an active app of the same one-app category', () => {
    assert.deepEqual(rivalsOf({ id: 'b', category: 'redirects' }, [{ id: 'a', category: 'redirects' }], ['a']), ['a']);
  });
  it('finds none when no app is active', () => {
    assert.deepEqual(rivalsOf({ id: 'b', category: 'redirects' }, [{ id: 'a', category: 'redirects' }], []), []);
  });
  it('finds none in a many-app category', () => {
    assert.deepEqual(rivalsOf({ id: 'b', category: 'payment' }, [{ id: 'a', category: 'payment' }], ['a']), []);
  });
  it('finds none when the app has no category', () => {
    assert.deepEqual(rivalsOf({ id: 'b' }, [{ id: 'a' }], ['a']), []);
  });
  it('leaves out the app itself', () => {
    assert.deepEqual(rivalsOf({ id: 'a', category: 'redirects' }, [{ id: 'a', category: 'redirects' }], ['a']), []);
  });
  it('sorts the ids and skips other categories', () => {
    const apps = [
      { id: 'b', category: 'redirects' },
      { id: 'a', category: 'redirects' },
      { id: 'd', category: 'booking' },
    ];
    assert.deepEqual(rivalsOf({ id: 'c', category: 'redirects' }, apps, ['a', 'b', 'd']), ['a', 'b']);
  });
  it('finds none in another category', () => {
    assert.deepEqual(rivalsOf({ id: 'b', category: 'redirects' }, [{ id: 'a', category: 'booking' }], ['a']), []);
  });
  it('treats links as a one-app category', () => {
    assert.deepEqual(rivalsOf({ id: 'b', category: 'links' }, [{ id: 'a', category: 'links' }], ['a']), ['a']);
  });
});

describe('withRivalsOff', () => {
  it('turns a rival off', () => {
    assert.deepEqual(withRivalsOff({ installed: ['a', 'b'], off: [] }, ['a']), { installed: ['a', 'b'], off: ['a'] });
  });
  it('changes nothing without rivals', () => {
    assert.deepEqual(withRivalsOff({ installed: ['a', 'b'], off: ['a'] }, []), { installed: ['a', 'b'], off: ['a'] });
  });
  it('ignores a rival that is not installed', () => {
    assert.deepEqual(withRivalsOff({ installed: ['b'], off: [] }, ['x']), { installed: ['b'], off: [] });
  });
});
