import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stripAll } from './stripAll.mjs';

test('stripAll removes a match that removing another puts together', () => {
  assert.equal(stripAll('x<!<!-- a -->-- b -->y', /<!--[\s\S]*?-->/g), 'xy');
  assert.equal(stripAll('plain', /<[^>]*>/g), 'plain');
});
