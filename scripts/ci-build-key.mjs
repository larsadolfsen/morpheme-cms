// The key of the CI build (the job `build` of .github/workflows/check.yml): the hash of every tracked file that `npm run build` can read
// and of the Node version, made by lib/outputKey.mjs, never from file times. The job keeps the built tarball in Actions' cache under
// this key and builds only when no tarball with it exists. Run: node scripts/ci-build-key.mjs  (prints key=<hex>, for $GITHUB_OUTPUT)
// Building block 1 of docs/superpowers/plans/2026-11-18-build-and-check-speed.md.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { outputKey } from '../lib/outputKey.mjs';

/** Folders the build never reads: notes for people and agents, changesets, the staging watcher. Every other tracked file is an input (when
 * in doubt, it counts, so a change to it builds again). The build reads package.json's `files` list, demo/, starter/ and the lock file;
 * nothing under these folders is in them. */
export const NOT_INPUTS = ['docs/', '.claude/', '.agents/', '.changeset/'];

/** @param {string} path a tracked file, relative to the repository root */
export const isBuildInput = (path) => !NOT_INPUTS.some((prefix) => path.startsWith(prefix));

/**
 * @param {string} root the repository root
 * @param {string} [node] the Node version the build runs with
 */
export function buildKey(root, node = process.versions.node) {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, maxBuffer: 1 << 28 })
    .toString()
    .split('\0')
    .filter(Boolean);
  const files = tracked.filter(isBuildInput).map((path) => ({ path, content: readFileSync(`${root}/${path}`) }));
  return outputKey({ files, values: { node: node.split('.')[0], platform: process.platform, arch: process.arch } });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`key=${buildKey(fileURLToPath(new URL('../', import.meta.url)))}`);
}
