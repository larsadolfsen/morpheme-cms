import { locale, t } from './i18n';
import { whenParts } from './whenView.mjs';

// "today at 1:42 PM", "yesterday at 9:05 AM", "Oct 1 at 1:42 PM" or, another year, "Oct 1, 2023 at 1:42 PM";
// in the editor's language. `short`: only the time today ("1:42 PM"), only the date on another day ("Oct 1"), never "at".
export function when(date: Date, { short = false } = {}) {
  const parts = whenParts(date, locale, t.common);
  return short ? parts.short : t.common.at(parts.shown, parts.time);
}

// "2023-10-01" as "Oct 1, 2023" (in the editor's language); anything else as it is.
export const shortDate = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T12:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : iso;
