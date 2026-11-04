// The files changed between the commit that is live (the site's /editor/version.json) and HEAD, for morpheme ci-build's
// lane decision (lib/build-lane.mjs); every doubt gives no list and a reason. Exposes changedSinceLive. Depends on git
// and fetch.
import { execFileSync } from 'node:child_process';

/** how long a git call may take; a fetch that stalls longer counts as failed, which gives the full lane. */
const GIT_TIMEOUT = 60_000;

/**
 * Runs git in `cwd` and returns its stdout. Throws when git fails.
 * @param {string} cwd
 * @param {string[]} args
 * @param {number} [timeout] milliseconds
 * @returns {string}
 */
function git(cwd, args, timeout = GIT_TIMEOUT) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
}

/**
 * @param {object} o
 * @param {string} o.siteUrl the live site, `https://<domain>`
 * @param {string} o.cwd the repository
 * @param {typeof globalThis.fetch} [o.fetch]
 * @param {string} [o.branch] the branch being built (WORKERS_CI_BRANCH; undefined outside Cloudflare)
 * @param {string} o.repoBranch the site's own branch (repo.branch in its config)
 * @param {number} [o.gitTimeout] milliseconds a git call may take (default 60 s)
 * @returns {Promise<{ paths: string[] | null, reason: string, live: string | null }>}
 */
export async function changedSinceLive({ siteUrl, cwd, fetch = globalThis.fetch, branch, repoBranch, gitTimeout }) {
  if (branch && branch !== repoBranch) {
    return { paths: null, reason: 'branch preview', live: null };
  }

  let live;
  try {
    const res = await fetch(siteUrl + '/editor/version.json', { signal: AbortSignal.timeout(5000) });
    if (res.status !== 200) {
      return { paths: null, reason: 'live commit unknown', live: null };
    }
    const body = await res.json();
    live = body?.commit;
    if (typeof live !== 'string' || !/^[0-9a-f]{40}$/.test(live)) {
      return { paths: null, reason: 'live commit unknown', live: null };
    }
  } catch {
    return { paths: null, reason: 'live commit unknown', live: null };
  }

  try {
    git(cwd, ['cat-file', '-e', live + '^{commit}']);
  } catch {
    try {
      git(cwd, ['fetch', '--deepen=50', 'origin'], gitTimeout);
    } catch {
      // ignored: the retry below decides
    }
    try {
      git(cwd, ['cat-file', '-e', live + '^{commit}']);
    } catch {
      return { paths: null, reason: 'live commit not in history', live };
    }
  }

  try {
    git(cwd, ['merge-base', '--is-ancestor', live, 'HEAD']);
  } catch {
    return { paths: null, reason: 'live commit not an ancestor of HEAD', live };
  }

  // The build runs on the working tree, so tracked changes that are not committed are code the diff cannot see.
  if (git(cwd, ['status', '--porcelain', '--untracked-files=no']).trim().length > 0) {
    return { paths: null, reason: 'uncommitted changes in the working tree', live };
  }

  // --no-renames lists both sides of a rename (else a code file moved into a content folder shows only its new path), -z and
  // core.quotePath=false keep every path as it is, and diff.relative=false lists changes outside the working directory too.
  const out = git(cwd, [
    '-c',
    'core.quotePath=false',
    '-c',
    'diff.relative=false',
    'diff',
    '--no-renames',
    '--name-only',
    '-z',
    live,
    'HEAD',
  ]);
  const paths = out.split('\0').filter((line) => line.length > 0);
  return { paths, reason: 'diff against ' + live.slice(0, 7), live };
}
