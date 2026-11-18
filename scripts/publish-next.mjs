// Decides what the publish workflow (.github/workflows/publish.yml) stages as a test version, and under which npm tag.
// Pure logic, so it can be tested; the CLI at the bottom is the one step the job `next-line` runs after
// `changeset version --snapshot next`, and it can be run by hand as a dry run (see below). It publishes nothing.
//
// The tags (docs/superpowers/plans/2026-11-18-build-and-check-speed.md, "A6 as built"):
//  - `main` stages under `next`, as always; morpheme-staging follows only that tag (its own Worker checks npm hourly).
//  - a version line's branch (`0.18`, `0.19` ...) stages under `next-<line>` (`next-0.18`), never under `next` and never `latest`, so
//    three lines running together do not fight over one tag.
// The version string is `<X.Y.Z>-next-<timestamp>` for both (changeset's snapshot), unique and sorted by its time. For a line it must
// start with the line's own `X.Y.`: a line whose pending changesets only calculate a lower version (for example `0.17.1-next-…` on `0.18`)
// is refused, not staged under a version that belongs to another line.
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** The line a branch name is (`0.18` gives `0.18`), or null. Only `0.<minor>` is a line (`0.x`, `0.18.1` and `main` are not). */
export function lineOf(branch = '') {
  const m = /^0\.(\d+)$/.exec(branch.trim());
  return m ? `0.${m[1]}` : null;
}

/** The npm dist-tag a branch stages under: `next` for main, `next-<line>` for a line, null for any other branch (nothing is staged). */
export function tagFor(branch = '') {
  if (branch.trim() === 'main') return 'next';
  const line = lineOf(branch);
  return line ? `next-${line}` : null;
}

/**
 * @param {{ branch?: string, version?: string, base?: string }} input
 *   version: package.json after the snapshot; base: package.json before it (HEAD)
 * @returns {{ action: 'stage' | 'skip' | 'error', tag: string, reason: string }}
 */
export function decide({ branch = '', version = '', base = '' }) {
  const tag = tagFor(branch);
  if (!tag) return { action: 'skip', tag: '', reason: `"${branch}" is not main or a version line` };
  version = version.trim();
  if (!version || version === base.trim()) return { action: 'skip', tag, reason: 'no changeset changes the version (nothing to stage)' };
  const line = lineOf(branch);
  if (line && !new RegExp(`^${line.replace('.', '\\.')}\\.\\d+-next-\\d{14}$`).test(version)) {
    return {
      action: 'error',
      tag,
      reason: `${version} does not belong to line ${line} (expected ${line}.<patch>-next-<timestamp>); the line's changesets must raise it to ${line}.0`,
    };
  }
  if (!line && !/-next-\d{14}$/.test(version)) return { action: 'error', tag, reason: `${version} is not a next version` };
  return { action: 'stage', tag, reason: `stage ${version} under "${tag}"` };
}

// CLI. In the workflow: BRANCH, VERSION and BASE come from the environment and `action` and `tag` go to $GITHUB_OUTPUT.
// Dry run by hand:  node scripts/publish-next.mjs --branch 0.18 --version 0.18.0-next-20261118120000 --base 0.17.0
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (n) => {
    const i = process.argv.indexOf('-' + '-' + n);
    return i > 0 ? process.argv[i + 1] : undefined;
  };
  const pkg = () => JSON.parse(readFileSync('package.json', 'utf8')).version;
  const r = decide({
    branch: arg('branch') ?? process.env.BRANCH,
    version: arg('version') ?? process.env.VERSION ?? pkg(),
    base: arg('base') ?? process.env.BASE,
  });
  console.log(`${r.action}: ${r.reason}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `action=${r.action}\ntag=${r.tag}\n`);
  if (r.action === 'error') {
    console.log(`::error::${r.reason}`);
    process.exit(1);
  }
}
