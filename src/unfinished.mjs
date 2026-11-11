// The pages and posts that are not finished: drafts, scheduled ones and published ones with changes waiting, in the order the start screen's
// "Unfinished" widget lists them. Exposes `unfinishedOf`. Depends on lib/notice.mjs.
import { untilTime } from '../lib/notice.mjs';

/** @typedef {import('./entries.mjs').Entry} Entry */
/** @typedef {{ path: string; collection: string; title: string; status: Entry['status'] | 'waiting'; at: number | null }} UnfinishedRow */

/** Scheduled entries first by date (one with a missing or bad publishAt after the dated ones, without a date), then
 * drafts, then published pages with changes waiting (`waiting`, with the time they go live when they have one); by title within a group.
 * @param {Entry[]} entries
 * @returns {UnfinishedRow[]} */
export function unfinishedOf(entries) {
  /** @type {UnfinishedRow[]} */
  const rows = entries.flatMap((e) =>
    e.status === 'published'
      ? e.waiting
        ? [
            {
              path: e.path,
              collection: e.collection,
              title: e.title,
              status: /** @type {const} */ ('waiting'),
              at: untilTime(e.waiting.publishAt ?? ''),
            },
          ]
        : []
      : [
          {
            path: e.path,
            collection: e.collection,
            title: e.title,
            status: e.status,
            at: e.status === 'scheduled' ? untilTime(e.publishAt ?? '') : null,
          },
        ],
  );
  const group = (/** @type {UnfinishedRow} */ r) =>
    r.status === 'scheduled' ? (r.at === null ? 1 : 0) : r.status === 'waiting' ? (r.at === null ? 4 : 3) : 2;
  return rows.sort((a, b) => group(a) - group(b) || (a.at ?? 0) - (b.at ?? 0) || a.title.localeCompare(b.title));
}
