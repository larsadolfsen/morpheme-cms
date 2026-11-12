// How an icon name that is not on the site's list is found in Material Symbols (Outlined, `@material-symbols/svg-400`):
// the name as Material writes it, and the order an icon is looked for in (the list, then Material, then MISSING).
// Pure functions, so they are tested (materialIcon.test.mjs); the files themselves are looked up by the caller (icon.tsx).

/** A name as Material Symbols writes it (`drag_indicator`): lower case letters, digits and `_`, a hyphen read as an
 * underscore (`drag-indicator`). undefined for a name that cannot be a Material file (so it never reaches a path).
 * @param {string} name @returns {string | undefined} */
export function materialName(name) {
  return /^[a-z0-9_-]+$/.test(name) ? name.replaceAll('-', '_') : undefined;
}

/** What an icon asked for is drawn from, in order: the list's file (for `fill`: the list's filled one, else its regular
 * one), else Material's (for `fill`: Material's filled one, else its regular one), else nothing (MISSING).
 * `material` is undefined while Material's set is not loaded yet: `pending` when the list has none.
 * @param {string} name
 * @param {'fill' | undefined} weight
 * @param {{ list: (name: string, weight?: 'fill') => string | undefined, material: ((key: string) => string | undefined) | undefined }} lookup
 *   `material` is asked for `<name>` and `<name>-fill` (a Material name, see materialName).
 * @returns {{ file?: string, fallback?: string, pending?: boolean }}
 *   `fallback`: the name asked for, when the file is Material's. */
export function resolveIcon(name, weight, { list, material }) {
  const own = (weight ? list(name, weight) : undefined) ?? list(name);
  if (own) return { file: own };
  const key = materialName(name);
  if (!key) return {};
  if (!material) return { pending: true };
  const file = (weight ? material(`${key}-fill`) : undefined) ?? material(key);
  return file ? { file, fallback: name } : {};
}

/** The names of the icons in Material Symbols' set, from its files' paths (`…/outlined/<name>.svg`), sorted, without the
 * filled ones (`<name>-fill`: a picked icon is stored by its plain name).
 * @param {string[]} paths @returns {string[]} */
export function materialNames(paths) {
  const names = [];
  for (const path of paths) {
    const name = path.slice(path.lastIndexOf('/') + 1).replace(/\.svg$/, '');
    if (!name.endsWith('-fill') && materialName(name)) names.push(name);
  }
  return names.sort();
}

/** The names that match what is typed: every word of it is in the name (`arrow back` finds `arrow_back_ios`), the names that
 * start with the first word first. Nothing for an empty search.
 * @param {string[]} names @param {string} query @returns {string[]} */
export function searchIconNames(names, query) {
  const words = query
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean);
  if (!words.length) return [];
  const hits = names.filter((name) => words.every((w) => name.includes(w)));
  const first = (name) => (name.startsWith(words[0]) ? 0 : 1);
  return hits.sort((a, b) => first(a) - first(b));
}

/** A name to read, for a tile's name: `drag_indicator` → `drag indicator`. @param {string} name */
export const iconLabel = (name) => name.replace(/[_-]+/g, ' ');
