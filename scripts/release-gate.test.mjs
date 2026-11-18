import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gate } from './release-gate.mjs';

const PARENT = 'a'.repeat(40);
const OTHER = 'b'.repeat(40);
const V = '0.18.0-next-20261118120000';
const view =
  (o = {}) =>
  (field) => {
    const values = { gitHead: PARENT, version: V, ...o };
    if (values[field] instanceof Error) throw values[field];
    return values[field];
  };
const answer = (status, body) => async () => ({ status, text: async () => body });
const BASE = 'https://staging.example.test';
/** Answers by address: `routes` maps a path to a status (200 by default) or an Error to throw; the version file answers V. */
const route =
  (routes = {}) =>
  async (url) => {
    const path = url.slice(BASE.length);
    const r = routes[path] ?? 200;
    if (r instanceof Error) throw r;
    return { status: r, text: async () => (path === '/__staging/version' ? V : '<html>') };
  };
const run = (o = {}) =>
  gate({
    parent: PARENT,
    npmView: view(),
    fetch: answer(200, `${V}\n`),
    stagingUrl: 'https://staging.example.test/',
    ...o,
  });

test('all conditions hold: passes', async () => {
  assert.deepEqual(await run(), { ok: true, problems: [] });
});

test('(c) the home page and the editor must answer 200; each failure is its own line naming the URL and status', async () => {
  assert.equal((await run({ fetch: route() })).ok, true);
  let r = await run({ fetch: route({ '/': 500 }) });
  assert.deepEqual(r.problems, [`staging page ${BASE}/ answered 500, must be 200`]);
  r = await run({ fetch: route({ '/editor/': 404 }) });
  assert.deepEqual(r.problems, [`staging page ${BASE}/editor/ answered 404, must be 200`]);
  r = await run({ fetch: route({ '/': new Error('down') }) });
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], new RegExp(`^staging page ${BASE}/ did not answer: down`));
  r = await run({ fetch: route({ '/': 500, '/editor/': 404 }) });
  assert.equal(r.problems.length, 2);
  r = await run({ fetch: route({ '/': new Error('down'), '/editor/': new Error('down'), '/__staging/version': new Error('down') }) });
  assert.equal(r.problems.length, 3);
});

test('(c) the pages are asked at <url>/ and <url>/editor/', async () => {
  const asked = [];
  await run({ fetch: async (url) => (asked.push(url), { status: 200, text: async () => V }) });
  assert.deepEqual(asked, [`${BASE}/__staging/version`, `${BASE}/`, `${BASE}/editor/`]);
});

test('asks staging at <url>/__staging/version', async () => {
  let asked = '';
  await run({ fetch: async (url) => ((asked ||= url), { status: 200, text: async () => V }) });
  assert.equal(asked, 'https://staging.example.test/__staging/version');
});

test('(a) next built from another commit fails', async () => {
  const r = await run({ npmView: view({ gitHead: OTHER }) });
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /^next is not built from this code: merge main and approve the new next first/);
});

test('(a) next without a gitHead, or no parent commit, fails', async () => {
  assert.match((await run({ npmView: view({ gitHead: '' }) })).problems[0], /^next is not built from this code/);
  assert.match((await run({ parent: '' })).problems[0], /^next is not built from this code/);
});

test('(a) npm failing fails', async () => {
  const r = await run({ npmView: view({ gitHead: new Error('E404') }) });
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /approve the new next first/);
});

test('(b) staging on another version fails', async () => {
  const r = await run({
    fetch: async (url) => ({ status: 200, text: async () => (url.endsWith('/__staging/version') ? '0.18.0-next-20261117000000' : '') }),
  });
  assert.equal(r.ok, false);
  assert.match(r.problems[0], new RegExp(`^staging does not run ${V} yet`));
});

test('(b) staging not answering 200 fails', async () => {
  for (const status of [404, 500, 503]) {
    const r = await run({ fetch: route({ '/__staging/version': status }) });
    assert.equal(r.ok, false, String(status));
    assert.match(r.problems[0], new RegExp(`^staging does not run ${V} yet \\(.*${status}`));
  }
});

test('(b) staging unreachable, no body, or with no address fails', async () => {
  assert.match((await run({ fetch: async () => Promise.reject(new Error('down')) })).problems[0], /^staging does not run/);
  assert.match(
    (await run({ fetch: async () => ({ status: 200, text: async () => Promise.reject(new Error('x')) }) })).problems[0],
    /did not answer a body/,
  );
  assert.match((await run({ stagingUrl: '' })).problems[0], /STAGING_URL/);
});

test('both failing reports both', async () => {
  const r = await run({ npmView: view({ gitHead: OTHER }), fetch: route({ '/__staging/version': 500 }) });
  assert.equal(r.problems.length, 2);
});

test('publish.yml: the gate runs in step stage before latest is staged, and not in the next job', () => {
  const y = readFileSync(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');
  const stage = y.slice(y.indexOf('- id: stage'), y.indexOf('\n  latest:'));
  assert.ok(stage.indexOf('node scripts/release-gate.mjs') > -1);
  assert.ok(stage.indexOf('node scripts/release-gate.mjs') < stage.indexOf('npm stage publish --tag latest'));
  const rest = y.slice(y.indexOf('\n  next:'));
  assert.ok(!rest.includes('release-gate'), 'the next job never runs the gate');
});

test('check.yml: the gate job runs on the Release PR only and `check` waits for it', () => {
  const y = readFileSync(new URL('../.github/workflows/check.yml', import.meta.url), 'utf8');
  const job = y.slice(y.indexOf('\n  release-gate:'), y.indexOf('\n  # The one status check'));
  assert.match(job, /github\.head_ref == 'changeset-release\/main'/);
  assert.match(job, /release-gate\.mjs --check/);
  assert.match(y, /needs: \[[^\]]*release-gate[^\]]*\]/);
});
