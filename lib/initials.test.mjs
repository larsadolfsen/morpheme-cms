import assert from 'node:assert/strict';
import test from 'node:test';
import { initials } from './initials.mjs';

test('the first two letters of the first word', () => {
  assert.equal(initials('Blocks'), 'BL');
  assert.equal(initials('Blog posts'), 'BL');
  assert.equal(initials('about us'), 'AB');
  assert.equal(initials('ÉLAN'), 'ÉL');
  assert.equal(initials('élan'), 'ÉL');
  assert.equal(initials('ñandú'), 'ÑA');
});
test('one letter, a non-letter first character, nothing', () => {
  assert.equal(initials('A'), 'A');
  assert.equal(initials('"Quoted" page'), 'QU');
  assert.equal(initials('2024 plans'), '20');
  assert.equal(initials('— draft'), '#');
  assert.equal(initials(''), '#');
  assert.equal(initials(undefined), '#');
});
