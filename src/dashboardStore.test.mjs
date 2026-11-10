// Tests for src/dashboardStore.ts: the response handling of GET /api/dashboard and the placements to show. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDashboard, placementsOf } from './dashboardStore.ts';

const counter = () => {
  let n = 0;
  return () => `id-${++n}`;
};
const reply =
  (body, status = 200) =>
  async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const stored = { version: 1, widgets: [{ id: 'a', widget: 'cms:continue', settings: {} }] };

test('returns the stored dashboard', async () => {
  assert.deepEqual(await loadDashboard(reply({ dashboard: stored }), counter()), stored);
});

test('asks without a cache', async () => {
  let seen;
  await loadDashboard(async (url, init) => ((seen = [url, init]), reply({ dashboard: stored })()), counter());
  assert.equal(seen[0], '/api/dashboard');
  assert.equal(seen[1].cache, 'no-store');
});

test('gives the default dashboard when there is none', async () => {
  const dash = await loadDashboard(reply({ dashboard: null }), counter());
  assert.equal(dash.version, 1);
  assert.deepEqual(
    dash.widgets.map((p) => p.widget),
    ['cms:continue', 'cms:unfinished', 'cms:blog-rhythm', 'cms:status'],
  );
  assert.deepEqual(
    dash.widgets.map((p) => p.id),
    ['id-1', 'id-2', 'id-3', 'id-4'],
  );
});

test('gives the default dashboard when the Worker has no storage', async () => {
  const dash = await loadDashboard(reply({ error: 'no-storage' }, 503), counter());
  assert.equal(dash.widgets.length, 4);
});

test('throws on any other failure', async () => {
  for (const [body, status] of [
    [{ error: 'unauthorized' }, 401],
    [{ error: 'forbidden' }, 403],
    [{ error: 'github' }, 502],
    [{ error: 'other' }, 503],
    [{}, 500],
  ]) {
    await assert.rejects(loadDashboard(reply(body, status), counter()));
  }
  await assert.rejects(loadDashboard(async () => new Response('<html>', { status: 200 }), counter()));
  await assert.rejects(loadDashboard(async () => Promise.reject(new Error('offline')), counter()));
});

test('throws on a stored value that is not a dashboard', async () => {
  await assert.rejects(loadDashboard(reply({ dashboard: { version: 9, widgets: [] } }), counter()));
});

test('keeps the placements whose widget exists, in order', () => {
  const dash = {
    version: 1,
    widgets: [
      { id: '1', widget: 'cms:continue', settings: {} },
      { id: '2', widget: 'gone:x', settings: {} },
      { id: '3', widget: 'cms:status', settings: {} },
    ],
  };
  const widgets = new Map([
    ['cms:status', { label: 's' }],
    ['cms:continue', { label: 'c' }],
  ]);
  const shown = placementsOf(dash, widgets);
  assert.deepEqual(
    shown.map((s) => s.placement.id),
    ['1', '3'],
  );
  assert.equal(shown[0].definition.label, 'c');
});
