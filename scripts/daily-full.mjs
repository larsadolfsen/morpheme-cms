// The daily full run on feature branches (plan docs/superpowers/plans/2026-11-18-build-and-check-speed.md, "A5 as built"; skill checks, "What CI runs").
// Pure logic, so it can be tested (scripts/daily-full.test.mjs); the CLI at the bottom is the one step of each workflow that uses it.
//
//   node scripts/daily-full.mjs mark        reads `needs` (JSON, as Actions gives it) on stdin, in the job `check` of check.yml after a workflow_dispatch: prints
//                                           the state of the commit status `daily-full` to write (`success` or `failure`), or nothing when the run was cancelled
//   node scripts/daily-full.mjs dispatch    in .github/workflows/daily-full.yml (GITHUB_TOKEN, GITHUB_REPOSITORY in the environment; `--dry-run` writes nothing):
//                                           lists the feature branches, decides with `pick`, and dispatches check.yml with level=full on each chosen branch
//
// It merges, publishes, tags and releases nothing. The only writes are one workflow dispatch of check.yml per chosen branch (here) and one commit status
// (check.yml, job `check`).
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

/**
 * Which branches get a full run today. A branch is skipped when:
 *  - it is not a feature branch;
 *  - it has no commit that `main` lacks (`aheadBy` 0: merged and not yet deleted, or just cut);
 *  - its head already has the status `daily-full` as success (green), failure (red) or pending: the branch has not changed since its last full run,
 *    and a red head stays red until a push, so it is not run again (the PM re-runs it by hand: `workflow_dispatch` on check.yml);
 *  - a full run of it is queued or running.
 * Of the rest, at most `max` start (the order given: the caller sorts, oldest push first); the others wait for tomorrow.
 * @param {{name: string, sha: string, aheadBy?: number, status?: string|null, running?: boolean}[]} branches
 * @param {number} [max]
 * @returns {{run: string[], skipped: {name: string, reason: string}[]}}
 */
export function pick(branches, max = MAX_PER_DAY) {
  const run = [];
  const skipped = [];
  for (const b of branches) {
    let reason = '';
    if (!isFeatureBranch(b.name)) reason = 'not a feature branch';
    else if (b.aheadBy === 0) reason = 'nothing that main lacks';
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

async function api(path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function dispatch(dryRun) {
  const refs = await api('git/matching-refs/heads/feature/?per_page=100');
  const branches = [];
  for (const r of refs) {
    const name = r.ref.replace(/^refs\/heads\//, '');
    const sha = r.object.sha;
    const [cmp, statuses, runs] = await Promise.all([
      api(`compare/main...${encodeURIComponent(sha)}`),
      api(`commits/${sha}/statuses?per_page=100`),
      Promise.all(
        ['queued', 'in_progress'].map((s) =>
          api(`actions/workflows/check.yml/runs?event=workflow_dispatch&branch=${encodeURIComponent(name)}&status=${s}`),
        ),
      ),
    ]);
    // The statuses come newest first: the first with our context is the current one.
    branches.push({
      name,
      sha,
      aheadBy: cmp.ahead_by,
      status: statuses.find((s) => s.context === CONTEXT)?.state ?? null,
      running: runs.some((x) => x.total_count > 0),
      date: cmp.commits?.at(-1)?.commit?.committer?.date ?? '',
    });
  }
  branches.sort((a, b) => a.date.localeCompare(b.date)); // the oldest push first, so a limit leaves out the busiest branches
  const { run, skipped } = pick(branches);
  for (const s of skipped) console.log(`skip ${s.name}: ${s.reason}`);
  for (const name of run) {
    console.log(`${dryRun ? 'would dispatch' : 'dispatch'} check.yml level=full on ${name}`);
    if (!dryRun) {
      await api('actions/workflows/check.yml/dispatches', {
        method: 'POST',
        body: JSON.stringify({ ref: name, inputs: { level: 'full' } }),
      });
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode === 'mark') {
    let text = '';
    for await (const chunk of process.stdin) text += chunk;
    const state = markState(JSON.parse(text));
    if (state) console.log(state);
  } else if (mode === 'dispatch') {
    await dispatch(process.argv.includes('--dry-run'));
  } else {
    console.error('usage: daily-full.mjs mark | dispatch [--dry-run]');
    process.exit(2);
  }
}
