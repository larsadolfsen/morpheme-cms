// Tests lib/section-ranges.mjs: which top-level parts of a text form H2 sections (the editor's dotted frame).
// Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partKind, sectionPart, sectionRanges } from './section-ranges.mjs';

// '1 2 l o' -> h1, h2, label, other
const KINDS = { 1: 'h1', 2: 'h2', l: 'label', o: 'other' };
const ranges = (text) =>
  sectionRanges(
    text
      .split(' ')
      .filter(Boolean)
      .map((c) => ({ kind: KINDS[c] })),
  );

test('no parts, no sections', () => assert.deepEqual(ranges(''), []));
test('no H2, no sections', () => assert.deepEqual(ranges('1 o o'), []));
test('an H2 at the start runs to the end', () => assert.deepEqual(ranges('2 o o'), [{ from: 0, to: 2 }]));
test('text before the first H2 is outside', () => assert.deepEqual(ranges('o 2 o'), [{ from: 1, to: 2 }]));
test('an H2 as the last part is a section of one', () => assert.deepEqual(ranges('o o 2'), [{ from: 2, to: 2 }]));
test('an H1 ends a section', () =>
  assert.deepEqual(ranges('2 o 1 o 2 o'), [
    { from: 0, to: 1 },
    { from: 4, to: 5 },
  ]));
test('consecutive H2s are a section each', () =>
  assert.deepEqual(ranges('2 2 o 2'), [
    { from: 0, to: 0 },
    { from: 1, to: 2 },
    { from: 3, to: 3 },
  ]));
test('a label before an H2 starts the section', () => assert.deepEqual(ranges('o l 2 o'), [{ from: 1, to: 3 }]));
test('a label before an H2 ends the section above it', () =>
  assert.deepEqual(ranges('2 o l 2 o'), [
    { from: 0, to: 1 },
    { from: 2, to: 4 },
  ]));
test('a label before an H1 belongs to the H1', () => assert.deepEqual(ranges('2 o l 1 o'), [{ from: 0, to: 1 }]));
test('a label at the start before an H1 starts nothing', () => assert.deepEqual(ranges('l 1 2 o'), [{ from: 2, to: 3 }]));
test('a label not before a heading is an ordinary part', () => {
  assert.deepEqual(ranges('2 l o'), [{ from: 0, to: 2 }]);
  assert.deepEqual(ranges('l o 2'), [{ from: 2, to: 2 }]);
  assert.deepEqual(ranges('2 o l'), [{ from: 0, to: 2 }]);
});

test('sectionPart tells where a part is in its section', () => {
  assert.equal(sectionPart(3, { from: 3, to: 3 }), 'only');
  assert.equal(sectionPart(1, { from: 1, to: 4 }), 'start');
  assert.equal(sectionPart(2, { from: 1, to: 4 }), 'middle');
  assert.equal(sectionPart(4, { from: 1, to: 4 }), 'end');
});

test('partKind reads a node name and heading level', () => {
  assert.equal(partKind('heading', 1), 'h1');
  assert.equal(partKind('heading', 2), 'h2');
  assert.equal(partKind('heading', 3), 'other');
  assert.equal(partKind('eyebrow'), 'label');
  assert.equal(partKind('paragraph'), 'other');
  assert.equal(partKind('siteBlock'), 'other');
});
