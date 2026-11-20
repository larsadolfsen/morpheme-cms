// The key of the kept `tsc` build info (.morpheme/tsc/types.tsbuildinfo, npm run check:types; the job `static` of .github/workflows/check.yml): the
// hash, by lib/outputKey.mjs, of what tsc's build info cannot see change by itself: TypeScript's version, the compiler options (tsconfig.types.json),
// the lock file (the types of every dependency) and the Node major. The info itself holds the hash of every source file it read, so tsc finds a
// changed source file on its own; a changed key means a cold run. A cold run and a warm one give the same result. Run: node scripts/ci-tsc-key.mjs  (prints key=<hex>)
// Building block 1 of docs/superpowers/plans/2026-11-18-build-and-check-speed.md.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { outputKey } from '../lib/outputKey.mjs';

/** Files that decide what tsc reads or how: change one and the kept info is not used. */
export const TSC_INPUTS = ['tsconfig.types.json', 'package.json', 'package-lock.json'];

/**
 * @param {string} root the repository root
 * @param {{ typescript?: string, node?: string }} [now] the TypeScript version and Node version in use (read from the checkout by default)
 */
export function tscKey(root, { typescript, node = process.versions.node } = {}) {
  const version = typescript ?? JSON.parse(readFileSync(`${root}/node_modules/typescript/package.json`, 'utf8')).version;
  const files = TSC_INPUTS.map((path) => ({ path, content: readFileSync(`${root}/${path}`) }));
  return outputKey({ files, values: { typescript: version, node: node.split('.')[0], platform: process.platform, arch: process.arch } });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`key=${tscKey(fileURLToPath(new URL('../', import.meta.url)))}`);
}
