// A message of the Worker that the owner reads (a sign-in error, a commit message) in the site's language: the English text is the key.
// Exposes say, langOf. Depends on lib/translate.mjs and worker/i18n/da-DK.js.
import { translate } from '../lib/translate.mjs';
import { daDK } from './i18n/da-DK.js';

/**
 * The text in the locale: its Danish entry for 'da-DK', else the English text. Then fills each {name} from `values`.
 * @param {string | undefined} locale The site's locale (`config.locale`).
 * @param {string} text The English text.
 * @param {Record<string, string | number>} [values]
 * @returns {string}
 */
export function say(locale, text, values) {
  return translate(locale === 'da-DK' ? daDK : undefined, text, values);
}

/** The language of a locale for a `lang` attribute: 'da' for 'da-DK'. @param {string | undefined} locale */
export const langOf = (locale) => String(locale ?? 'en-US').split('-')[0];
