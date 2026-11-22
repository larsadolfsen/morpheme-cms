// The daily full run on feature branches (plan docs/superpowers/plans/2026-11-18-build-and-check-speed.md, "A5 as built"; skill checks, "What CI runs").
// Pure logic, so it can be tested (scripts/daily-full.test.mjs); the CLI at the bottom is the one step of each workflow that uses it.
//
//   node scripts/daily-full.mjs mark        reads `needs` (JSON, as Actions gives it) on stdin, in the job `check` of check.yml after a workflow_dispatch: prints
//                                           the state of the commit status `daily-full` to write (`success` or `failure`), or nothing when the run was cancelled
//   node scripts/daily-full.mjs dispatch    in .github/workflows/daily-full.yml (GITHUB_TOKEN, GITHUB_REPOSITORY in the environment; `--dry-run` writes nothing):
//                                           lists the feature branches, decides with `pick` (active branches first, stale and undispatchable ones left
//                                           out), dispatches check.yml with level=full on each chosen branch, and writes a table to $GITHUB_STEP_SUMMARY.
//                                           One branch's error never stops the rest; the job fails at the end if any branch had one (a 422 is a skip).
//                                           Plan: docs/superpowers/plans/2026-11-22-daily-full-run-fix.md.
//
// It merges, publishes, tags and releases nothing. The only writes are one workflow dispatch of check.yml per chosen branch (here) and one commit status
// (check.yml, job `check`).
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { verdict } from './ci-changes.mjs';

/** The name of the commit status that marks a branch's last commit; `gh api repos/<repo>/commits/<branch>/statuses` shows it. */
export const CONTEXT = 'daily-full';
/** The most runs one day starts. One full run is about 135 runner minutes (plan, "Where the time goes today"); the repository is public, so Actions minutes are free, but the queue is shared. */
export const MAX_PER_DAY = 6;

/** Only `feature/**` branches are checked (`main` and the version lines have their own checks). */
export function isFeatureBranch(name = '') {
  return /^feature\/.+/.test(name.trim());
}

/**
 * The state `check` writes on the branch head after a daily run, from the jobs' results. `success` when every job passed (the full level: nothing is
 * skipped); `null` (no mark at all) when a job was cancelled and none failed, so a cancel (a manual cancel, a lost runner, a timeout) is never a red
 * mark and the next day's run tries again; `failure` for anything else (a failed job, or a job skipped that must run).
 * @param {Record<string, {result?: string}>} needs
 * @returns {'success'|'failure'|null}
 */
export function markState(needs) {
  if (!verdict(needs, false, true, 'full').length) return 'success';
  const results = Object.values(needs ?? {}).map((n) => n?.result);
  if (results.includes('cancelled') && !results.includes('failure')) return null;
  return 'failure';
}

/** A branch with no open pull request and no push for this many days is stale: it is left out (the PM reads the list from the job summary). */
export const STALE_DAYS = 7;

/**
 * Whether check.yml (its text at a branch's head) can be dispatched with level=full: it has the `workflow_dispatch` trigger with the input `level`.
 * A branch cut before A5 has neither, and GitHub answers a dispatch with 422 "Workflow does not have 'workflow_dispatch' trigger".
 * @param {string|null|undefined} text
 */
