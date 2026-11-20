// Tests for lib/range.mjs (moved from morpheme-appstore's test/unit/range.test.mjs). Run: node --test packages/editor/lib/range.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { satisfies, Unsupported } from './range.mjs';

const cases = [
  ['1.2.3', '1.2.3', true],
  ['1.2.4', '1.2.3', false],
  ['1.9.0', '^1.2.3', true],
  ['2.0.0', '^1.2.3', false],
  ['1.2.2', '^1.2.3', false],
  ['0.2.9', '^0.2.3', true],
  ['0.3.0', '^0.2.3', false],
  ['0.0.3', '^0.0.3', true],
  ['0.0.4', '^0.0.3', false],
  ['1.2.9', '~1.2.3', true],
  ['1.3.0', '~1.2.3', false],
  ['1.9.9', '~1', true],
  ['19.3.0', '^18.0.0 || ^19.0.0', true],
  ['17.0.0', '^18.0.0 || ^19.0.0', false],
  ['7.3.7', '>=7.0.0 <8', true],
  ['8.0.0', '>=7.0.0 <8', false],
  ['1.5.0', '1.x', true],
  ['2.0.0', '1.x', false],
  ['1.2.7', '1.2', true],
  ['1.3.0', '1.2', false],
  ['5.0.0', '*', true],
  ['5.0.0', '', true],
  ['2.0.0', '>1', true],
  ['1.9.9', '>1', false],
  ['1.2.9', '<=1.2', true],
  ['1.3.0', '<=1.2', false],
  ['1.5.0', '1.2.3 - 1.6', true],
  ['1.7.0', '1.2.3 - 1.6', false],
  ['2.1.0', '>= 2.0.0', true],
];

test('satisfies reads the ranges peerDependencies use', () => {
  for (const [version, range, expected] of cases) assert.equal(satisfies(version, range), expected, `${version} in ${range}`);
});

test('what it does not read throws Unsupported', () => {
  assert.throws(() => satisfies('1.0.0-beta.1', '^1.0.0'), Unsupported);
  assert.throws(() => satisfies('1.0.0', 'latest'), Unsupported);
  assert.throws(() => satisfies('1.0.0', 'npm:other@1'), Unsupported);
});
