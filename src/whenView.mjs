/**
 * The logic of `when` (src/when.ts), with no i18n of its own: which day word or date and which time a moment gets.
 * Exposes `whenParts`. Depends on nothing.
 */

/**
 * `{ today, shown, dated, time }` for `date` as seen from `now`: `shown` is "today", "yesterday" or the date; `dated` is the date
 * ("Oct 1", with the year in another year); `time` is "1:42 PM". `short` is what the start screen's top bar says: only the
 * time today, only the date on another day, never a day word and never "at", so it fits a 375 px bar.
 */
export function whenParts(date, locale, words, now = new Date()) {
  const day = (d) => d.toLocaleDateString('sv');
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const dated = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
  const isToday = day(date) === day(now);
  const shown = isToday ? words.today : day(date) === day(yesterday) ? words.yesterday : dated;
  const time = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  return { today: isToday, shown, dated, time, short: isToday ? time : dated };
}
