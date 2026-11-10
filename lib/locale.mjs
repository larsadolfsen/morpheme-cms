// Plans how a language layer (i18n/<code>/) is laid over a site, for scripts/locale.mjs.
// Exposes layerPlan.
// Pure: no packages, no file access.

/**
 * Plans the layer for a language code: a layer file replaces the file at the same path, and a layer file `<path>.remove` removes `<path>`.
 * @param {string[]} files Paths relative to the site's root, with forward slashes.
 * @param {string} code For example 'da-DK'.
 * @returns {{ copy: [string, string][], remove: string[] }}
 */
export function layerPlan(files, code) {
  const prefix = `i18n/${code}/`;
  const copy = [];
  const remove = [];
  for (const file of files) {
    if (!file.startsWith(prefix) || file.length === prefix.length) continue;
    const path = file.slice(prefix.length);
    if (path.endsWith('.remove')) remove.push(path.slice(0, -'.remove'.length));
    else copy.push([file, path]);
  }
  return { copy, remove };
}
