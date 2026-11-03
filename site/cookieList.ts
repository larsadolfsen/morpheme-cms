// The site's cookie list: one JSON file per cookie in src/data/cookie-list/ (config.cookieList), edited in the editor
// ("Lister" › "Cookies"), with those of the apps installed and those the app "Cookiescanner" finds (see
// packages/editor/src/cookieList.ts). The standard block "Cookieliste" shows them (StandardSite.cookies).
import { categoryOf } from '@morphemecms/cms/lib/cookieCategories.mjs';
import type { CookieItem } from '@morphemecms/cms/src/standard/site';

const files = import.meta.glob<Record<string, unknown>>('@data/cookie-list/*.json', { eager: true, import: 'default' });

const text = (v: unknown) => (v == null ? '' : String(v));

export const cookieList: CookieItem[] = Object.values(files).map((c) => ({
  name: text(c.name),
  provider: text(c.provider),
  purpose: text(c.purpose) || undefined,
  lasts: text(c.lasts) || undefined,
  category: categoryOf(c),
}));
