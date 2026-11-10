// The blog rhythm: when the next post is due, given the date of the last one, and which post is the last. Days are
// counted by calendar date: a post's date is a day (the front matter's `date`), kept here as that day at noon UTC, and
// "today" is the day of `now` where the person is. Exposes `nextDue`, `isDue`, `lastPostOf` and `weeksSince`.
// Depends on lib/status.mjs.
import { stateOf } from '../lib/status.mjs';

const DAY = 86400000;

/** @typedef {'week' | 'two-weeks' | 'month'} Rhythm */

/** The calendar day of a post's date ("2026-11-01", or a Date) as that day at noon UTC; NaN when it is not a date.
 * @param {string | Date} date
 * @returns {number} */
function dayOf(date) {
  if (date instanceof Date) return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], 12) : NaN;
}

/** @param {number} now @returns {number} */
const todayOf = (now) => dayOf(new Date(now));

/** The day the next post is due: a week, two weeks or a month after the last post (a month is the same day of the next
 * month, or the last day of it when that is shorter: 31 Jan is 28 Feb). An unknown rhythm is a month. A day at noon UTC.
 * @param {string | Date} lastPostDate
 * @param {string} every
 * @returns {Date} */
export function nextDue(lastPostDate, every) {
  const last = new Date(dayOf(lastPostDate));
  if (every === 'week') return new Date(last.getTime() + 7 * DAY);
  if (every === 'two-weeks') return new Date(last.getTime() + 14 * DAY);
  const lastOfNext = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 2, 0, 12)).getUTCDate();
  return new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, Math.min(last.getUTCDate(), lastOfNext), 12));
}

/** Whether the next post is due on the day of `now` or has been.
 * @param {string | Date} lastPostDate
 * @param {string} every
 * @param {number} now
 * @returns {boolean} */
export const isDue = (lastPostDate, every, now = Date.now()) => todayOf(now) >= nextDue(lastPostDate, every).getTime();

/** The date ("2026-11-01") of the newest blog post that is on the blog: published, or scheduled with its time over.
 * Drafts, hidden posts and posts scheduled for later do not count. Null when there is none.
 * @param {import('./entries.mjs').Entry[]} entries
 * @param {number} now
 * @returns {string | null} */
export function lastPostOf(entries, now = Date.now()) {
  const dates = entries
    .filter((e) => e.collection === 'blog' && e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date))
    .filter((e) => stateOf({ status: e.status, publishAt: e.publishAt }, now) === 'published')
    .map((e) => /** @type {string} */ (e.date));
  return dates.length ? dates.reduce((a, b) => (b > a ? b : a)) : null;
}

/** Whole weeks from a date to the day of `now`; never below 0.
 * @param {string | Date} date
 * @param {number} now
 * @returns {number} */
export const weeksSince = (date, now = Date.now()) => Math.max(0, Math.floor((todayOf(now) - dayOf(date)) / (7 * DAY)));
