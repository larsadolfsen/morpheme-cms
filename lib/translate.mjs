// The text lookup of the editor: a dictionary maps a text as written to its translation.
// Exposes translate, splitMissing, englishOf. Pure: no packages, no file access.

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

/**
 * The way back from the standard parts' Danish to their English texts (Danish text -> English text). Only the standard
 * parts' own Danish leads back to them: an app's table (its Danish text -> an English one) must not, or an app whose
 * English text equals a standard one would make its Danish text count as a standard text.
 * @param {Record<string, string>} danishOf English standard text -> its Danish.
 * @returns {Map<string, string>}
 */
export function englishOf(danishOf) {
  return new Map(Object.entries(danishOf).map(([english, danish]) => [danish, english]));
}
