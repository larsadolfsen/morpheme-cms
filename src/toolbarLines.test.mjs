// Tests for src/toolbarLines.mjs: the tools on the first line, the arrow, and the lines between groups at a line break. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toolbarLines } from './toolbarLines.mjs';

const button = (middle) => ({ width: 40, margins: 0, middle });
const divider = (middle) => ({ width: 1, margins: 8, middle });

test('items that fit on one line are not wrapped and need no arrow', () => {
  const result = toolbarLines([button(20), button(20), button(20)], 2, 200);
  assert.equal(result.overflows, false);
  assert.deepEqual(
    result.marks.map((m) => m.wrapped),
    [false, false, false],
  );
  assert.equal(
    result.marks.some((m) => m.lineStart || m.lineEnd),
    false,
  );
});

test('items after the first line are wrapped and the bar overflows', () => {
  const result = toolbarLines([button(20), button(20), button(64), button(64)], 2, 100);
  assert.equal(result.overflows, true);
  assert.deepEqual(
    result.marks.map((m) => m.wrapped),
    [false, false, true, true],
  );
  assert.equal(result.marks[2].lineStart, true);
  assert.equal(result.marks[1].lineEnd, true);
  assert.equal(result.marks[3].lineStart, false);
});

test('a line between groups at a line start or end is marked', () => {
  const result = toolbarLines([button(20), divider(20), button(20), divider(64), button(64)], 2, 100);
  assert.equal(result.marks[3].lineStart, true);
  assert.equal(result.marks[2].lineEnd, true);
  assert.equal(result.marks[1].lineStart, false);
});

test('a wrapped item makes overflows true even when the widths fit the room', () => {
  const result = toolbarLines([button(20), button(64)], 2, 500);
  assert.equal(result.overflows, true);
});

test('an empty list has no marks and does not overflow', () => {
  assert.deepEqual(toolbarLines([], 2, 100), { overflows: false, marks: [] });
});
