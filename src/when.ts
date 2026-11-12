import { locale, t } from './i18n';

// "today at 1:42 PM", "yesterday at 9:05 AM", "Oct 1 at 1:42 PM" or, another year, "Oct 1, 2023 at 1:42 PM";
// in the editor's language. `short`: only the time today ("1:42 PM").
export function when(date: Date, { short = false } = {}) {
  const day = (d: Date) => d.toLocaleDateString('sv');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const shown =
    day(date) === day(new Date())
      ? t.common.today
      : day(date) === day(yesterday)
        ? t.common.yesterday
        : date.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
          });
  const time = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  if (short && shown === t.common.today) return time;
  return t.common.at(shown, time);
}

// "2023-10-01" as "Oct 1, 2023" (in the editor's language); anything else as it is.
export const shortDate = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T12:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : iso;
