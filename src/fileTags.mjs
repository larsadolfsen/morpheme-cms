// The tags of one file in Filer and how they change: its own tags and the tags removed from it.
// A page's tags reach the file only when it is inserted (tagsFor). Pure; used by fileRecords.mjs and MediaTags.tsx.
/**
 * @typedef {{ name: string; url: string; source: string }} FileCredit Who an image is credited to: the photographer, their page and the source it came from (an app's media provider).
 * @typedef {{ src: string; categories: string[]; removed: string[]; credit?: FileCredit }} FileRecord
 */

/** @param {unknown[]} list */
const unique = (list) => [...new Set(list.map(String))];

/**
 * A record with no tags for a file.
 * @param {string} src
 * @returns {FileRecord}
 */
export function emptyRecord(src) {
  return { src, categories: [], removed: [] };
}

/**
 * The tags of a file: its own tags first, then the page's tags that were not removed from it.
 * @param {FileRecord | undefined} record
 * @param {string[]} pageTags
 * @returns {string[]}
 */
export function tagsFor(record, pageTags) {
  const removed = record?.removed ?? [];
  const out = unique(record?.categories ?? []);
  for (const tag of unique(pageTags)) {
    if (!removed.includes(tag) && !out.includes(tag)) out.push(tag);
  }
  return out;
}

/**
 * The record with a tag added; the tag leaves `removed`.
 * @param {FileRecord | undefined} record
 * @param {string} src
 * @param {string} tag
 * @returns {FileRecord}
 */
export function addTag(record, src, tag) {
  const categories = record?.categories ?? [];
  return {
    src,
    categories: categories.includes(tag) ? [...categories] : [...categories, tag],
    removed: (record?.removed ?? []).filter((t) => t !== tag),
    ...creditOf(record),
  };
}

/**
 * The record with a tag removed; the tag goes to `removed`.
 * @param {FileRecord | undefined} record
 * @param {string} src
 * @param {string} tag
 * @returns {FileRecord}
 */
export function removeTag(record, src, tag) {
  const removed = record?.removed ?? [];
  return {
    src,
    categories: (record?.categories ?? []).filter((t) => t !== tag),
    removed: removed.includes(tag) ? [...removed] : [...removed, tag],
    ...creditOf(record),
  };
}

/**
 * The record with exactly these tags, in this order. Tags that leave are removed; tags that arrive are added.
 * @param {FileRecord | undefined} record
 * @param {string} src
 * @param {string[]} next
 * @returns {FileRecord}
 */
export function setTags(record, src, next) {
  let current = record ?? emptyRecord(src);
  for (const tag of current.categories) {
    if (!next.includes(tag)) current = removeTag(current, src, tag);
  }
  for (const tag of next) current = addTag(current, src, tag);
  return { src, categories: unique(next), removed: [...current.removed], ...creditOf(record) };
}

/**
 * The record with its tags set to the page's tags (those not removed); `removed` is kept.
 * @param {FileRecord | undefined} record
 * @param {string} src
 * @param {string[]} pageTags
 * @returns {FileRecord}
 */
export function inherit(record, src, pageTags) {
  return { src, categories: tagsFor(record, pageTags), removed: [...(record?.removed ?? [])], ...creditOf(record) };
}

/** The credit of a record as a spreadable part, so a change to the tags keeps it. @param {FileRecord | undefined} record */
const creditOf = (record) => (record?.credit ? { credit: { ...record.credit } } : {});

/**
 * The record with a credit: who made the image, as the source gave it.
 * @param {FileRecord | undefined} record
 * @param {string} src
 * @param {FileCredit} credit
 * @returns {FileRecord}
 */
export function withCredit(record, src, credit) {
  return { ...(record ?? emptyRecord(src)), src, credit: { name: credit.name, url: credit.url, source: credit.source } };
}

/**
 * True when the record holds no tags, no removed tags and no credit.
 * @param {FileRecord} record
 * @returns {boolean}
 */
export function isEmpty(record) {
  return record.categories.length === 0 && record.removed.length === 0 && !record.credit;
}
