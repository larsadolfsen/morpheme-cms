// Tests for lib/affected.mjs, the engine behind "what a change affects". Run: node --test lib/affected.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVERYTHING, ruleFor, select } from './affected.mjs';

const rules = [
  [/^src\/a\.ts$/, ['one']],
  [/^src\/b\.ts$/, ['two', 'one']],
  [/^docs\//, 'none'],
  [/^src\//, 'all'],
];

test('the first matching rule decides', () => {
  assert.deepEqual(select(['src/a.ts'], rules), { all: false, areas: ['one'], unknown: [] });
  assert.equal(ruleFor('src/a.ts', rules)[1][0], 'one');
});
test('areas of several paths are joined, sorted, without doubles', () => {
  assert.deepEqual(select(['src/b.ts', 'src/a.ts'], rules).areas, ['one', 'two']);
});
test('none adds nothing; only none gives no areas and not all', () => {
  assert.deepEqual(select(['docs/a.md'], rules), { all: false, areas: [], unknown: [] });
  assert.deepEqual(select(['docs/a.md', 'src/a.ts'], rules).areas, ['one']);
});
test('all wins over areas', () => {
  assert.deepEqual(select(['src/a.ts', 'src/z.ts'], rules), { all: true, areas: [], unknown: [] });
});
test('an unknown path affects everything and is named', () => {
  assert.deepEqual(select(['src/a.ts', 'other/x.js'], rules), { all: true, areas: [], unknown: ['other/x.js'] });
});
test('in doubt, everything: empty list, `..`, blanks, bad input, a malformed rule', () => {
  assert.equal(select([], rules).all, true);
  assert.equal(select(['', '\n'], rules).all, true);
  assert.equal(select(['docs/../src/a.ts'], rules).all, true);
  assert.equal(select('src/a.ts', rules).all, true);
  assert.equal(select(['src/a.ts'], null).all, true);
  assert.equal(select(['src/a.ts'], [[/^src/, 'some']]).all, true);
  assert.equal(select(['src/a.ts'], [[/^src/, [1]]]).all, true);
  assert.equal(select(['src/a.ts'], [[/^src/, []]]).all, false); // an empty list names no area: nothing is affected
  assert.equal(EVERYTHING.all, true);
});
test('a leading ./ and spaces are ignored', () => {
  assert.deepEqual(select(['  ./src/a.ts '], rules).areas, ['one']);
});
test('a name with dots is not a `..` segment', () => {
  assert.deepEqual(select(['src/[...slug].ts'], [[/^src\//, ['one']]]).areas, ['one']);
  assert.equal(select(['src/../a.ts'], [[/^src\//, ['one']]]).all, true);
});
