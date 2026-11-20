// Tests for src/dashboard.mjs: shape validation, layout edits and purity. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DASHBOARD_VERSION,
  MAX_WIDGETS,
  validDashboard,
  defaultDashboard,
  addWidget,
  removeWidget,
  moveWidget,
  setSettings,
  withoutMissing,
} from './dashboard.mjs';

/** Returns a newId function that yields "id-1", "id-2", ... */
function counter() {
  let n = 0;
  return () => `id-${++n}`;
}

/** @param {number} n */
function placements(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, widget: 'cms:status', settings: {} }));
}

/** Freezes an object graph so any mutation throws in strict mode. */
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) deepFreeze(value[key]);
    Object.freeze(value);
  }
  return value;
}

test('validDashboard rejects non-objects and other versions', () => {
  assert.equal(validDashboard(null), null);
  assert.equal(validDashboard({ version: 2, widgets: [] }), null);
  assert.equal(validDashboard({ version: 1, widgets: 'nope' }), null);
});

test('validDashboard rejects a placement without id', () => {
  const value = { version: 1, widgets: [{ widget: 'cms:status', settings: {} }] };
  assert.equal(validDashboard(value), null);
});

test('validDashboard rejects a widget without a source and key', () => {
  assert.equal(validDashboard({ version: 1, widgets: [{ id: 'a', widget: 'status', settings: {} }] }), null);
  assert.equal(validDashboard({ version: 1, widgets: [{ id: 'a', widget: ':status', settings: {} }] }), null);
  assert.equal(validDashboard({ version: 1, widgets: [{ id: 'a', widget: 'cms:', settings: {} }] }), null);
});

test('validDashboard rejects duplicate placement ids', () => {
  const value = {
    version: 1,
    widgets: [
      { id: 'a', widget: 'cms:status', settings: {} },
      { id: 'a', widget: 'cms:continue', settings: {} },
    ],
  };
  assert.equal(validDashboard(value), null);
});

test('validDashboard rejects settings that are present but not a plain object', () => {
  assert.equal(validDashboard({ version: 1, widgets: [{ id: 'a', widget: 'cms:status', settings: [] }] }), null);
  assert.equal(validDashboard({ version: 1, widgets: [{ id: 'a', widget: 'cms:status', settings: 'x' }] }), null);
});

test('validDashboard allows at most MAX_WIDGETS placements', () => {
  assert.equal(MAX_WIDGETS, 50);
  assert.equal(validDashboard({ version: 1, widgets: placements(51) }), null);
  assert.equal(validDashboard({ version: 1, widgets: placements(50) })?.widgets.length, 50);
});

test('validDashboard round trips a valid dashboard and fills missing settings', () => {
  const stored = {
    version: DASHBOARD_VERSION,
    widgets: [
      { id: 'a', widget: 'cms:status', settings: { compact: true } },
      { id: 'b', widget: 'app-x:chart', settings: {} },
    ],
  };
  assert.deepEqual(validDashboard(JSON.parse(JSON.stringify(stored))), stored);

  const withoutSettings = validDashboard({ version: 1, widgets: [{ id: 'c', widget: 'cms:status' }] });
  assert.deepEqual(withoutSettings, { version: 1, widgets: [{ id: 'c', widget: 'cms:status', settings: {} }] });
});

test('defaultDashboard lists the four built-in widgets in order with new ids', () => {
  const dash = defaultDashboard(counter());
  assert.deepEqual(dash, {
    version: 1,
    widgets: [
      { id: 'id-1', widget: 'cms:continue', settings: {} },
      { id: 'id-2', widget: 'cms:unfinished', settings: {} },
      { id: 'id-3', widget: 'cms:blog-rhythm', settings: {} },
      { id: 'id-4', widget: 'cms:status', settings: {} },
    ],
  });
});

