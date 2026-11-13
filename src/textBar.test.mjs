import test from 'node:test';
import assert from 'node:assert/strict';
import { slotsFor, planBar } from './textBar.mjs';

const TEXT = ['bold', 'italic', 'link', 'style', 'list', 'align', 'color'];
const MAIN = ['undo', 'redo', 'settings', 'insert'];

test('the slots with the two dividers: 6 in the bar of a 375 px and of a 360 px phone, 5 at 320 px; one divider leaves 7 at 375', () => {
  assert.equal(slotsFor(341), 6);
  assert.equal(slotsFor(326), 6);
  assert.equal(slotsFor(286), 5);
  assert.equal(slotsFor(341, 1), 7);
  assert.equal(slotsFor(341, 0), 7);
  assert.equal(slotsFor(10), 0);
});

test('at 375 px in text the bar has Bold, Italic, Undo, Redo, Insert block and the ⋮; the rest of the text tools are in the ⋮', () => {
  const plan = planBar({ slots: 6, context: TEXT, main: MAIN });
  assert.deepEqual(plan.bar, { context: ['bold', 'italic'], main: ['undo', 'redo', 'insert'] });
  assert.deepEqual(plan.more, { context: ['link', 'style', 'list', 'align', 'color'], main: ['settings'] });
  assert.equal(plan.overflow, true);
  // The bar is 5 tools and the ⋮: 6 slots.
  assert.equal(plan.bar.context.length + plan.bar.main.length + 1, 6);
});

test('Insert block is never in the ⋮: at 320 px the text tools give way first, then Redo and Undo', () => {
  const at320 = planBar({ slots: slotsFor(286), context: TEXT, main: MAIN });
  assert.deepEqual(at320.bar, { context: ['bold'], main: ['undo', 'redo', 'insert'] });
  for (let slots = 2; slots <= 30; slots++) {
    const plan = planBar({ slots, context: TEXT, main: MAIN });
    assert.ok(plan.bar.main.includes('insert'), `Insert block is on the bar with ${slots} slots`);
    assert.ok(!plan.more.main.includes('insert'));
  }
  // So short that only the Insert block and the ⋮ fit: Undo and Redo go in the ⋮ before it does.
  const tiny = planBar({ slots: 2, context: TEXT, main: MAIN });
  assert.deepEqual(tiny.bar.main, ['insert']);
});

test('on a wide bar everything fits and there is no ⋮', () => {
  const plan = planBar({ slots: slotsFor(1200), context: TEXT, main: MAIN });
  assert.deepEqual(plan.bar, { context: TEXT, main: MAIN });
  assert.equal(plan.overflow, false);
  assert.deepEqual(plan.more, { context: [], main: [] });
});

test('idle: only the main tools, all on the bar at 375 px, no ⋮', () => {
  const plan = planBar({ slots: slotsFor(341, 1), context: [], main: ['undo', 'redo', 'insert'] });
  assert.deepEqual(plan.bar.main, ['undo', 'redo', 'insert']);
  assert.equal(plan.overflow, false);
});

test('a medium bar shows what fits, keeps the order, and puts the rest in the ⋮', () => {
  const plan = planBar({ slots: 9, context: TEXT, main: MAIN });
  assert.equal(plan.bar.context.length + plan.bar.main.length + 1, 9);
  assert.deepEqual(plan.bar.context, ['bold', 'italic', 'link', 'style', 'list']);
  assert.deepEqual(plan.more, { context: ['align', 'color'], main: ['settings'] });
});

test('a block always has the ⋮ (its own menu): it takes a slot even when every tool fits', () => {
  const plan = planBar({ slots: 11, context: ['above', 'below', 'up', 'down'], main: ['undo', 'redo', 'insert'], more: true });
  assert.equal(plan.overflow, true);
  assert.deepEqual(plan.more, { context: [], main: [] });
  const tight = planBar({
    slots: 6,
    context: ['above', 'below', 'up', 'down', 'link', 'gear'],
    main: ['undo', 'redo', 'insert'],
    more: true,
  });
  assert.deepEqual(tight.bar, { context: ['above', 'below'], main: ['undo', 'redo', 'insert'] });
  assert.deepEqual(tight.more, { context: ['up', 'down', 'link', 'gear'], main: [] });
});