export function canDispatch(text) {
  if (!text) return false;
  const lines = text.split('\n');
  const at = lines.findIndex((l) => /^\s*workflow_dispatch:\s*(#.*)?$/.test(l));
  if (at < 0) return false;
  const indent = (l) => l.match(/^\s*/)[0].length;
  const base = indent(lines[at]);
  const block = [];
  for (const l of lines.slice(at + 1)) {
    if (!l.trim() || /^\s*#/.test(l)) continue;
    if (indent(l) <= base) break;
    block.push(l);
  }
  const inputs = block.findIndex((l) => /^\s*inputs:\s*(#.*)?$/.test(l));
  return inputs >= 0 && block.slice(inputs + 1).some((l) => indent(l) > indent(block[inputs]) && /^\s*level:/.test(l));
}

/**
 * Which branches get a full run today. Active branches (an open pull request has the branch as its head or its base: the feature being built)
 * come first, then the rest; within each, the order given (the caller sorts, oldest push first). A branch is skipped when:
 *  - it is not a feature branch;
 *  - it has no commit that `main` lacks (`aheadBy` 0: merged and not yet deleted, or just cut);
 *  - it is stale: not active and its last commit is more than STALE_DAYS old;
 *  - its check.yml cannot be dispatched with level=full (`dispatchable` false: cut before A5);
 *  - its head already has the status `daily-full` as success (green), failure (red) or pending: the branch has not changed since its last full run,
 *    and a red head stays red until a push, so it is not run again (the PM re-runs it by hand: `workflow_dispatch` on check.yml);
 *  - a full run of it is queued or running.
 * Of the rest, at most `max` start; the others wait for tomorrow. Only what runs counts towards `max`.
 * @param {{name: string, sha: string, aheadBy?: number, status?: string|null, running?: boolean, dispatchable?: boolean, active?: boolean, date?: string}[]} branches
 * @param {number} [max]
 * @param {number} [now] ms since the epoch
 * @returns {{run: string[], skipped: {name: string, reason: string}[]}}
 */
export function pick(branches, max = MAX_PER_DAY, now = Date.now()) {
  const run = [];
  const skipped = [];
  const ordered = [...branches.filter((b) => b.active), ...branches.filter((b) => !b.active)];
  for (const b of ordered) {
    let reason = '';
    const age = b.date ? now - Date.parse(b.date) : NaN;
    if (!isFeatureBranch(b.name)) reason = 'not a feature branch';
    else if (b.aheadBy === 0) reason = 'nothing that main lacks';
    else if (!b.active && age > STALE_DAYS * 86400000) reason = `stale: no open pull request and no push for ${STALE_DAYS} days`;
    else if (b.dispatchable === false) reason = 'check.yml has no workflow_dispatch with level (cut before A5): merge main into it';
    else if (b.status === 'success') reason = 'head already has a green daily-full';
    else if (b.status === 'failure' || b.status === 'error') reason = 'head already has a red daily-full and has not changed since';
    else if (b.status === 'pending') reason = 'daily-full is pending on this head';
    else if (b.running) reason = 'a full run is queued or running';
    else if (run.length >= max) reason = `over today's limit of ${max} runs, tomorrow`;
    if (reason) skipped.push({ name: b.name, reason });
    else run.push(b.name);
  }
  return { run, skipped };
}

/** The job summary: one row per branch, in the order decided. */
export function summaryTable(rows) {
  const cell = (v) =>
    String(v ?? '')
      .replace(/[\\|`]/g, '\\$&')
      .replace(/\s+/g, ' ');
  return [
    '| Branch | Result | Reason |',
    '| :--- | :--- | :--- |',
    ...rows.map((r) => `| ${cell(r.name)} | ${cell(r.result)} | ${cell(r.reason)} |`),
    '',
  ].join('\n');
}

async function githubApi(path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...init.headers,
    },
  });
  if (!res.ok) {
    const err = new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

/** check.yml at one head, or null when the branch has none. */
async function readCheckYml(api, sha) {
  try {
    const file = await api(`contents/.github/workflows/check.yml?ref=${encodeURIComponent(sha)}`);
    return Buffer.from(file?.content ?? '', file?.encoding === 'base64' ? 'base64' : 'utf8').toString('utf8');
  } catch (e) {
    if (e?.status === 404) return null;
    throw e;
  }
}

/**
 * Lists the feature branches, decides with `pick` and dispatches check.yml level=full on each chosen one. One branch's error never stops the rest:
 * reading or dispatching a branch is in its own try; a 422 on the dispatch is a skip, any other error is listed and makes `failed` true. Only listing
 * the refs and the open pull requests at the start may throw.
 * @param {{api: (path: string, init?: object) => Promise<any>, dryRun?: boolean, now?: number, log?: (line: string) => void}} opts
 * @returns {Promise<{rows: {name: string, result: string, reason: string}[], failed: boolean}>}
 */
export async function dispatch({ api, dryRun = false, now = Date.now(), log = console.log }) {
  const refs = await api('git/matching-refs/heads/feature/?per_page=100');
  const pulls = await api('pulls?state=open&per_page=100');
  const active = new Set((pulls ?? []).flatMap((p) => [p?.head?.ref, p?.base?.ref]).filter(Boolean));
  const branches = [];
  const errors = [];
  for (const r of refs ?? []) {
    const name = r.ref.replace(/^refs\/heads\//, '');
    const sha = r.object.sha;
    try {
      const [cmp, statuses, runs, checkYml] = await Promise.all([
        api(`compare/main...${encodeURIComponent(sha)}`),
        api(`commits/${sha}/statuses?per_page=100`),
        Promise.all(
          ['queued', 'in_progress'].map((s) =>
            api(`actions/workflows/check.yml/runs?event=workflow_dispatch&branch=${encodeURIComponent(name)}&status=${s}`),
          ),
        ),
        readCheckYml(api, sha),
      ]);
      // The statuses come newest first: the first with our context is the current one.
      branches.push({
        name,
        sha,
        aheadBy: cmp.ahead_by,
        status: statuses.find((s) => s.context === CONTEXT)?.state ?? null,
        running: runs.some((x) => x.total_count > 0),
        date: cmp.commits?.at(-1)?.commit?.committer?.date ?? '',
        active: active.has(name),
        dispatchable: canDispatch(checkYml),
      });
    } catch (e) {
      errors.push({ name, result: 'error', reason: `reading the branch: ${e?.message ?? e}` });
    }
  }
  branches.sort((a, b) => a.date.localeCompare(b.date)); // the oldest push first, so a limit leaves out the busiest branches
  const { run, skipped } = pick(branches, MAX_PER_DAY, now);
  const rows = [];
  for (const name of run) {
    if (dryRun) {
      rows.push({ name, result: 'would dispatch', reason: '' });
      continue;
    }
    try {
      await api('actions/workflows/check.yml/dispatches', {
        method: 'POST',
        body: JSON.stringify({ ref: name, inputs: { level: 'full' } }),
      });
      rows.push({ name, result: 'dispatched', reason: '' });
    } catch (e) {
      if (e?.status === 422) rows.push({ name, result: 'skipped', reason: `GitHub refused the dispatch (422): ${e.message}` });
      else rows.push({ name, result: 'error', reason: e?.message ?? String(e) });
    }
  }
  for (const s of skipped) rows.push({ name: s.name, result: 'skipped', reason: s.reason });
  rows.push(...errors);
  for (const r of rows) log(`${r.result} ${r.name}${r.reason ? `: ${r.reason}` : ''}`);
  return { rows, failed: rows.some((r) => r.result === 'error') };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode === 'mark') {
    let text = '';
    for await (const chunk of process.stdin) text += chunk;
    const state = markState(JSON.parse(text));
    if (state) console.log(state);
  } else if (mode === 'dispatch') {
    const dryRun = process.argv.includes('--dry-run');
    const { rows, failed } = await dispatch({ api: githubApi, dryRun });
    const table = summaryTable(rows);
    if (dryRun) console.log(`\n${table}`);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Daily full run\n\n${table}`);
    if (failed) {
      console.error('One or more branches had an error (see the table); every other branch was handled.');
      process.exit(1);
    }
  } else {
    console.error('usage: daily-full.mjs mark | dispatch [--dry-run]');
    process.exit(2);
  }
}
