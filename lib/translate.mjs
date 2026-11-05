// The text lookup of the editor: a dictionary maps a text as written to its translation.
// Exposes translate, splitMissing. Pure: no packages, no file access.

/**
 * Takes dictionary[text] when the dictionary has that own key, else the text. Then fills each {name} from values.
 * @param {Record<string, string> | undefined} dictionary
 * @param {string} text
 * @param {Record<string, string | number>} [values]
 * @returns {string}
 */
export function translate(dictionary, text, values) {
  const taken = dictionary && Object.hasOwn(dictionary, text) ? dictionary[text] : text;
  if (!values) return taken;
  return taken.replace(/\{(\w+)\}/g, (whole, name) => (name in values ? String(values[name]) : whole));
}

/**
 * Splits the texts that have no translation in a language: the standard parts' (English texts of
 * defaults/, whose translations the package must have: they stop the check) and the others (the site's and the apps' own).
 * @param {Iterable<string>} missing The texts with no translation.
 * @param {ReadonlySet<string>} standard The standard parts' texts (the keys of defaults/i18n/da-DK/).
 * @returns {{ standard: string[], own: string[] }}
 */
export function splitMissing(missing, standard) {
  const all = [...missing];
  return { standard: all.filter((text) => standard.has(text)), own: all.filter((text) => !standard.has(text)) };
}
