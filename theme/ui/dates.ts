// Days and times as the date and time pickers (DatePicker.tsx, TimePicker.tsx and their scripts) hold them: a day as a
// form saves it (ISO, 2026-11-02), a month as its first day's year and month (2026-11), and a time of day as hh:mm
// (24-hour). Written out and read back in a language (`locale`, BCP 47: the site's on the site), with Intl, so the
// names of the months and the weekdays, the order of day, month and year and the week's first day are the language's
// (in Danish: 02.11.2026, november, man., the week from Monday). No React and no texts here: the scripts load it at once.

const pad = (n: number) => String(n).padStart(2, '0');

/** A day (2026-11-02) as a date at noon, so no change of time moves it a day; null when it is not one. */
export function dateOf(day: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

/** A date's day, as a form saves it (2026-11-02). */
export const dayOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Today, as a day. */
export const today = () => dayOf(new Date());

/** The month a day is in (2026-11). */
export const monthOfDay = (day: string) => day.slice(0, 7);

/** A month (2026-11) moved by a number of months. */
export function addMonths(month: string, months: number): string {
  const [y, m] = month.split('-').map(Number);
  return dayOf(new Date(y, m - 1 + months, 1, 12)).slice(0, 7);
}

/** A day moved by a number of days. */
export function addDays(day: string, days: number): string {
  const d = dateOf(day)!;
  d.setDate(d.getDate() + days);
  return dayOf(d);
}

/** A day moved by a number of months, on the same day of the month or, in a shorter month, its last. */
export function addMonthsToDay(day: string, months: number): string {
  const d = dateOf(day)!;
  const month = addMonths(monthOfDay(day), months);
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${month}-${pad(Math.min(d.getDate(), last))}`;
}

/** A day within the days that can be picked (`min` and `max`, either of them '' for none). */
export const clampDay = (day: string, min = '', max = '') => (min && day < min ? min : max && day > max ? max : day);

/** The day a week starts with in a language (1 Monday … 7 Sunday), where Intl knows it; else Monday. */
export function weekStart(locale: string): number {
  try {
    const l = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
    return (l.getWeekInfo?.() ?? l.weekInfo)?.firstDay ?? 1;
  } catch {
    return 1;
  }
}

/** A month's weeks, each seven days from the week's first day: a day, or '' for the days of the months before and
 * after. */
export function weeksOf(month: string, locale: string): string[][] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1, 12);
  const lead = (first.getDay() - (weekStart(locale) % 7) + 7) % 7;
  const length = new Date(y, m, 0).getDate();
  const cells = [...Array.from({ length: lead }, () => ''), ...Array.from({ length }, (_, i) => `${month}-${pad(i + 1)}`)];
  while (cells.length % 7) cells.push('');
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

/** The weekdays from the one the week starts with, each its short and its full name (M and mandag). */
export function weekdaysOf(locale: string): { short: string; long: string }[] {
  const start = weekStart(locale);
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, ((start - 1 + i) % 7) + 1, 12);
    return { short: d.toLocaleDateString(locale, { weekday: 'narrow' }), long: d.toLocaleDateString(locale, { weekday: 'long' }) };
  });
}

const firstUp = (text: string, locale: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

/** A month's name and year (November 2026), its name alone (November), or its short name (nov.). */
export function monthName(month: string, locale: string, style: 'year' | 'long' | 'short' = 'year'): string {
  const d = dateOf(`${month}-01`)!;
  return firstUp(
    style === 'year' ? d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : d.toLocaleDateString(locale, { month: style }),
    locale,
  );
}

/** A day written out in full (mandag 2. november 2026), for screen readers. */
export const dayName = (day: string, locale: string) =>
  dateOf(day)!.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** A day written short (Man. 2. nov.), as a date picker's headline. */
export const dayHeadline = (day: string, locale: string) =>
  firstUp(dateOf(day)!.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }), locale);

/** A day as it is typed in a field, in the language's order (02.11.2026). */
export const dayTyped = (day: string, locale: string) =>
  dateOf(day)!.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

/** A day typed in a field, in the language's order of day, month and year (2.11.2026, 02-11-2026), as a day; null
 * when it is not one. */
export function dayFromTyped(text: string, locale: string): string | null {
  const numbers = text.match(/\d+/g);
  if (!numbers || numbers.length !== 3 || text.replace(/[\d\s./-]/g, '')) return null;
  const order = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    .formatToParts(new Date(2024, 0, 1, 12))
    .map((p) => p.type)
    .filter((t) => t === 'day' || t === 'month' || t === 'year');
  const value = Object.fromEntries(order.map((t, i) => [t, numbers[i]]));
  if (value.year?.length !== 4) return null;
  const day = `${value.year}-${pad(Number(value.month))}-${pad(Number(value.day))}`;
  return dateOf(day) ? day : null;
}

/** Days typed in a field, one or two (02.11.2026 – 08.11.2026), each a day or null. */
export function daysFromTyped(text: string, locale: string): (string | null)[] {
  return text
    .split(/\s[–-]\s|\s*–\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => dayFromTyped(part, locale));
}

/** A time of day (14:05) as hours and minutes; null when it is not one. */
export function timeOf(time: string): { hour: number; minute: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

/** Hours and minutes as a form saves them (14:05). */
export const timeString = (hour: number, minute: number) => `${pad(hour)}:${pad(minute)}`;

/** Two digits (05). */
export const twoDigits = pad;

/** A time of day as the language writes it, 24-hour (14.05 in Danish), or on a 12-hour clock (`twelve`: 2.05 PM). */
export const timeTyped = (time: string, locale: string, twelve = false) => {
  const t = timeOf(time)!;
  return new Date(2024, 0, 1, t.hour, t.minute).toLocaleTimeString(
    locale,
    twelve ? { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' } : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  );
};

/** What the language calls the morning and the afternoon on a 12-hour clock (AM and PM). */
export const dayPeriods = (locale: string): [string, string] =>
  [9, 21].map(
    (hour) =>
      new Intl.DateTimeFormat(locale, { hour: 'numeric', hourCycle: 'h12' })
        .formatToParts(new Date(2024, 0, 1, hour))
        .find((p) => p.type === 'dayPeriod')?.value ?? (hour < 12 ? 'AM' : 'PM'),
  ) as [string, string];

/** What the language writes between the hours and the minutes (. in Danish). */
export const timeSeparator = (locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(2024, 0, 1, 14, 5))
    .find((p) => p.type === 'literal')
    ?.value.trim() || ':';

/** A time typed in a field (14.05, 14:05, 1405, 9.30; with `periods`, the language's AM and PM, also 2.05 PM or
 * 2:05 pm, the hour 1–12), as a time; null when it is not one. */
export function timeFromTyped(text: string, periods?: [string, string]): string | null {
  const m = /^\s*(\d{1,2})\s*[.:\s]?\s*(\d{2})\s*(\S*)\s*$/.exec(text);
  if (!m) return null;
  let hour = Number(m[1]);
  const said = m[3].toLowerCase().replace(/\./g, '');
  if (said) {
    const at = (periods ?? ['AM', 'PM']).findIndex((p) => p.toLowerCase().replace(/\./g, '') === said);
    const pm = at >= 0 ? at === 1 : said === 'pm' || said === 'p' ? true : said === 'am' || said === 'a' ? false : null;
    if (pm === null || !periods || hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (pm ? 12 : 0);
  }
  const time = timeString(hour, Number(m[2]));
  return timeOf(time) ? time : null;
}
