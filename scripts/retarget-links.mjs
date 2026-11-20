// One-off helper, run by an agent per site and committed as a normal change (not a command of bin/morpheme.mjs): rewrites a
// site's own links to a renamed public address (`/blog/kategori/x/` to `/blog/tags/x/`) in src/content/** and src/data/**.  // language-ok: an old public address
// The Worker (worker/movedAddresses.js) redirects the old address anyway, so this is optional; it saves one hop.
// Run in the site's folder: node node_modules/@morphemecms/cms/scripts/retarget-links.mjs [--dry-run] [--only <old prefix>]... [--domain <domain>]
// The renames come from MOVED_PREFIXES in worker/movedAddresses.js, the list the Worker redirects with: one source.
// Idempotent: a second run finds nothing to replace. Depends on lib/retarget.mjs and worker/movedAddresses.js.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { retargetPrefix } from '../lib/retarget.mjs';
import { MOVED_PREFIXES } from '../worker/movedAddresses.js';

const FOLDERS = ['src/content', 'src/data'];
const TEXT = /\.(md|mdx|json|html|astro|ya?ml|txt)$/;

/** @param {string} dir @returns {string[]} */
function filesIn(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((e) => (e.isDirectory() ? filesIn(join(dir, e.name)) : TEXT.test(e.name) ? [join(dir, e.name)] : []));
}

/** The site's domain from `domain: '…'` in src/site/config.ts, or ''. @param {string} root */
export function domainOf(root) {
  for (const file of ['src/site/config.ts', 'src/site/config.mjs']) {
    try {
      const m = /\bdomain:\s*['"`]([^'"`]+)['"`]/.exec(readFileSync(join(root, file), 'utf8'));
      if (m) return m[1];
    } catch {
      /* no such file */
    }
  }
  return '';
}

/**
 * Rewrites the links in a site's content and data. Returns the files it changed (relative paths) and how many links.
 * @param {string} root the site's folder
 * @param {{ prefixes?: [string, string][], domain?: string, write?: boolean }} [options]
 */
export function retargetSite(root, { prefixes = MOVED_PREFIXES, domain = domainOf(root), write = true } = {}) {
  /** @type {{ file: string, count: number }[]} */
  const changed = [];
  for (const file of FOLDERS.flatMap((f) => filesIn(join(root, f)))) {
    const text = readFileSync(file, 'utf8');
    let next = text;
    let count = 0;
    for (const [from, to] of prefixes) {
      const was = next;
      next = retargetPrefix(was, from, to, domain);
      count += next.split(to).length - was.split(to).length;
    }
    if (next === text) continue;
    if (write) writeFileSync(file, next);
    changed.push({ file: relative(root, file), count });
  }
  return changed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const only = args.flatMap((a, i) => (args[i - 1] === '--only' ? [a] : []));
  const domainArg = args[args.indexOf('--domain') + 1];
  const prefixes = only.length ? MOVED_PREFIXES.filter(([from]) => only.includes(from)) : MOVED_PREFIXES;
  const changed = retargetSite(process.cwd(), {
    prefixes,
    ...(args.includes('--domain') ? { domain: domainArg } : {}),
    write: !args.includes('--dry-run'),
  });
  for (const { file, count } of changed) console.log(`${args.includes('--dry-run') ? 'would change' : 'changed'} ${file} (${count})`);
  if (!changed.length) console.log('Nothing to replace.');
}
