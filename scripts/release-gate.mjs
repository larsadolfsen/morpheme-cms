// The release gate (owner, 18 Nov 2026): `latest` is staged, and the Release PR is green, only when the `next` test version was built from
// exactly the code being released AND staging runs that `next` version. It only checks: it never stages, approves or publishes anything.
//
//   node scripts/release-gate.mjs           in publish.yml, job `release`, step `stage`, before `npm stage publish --tag latest`
//   node scripts/release-gate.mjs --check   in check.yml, job `release-gate`, on the Release PR (branch changeset-release/main) only
//
// Both run the same checks, in a checkout whose HEAD is the Release PR's merge commit (a pull_request run checks out the merge of the PR
// into main, so HEAD^1 is the main commit that is about to be released; after the merge HEAD^1 is the same commit):
//   (a) `npm view @morphemecms/cms@next gitHead` equals HEAD^1. The Release PR adds only the version and the changelog, so the `next` build
//       of that main commit is the code that will be `latest`.
//   (b) GET <STAGING_URL>/__staging/version answers 200 with the exact installed version as plain text (trimmed; written at build time by
//       morpheme-staging). A static file proves the build and the deploy, not that pages render, so also:
//   (c) GET <STAGING_URL>/ and GET <STAGING_URL>/editor/ each answer 200 (the editor may answer its sign-in page). Redirects are whatever
//       fetch does by itself. Each failure is its own problem line naming the URL and the status.
// The staging address is the repository variable STAGING_URL (Settings > Secrets and variables > Actions > Variables), for example
// https://staging.example.com. It is not kept in the repository; an empty one fails the gate with a clear message.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const PACKAGE = '@morphemecms/cms';
export const VERSION_PATH = '/__staging/version';
export const PAGE_PATHS = ['/', '/editor/'];

/**
 * @param {{
 *   parent: string,
 *   npmView: (field: 'gitHead' | 'version') => Promise<string> | string,
 *   fetch: typeof fetch,
 *   stagingUrl?: string,
 * }} io `parent` is the first parent of the Release PR's merge commit; `npmView` answers `npm view @morphemecms/cms@next <field>`
 * @returns {Promise<{ ok: boolean, problems: string[] }>}
 */
export async function gate({ parent, npmView, fetch: fetchFn, stagingUrl = '' }) {
  const problems = [];
  let nextVersion = '';
  let gitHead = '';
  try {
    gitHead = String(await npmView('gitHead')).trim();
    nextVersion = String(await npmView('version')).trim();
  } catch (error) {
    problems.push(`npm could not tell what next is built from (${error?.message ?? error}): approve the new next first`);
  }
  if (!problems.length) {
    if (!parent || !gitHead || gitHead !== parent.trim()) {
      problems.push(
        `next is not built from this code: merge main and approve the new next first (next ${nextVersion || '?'} is built from ${gitHead || 'an unknown commit'}, this release is main at ${parent || 'an unknown commit'})`,
      );
    }
    const stagingProblem = await checkStaging(fetchFn, stagingUrl, nextVersion);
    if (stagingProblem) problems.push(stagingProblem);
    if (stagingUrl.trim()) {
      for (const path of PAGE_PATHS) {
        const pageProblem = await checkPage(fetchFn, `${stagingUrl.trim().replace(/\/+$/, '')}${path}`);
        if (pageProblem) problems.push(pageProblem);
      }
    }
  }
  return { ok: problems.length === 0, problems };
}

/** @returns {Promise<string>} the problem, or an empty string */
async function checkStaging(fetchFn, stagingUrl, nextVersion) {
  const notRunning = (why) => `staging does not run ${nextVersion || 'the next version'} yet (${why})`;
  if (!stagingUrl.trim()) return notRunning('the repository variable STAGING_URL is empty: the owner must set it');
  const url = `${stagingUrl.trim().replace(/\/+$/, '')}${VERSION_PATH}`;
  let response;
  try {
    response = await fetchFn(url, { headers: { accept: 'text/plain' }, signal: AbortSignal.timeout(30_000) });
  } catch (error) {
    return notRunning(`${url} did not answer: ${error?.message ?? error}`);
  }
  if (response.status !== 200) return notRunning(`${url} answered ${response.status}`);
  let running;
  try {
    running = (await response.text()).trim();
  } catch {
    return notRunning(`${url} did not answer a body`);
  }
  if (running !== nextVersion) return notRunning(`it runs ${running || 'an unknown version'}`);
  return '';
}

/** @returns {Promise<string>} the problem, or an empty string */
async function checkPage(fetchFn, url) {
  let response;
  try {
    response = await fetchFn(url, { signal: AbortSignal.timeout(30_000) });
  } catch (error) {
    return `staging page ${url} did not answer: ${error?.message ?? error}`;
  }
  return response.status === 200 ? '' : `staging page ${url} answered ${response.status}, must be 200`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const npmView = (field) => execFileSync('npm', ['view', `${PACKAGE}@next`, field], { encoding: 'utf8' });
  let parent = '';
  try {
    parent = execFileSync('git', ['rev-parse', 'HEAD^1'], { encoding: 'utf8' }).trim();
  } catch {
    // Left empty: the gate fails with its message.
  }
  const { ok, problems } = await gate({ parent, npmView, fetch, stagingUrl: process.env.STAGING_URL ?? '' });
  if (ok) {
    console.log(`Release gate passed${check ? ' (check)' : ''}: next is built from ${parent} and staging runs it.`);
  } else {
    for (const p of problems) console.log(`::error::Release gate: ${p}`);
    console.error(`Release gate failed${check ? ' (check)' : ': nothing is staged for latest'}.`);
    process.exit(1);
  }
}
