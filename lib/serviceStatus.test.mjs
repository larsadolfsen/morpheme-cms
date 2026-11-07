// lib/serviceStatus.mjs tests; run with: node --test lib/serviceStatus.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS, providersFor, stateOf, worst, providerFrom, reportFrom } from './serviceStatus.mjs';

test('stateOf maps statuses', () => {
  assert.equal(stateOf('operational'), 'ok');
  assert.equal(stateOf('degraded_performance'), 'minor');
  assert.equal(stateOf('under_maintenance'), 'minor');
  assert.equal(stateOf('partial_outage'), 'major');
  assert.equal(stateOf('major_outage'), 'major');
  assert.equal(stateOf('foo'), 'unknown');
  assert.equal(stateOf(undefined), 'unknown');
});

test('worst picks most severe', () => {
  assert.equal(worst([]), 'ok');
  assert.equal(worst(['ok', 'unknown']), 'unknown');
  assert.equal(worst(['unknown', 'minor']), 'minor');
  assert.equal(worst(['minor', 'major', 'ok']), 'major');
});

test('providerFrom with null summary', () => {
  const p = providerFrom(PROVIDERS[0], null);
  assert.equal(p.state, 'unknown');
  assert.equal(p.components.length, 3);
  for (const c of p.components) {
    assert.equal(c.status, 'unknown');
    assert.equal(c.state, 'unknown');
  }
});

test('providerFrom with partial feed', () => {
  const feed = { components: [{ id: '8l4ygp009s5s', name: 'x', status: 'major_outage' }] };
  const p = providerFrom(PROVIDERS[0], feed);
  assert.equal(p.state, 'major');
  assert.equal(p.components[0].name, 'Git Operations');
  assert.equal(p.components[0].status, 'major_outage');
  assert.equal(p.components[0].state, 'major');
  assert.equal(p.components[1].status, 'unknown');
  assert.equal(p.components[2].status, 'unknown');
});

test('providerFrom ignores extra components', () => {
  const s = {
    components: [
      { id: '57srcl8zcn7c', name: 'Workers', status: 'operational' },
      { id: 'pg21w9xb991r', name: 'Workers Assets', status: 'operational' },
      { id: 'vcpsk0w6g86k', name: 'Workers Builds', status: 'operational' },
      { id: 'tmh50tx2nprs', name: 'Workers KV', status: 'operational' },
      { id: 'z0yd3sxqjqdm', name: 'D1', status: 'operational' },
      { id: 'hb7g5sq2zz0h', name: 'R2', status: 'operational' },
      { id: 'other', name: 'Other', status: 'major_outage' },
    ],
  };
  const p = providerFrom(PROVIDERS[1], s);
  assert.equal(p.state, 'ok');
  assert.equal(p.components.length, 6);
});

test('providerFrom maps unknown status to unknown', () => {
  const feed = { components: [{ id: '8l4ygp009s5s', status: 'weird' }] };
  const p = providerFrom(PROVIDERS[0], feed);
  assert.equal(p.components[0].status, 'unknown');
  assert.equal(p.components[0].state, 'unknown');
});

test('reportFrom with all nulls', () => {
  const r = reportFrom({ github: null, cloudflare: null });
  assert.equal(r.state, 'unknown');
  assert.deepEqual(
    r.providers.map((p) => p.id),
    ['github', 'cloudflare'],
  );
});

test('reportFrom with minor degradation', () => {
  const github = {
    components: [
      { id: '8l4ygp009s5s', name: 'Git Operations', status: 'operational' },
      { id: 'brv1bkgrwx7q', name: 'API Requests', status: 'operational' },
      { id: '4230lsnqdsld', name: 'Webhooks', status: 'operational' },
    ],
  };
  const cloudflare = {
    components: [
      { id: '57srcl8zcn7c', name: 'Workers', status: 'operational' },
      { id: 'pg21w9xb991r', name: 'Workers Assets', status: 'operational' },
      { id: 'vcpsk0w6g86k', name: 'Workers Builds', status: 'operational' },
      { id: 'tmh50tx2nprs', name: 'Workers KV', status: 'operational' },
      { id: 'z0yd3sxqjqdm', name: 'D1', status: 'operational' },
      { id: 'hb7g5sq2zz0h', name: 'R2', status: 'degraded_performance' },
    ],
  };
  const r = reportFrom({ github, cloudflare });
  assert.equal(r.state, 'minor');
});

const cloudflareIds = (report) => report.providers.find((p) => p.id === 'cloudflare').components.map((c) => c.name);
const feed = (id, status) => ({ components: [{ id, status }] });
const ALL = ['NOT_FOUND', 'PUSH', 'FILES', 'CONSENT'];

test('without FILES there is no R2, and an R2 outage in the feed does not count', () => {
  const report = reportFrom({ github: null, cloudflare: feed('hb7g5sq2zz0h', 'major_outage') }, providersFor(['NOT_FOUND', 'CONSENT']));
  assert.equal(cloudflareIds(report).includes('R2'), false);
  assert.notEqual(report.providers.find((p) => p.id === 'cloudflare').state, 'major');
});

test('with FILES R2 is there, and its outage counts', () => {
  const report = reportFrom({ github: null, cloudflare: feed('hb7g5sq2zz0h', 'major_outage') }, providersFor(ALL));
  assert.equal(cloudflareIds(report).includes('R2'), true);
  assert.equal(report.providers.find((p) => p.id === 'cloudflare').state, 'major');
});

test('D1 counts only with CONSENT', () => {
  assert.equal(cloudflareIds(reportFrom({}, providersFor(['FILES', 'PUSH']))).includes('D1'), false);
  assert.equal(cloudflareIds(reportFrom({}, providersFor(['CONSENT']))).includes('D1'), true);
});

test('Workers KV counts with NOT_FOUND or PUSH, and with neither it does not', () => {
  assert.equal(cloudflareIds(reportFrom({}, providersFor(['NOT_FOUND']))).includes('Workers KV'), true);
  assert.equal(cloudflareIds(reportFrom({}, providersFor(['PUSH']))).includes('Workers KV'), true);
  assert.equal(cloudflareIds(reportFrom({}, providersFor(['FILES', 'CONSENT']))).includes('Workers KV'), false);
});

test('with no binding the three Workers components stay, and GitHub does not change', () => {
  const report = reportFrom({}, providersFor([]));
  assert.deepEqual(cloudflareIds(report), ['Workers', 'Workers Assets', 'Workers Builds']);
  assert.equal(report.providers.find((p) => p.id === 'github').components.length, PROVIDERS[0].components.length);
});

test('reportFrom without a list reports every component, and a report has no binding names', () => {
  const report = reportFrom({});
  assert.equal(cloudflareIds(report).length, 6);
  assert.equal(JSON.stringify(report).includes('needs'), false);
});
