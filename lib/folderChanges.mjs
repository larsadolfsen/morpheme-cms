// The changes that make a folder in a site the store's version of an app or a theme, with its store.json note, or remove
// it. Exposes folderChanges (used by src/store.ts and src/legacyMove.ts). Depends on ./storeEntries.mjs (RECORD).
import { RECORD } from './storeEntries.mjs';

/** @typedef {{ path: string, oid: string }} RepoFile
 * @typedef {{ path: string, content: string | Uint8Array | null, oid: string | null }} Change */

/** The changes that make a folder in the site (`current`, its files now) the store's version of an app or a theme, with
 * the note of where it came from, or remove it (`next` null).
 * @param {string} folder
 * @param {RepoFile[]} current
 * @param {{ files: { path: string, content: string | Uint8Array }[], record: { files: { path: string, oid: string }[] } } | null} next
 * @returns {Change[]} */
export function folderChanges(folder, current, next) {
  const now = new Map(current.map((f) => [f.path, f.oid]));
  /** @type {{ path: string, content: string | Uint8Array, oid?: string }[]} */
  const wanted = next
    ? [
        ...next.files.map((f) => ({
          path: `${folder}/${f.path}`,
          content: f.content,
          oid: next.record.files.find((r) => r.path === f.path)?.oid,
        })),
        { path: `${folder}/${RECORD}`, content: `${JSON.stringify(next.record, null, 2)}\n` },
      ]
    : [];
  return [
    // A file the site has as it is in the store is left as it is.
    ...wanted
      .filter((w) => !w.oid || now.get(w.path) !== w.oid)
      .map((w) => ({ path: w.path, content: w.content, oid: now.get(w.path) ?? null })),
    ...current.filter((f) => !wanted.some((w) => w.path === f.path)).map((f) => ({ path: f.path, content: null, oid: f.oid })),
  ];
}
