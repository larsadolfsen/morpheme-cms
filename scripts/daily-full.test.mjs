import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONTEXT, MAX_PER_DAY, isFeatureBranch, markState, pick } from './daily-full.mjs';

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
  assert.match(daily, /permissions:\n {2}contents: read\n {2}statuses: read\n {2}actions: write\n/);
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
