// The tags a file gets when it is newly used in a page or post (EntryForm.tsx, at "Save"): every Files file the saved page refers to and its last saved version did not gets the page's tags,
// except those removed from the file before (tagsFor), saved in the same commit as the page. Pure, so node --test can run it.

import { inherit } from './fileTags.mjs';
import { recordFor, writeRecords } from './fileRecords.mjs';

/**
 * @typedef {import('./fileRecords.mjs').StoredRecord} StoredRecord
 * @typedef {import('./fileRecords.mjs').RecordChange} RecordChange
 */

/**
 * @param {string} text
 * @param {Iterable<string>} srcs
 * @returns {string[]}
 */
export function filesIn(text, srcs) {
  const results = [];
  for (const src of srcs) {
    if (results.includes(src)) continue;
    const escaped = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}(?![\\w.-])`);
    if (regex.test(text)) {
      results.push(src);
    }
  }
  return results;
}

/**
 * @param {string} before
 * @param {string} after
 * @param {Iterable<string>} srcs
 * @returns {string[]}
 */
export function newlyUsed(before, after, srcs) {
  const srcArray = Array.from(srcs);
  const beforeSet = new Set(filesIn(before, srcArray));
  return filesIn(after, srcArray).filter((src) => !beforeSet.has(src));
}

/**
 * @param {StoredRecord[]} records
 * @param {string} folder
 * @param {string[]} srcs
 * @param {string[]} pageTags
 * @param {() => number} [random]
 * @returns {RecordChange[]}
 */
export function autoTagChanges(records, folder, srcs, pageTags, random) {
  if (pageTags.length === 0 || srcs.length === 0) {
    return [];
  }

  const updates = [];
  const seen = new Set();
  for (const src of srcs) {
    if (seen.has(src)) continue;
    seen.add(src);
    const record = recordFor(records, src);
    updates.push({ src, next: inherit(record?.record, src, pageTags) });
  }

  if (random) {
    return writeRecords(records, folder, updates, random);
  }
  return writeRecords(records, folder, updates);
}
