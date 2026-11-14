import test from 'node:test';
import assert from 'node:assert/strict';
import { planBar } from './textBar.mjs';

const TEXT = ['bold', 'italic', 'style', 'list', 'align', 'link', 'color'];
const FIXED = ['undo', 'redo', 'insert'];

test('at 375 px (the bar is 350 dp inside its edges) in text: Bold, Italic, Text style, then Undo, Redo, Insert block and the ⋮; the rest is in the ⋮ in the owner order', () => {
  const plan = planBar({ width: 350, context: TEXT, fixed: FIXED });
  assert.deepEqual(plan.bar, { context: ['bold', 'italic', 'style'], fixed: FIXED });
  assert.deepEqual(plan.more, { context: ['list', 'align', 'link', 'color'], fixed: [] });
  assert.equal(plan.overflow, true);
  // Lists is 2 dp short: four tools, the three fixed ones and the ⋮ are 352 dp.
  assert.equal(plan.short, 2);
});

test('with 352 dp inside, Bold, Italic, Text style and Lists stand on the bar; Alignment, Link, Color are in the ⋮ in that order', () => {
  const plan = planBar({ width: 352, context: TEXT, fixed: FIXED });
  assert.deepEqual(plan.bar.context, ['bold', 'italic', 'style', 'list']);
  assert.deepEqual(plan.more.context, ['align', 'link', 'color']);
});

test('Insert block is never in the ⋮: on a narrow bar the text tools give way first, then Redo, then Undo', () => {
  const at300 = planBar({ width: 250, context: TEXT, fixed: FIXED });
  assert.deepEqual(at300.bar, { context: ['bold'], fixed: FIXED });
  for (let width = 90; width <= 700; width += 4) {
    const plan = planBar({ width, context: TEXT, fixed: FIXED });
    assert.ok(plan.bar.fixed.includes('insert'), `Insert block is on the bar at ${width} dp`);
    assert.ok(!plan.more.fixed.includes('insert'));
  }
  const tiny = planBar({ width: 100, context: TEXT, fixed: FIXED });
  assert.deepEqual(tiny.bar.fixed, ['insert']);
  assert.deepEqual(tiny.more.fixed, ['undo', 'redo']);
});

test('on a wide bar everything fits and there is no ⋮', () => {
  const plan = planBar({ width: 1200, context: TEXT, fixed: FIXED });
  assert.deepEqual(plan.bar, { context: TEXT, fixed: FIXED });
  assert.equal(plan.overflow, false);
  assert.deepEqual(plan.more, { context: [], fixed: [] });
});

test('idle: only the fixed tools, no ⋮, and the order never skips a tool that does not fit', () => {
  const plan = planBar({ width: 350, context: [], fixed: FIXED });
  assert.deepEqual(plan.bar.fixed, FIXED);
  assert.equal(plan.overflow, false);
  const gap = planBar({ width: 300, context: ['a', 'b', 'c', 'd'], fixed: FIXED });
  assert.deepEqual(gap.bar.context, ['a', 'b']);
  assert.deepEqual(gap.more.context, ['c', 'd']);
});

test('Section settings (or a block menu) keeps the ⋮ on the bar even when everything fits', () => {
  const plan = planBar({ width: 1200, context: TEXT, fixed: FIXED, more: true });
  assert.equal(plan.overflow, true);
  assert.deepEqual(plan.more, { context: [], fixed: [] });
  const tight = planBar({ width: 350, context: ['above', 'below', 'up', 'down', 'link', 'gear'], fixed: FIXED, more: true });
  assert.deepEqual(tight.bar.context, ['above', 'below', 'up']);
  assert.deepEqual(tight.more.context, ['down', 'link', 'gear']);
});
