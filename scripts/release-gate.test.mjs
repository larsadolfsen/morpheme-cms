import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { gate, isUnshipped, UNSHIPPED } from './release-gate.mjs';

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

// next trails main by commits (plan 2026-11-22-release-gate-unshipped-commits.md)
const EMPTY_CS = '---\n---\n';
const trailing = (files, o = {}) => ({
  npmView: view({ gitHead: OTHER }),
  isAncestor: () => true,
  changedFiles: () => files,
  countAhead: () => 3,
  ...o,
});
const trail = (files, o) => run(trailing(files, o));

test('trailing: docs and .claude only passes and names the commits ahead', async () => {
  const r = await trail([
    { path: 'docs/a.md' },
    { path: '.claude/skills/x/SKILL.md' },
    { path: 'AGENTS.md' },
    { path: '.agents/y' },
    { path: 'CLAUDE.md' },
  ]);
  assert.equal(r.ok, true);
  assert.match(
    r.note,
    /^next is built from bbbbbbb; main is 3 commits ahead with unshipped files only \(docs\/…, \.claude\/…, AGENTS\.md, \.agents\/…, CLAUDE\.md\), and staging runs it\.$/,
  );
});

test('trailing: an empty changeset passes, one that bumps the package blocks', async () => {
  assert.equal((await trail([{ path: '.changeset/a.md', content: EMPTY_CS }])).ok, true);
  const r = await trail([{ path: '.changeset/a.md', content: "---\n'@morphemecms/cms': patch\n---\n\nNote\n" }]);
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /main has changed \.changeset\/a\.md since/);
  assert.equal((await trail([{ path: '.changeset/a.md' }])).ok, false, 'a changeset without content blocks');
});

test('trailing: any shipped or release-relevant path blocks and is named', async () => {
  for (const path of [
    'src/x.ts',
    'package.json',
    'scripts/x.mjs',
    '.github/workflows/check.yml',
    'release-notes/x.md',
    'README.md',
    'CHANGELOG.md',
    'unknown/file',
    'docs/../src/x.ts',
  ]) {
    const r = await trail([{ path: 'docs/a.md' }, { path }]);
    assert.equal(r.ok, false, path);
    assert.equal(
      r.problems[0],
      `next is built from bbbbbbb, and main has changed ${path} since: merge main and approve the new next first`,
    );
  }
});

test('trailing: a deleted shipped file and a rename from docs/ into src/ block', async () => {
  // Both names of a rename are listed, so the new name blocks; a deletion lists the old name.
  assert.equal((await trail([{ path: 'lib/gone.mjs' }])).ok, false);
  const r = await trail([{ path: 'docs/a.md' }, { path: 'src/a.md' }]);
  assert.match(r.problems[0], /changed src\/a\.md since/);
});

test('trailing: next not an ancestor of main blocks, and so does a missing git', async () => {
  const r = await trail([{ path: 'docs/a.md' }], { isAncestor: () => false });
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /^next is not built from this code/);
  assert.match((await run({ npmView: view({ gitHead: OTHER }) })).problems[0], /^next is not built from this code/);
});

test('trailing: a git error blocks with its message', async () => {
  for (const o of [
    {
      isAncestor: () => {
        throw new Error('fatal: bad object');
      },
    },
    {
      changedFiles: async () => {
        throw new Error('fatal: bad revision');
      },
    },
  ]) {
    const r = await trail([], o);
    assert.equal(r.ok, false);
    assert.match(r.problems[0], /^git could not compare next \(bbbbbbb\) with main \(fatal: bad (object|revision)\)/);
  }
});

test('trailing: staging problems still fail a trailing next', async () => {
  const r = await trail([{ path: 'docs/a.md' }], { fetch: route({ '/__staging/version': 500 }) });
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /^staging does not run/);
});

test('an equal gitHead still passes with no git inputs and gives no note', async () => {
  const r = await run();
  assert.equal(r.note, undefined);
});

test('isUnshipped: the list', () => {
  assert.equal(isUnshipped('docs/x/y.md'), true);
  assert.equal(isUnshipped('docsx/y.md'), false);
  assert.equal(isUnshipped('.changeset/README.md', '# Changesets'), false);
  assert.equal(isUnshipped('.changeset/config.json', EMPTY_CS), false);
  assert.equal(isUnshipped('.changeset/sub/a.md', EMPTY_CS), false);
  assert.equal(isUnshipped('package.json'), false);
});

test('UNSHIPPED overlaps nothing in package.json `files` or in npm pack', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const roots = UNSHIPPED.map((p) => p.split(/[ /*]/)[0]).filter(Boolean);
  for (const entry of pkg.files) {
    const e = entry.replace(/^!/, '').replace(/^\.\//, '');
    for (const root of roots) {
      assert.ok(e !== root && !e.startsWith(`${root}/`), `package.json files names "${entry}", which UNSHIPPED says is never shipped`);
    }
  }
  assert.ok(!pkg.files.some((f) => f === '.' || f === './'), 'files must not ship the whole repository');
  const out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  const packed = JSON.parse(out)[0].files.map((f) => f.path);
  assert.ok(packed.length > 0);
  for (const p of packed) assert.ok(!isUnshipped(p, EMPTY_CS), `npm pack ships ${p}, which UNSHIPPED says is never shipped`);
});

test("both workflows fetch enough history to reach next's gitHead", () => {
  for (const file of ['check.yml', 'publish.yml']) {
    const y = readFileSync(new URL(`../.github/workflows/${file}`, import.meta.url), 'utf8');
    const step =
      file === 'check.yml'
        ? y.slice(y.indexOf('\n  release-gate:'), y.indexOf('\n  # The one status check'))
        : y.slice(y.indexOf('\n  release:'), y.indexOf('\n  latest:'));
    assert.match(step, /fetch-depth: 0/, file);
  }
});
