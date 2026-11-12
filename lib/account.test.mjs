// Tests for lib/account.mjs: the initials and the image address of the signed-in user.
import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarOf, initialsOf } from './account.mjs';

test('initialsOf takes the first letters of the name', () => {
  assert.equal(initialsOf('Lars Adolfsen', 'larsadolfsen'), 'LA');
  assert.equal(initialsOf('Lars', 'x'), 'L');
});

test('initialsOf takes the first and the last word', () => {
  assert.equal(initialsOf('anna maria berg', 'x'), 'AB');
});

test('initialsOf falls back to the login', () => {
  assert.equal(initialsOf(null, 'octocat'), 'O');
  assert.equal(initialsOf('  ', 'octocat'), 'O');
});

test('avatarOf makes the GitHub image address', () => {
  assert.equal(avatarOf('octo cat', 80), 'https://avatars.githubusercontent.com/octo%20cat?s=80');
});
