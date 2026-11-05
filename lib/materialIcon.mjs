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
