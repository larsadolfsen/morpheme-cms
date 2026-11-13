import test from 'node:test';
import assert from 'node:assert/strict';
import { slotsFor, planBar } from './textBar.mjs';

const TEXT = ['bold', 'italic', 'link', 'style', 'list', 'align', 'color'];
const MAIN = ['insert', 'undo', 'redo', 'settings'];

test('the slots: 7 at 375 px and at 360 px, 6 at 320 px; the divider is counted', () => {
  assert.equal(slotsFor(375), 7);
  assert.equal(slotsFor(360), 7);
  assert.equal(slotsFor(320), 6);
  assert.equal(slotsFor(375, false), 7);
  assert.equal(slotsFor(1280), 27);
  assert.equal(slotsFor(10), 0);
});

test('at 375 px in text the bar has Bold, Italic, Link, Text style, Undo, Redo and the ⋮, and the rest is in the ⋮', () => {
  const plan = planBar({ slots: 7, context: TEXT, main: MAIN });
  assert.deepEqual(plan.bar, { context: ['bold', 'italic', 'link', 'style'], main: ['undo', 'redo'] });
  assert.deepEqual(plan.more, { context: ['list', 'align', 'color'], main: ['insert', 'settings'] });
  assert.equal(plan.overflow, true);
  // The bar is 6 tools and the ⋮: 7 slots.
  assert.equal(plan.bar.context.length + plan.bar.main.length + 1, 7);
});

test('at 320 px Redo moves into the ⋮ first', () => {
  const plan = planBar({ slots: 6, context: TEXT, main: MAIN });
  assert.deepEqual(plan.bar, { context: ['bold', 'italic', 'link', 'style'], main: ['undo'] });
  assert.ok(plan.more.main.includes('redo'));
});

test('on a wide bar everything fits and there is no ⋮', () => {
  const plan = planBar({ slots: slotsFor(1280), context: TEXT, main: MAIN });
  assert.deepEqual(plan.bar, { context: TEXT, main: MAIN });
  assert.equal(plan.overflow, false);
  assert.deepEqual(plan.more, { context: [], main: [] });
});

test('idle: only the main tools, all on the bar at 375 px, no ⋮', () => {
  const plan = planBar({ slots: slotsFor(375, false), context: [], main: ['insert', 'undo', 'redo'] });
  assert.deepEqual(plan.bar.main, ['insert', 'undo', 'redo']);
  assert.equal(plan.overflow, false);
});

test('a medium bar shows what fits, keeps the order, and puts the rest in the ⋮', () => {
  const plan = planBar({ slots: 9, context: TEXT, main: MAIN });
  assert.equal(plan.bar.context.length + plan.bar.main.length + 1, 9);
  assert.deepEqual(plan.bar.context, ['bold', 'italic', 'link', 'style', 'list', 'align']);
  assert.deepEqual(plan.more, { context: ['color'], main: ['insert', 'settings'] });
});
