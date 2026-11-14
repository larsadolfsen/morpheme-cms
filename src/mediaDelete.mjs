/**
 * What deleting several files of Filer at once commits: the files nothing uses (and each one's record of tags) as one
 * list of changes for one commit, and the selected files that are kept because a page or the site's code uses them.
 * Exposes `mediaDeletion`.
 * Used by Media.tsx (delete selected files). Uses fileRecords.mjs (deleteRecord).
 */
import { deleteRecord } from './fileRecords.mjs';

/**
 * @param {string[]} srcs the selected addresses on the site
 * @param {{ fileOf: (src: string) => { path: string; oid: string } | undefined, isUsed: (src: string) => boolean, records: import('./fileRecords.mjs').StoredRecord[] }} how
 *   `fileOf`: the repository file of an address; `isUsed`: whether a page or the site's code uses it; `records`: the file records
 * @returns {{ deleted: string[], kept: string[], changes: { path: string; content: null; oid: string | null }[] }}
 */
export function mediaDeletion(srcs, { fileOf, isUsed, records }) {
  const deleted = [];
  const kept = [];
  const changes = [];
  const seen = new Set();
  for (const src of srcs) {
    const file = fileOf(src);
    if (!file || isUsed(src)) {
      kept.push(src);
      continue;
    }
    deleted.push(src);
    changes.push({ path: file.path, content: null, oid: file.oid });
    const record = deleteRecord(records, src);
    if (record && !seen.has(record.path)) {
      seen.add(record.path);
      changes.push(record);
    }
  }
  return { deleted, kept, changes };
}
