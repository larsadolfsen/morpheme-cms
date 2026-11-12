// Tests of sheet-stops.mjs: the states a bottom sheet rests in, the next one on a tap and after a drag, a modal's heights.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultStates,
  isResizable,
  restingStops,
  nextOnTap,
  restAfterDrag,
  modalStartHeight,
  modalRestAfterDrag,
} from './sheet-stops.mjs';

const heights = { collapsed: 100, 'half-expanded': 400, expanded: 700 };

test('defaultStates(false) returns collapsed, half-expanded, expanded', () => {
  assert.deepEqual(defaultStates(false), ['collapsed', 'half-expanded', 'expanded']);
});

test('defaultStates(true) returns hidden, collapsed, half-expanded, expanded', () => {
  assert.deepEqual(defaultStates(true), ['hidden', 'collapsed', 'half-expanded', 'expanded']);
});

test('isResizable returns false for single non-hidden state', () => {
  assert.equal(isResizable(['expanded']), false);
});

test('isResizable returns false for hidden and one other', () => {
  assert.equal(isResizable(['hidden', 'expanded']), false);
});

test('isResizable returns true for two non-hidden states', () => {
  assert.equal(isResizable(['collapsed', 'expanded']), true);
});

test('restingStops with default states (false)', () => {
  assert.deepEqual(restingStops(heights, defaultStates(false)), [
    { state: 'collapsed', height: 100 },
    { state: 'half-expanded', height: 400 },
    { state: 'expanded', height: 700 },
  ]);
});

test('restingStops with default states (true) includes hidden', () => {
  const stops = restingStops(heights, defaultStates(true));
  assert.equal(stops.length, 4);
  assert.deepEqual(stops[0], { state: 'hidden', height: 0 });
  assert.deepEqual(stops[1], { state: 'collapsed', height: 100 });
  assert.deepEqual(stops[2], { state: 'half-expanded', height: 400 });
  assert.deepEqual(stops[3], { state: 'expanded', height: 700 });
});

test('restingStops with single expanded state', () => {
  assert.deepEqual(restingStops(heights, ['expanded']), [{ state: 'expanded', height: 700 }]);
});

test('restingStops filters half-expanded if too close to collapsed', () => {
  const h = { collapsed: 100, 'half-expanded': 130, expanded: 700 };
  assert.deepEqual(restingStops(h, defaultStates(false)), [
    { state: 'collapsed', height: 100 },
    { state: 'expanded', height: 700 },
  ]);
});

test('restingStops filters expanded if too close to collapsed', () => {
  const h = { collapsed: 100, 'half-expanded': 400, expanded: 100 };
  assert.deepEqual(restingStops(h, ['collapsed', 'expanded']), [{ state: 'collapsed', height: 100 }]);
});

test('nextOnTap cycles through states', () => {
  const stops = restingStops(heights, defaultStates(false));
  assert.equal(nextOnTap(stops, 'collapsed'), 'half-expanded');
  assert.equal(nextOnTap(stops, 'half-expanded'), 'expanded');
  assert.equal(nextOnTap(stops, 'expanded'), 'collapsed');
});

test('nextOnTap with hidden stops returns collapsed when at expanded', () => {
  const stops = restingStops(heights, defaultStates(true));
  assert.equal(nextOnTap(stops, 'expanded'), 'collapsed');
});

test('nextOnTap with hidden not a stop returns collapsed', () => {
  const stops = restingStops(heights, defaultStates(false));
  assert.equal(nextOnTap(stops, 'hidden'), 'collapsed');
});

test('nextOnTap with single stop returns that stop', () => {
  const stops = restingStops(heights, ['expanded']);
  assert.equal(nextOnTap(stops, 'expanded'), 'expanded');
});

test('restAfterDrag with zero velocity chooses nearest', () => {
  const stops = restingStops(heights, defaultStates(false));
  assert.equal(restAfterDrag(stops, 380, 0), 'half-expanded');
  assert.equal(restAfterDrag(stops, 250, 0), 'collapsed');
});

test('restAfterDrag with positive velocity chooses higher', () => {
  const stops = restingStops(heights, defaultStates(false));
  assert.equal(restAfterDrag(stops, 150, 0.8), 'half-expanded');
});

test('restAfterDrag with negative velocity chooses lower', () => {
  const stops = restingStops(heights, defaultStates(false));
  assert.equal(restAfterDrag(stops, 650, -0.8), 'half-expanded');
});

test('restAfterDrag with high velocity and no higher stop chooses nearest', () => {
  const stops = restingStops(heights, defaultStates(false));
  assert.equal(restAfterDrag(stops, 720, 0.8), 'expanded');
});

test('modalStartHeight returns content if less than half viewport', () => {
  assert.equal(modalStartHeight(300, 800, 'half', 72), 300);
});

test('modalStartHeight returns half viewport if content is larger', () => {
  assert.equal(modalStartHeight(600, 800, 'half', 72), 400);
});

test('modalStartHeight returns viewport minus gap if content is larger and full', () => {
  assert.equal(modalStartHeight(900, 800, 'full', 72), 728);
});

test('modalStartHeight returns content if less than viewport minus gap and full', () => {
  assert.equal(modalStartHeight(300, 800, 'full', 72), 300);
});

test('modalRestAfterDrag with zero velocity and height near start returns start', () => {
  assert.equal(modalRestAfterDrag(400, 728, 420, 0), 'start');
});

test('modalRestAfterDrag with zero velocity and height near full returns full', () => {
  assert.equal(modalRestAfterDrag(400, 728, 600, 0), 'full');
});

test('modalRestAfterDrag with zero velocity and height near close returns close', () => {
  assert.equal(modalRestAfterDrag(400, 728, 150, 0), 'close');
});

test('modalRestAfterDrag with zero velocity and tie between close and start returns start', () => {
  assert.equal(modalRestAfterDrag(400, 728, 200, 0), 'start');
});

test('modalRestAfterDrag with positive velocity returns full', () => {
  assert.equal(modalRestAfterDrag(400, 728, 420, 0.8), 'full');
});

test('modalRestAfterDrag with negative velocity and low height returns close', () => {
  assert.equal(modalRestAfterDrag(400, 728, 380, -0.8), 'close');
});

test('modalRestAfterDrag with negative velocity and high height returns start', () => {
  assert.equal(modalRestAfterDrag(400, 728, 600, -0.8), 'start');
});
