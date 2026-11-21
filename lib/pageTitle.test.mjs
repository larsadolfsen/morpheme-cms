// Tests for lib/pageTitle.mjs: the title of the page for a screen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pageTitle } from './pageTitle.mjs';

test('a screen and the site', () => assert.equal(pageTitle('Pages', 'My site'), 'Pages – My site'));
test('the start screen is the site alone', () => assert.equal(pageTitle('My site', 'My site'), 'My site'));
test('a missing part leaves the other', () => {
  assert.equal(pageTitle('', 'My site'), 'My site');
  assert.equal(pageTitle('Pages', ''), 'Pages');
  assert.equal(pageTitle(' Pages ', ' My site '), 'Pages – My site');
});
