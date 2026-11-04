// Tests for cmsView.
// Verifies status transformation and output shape.
// Run: node --test packages/editor/src/cmsView.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cmsView } from './cmsView.mjs';

const baseStatus = {
  running: '0.1.1',
  token: true,
  kv: true,
  checked: { at: '2026-11-04T10:00:00.000Z', latest: '0.1.1' },
  update: null,
  skipped: [],
  notes: [],
};

const now = Date.parse('2026-11-04T12:00:00.000Z');

function makeStatus(overrides) {
  const result = { ...baseStatus, ...overrides };

  if (!('checked' in overrides)) {
    result.checked = baseStatus.checked;
  } else if (overrides.checked === null) {
    result.checked = null;
  } else {
    result.checked = { ...baseStatus.checked, ...overrides.checked };
  }

  if (!('update' in overrides)) {
    result.update = baseStatus.update;
  } else if (overrides.update === null) {
    result.update = null;
  } else {
    result.update = { ...baseStatus.update, ...overrides.update };
  }

  return result;
}

test('up to date', () => {
  const view = cmsView(baseStatus, now);
  assert.equal(view.latest, null);
  assert.equal(view.action, null);
  assert.equal(view.npmCommand, null);
  assert.equal(view.update, null);
  assert.deepEqual(view.problems, []);
  assert.equal(view.checkedAt, '2026-11-04T10:00:00.000Z');
});

test('not checked', () => {
  const status = makeStatus({ checked: null });
  const view = cmsView(status, now);
  assert.equal(view.checkedAt, null);
  assert.equal(view.latest, null);
});

test('patch waiting', () => {
  const status = makeStatus({
    checked: { latest: '0.1.2' },
    update: { commit: 'a1', from: '0.1.1', to: '0.1.2', at: '2026-11-04T11:00:00.000Z', state: 'waiting' },
  });
  const view = cmsView(status, now);
  assert.equal(view.update.state, 'waiting');
  assert.equal(view.update.to, '0.1.2');
  assert.equal(view.action, null);
});

test('major', () => {
  const status = makeStatus({ checked: { latest: '1.0.0', problem: { kind: 'major' } } });
  const view = cmsView(status, now);
  assert.equal(view.latest, '1.0.0');
  assert.equal(view.action, 'update');
});

test('major while undoing', () => {
  const status = makeStatus({
    checked: { latest: '1.0.0', problem: { kind: 'major' } },
    update: { commit: 'a1', from: '1.0.0', to: '0.1.1', at: '2026-11-04T11:00:00.000Z', state: 'undoing' },
  });
  const view = cmsView(status, now);
  assert.equal(view.action, null);
});

test('skipped', () => {
  const status = makeStatus({ checked: { latest: '0.1.3', problem: { kind: 'skipped' } } });
  const view = cmsView(status, now);
  assert.equal(view.action, 'try-again');
});

test('needs npm', () => {
  const status = makeStatus({ checked: { latest: '0.1.2', problem: { kind: 'needs-npm', detail: 'x' } } });
  const view = cmsView(status, now);
  assert.equal(view.npmCommand, 'npm install @morphemecms/cms@0.1.2');
  assert.equal(view.action, null);
});

test('no token', () => {
  const status = makeStatus({ token: false });
  const view = cmsView(status, now);
  assert.deepEqual(view.problems, ['no-token']);
});

test('cannot write', () => {
  const status = makeStatus({ checked: { problem: { kind: 'cannot-write' } } });
  const view = cmsView(status, now);
  assert.deepEqual(view.problems, ['cannot-write']);
});

test('slow undo', () => {
  const status = makeStatus({ checked: { noChecks: true } });
  const view = cmsView(status, now);
  assert.ok(view.problems.includes('slow-undo'));
});

test('done two days ago', () => {
  const status = makeStatus({ update: { commit: 'a1', from: '0.1.1', to: '0.1.2', at: '2026-11-02T12:00:00.000Z', state: 'done' } });
  const view = cmsView(status, now);
  assert.equal(view.update, null);
});

test('done an hour ago', () => {
  const status = makeStatus({ update: { commit: 'a1', from: '0.1.1', to: '0.1.2', at: '2026-11-04T11:00:00.000Z', state: 'done' } });
  const view = cmsView(status, now);
  assert.equal(view.update.state, 'done');
});

test('notes order', () => {
  const status = makeStatus({
    checked: { latest: '0.1.3' },
    notes: [
      { version: '0.1.2', text: 'b' },
      { version: '0.1.3', text: 'c' },
    ],
  });
  const view = cmsView(status, now);
  assert.equal(view.notes[0].version, '0.1.3');
});

test('pre-release running', () => {
  const status = makeStatus({ running: '0.2.0-next.1', checked: { latest: '0.2.0' } });
  const view = cmsView(status, now);
  assert.equal(view.latest, null);
});
