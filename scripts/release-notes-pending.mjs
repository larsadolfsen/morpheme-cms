// Reads the pending release notes of a repository (release-notes/i18n/<locale>/pending/<id>.json) into the Pending object
// of lib/releaseNotes.mjs, and resolves the repository root. Exposes readPending(root) and repoRoot(arg).
// Depends on node:fs, node:path and node:url only; shared by release-notes.mjs and check-release-notes.mjs.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Reads every pending note of every locale.
 * @param {string} root the repository root
 * @returns {Record<string, Record<string, object>>} locale -> file name without .json -> note; {} when there are no folders
 */
export function readPending(root) {
  const i18n = join(root, 'release-notes', 'i18n');
  const pending = {};
  if (!existsSync(i18n)) return pending;
  for (const locale of readdirSync(i18n, { withFileTypes: true })) {
    const dir = join(i18n, locale.name, 'pending');
    if (!locale.isDirectory() || !existsSync(dir)) continue;
    pending[locale.name] = {};
    const files = readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .sort();
    for (const file of files) {
      pending[locale.name][file.slice(0, -'.json'.length)] = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    }
  }
  return pending;
}

/**
 * The repository root: the argument when given, else the folder above this script.
 * @param {string | undefined} arg
 * @returns {string}
 */
export function repoRoot(arg) {
  return resolve(arg ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
}
