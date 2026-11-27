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

/**
 * The parts the site's own walk goes over: an app block's parts have a bucket of their own (the block's texts.ts), so a text
 * the block translates there is not asked of the site's texts.
 * @template {{ id: string }} P
 * @param {P[]} parts Every part the site shows.
 * @param {ReadonlySet<string>} appBlockIds The types of the app blocks that have shared parts.
 * @returns {P[]}
 */
export function siteWalkParts(parts, appBlockIds) {
  return parts.filter((part) => !appBlockIds.has(part.id));
}

/**
 * The texts of a walk that `own` has no translation for.
 * @param {Iterable<string>} texts
 * @param {Record<string, string>} own
 * @returns {string[]}
 */
export function lacking(texts, own) {
  return [...new Set(texts)].filter((text) => !(text in own));
}

/**
 * The one language an app's texts must have. A store app (it has a version and comes from the store) needs en-US for
 * every text. A site's own app (no store record) needs its own default language: `defaultLanguage`, else en-US.
 * @param {{ store?: unknown, defaultLanguage?: string }} app
 * @returns {string}
 */
export function appLanguage(app) {
  return app.store ? 'en-US' : app.defaultLanguage || 'en-US';
}

/**
 * Whether the untranslated-texts warning and `check:content` ask an app's texts for `locale`: only for the app's
 * default language. Every other language, da-DK included, is optional and never warned or failed.
 * @param {{ store?: unknown, defaultLanguage?: string }} app
 * @param {string} locale
 * @returns {boolean}
 */
export function appNeeds(app, locale) {
  return appLanguage(app) === locale;
}

/**
 * Whether a text is already in a language: the table has it as a key (its translation), or as a value (it is the
 * translation, so it is written in that language).
 * @param {string} text
 * @param {Record<string, string> | undefined} table The app's texts in that language.
 * @returns {boolean}
 */
export function hasIn(text, table) {
  if (!table) return false;
  if (Object.hasOwn(table, text) && String(table[text]).trim()) return true;
  return Object.values(table).includes(text);
}

/**
 * The texts of an app that lack the app's default language. A text counts as having it when it is written in it
 * (`writtenIn`) or the app's table for it has the text.
 * @param {{ store?: unknown, defaultLanguage?: string }} app
 * @param {Iterable<string>} texts
 * @param {Record<string, Record<string, string> | undefined>} tables The app's texts, by language.
 * @param {(text: string) => string} writtenIn The language a text is written in.
 * @returns {string[]}
 */
export function appLacking(app, texts, tables, writtenIn) {
  const language = appLanguage(app);
  return [...new Set(texts)].filter((text) => writtenIn(text) !== language && !hasIn(text, tables[language]));
}
