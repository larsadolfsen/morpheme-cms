// Whether a link's text is only a vague phrase, and the list of vague phrases for a site's language.
// Exposes: isVague, vagueLinksOf. Depends on: the vagueLinks lists in i18n/da-DK and i18n/en-US (not on ./i18n, so node --test imports it; the .ts endings are what node needs).
import { vagueLinks as da } from './i18n/da-DK/vagueLinks.ts';
import { vagueLinks as en } from './i18n/en-US/vagueLinks.ts';

/** Whether `text` is only a phrase in `list` ("click here", "Read more →"), whatever the case and punctuation. */
export const isVague = (text: string, list: readonly string[]): boolean =>
  list.includes(
    text
      .replace(/^[\s\p{P}\p{S}]+|[\s\p{P}\p{S}]+$/gu, '')
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase(),
  );

/** The vague link texts of a site's locale; an unknown locale gets the da-DK list, as `siteLocale` falls back to da-DK. */
export const vagueLinksOf = (locale: string): readonly string[] => (locale === 'en-US' ? en : da);
