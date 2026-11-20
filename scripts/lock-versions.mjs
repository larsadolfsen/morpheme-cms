// Cuts a site's package-lock.json down to what the peer test needs: versions only, none of a site's content and nothing of a customer.
// Keeps the root's name-less entry with the CMS as its dependency, the CMS's own entry and the entry of each package the CMS has as a
// peer (package.json, peerDependencies); each of them with its `version` and nothing else. Writes the cut lockfile to the output.
// Run: node scripts/lock-versions.mjs <package-lock.json> [> scripts/fixtures/locks/<name>.json]
// Exposes versionsOnly (used by scripts/peer-ranges.test.mjs).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CMS = '@morphemecms/cms';
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/** The lockfile (parsed) with the root, the CMS and the CMS's peers, each with its version only. */
export function versionsOnly(lock, peers = Object.keys(pkg.peerDependencies)) {
  const keep = new Set([CMS, ...peers]);
  const packages = {};
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (path === '')
      packages[''] = { name: 'site', dependencies: { [CMS]: entry.dependencies?.[CMS] ?? lock.packages[`node_modules/${CMS}`]?.version } };
    else if (keep.has(path.replace(/^node_modules\//, '')) && path.startsWith('node_modules/') && !path.slice(13).includes('node_modules/'))
      packages[path] = { version: entry.version };
  }
  return { name: 'site', lockfileVersion: 3, requires: true, packages };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/lock-versions.mjs <package-lock.json>');
    process.exit(2);
  }
  process.stdout.write(JSON.stringify(versionsOnly(JSON.parse(readFileSync(file, 'utf8'))), null, 2) + '\n');
}
