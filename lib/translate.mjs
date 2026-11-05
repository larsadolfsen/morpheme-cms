// The text lookup of the editor: a dictionary maps a text as written to its translation.
// Exposes translate, joinDictionaries. Pure: no packages, no file access.

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
 * The dictionary for one language while the standard parts move to English: the standard parts' dictionary
 * (English to the language it translates into) when `language` is that language, then the own dictionaries (the apps'
 * and the site's texts for `language`; Danish to English for en-US). A later dictionary wins over an earlier one. A
 * text with no entry is shown as written.
 * @param {string} language The language the dictionary is for.
 * @param {{ language: string, dictionary: Record<string, string> }} standard The standard parts' dictionary and the language it translates into.
 * @param {...(Record<string, string> | undefined)} own
 * @returns {Record<string, string>}
 */
export function joinDictionaries(language, standard, ...own) {
  return Object.assign({}, language === standard.language ? standard.dictionary : {}, ...own);
}
