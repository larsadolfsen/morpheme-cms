// Tests the account side of Density (src/density.ts, src/settings.mjs): what is read from and sent to /api/settings.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DENSITIES, DENSITY_ATTRIBUTE, readDensity, validSettings } from './settings.mjs';
import { loadDensity, saveDensity } from './density.ts';

const answer = (status, body) => async () =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('the steps are Medium and Small, and Medium is 0 (Large went in 0.19.5)', () => {
  assert.deepEqual(DENSITIES, ['medium', 'small']);
  assert.deepEqual(DENSITY_ATTRIBUTE, { medium: '0', small: '-1' });
});

test('a stored Large is read as Medium, with no failed load', () => {
  assert.equal(readDensity('large'), 'medium');
  assert.equal(readDensity('small'), 'small');
  assert.equal(readDensity('tiny'), null);
  assert.deepEqual(validSettings({ density: 'large' }), { density: 'medium' });
});

test('validSettings keeps a known density and drops the rest', () => {
  assert.deepEqual(validSettings({ density: 'small', x: 1 }), { density: 'small' });
  assert.deepEqual(validSettings({}), {});
  for (const bad of [null, [], 'small', { density: 'tiny' }, { density: 1 }]) assert.equal(validSettings(bad), null);
});

test('loadDensity gives the step on the account, or null', async () => {
  assert.equal(await loadDensity(answer(200, { settings: { density: 'large' } })), 'medium');
  assert.equal(await loadDensity(answer(200, { settings: null })), null);
  assert.equal(await loadDensity(answer(200, { settings: { density: 'huge' } })), null);
  assert.equal(await loadDensity(answer(503, { error: 'no-storage' })), null);
  await assert.rejects(loadDensity(answer(500, { error: 'x' })));
});

test('saveDensity sends the step, and a Worker without storage is not an error', async () => {
  let sent;
  await saveDensity('small', async (url, init) => {
    sent = { url, ...init };
    return new Response(null, { status: 204 });
  });
  assert.equal(sent.url, '/api/settings');
  assert.equal(sent.method, 'PUT');
  assert.equal(sent.body, '{"density":"small"}');
  await saveDensity('medium', answer(503, { error: 'no-storage' }));
  await assert.rejects(saveDensity('medium', answer(500, {})));
});
