import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONTEXT, MAX_PER_DAY, STALE_DAYS, canDispatch, dispatch, isFeatureBranch, markState, pick, summaryTable } from './daily-full.mjs';

const ok = { result: 'success' };
const green = {
  changes: ok,
  static: ok,
  build: ok,
  screens: ok,
  'screens-extra': ok,
  'm3-render': ok,
  demo: ok,
  starter: ok,
  'starter-smoke': { result: 'skipped' },
};

test('isFeatureBranch: only feature/**', () => {
  assert.equal(isFeatureBranch('feature/css-split'), true);
  for (const b of ['main', '0.18', 'feature', 'feature/', 'changeset-release/main', 'claude/x']) assert.equal(isFeatureBranch(b), false, b);
});

test('markState: every job green is success; the full level skips nothing', () => {
  assert.equal(markState(green), 'success');
  assert.equal(markState({ ...green, starter: { result: 'skipped' } }), 'failure');
});

test('markState: a failed job is failure, with or without a cancelled one', () => {
  assert.equal(markState({ ...green, screens: { result: 'failure' } }), 'failure');
  assert.equal(markState({ ...green, screens: { result: 'failure' }, demo: { result: 'cancelled' } }), 'failure');
});

test('markState: a cancel writes no mark, never a red one', () => {
  assert.equal(markState({ ...green, starter: { result: 'cancelled' }, check: { result: 'skipped' } }), null);
  assert.equal(
    markState({ ...green, build: { result: 'cancelled' }, static: { result: 'skipped' }, screens: { result: 'skipped' } }),
    null,
  );
});

const b = (name, extra = {}) => ({ name, sha: name + 'sha', aheadBy: 3, status: null, running: false, ...extra });

test('pick: a changed branch with no mark and no run goes', () => {
  assert.deepEqual(pick([b('feature/a'), b('feature/b')]), { run: ['feature/a', 'feature/b'], skipped: [] });
});

test('pick: a head that has a green, red or pending daily-full is not run again (not changed since)', () => {
  const r = pick([
    b('feature/g', { status: 'success' }),
    b('feature/r', { status: 'failure' }),
    b('feature/e', { status: 'error' }),
    b('feature/p', { status: 'pending' }),
  ]);
  assert.deepEqual(r.run, []);
  assert.equal(r.skipped.length, 4);
  assert.match(r.skipped[0].reason, /green/);
  assert.match(r.skipped[1].reason, /red/);
});

test('pick: a branch with a run queued or going, nothing ahead of main, or another name is skipped', () => {
  const r = pick([b('feature/run', { running: true }), b('feature/merged', { aheadBy: 0 }), b('0.18'), b('main'), b('feature/x')]);
  assert.deepEqual(r.run, ['feature/x']);
  assert.deepEqual(
    r.skipped.map((s) => s.name),
    ['feature/run', 'feature/merged', '0.18', 'main'],
  );
});

test('pick: at most MAX_PER_DAY runs, in the order given; the rest wait', () => {
  const many = Array.from({ length: 10 }, (_, i) => b(`feature/n${i}`));
  const r = pick(many);
  assert.equal(r.run.length, MAX_PER_DAY);
  assert.deepEqual(
    r.run,
    many.slice(0, MAX_PER_DAY).map((x) => x.name),
  );
  assert.equal(r.skipped.length, 4);
  assert.equal(pick(many, 2).run.length, 2);
});

test('pick: a cancelled run (no mark) is picked again the next day', () => {
  assert.deepEqual(pick([b('feature/a', { status: null })]).run, ['feature/a']);
});

