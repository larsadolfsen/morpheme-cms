// What the lists with headings between their entries share (Filer, Media.tsx; the lists,
// Library.tsx; Apps, AppList.tsx): the entries under their headings, and the names of the headings, a
// month or a letter. The sheet from the bottom and its parts are in ui.tsx.
import { locale, t } from './i18n';

/** How many entries a list has before it gets headings between them; fewer are one group. */
export const HEADINGS_FROM = 7;

/** The entries, in their order, under a heading each time their key (a letter, a month) changes; with
 * fewer than HEADINGS_FROM, one group without a heading (key null). */
export function headed<T>(items: T[], keyOf: (item: T) => string): { key: string | null; items: T[] }[] {
  if (items.length < HEADINGS_FROM) return items.length ? [{ key: null, items }] : [];
  return items.reduce<{ key: string | null; items: T[] }[]>((all, item) => {
    const key = keyOf(item);
    if (all.at(-1)?.key === key) all.at(-1)!.items.push(item);
    else all.push({ key, items: [item] });
    return all;
  }, []);
}

/** The first letter of a name, for the headings when sorted by name; the names that start with a digit together. */
export const letterOf = (name: string) => {
  // Its first letter or digit (not a quotation mark before it).
  const first = /[\p{L}\p{N}]/u.exec(name)?.[0].toUpperCase() ?? '';
  return /\d/.test(first) ? '0–9' : first;
};

/** A month ("2025-06") as "Juni 2025" (in the editor's language), or a year alone. */
export function dateName(key: string) {
  if (!key) return t.common.noDate;
  const [year, month] = key.split('-');
  if (!month) return year;
  const name = new Date(Number(year), Number(month) - 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return name[0].toLocaleUpperCase(locale) + name.slice(1);
}
