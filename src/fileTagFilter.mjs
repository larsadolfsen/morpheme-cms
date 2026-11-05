// Filer's filter by tag (Gallery in Media.tsx): each file's own tags from its record, the tags the filter offers (only those some file has), and the files with a tag.
// Pure, so node --test can run it. Uses the StoredRecord type from fileRecords.mjs.
/**
 * @typedef {import('./fileRecords.mjs').StoredRecord} StoredRecord
 */

/**
 * The tags of each file, keyed by file address (src). Records with no tags are left out.
 * @param {StoredRecord[]} records
 * @returns {Map<string, string[]>}
 */
export function tagIndex(records) {
  const index = new Map();
  for (const stored of records) {
    if (stored.record.categories.length > 0) index.set(stored.record.src, [...stored.record.categories]);
  }
  return index;
}

/**
 * The filter's choices: the tags (in their order) that some file in the index has, plus the chosen tag when it is among the tags.
 * @template {{ value: string; label: string }} O
 * @param {Map<string, string[]>} index
 * @param {O[]} tags
 * @param {string} chosen
 * @returns {O[]}
 */
export function tagFilterOptions(index, tags, chosen) {
  const used = new Set();
  for (const list of index.values()) for (const tag of list) used.add(tag);
  return tags.filter((option) => used.has(option.value) || option.value === chosen);
}

/**
 * The files that have a tag, in their order. With an empty tag, all files are kept.
 * @param {string[]} srcs
 * @param {Map<string, string[]>} index
 * @param {string} tag
 * @returns {string[]}
 */
export function withTag(srcs, index, tag) {
  if (tag === '') return srcs;
  return srcs.filter((src) => index.get(src)?.includes(tag) === true);
}
