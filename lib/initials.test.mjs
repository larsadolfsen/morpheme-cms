import assert from 'node:assert/strict';
import test from 'node:test';
import { initials, waveStep } from './initials.mjs';

test('the first two letters of the first word', () => {
  assert.equal(initials('Blocks'), 'Bl');
  assert.equal(initials('Blog posts'), 'Bl');
  assert.equal(initials('about us'), 'Ab');
  assert.equal(initials('ÆBLE'), 'Æb');
});
test('one letter, a non-letter first character, nothing', () => {
  assert.equal(initials('A'), 'A');
  assert.equal(initials('"Quoted" page'), 'Qu');
  assert.equal(initials('2024 plans'), '20');
  assert.equal(initials('— draft'), '#');
  assert.equal(initials(''), '#');
  assert.equal(initials(undefined), '#');
});
test('the wave runs 0 1 2 1 0 1 2', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(waveStep), [0, 1, 2, 1, 0, 1, 2]);
});