test('the workflows: one definition (check.yml is dispatched), least permissions, nothing merged, published or tagged', () => {
  const daily = readFileSync(new URL('../.github/workflows/daily-full.yml', import.meta.url), 'utf8');
  const check = readFileSync(new URL('../.github/workflows/check.yml', import.meta.url), 'utf8');
  const script = readFileSync(new URL('./daily-full.mjs', import.meta.url), 'utf8');
  assert.match(daily, /^\s+schedule:/m);
  assert.match(daily, /permissions:\n {2}contents: read\n {2}statuses: read\n {2}pull-requests: read\n {2}actions: write\n/);
  assert.doesNotMatch(daily, /(contents|pull-requests|packages|id-token|checks|statuses): write/);
  // The script dispatches check.yml and no other workflow, and calls no merge, tag, release or publish endpoint.
  assert.deepEqual(
    [...script.matchAll(/workflows\/([\w.-]+)\//g)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i),
    ['check.yml'],
  );
  assert.doesNotMatch(script, /\/merges|\/releases|git\/(tags|refs)['"`]/i);
  // check.yml: dispatchable with level=full; the mark is written by the job `check` only, which alone has statuses: write.
  assert.match(check, /workflow_dispatch:\n {4}inputs:\n {6}level:/);
  assert.match(check, new RegExp(`context=${CONTEXT}`));
  assert.equal([...check.matchAll(/^\s+statuses: write$/gm)].length, 1);
  assert.match(check, /check:\n {4}if: always\(\)[\s\S]*?permissions:\n {6}contents: read\n {6}pull-requests: read\n {6}statuses: write/);
});

test('canDispatch: only check.yml with workflow_dispatch and the input level', () => {
  const check = readFileSync(new URL('../.github/workflows/check.yml', import.meta.url), 'utf8');
  assert.equal(canDispatch(check), true);
  assert.equal(canDispatch('on:\n  pull_request:\n  workflow_dispatch:\n    inputs:\n      level:\n        type: choice\n'), true);
  assert.equal(canDispatch('on:\n  pull_request:\n  push:\n    branches: [main]\n'), false, 'no trigger (cut before A5)');
  assert.equal(canDispatch('on:\n  workflow_dispatch:\n  pull_request:\n'), false, 'trigger without inputs');
  assert.equal(
    canDispatch('on:\n  workflow_dispatch:\n    inputs:\n      other:\n        type: string\njobs:\n  level:\n'),
    false,
    'inputs without level',
  );
  assert.equal(canDispatch(null), false, 'no file');
  assert.equal(canDispatch(''), false);
});

const NOW = Date.parse('2026-11-22T02:17:00Z');
const daysAgo = (d) => new Date(NOW - d * 86400000).toISOString();

test('pick: a branch whose check.yml cannot be dispatched takes no slot', () => {
  const r = pick([b('feature/old', { dispatchable: false }), b('feature/a'), b('feature/b')], 2, NOW);
  assert.deepEqual(r.run, ['feature/a', 'feature/b']);
  assert.deepEqual(
    r.skipped.map((s) => s.name),
    ['feature/old'],
  );
  assert.match(r.skipped[0].reason, /workflow_dispatch/);
});

test('pick: active branches go before older inactive ones; stale ones are skipped; the limit holds', () => {
  const branches = [
    b('feature/stale', { date: daysAgo(STALE_DAYS + 3) }),
    ...Array.from({ length: 6 }, (_, i) => b(`feature/old${i}`, { date: daysAgo(5) })),
    b('feature/built', { date: daysAgo(1), active: true }),
    b('feature/old-active', { date: daysAgo(30), active: true }),
  ];
  const r = pick(branches, MAX_PER_DAY, NOW);
  assert.deepEqual(r.run.slice(0, 2), ['feature/built', 'feature/old-active'], 'active first; an active branch is never stale');
  assert.equal(r.run.length, MAX_PER_DAY);
  const reason = Object.fromEntries(r.skipped.map((s) => [s.name, s.reason]));
  assert.match(reason['feature/stale'], /stale/);
  assert.match(reason['feature/old5'], /limit/);
  assert.match(reason['feature/old4'], /limit/);
  assert.equal(r.skipped.length, 3);
});

/** A fake GitHub: branches by name, with what each read gives; `fail` maps a path part to a status the call throws with. */
function fakeApi({ branches, pulls = [], fail = {} }) {
  const calls = [];
  const err = (status, path) => Object.assign(new Error(`${status} ${path}`), { status });
  const api = async (path, init = {}) => {
    calls.push({ path, init });
    for (const [part, status] of Object.entries(fail)) if ((path + (init.body ?? '')).includes(part)) throw err(status, path);
    if (path.startsWith('git/matching-refs')) return branches.map((x) => ({ ref: `refs/heads/${x.name}`, object: { sha: x.sha } }));
    if (path.startsWith('pulls')) return pulls;
    const sha = branches.find((x) => path.includes(x.sha));
    if (path.startsWith('compare/')) return { ahead_by: 2, commits: [{ commit: { committer: { date: sha.date } } }] };
    if (path.startsWith('commits/')) return [];
    if (path.includes('/runs?')) return { total_count: 0 };
    if (path.startsWith('contents/')) {
      if (sha.noCheck) throw err(404, path);
      return { encoding: 'base64', content: Buffer.from('on:\n  workflow_dispatch:\n    inputs:\n      level:\n').toString('base64') };
    }
    if (path.endsWith('/dispatches')) return null;
    throw new Error(`unexpected ${path}`);
  };
  return { api, calls };
}

test('dispatch: a 422 is a skip, a 500 is an error, every other branch is dispatched and the run fails at the end', async () => {
  const branches = ['a', 'b', 'c', 'd', 'e'].map((n, i) => ({ name: `feature/${n}`, sha: `sha${n}`, date: daysAgo(1 + i) }));
  branches.push({ name: 'feature/gone', sha: 'shagone', date: daysAgo(1) });
  branches.push({ name: 'feature/pre-a5', sha: 'shapre', date: daysAgo(2), noCheck: true });
  const { api, calls } = fakeApi({
    branches,
    pulls: [{ head: { ref: 'feature/e' }, base: { ref: 'main' } }],
    fail: { '"ref":"feature/b"': 422, '"ref":"feature/c"': 500, 'compare/main...shagone': 404 },
  });
  const lines = [];
  const { rows, failed } = await dispatch({ api, now: NOW, log: (l) => lines.push(l) });
  const by = Object.fromEntries(rows.map((r) => [r.name, r]));
  assert.equal(failed, true);
  assert.equal(by['feature/a'].result, 'dispatched');
  assert.equal(by['feature/d'].result, 'dispatched');
  assert.equal(by['feature/e'].result, 'dispatched');
  assert.equal(by['feature/b'].result, 'skipped');
  assert.match(by['feature/b'].reason, /422/);
  assert.equal(by['feature/c'].result, 'error');
  assert.equal(by['feature/gone'].result, 'error', 'a branch that cannot be read is an error, not a crash');
  assert.equal(by['feature/pre-a5'].result, 'skipped');
  assert.match(by['feature/pre-a5'].reason, /workflow_dispatch/);
  const dispatched = calls.filter((c) => c.path.endsWith('/dispatches')).map((c) => JSON.parse(c.init.body).ref);
  assert.equal(dispatched[0], 'feature/e', 'the branch with an open pull request goes first');
  assert.equal(lines.length, rows.length);
  assert.match(summaryTable(rows), /^\| Branch \| Result \| Reason \|\n\| :--- \| :--- \| :--- \|\n\| `feature\/e` \| dispatched \|/);
});

test('dispatch: a dry run writes nothing and fails on nothing', async () => {
  const { api, calls } = fakeApi({ branches: [{ name: 'feature/a', sha: 'shaa', date: daysAgo(1) }] });
  const { rows, failed } = await dispatch({ api, dryRun: true, now: NOW, log: () => {} });
  assert.equal(failed, false);
  assert.deepEqual(rows, [{ name: 'feature/a', result: 'would dispatch', reason: '' }]);
  assert.equal(calls.filter((c) => c.init.method === 'POST').length, 0);
});
