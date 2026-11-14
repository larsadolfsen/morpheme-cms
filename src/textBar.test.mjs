import test from 'node:test';
import assert from 'node:assert/strict';
import { BUTTON, TOOL_WIDTH, planBar, toolWidth } from './textBar.mjs';

const TEXT = ['bold', 'italic', 'style', 'list', 'align', 'link', 'color'];
const FIXED = ['undo', 'redo', 'insert'];

test('at 375 px (the bar is 352 dp inside its edges) in text: Bold, Italic, Text style, Lists, then Undo, Redo, Insert block and the ⋮; Alignment, Link, Color are in the ⋮ in the owner order', () => {
  const plan = planBar({ width: 352, context: TEXT, fixed: FIXED });
  assert.deepEqual(plan.bar, { context: ['bold', 'italic', 'style', 'list'], fixed: FIXED });
  assert.deepEqual(plan.more, { context: ['align', 'link', 'color'], fixed: [] });
  assert.equal(plan.overflow, true);
});

test('at 360 px (335 dp inside) Lists is the first tool in the ⋮, before Alignment, Link, Color', () => {
  const plan = planBar({ width: 335, context: TEXT, fixed: FIXED });
  assert.deepEqual(plan.bar.context, ['bold', 'italic', 'style']);
  assert.deepEqual(plan.more.context, ['list', 'align', 'link', 'color']);
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
  const plan = planBar({ width: 352, context: [], fixed: FIXED });
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
  const tight = planBar({ width: 352, context: ['above', 'below', 'up', 'down', 'link', 'gear'], fixed: FIXED, more: true });
  assert.deepEqual(tight.bar.context, ['above', 'below', 'up', 'down']);
  assert.deepEqual(tight.more.context, ['link', 'gear']);
});

// The width budget (14 Nov owner requirement): no count per screen width, the most tools that fit, in order, no gap.
const WIDE = ['bold', 'italic', 'style', 'list', 'align', 'link', 'color'];
const widthOf = (ids) => ids.reduce((n, id) => n + toolWidth(id), 0);

test('every tool is 44 dp but the count with its cross, which is two buttons', () => {
  for (const id of [...WIDE, ...FIXED]) assert.equal(toolWidth(id), BUTTON);
  assert.equal(toolWidth('block:count'), 2 * BUTTON);
});

test('from 280 to 1400 dp: nothing past the budget, order kept, ⋮ only when needed, no gap', () => {
  for (let width = 280; width <= 1400; width++) {
    const plan = planBar({ width, context: WIDE, fixed: FIXED });
    const onBar = widthOf(plan.bar.context) + widthOf(plan.bar.fixed) + (plan.overflow ? BUTTON : 0);
    assert.ok(onBar <= width, `${width}: ${onBar} dp on a bar of ${width} dp`);
    assert.deepEqual([...plan.bar.context, ...plan.more.context], WIDE, `${width}: order`);
    assert.equal(plan.overflow, plan.more.context.length + plan.more.fixed.length > 0, `${width}: ⋮ only with something in it`);
    assert.equal(plan.free, width - onBar);
    const next = plan.more.context[0];
    if (next) assert.ok(plan.free < toolWidth(next), `${width}: a gap of ${plan.free} dp, next tool ${toolWidth(next)}`);
  }
});

test('the bar holds as many tools as fit: 352 dp holds four text tools, 396 dp holds five', () => {
  assert.deepEqual(planBar({ width: 352, context: WIDE, fixed: FIXED }).bar.context, ['bold', 'italic', 'style', 'list']);
  assert.deepEqual(planBar({ width: 396, context: WIDE, fixed: FIXED }).bar.context, ['bold', 'italic', 'style', 'list', 'align']);
  // At 440 dp all seven fit without a ⋮ (seven and three tools of 44 dp), so the ⋮ takes no room.
  assert.equal(planBar({ width: 440, context: WIDE, fixed: FIXED }).overflow, false);
  assert.equal(planBar({ width: 439, context: WIDE, fixed: FIXED }).bar.context.length, 5);
});

test('with wider chevron buttons the budget still holds, the order never skips and there is no gap', () => {
  const before = { style: TOOL_WIDTH.style, list: TOOL_WIDTH.list };
  Object.assign(TOOL_WIDTH, { style: 60, list: 60 });
  try {
    for (let width = 280; width <= 1400; width += 3) {
      const plan = planBar({ width, context: WIDE, fixed: FIXED });
      const onBar = widthOf(plan.bar.context) + widthOf(plan.bar.fixed) + (plan.overflow ? BUTTON : 0);
      assert.ok(onBar <= width, `${width}: over budget`);
      assert.deepEqual([...plan.bar.context, ...plan.more.context], WIDE);
      const next = plan.more.context[0];
      if (next) assert.ok(plan.free < toolWidth(next), `${width}: gap ${plan.free} dp before ${next}`);
    }
    // 352 dp: Bold, Italic, Text style 60 leave 4 dp after the ⋮, Undo, Redo, Insert: List (60) does not fit and goes to the ⋮ with everything after it.
    const plan = planBar({ width: 352, context: WIDE, fixed: FIXED });
    assert.deepEqual(plan.bar.context, ['bold', 'italic', 'style']);
  } finally {
    Object.assign(TOOL_WIDTH, before);
  }
});
