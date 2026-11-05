// The tags of one file in Filer and how they change: its own tags and the tags removed from it.
// A page's tags reach the file only when it is inserted (tagsFor). Pure; used by fileRecords.mjs and MediaTags.tsx.
/**
 * @typedef {{ src: string; categories: string[]; removed: string[] }} FileRecord
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
  return { src, categories: unique(next), removed: [...current.removed] };
}

/**
 * The record with its tags set to the page's tags (those not removed); `removed` is kept.
 * @param {FileRecord | undefined} record
 * @param {string} src
 * @param {string[]} pageTags
 * @returns {FileRecord}
 */
export function inherit(record, src, pageTags) {
  return { src, categories: tagsFor(record, pageTags), removed: [...(record?.removed ?? [])] };
}

/**
 * True when the record holds no tags and no removed tags.
 * @param {FileRecord} record
 * @returns {boolean}
 */
export function isEmpty(record) {
  return record.categories.length === 0 && record.removed.length === 0;
}
