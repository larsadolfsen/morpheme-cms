// The editor's language: its own texts (the buttons, the messages, the lines on the cards) and how it
// writes dates, numbers and sorts, in one language, by its code with the country (BCP 47: da-DK,
// en-US), used as it is with Intl. The language is the one picked on "Konto", else the browser's (the
// same code, else the same language: en-GB is en-US), else the site's (config.locale). Picked once when
// the editor opens; a new choice reloads it (setLocale). Away from a browser (the check before the
// build, checkSite.ts) it is the site's.
// What is the site's own (src/site/, src/apps/<app>/blocks/: the fields, the start screen's groups, the blocks'
// names) is written in the site's language, and shown in the editor's by the site's own texts
// (siteText, @site/texts). The blocks' drawings and the commits (siteT) stay in the site's
// language, so the site looks as it is, and the history is in one language, whoever saved.
// A value the editor writes into content (a default text) is in the site's language too (inSiteLanguage).
// While the standard parts move to English (docs/superpowers/plans/2026-11-04-english-source.md), the dictionary of a
// language joins the standard parts' English -> Danish dictionary (defaults/i18n/da-DK/, for da-DK) with the apps' and the
// site's own texts for it (joinDictionaries, lib/translate.mjs).
// A language is a folder with the texts by the part of the editor they are in (en-US/index.ts). English is the
// reference: its texts are written first (Messages is its type), and every other language translates them; a new
// one is a copy of da-DK with its texts translated from en-US, added to `messages`. TypeScript says when a
// translation is missing.
import { config } from '@site/config';
import { appTexts as appFiles, texts } from '@site/texts';
import { daDK } from './da-DK';
import { enUS, type Messages } from './en-US';
import { defaultsDaDK } from '../../defaults/i18n/da-DK';
import { joinDictionaries, translate } from '../../lib/translate.mjs';

export type { Messages };

export const messages = { 'da-DK': daDK, 'en-US': enUS } satisfies Record<string, Messages>;
export type Locale = keyof typeof messages;
export const locales = Object.keys(messages) as Locale[];

/** A code as it is written ("da-dk" as "da-DK"), or undefined when it is not one. */
function canonical(code: string): string | undefined {
  try {
    return Intl.getCanonicalLocales(code)[0];
  } catch {
    return undefined;
  }
}

const language = (code: string) => code.split('-')[0];

/** The editor's language for codes, the first that fits: the same code, else the same language. */
export function matchLocale(codes: readonly (string | null | undefined)[]): Locale | undefined {
  const known = codes.flatMap((c) => (c && canonical(c)) || []);
  return (
    known.map((c) => locales.find((l) => l === c)).find(Boolean) ??
    known.map((c) => locales.find((l) => language(l) === language(c))).find(Boolean)
  );
}

/** The site's language, for what is the site's (the commits); da-DK when the editor does not have it. */
export const siteLocale: Locale = matchLocale([config.locale]) ?? 'da-DK';

const KEY = 'editor-locale';
const inBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

/** The language picked on "Konto" in this browser, or 'auto' (the browser's, else the site's). */
export function savedLocale(): Locale | 'auto' {
  try {
    return matchLocale([localStorage.getItem(KEY)]) ?? 'auto';
  } catch {
    return 'auto';
  }
}

/** Picks the language in this browser ('auto': none) and opens the editor again in it. */
export function setLocale(pick: Locale | 'auto') {
  try {
    if (pick === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pick);
  } catch {}
  location.reload();
}

/** The language the browser asks for, when the editor has it. */
export const browserLocale = (): Locale | undefined => (inBrowser ? matchLocale(navigator.languages ?? [navigator.language]) : undefined);

const saved = inBrowser ? savedLocale() : 'auto';

/** The editor's language, and its texts. */
export const locale: Locale = (saved !== 'auto' && saved) || browserLocale() || siteLocale;
export const t: Messages = messages[locale];

/** The texts in the site's language: the commits. */
export const siteT: Messages = messages[siteLocale];

/** The language the package's standard parts (defaults/) are written in, whatever the site's language is. */
export const DEFAULTS_LOCALE: Locale = 'da-DK';

/** The standard parts' dictionary: English text -> Danish (defaults/i18n/da-DK/), for the Danish editor and a Danish site. */
const standard = { language: 'da-DK', dictionary: defaultsDaDK };

/** Whether the site's own texts (written in the site's language) or the package's standard parts (written in
 * DEFAULTS_LOCALE) may be shown in another language than they are written in. Until the standard parts are all English
 * (Task 2.5), the converted ones are English although DEFAULTS_LOCALE is da-DK: they need the Danish dictionary. */
export const translatingSite = locale !== siteLocale || locale !== DEFAULTS_LOCALE || Object.keys(defaultsDaDK).length > 0;

/** The site's own texts in the editor's other languages: by language, by the text as it is written. */
export type Texts = Partial<Record<string, Record<string, string>>>;

/** The texts of each app and its blocks (src/apps/<app>/texts.ts, blocks/<type>/texts.ts), by the app's id or
 * by "blocks/" and the block's type (an app and its block can have the same name, as MobilePay's). */
export const appTexts: Record<string, Texts> = Object.fromEntries(
  Object.entries(appFiles).map(([path, m]) => {
    const [folder, name] = path.split('/').slice(-3, -1);
    return [folder === 'blocks' ? `blocks/${name}` : name!, m.texts];
  }),
);

const own = joinDictionaries(locale, standard, ...Object.values(appTexts).map((a) => a[locale]), (texts as Texts)[locale]);

/** One of the site's own texts (src/site/, src/themes/<theme>/blocks/, src/apps/), written in the site's language, in the editor's:
 * its translation in @site/texts or in a block's texts.ts, else as it is written. `values` fill in
 * its {name}s, after. */
export function siteText(text: string, values?: Record<string, string | number>): string {
  return translate(own, text, values);
}

const inSite = joinDictionaries(siteLocale, standard, ...Object.values(appTexts).map((a) => a[siteLocale]), (texts as Texts)[siteLocale]);

/** A text of the package's standard parts (written in DEFAULTS_LOCALE) in the site's language, for a value that the
 * editor writes into content (a default button text): its translation in @site/texts or in a block's texts.ts, else
 * as it is written. `values` fill in its {name}s, after. Not the editor's language: content is in the site's
 * language, whoever saves. */
export function inSiteLanguage(text: string, values?: Record<string, string | number>): string {
  return translate(inSite, text, values);
}

/** A language by its own name ("Dansk (Danmark)", "English (United States)"), or by its name in another
 * (`inLanguage`: "Danish (Denmark)" in en-US). */
export function localeName(code: Locale, inLanguage: Locale = code): string {
  try {
    const name = new Intl.DisplayNames([inLanguage], { type: 'language', languageDisplay: 'standard' }).of(code) ?? code;
    return name.charAt(0).toLocaleUpperCase(inLanguage) + name.slice(1);
  } catch {
    return code;
  }
}

if (typeof document !== 'undefined') document.documentElement.lang = locale;