test('addWidget twice with the same widget gives two placements with two ids', () => {
  const newId = counter();
  const once = addWidget({ version: 1, widgets: [] }, 'cms:status', newId);
  const twice = addWidget(once, 'cms:status', newId);
  assert.equal(twice.widgets.length, 2);
  assert.deepEqual(
    twice.widgets.map((p) => p.widget),
    ['cms:status', 'cms:status'],
  );
  assert.notEqual(twice.widgets[0].id, twice.widgets[1].id);
});

test('moveWidget moves a placement to the first and last position', () => {
  const dash = { version: 1, widgets: placements(3) };
  assert.deepEqual(
    moveWidget(dash, 'p2', 0).widgets.map((p) => p.id),
    ['p2', 'p0', 'p1'],
  );
  assert.deepEqual(
    moveWidget(dash, 'p0', 2).widgets.map((p) => p.id),
    ['p1', 'p2', 'p0'],
  );
});

test('moveWidget clamps an out of range index to the first or last position', () => {
  const dash = { version: 1, widgets: placements(3) };
  assert.deepEqual(
    moveWidget(dash, 'p0', 99).widgets.map((p) => p.id),
    ['p1', 'p2', 'p0'],
  );
  assert.deepEqual(
    moveWidget(dash, 'p2', -5).widgets.map((p) => p.id),
    ['p2', 'p0', 'p1'],
  );
});

test('moveWidget with an unknown id keeps the widgets', () => {
  const dash = { version: 1, widgets: placements(2) };
  assert.deepEqual(moveWidget(dash, 'missing', 0), dash);
});

test('removeWidget with an unknown id keeps the widgets', () => {
  const dash = { version: 1, widgets: placements(2) };
  const result = removeWidget(dash, 'missing');
  assert.deepEqual(result, dash);
  assert.notEqual(result, dash);
  assert.notEqual(result.widgets, dash.widgets);
});

test('setSettings replaces only the settings of the given placement', () => {
  const dash = { version: 1, widgets: placements(2) };
  const result = setSettings(dash, 'p1', { days: 7 });
  assert.deepEqual(result.widgets[0], { id: 'p0', widget: 'cms:status', settings: {} });
  assert.deepEqual(result.widgets[1], { id: 'p1', widget: 'cms:status', settings: { days: 7 } });
});

test('withoutMissing drops widgets that are not installed and keeps the order of the rest', () => {
  const dash = {
    version: 1,
    widgets: [
      { id: 'a', widget: 'cms:status', settings: {} },
      { id: 'b', widget: 'gone-app:stats', settings: {} },
      { id: 'c', widget: 'cms:continue', settings: {} },
    ],
  };
  const result = withoutMissing(dash, new Set(['cms:status', 'cms:continue']));
  assert.deepEqual(
    result.widgets.map((p) => p.id),
    ['a', 'c'],
  );
});

test('edits never mutate their input', () => {
  const dash = deepFreeze({
    version: 1,
    widgets: [
      { id: 'a', widget: 'cms:status', settings: { x: 1 } },
      { id: 'b', widget: 'cms:continue', settings: {} },
    ],
  });
  const newId = counter();
  const before = JSON.stringify(dash);

  assert.doesNotThrow(() => {
    addWidget(dash, 'cms:status', newId);
    removeWidget(dash, 'a');
    moveWidget(dash, 'b', 0);
    setSettings(dash, 'a', { x: 2 });
    withoutMissing(dash, ['cms:status']);
    defaultDashboard(newId);
    validDashboard(dash);
  });

  assert.equal(JSON.stringify(dash), before);
});

test('edits return new placement and settings objects', () => {
  const dash = { version: 1, widgets: [{ id: 'a', widget: 'cms:status', settings: { x: 1 } }] };
  const result = removeWidget(dash, 'missing');
  assert.notEqual(result.widgets[0], dash.widgets[0]);
  assert.notEqual(result.widgets[0].settings, dash.widgets[0].settings);
});
