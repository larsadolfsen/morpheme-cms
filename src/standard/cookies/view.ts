// What "Cookie list" shows (its view, drawn by the theme's View.tsx): the cookies of the list "Cookies" (list.ts), by
// category (the necessary first, as the cookie banner has them), then by who sets them and then by name, and its shared
// texts ("Blocks" › "Cookie list"), with the categories' names. In the editor: viewOf, from the files as the editor
// has them (StandardSiteData.cookies); on the site: load.ts.
import { COOKIE_CATEGORIES, type CookieCategory } from '../../../lib/cookieCategories.mjs';
import { sharedIn } from '../../shared';
import type { CookieItem } from '../site';
import type { ViewOf } from '../view';
import shared from './shared';

export type CookieRow = { name: string; provider: string; purpose: string; lasts: string; category: CookieCategory };
export type CookiesTexts = Record<'name' | 'provider' | 'purpose' | 'lasts' | 'category' | CookieCategory, string>;
export type CookiesView = { cookies: CookieRow[]; texts: CookiesTexts };

const order = (c: CookieRow) => COOKIE_CATEGORIES.indexOf(c.category);

/** The cookies as the block shows them: by category, then by who sets them, then by name (one without a name is left
 * out). */
export const rowsOf = (cookies: CookieItem[]): CookieRow[] =>
  cookies
    .filter((c) => c.name)
    .map((c) => ({ name: c.name, provider: c.provider, purpose: c.purpose ?? '', lasts: c.lasts ?? '', category: c.category }))
    .sort((a, b) => order(a) - order(b) || a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));

export const viewOf: ViewOf<CookiesView> = (_, data) => ({
  cookies: rowsOf(data.site.cookies),
  texts: sharedIn(data.site, 'cookies', shared.values) as CookiesTexts,
});
