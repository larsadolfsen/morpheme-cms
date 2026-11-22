// The release gate (owner, 18 Nov 2026): `latest` is staged, and the Release PR is green, only when the `next` test version was built from
// exactly the code being released AND staging runs that `next` version. It only checks: it never stages, approves or publishes anything.
//
//   node scripts/release-gate.mjs           in publish.yml, job `release`, step `stage`, before `npm stage publish --tag latest`
//   node scripts/release-gate.mjs --check   in check.yml, job `release-gate`, on the Release PR (branch changeset-release/main) only
//
// Both run the same checks, in a checkout whose HEAD is the Release PR's merge commit (a pull_request run checks out the merge of the PR
// into main, so HEAD^1 is the main commit that is about to be released; after the merge HEAD^1 is the same commit):
//   (a) `npm view @morphemecms/cms@next gitHead` equals HEAD^1. The Release PR adds only the version and the changelog, so the `next` build
//       of that main commit is the code that will be `latest`. It may also be an ancestor of HEAD^1 when every path changed since is
//       on UNSHIPPED (docs, agent files, an empty changeset): such commits change nothing in the package, so the bytes staging ran are
//       the bytes released (plan 2026-11-22-release-gate-unshipped-commits.md). Anything else, or any git error, blocks.
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

/** Paths the package never ships. `package.json` `files` must not reach any of them (tested). Fails closed: a path not named blocks. */
export const UNSHIPPED = ['docs/**', '.claude/**', '.agents/**', 'AGENTS.md', 'CLAUDE.md', '.changeset/*.md (empty front matter only)'];

/**
 * @param {string} path a repository path, forward slashes
 * @param {string} [content] the file's content at the released commit; only read for `.changeset/*.md`
 */
export function isUnshipped(path, content) {
  if (path.startsWith('docs/') || path.startsWith('.claude/') || path.startsWith('.agents/')) return !path.split('/').includes('..');
  if (path === 'AGENTS.md' || path === 'CLAUDE.md') return true;
  if (/^\.changeset\/[^/]+\.md$/.test(path)) return typeof content === 'string' && /^---[ \t]*\r?\n---[ \t]*(\r?\n|$)/.test(content);
  return false;
}

/**
 * @param {{
 *   parent: string,
 *   npmView: (field: 'gitHead' | 'version') => Promise<string> | string,
 *   fetch: typeof fetch,
 *   stagingUrl?: string,
 *   isAncestor?: (gitHead: string, parent: string) => Promise<boolean> | boolean,
 *   changedFiles?: (gitHead: string, parent: string) => Promise<{ path: string, content?: string }[]> | { path: string, content?: string }[],
 *   countAhead?: (gitHead: string, parent: string) => Promise<number> | number,
 * }} io `parent` is the first parent of the Release PR's merge commit; `npmView` answers `npm view @morphemecms/cms@next <field>`;
 * `isAncestor` and `changedFiles` (every added, changed, deleted or renamed path, both names of a rename) let `next` trail `parent` by
 * unshipped commits; without them only an equal `gitHead` passes
 * @returns {Promise<{ ok: boolean, problems: string[] }>}
 */
export async function gate({ parent, npmView, fetch: fetchFn, stagingUrl = '', isAncestor, changedFiles, countAhead }) {
  let passNote = '';
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
      const notBuilt = `next is not built from this code: merge main and approve the new next first (next ${nextVersion || '?'} is built from ${gitHead || 'an unknown commit'}, this release is main at ${parent || 'an unknown commit'})`;
      const verdict =
        parent && gitHead ? await checkUnshipped({ gitHead, parent: parent.trim(), isAncestor, changedFiles, countAhead }) : null;
      if (verdict?.ok) passNote = verdict.note;
      else problems.push(verdict?.problem ?? notBuilt);
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
  return { ok: problems.length === 0, problems, ...(passNote && !problems.length ? { note: passNote } : {}) };
}

/**
 * `next` trails `parent`: passes only when it is an ancestor and every path changed since is unshipped.
 * @returns {Promise<{ ok: true, note: string } | { ok: false, problem?: string }>} no `problem` means "use the plain not-built message"
 */
async function checkUnshipped({ gitHead, parent, isAncestor, changedFiles, countAhead }) {
  if (!isAncestor || !changedFiles) return { ok: false };
  const short = (sha) => sha.slice(0, 7);
  try {
    if (!(await isAncestor(gitHead, parent))) return { ok: false };
    const files = await changedFiles(gitHead, parent);
    const blocking = files.find((f) => f.path === 'package.json' || !isUnshipped(f.path, f.content));
    if (blocking) {
      return {
        ok: false,
        problem: `next is built from ${short(gitHead)}, and main has changed ${blocking.path} since: merge main and approve the new next first`,
      };
    }
    const ahead = countAhead ? await countAhead(gitHead, parent) : null;
    const commits = typeof ahead === 'number' ? `${ahead} commit${ahead === 1 ? '' : 's'}` : 'commits';
    const roots = [...new Set(files.map((f) => (f.path.includes('/') ? `${f.path.split('/')[0]}/…` : f.path)))].join(', ');
    return {
      ok: true,
      note: `next is built from ${short(gitHead)}; main is ${commits} ahead with unshipped files only (${roots || 'none'}), and staging runs it.`,
    };
  } catch (error) {
    return {
      ok: false,
      problem: `git could not compare next (${short(gitHead)}) with main (${error?.message ?? error}): approve the new next first`,
    };
  }
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
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const isAncestor = (head, tip) => {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', head, tip], { stdio: 'pipe' });
      return true;
    } catch (error) {
      if (error.status === 1) return false; // not an ancestor; any other status is a git error and fails the gate
      throw new Error(String(error.stderr || error.message).trim());
    }
  };
  // `--no-renames` lists both names of a rename, so a move out of docs/ into src/ shows both.
  const changedFiles = (head, tip) =>
    git('diff', '--name-only', '--no-renames', '-z', head, tip)
      .split('\0')
      .filter(Boolean)
      .map((path) => {
        if (!/^\.changeset\/[^/]+\.md$/.test(path)) return { path };
        try {
          return { path, content: git('show', `${tip}:${path}`) };
        } catch {
          return { path }; // deleted at the tip: blocks
        }
      });
  const countAhead = (head, tip) => Number(git('rev-list', '--count', `${head}..${tip}`).trim());
  const { ok, problems, note } = await gate({
    parent,
    npmView,
    fetch,
    stagingUrl: process.env.STAGING_URL ?? '',
    isAncestor,
    changedFiles,
    countAhead,
  });
  if (ok) {
    console.log(
      note
        ? `Release gate passed${check ? ' (check)' : ''}: ${note}`
        : `Release gate passed${check ? ' (check)' : ''}: next is built from ${parent} and staging runs it.`,
    );
  } else {
    for (const p of problems) console.log(`::error::Release gate: ${p}`);
    console.error(`Release gate failed${check ? ' (check)' : ': nothing is staged for latest'}.`);
    process.exit(1);
  }
}
