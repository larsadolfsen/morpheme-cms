// Reads the pending release notes of a repository (release-notes/i18n/<locale>/pending/<id>.json, and <id>.webp for a card)
// into the Pending object of lib/releaseNotes.mjs, and resolves the repository root. Exposes readPending(root) and repoRoot(arg).
// Depends on node:fs, node:path and node:url only; shared by release-notes.mjs and check-release-notes.mjs.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Reads every pending note of every locale, with the size of its screenshot.
 * @param {string} root the repository root
 * @returns {Record<string, Record<string, { note: object, imageBytes: number | null }>>} locale -> id -> entry; {} when there are no folders
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
      const id = file.slice(0, -'.json'.length);
      const image = join(dir, `${id}.webp`);
      pending[locale.name][id] = {
        note: JSON.parse(readFileSync(join(dir, file), 'utf8')),
        imageBytes: existsSync(image) ? statSync(image).size : null,
      };
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
