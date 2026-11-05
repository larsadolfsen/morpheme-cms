// The file records (src/data/files/<id>.json): which tags a file in Filer has and which were removed from it, one record per file address.
// Reads them from the editor's files, gives the changes (as env.commit takes them) a save, rename or delete makes, checks them, and finds the record of a deleted file. Pure, so node --test can run it.
// Uses fileTags.mjs (isEmpty).
import { isEmpty } from './fileTags.mjs';

/**
 * @typedef {import('./fileTags.mjs').FileRecord} FileRecord
 * @typedef {{ path: string; oid: string; record: FileRecord }} StoredRecord
 * @typedef {{ path: string; content: string | null; oid: string | null }} RecordChange
 * @typedef {{ path: string; problem: 'shape' | 'overlap' | 'duplicate'; value?: string }} RecordProblem
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** @param {unknown} list */
const isStringArray = (list) => Array.isArray(list) && list.every((item) => typeof item === 'string');

/**
 * The record in a file's text, or null when the text is not a record.
 * @param {string} text
 * @returns {FileRecord | null}
 */
export function parseRecord(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  if (typeof data.src !== 'string' || !data.src.startsWith('/')) return null;
  const categories = data.categories === undefined ? [] : data.categories;
  const removed = data.removed === undefined ? [] : data.removed;
  if (!isStringArray(categories) || !isStringArray(removed)) return null;
  return { src: data.src, categories: [...categories], removed: [...removed] };
}

/**
 * Whether a path is a .json file directly in the folder (no subfolders).
 * @param {string} path
 * @param {string} folder
 * @returns {boolean}
 */
export const isRecordPath = (path, folder) => {
  const prefix = `${folder}/`;
  if (!path.startsWith(prefix)) return false;
  const name = path.slice(prefix.length);
  return !name.includes('/') && name.endsWith('.json');
};

/**
 * Sorts by path.
 * @template {{ path: string }} T
 * @param {T[]} items
 * @returns {T[]}
 */
const byPath = (items) => items.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

/**
 * The records directly in a folder, sorted by path. Files that are not records are left out.
 * @param {{ path: string; oid: string; text: string }[]} files
 * @param {string} folder
 * @returns {StoredRecord[]}
 */
export function recordsIn(files, folder) {
  const out = [];
  for (const file of files) {
    if (!isRecordPath(file.path, folder)) continue;
    const record = parseRecord(file.text);
    if (record) out.push({ path: file.path, oid: file.oid, record });
  }
  return byPath(out);
}

/**
 * The problems in the record files directly in a folder. Paths are compared and returned with `/`.
 * `shape`: not a record. `overlap`: a slug is both chosen and removed. `duplicate`: a later record has the same address.
 * @param {{ path: string; text: string }[]} files
 * @param {string} folder
 * @returns {RecordProblem[]}
 */
export function recordProblems(files, folder) {
  /** @type {RecordProblem[]} */
  const problems = [];
  /** @type {{ path: string; record: FileRecord }[]} */
  const valid = [];
  for (const file of files) {
    const path = file.path.replace(/\\/g, '/');
    if (!isRecordPath(path, folder)) continue;
    const record = parseRecord(file.text);
    if (!record) {
      problems.push({ path, problem: 'shape' });
      continue;
    }
    const both = record.categories.find((tag) => record.removed.includes(tag));
    if (both !== undefined) problems.push({ path, problem: 'overlap', value: both });
    valid.push({ path, record });
  }
  /** @type {Set<string>} */
  const seen = new Set();
  for (const { path, record } of byPath(valid)) {
    if (seen.has(record.src)) problems.push({ path, problem: 'duplicate', value: record.src });
    seen.add(record.src);
  }
  return problems;
}

/**
 * The record of a file address, or undefined.
 * @param {StoredRecord[]} records
 * @param {string} src
 * @returns {StoredRecord | undefined}
 */
export function recordFor(records, src) {
  return records.find((stored) => stored.record.src === src);
}

/**
 * The path of a record file.
 * @param {string} folder
 * @param {string} id
 * @returns {string}
 */
export function recordPath(folder, id) {
  return `${folder}/${id}.json`;
}

/**
 * A new record id: 8 characters from a-z and 0-9, not in `taken`.
 * @param {ReadonlySet<string>} taken
 * @param {() => number} [random]
 * @returns {string}
 */
export function newRecordId(taken, random = Math.random) {
  for (;;) {
    let id = '';
    for (let i = 0; i < 8; i++) id += ALPHABET[Math.floor(random() * ALPHABET.length)];
    if (!taken.has(id)) return id;
  }
}

/**
 * The text of a record file: keys in order, 2-space JSON, newline at the end.
 * @param {FileRecord} record
 * @returns {string}
 */
export function recordText(record) {
  return `${JSON.stringify({ src: record.src, categories: record.categories, removed: record.removed }, null, 2)}\n`;
}

/** @param {string} path */
const idOf = (path) => path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '');

/**
 * The changes that bring the records to the updated ones: delete when empty, update when the text differs,
 * create under a new id when there was no record.
 * @param {StoredRecord[]} records
 * @param {string} folder
 * @param {{ src: string; next: FileRecord }[]} updates
 * @param {() => number} [random]
 * @returns {RecordChange[]}
 */
export function writeRecords(records, folder, updates, random = Math.random) {
  const taken = new Set(records.map((stored) => idOf(stored.path)));
  /** @type {RecordChange[]} */
  const changes = [];
  for (const { src, next } of updates) {
    const existing = recordFor(records, src);
    if (existing) {
      if (isEmpty(next)) {
        changes.push({ path: existing.path, content: null, oid: existing.oid });
        continue;
      }
      const content = recordText(next);
      if (content !== recordText(existing.record)) changes.push({ path: existing.path, content, oid: existing.oid });
    } else if (!isEmpty(next)) {
      const id = newRecordId(taken, random);
      taken.add(id);
      changes.push({ path: recordPath(folder, id), content: recordText(next), oid: null });
    }
  }
  return changes;
}

/**
 * The change that moves a record to a new file address (same file, same id), or null when there is no record.
 * @param {StoredRecord[]} records
 * @param {string} from
 * @param {string} to
 * @returns {RecordChange | null}
 */
export function renameRecord(records, from, to) {
  const existing = recordFor(records, from);
  if (!existing) return null;
  return { path: existing.path, content: recordText({ ...existing.record, src: to }), oid: existing.oid };
}

/**
 * The change that deletes the record of a file address, or null when there is no record.
 * @param {StoredRecord[]} records
 * @param {string} src
 * @returns {RecordChange | null}
 */
export function deleteRecord(records, src) {
  const existing = recordFor(records, src);
  if (!existing) return null;
  return { path: existing.path, content: null, oid: existing.oid };
}

/**
 * The deleted entry that holds the record of a deleted file: its text is a record for `src` and it was deleted at `at`.
 * Null when a live record already has `src`, or when no entry matches.
 * @template {{ path: string; text: string; at: Date | string }} D
 * @param {string} src
 * @param {Date | string} at
 * @param {D[]} deleted
 * @param {StoredRecord[]} live
 * @returns {D | null}
 */
export function deletedRecordFor(src, at, deleted, live) {
  if (recordFor(live, src)) return null;
  const instant = +new Date(at);
  return deleted.find((entry) => +new Date(entry.at) === instant && parseRecord(entry.text)?.src === src) ?? null;
}
