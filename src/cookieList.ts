// The site's cookie list, "Cookies" under "Lists" (the list the standard block "Cookie list" brings,
// standard/cookies/list.ts): a file per cookie in config.cookieList, each with its name (`*` for the rest of it), who
// sets it, what for, how long it lasts and its category (necessary, or one the visitor says yes to in the cookie banner,
// lib/cookieCategories.mjs). An app's cookies (its
// cookies.json, those with a name) are added to it in the commit that installs the app, and those it added (`app`, its
// id, kept in the file but not shown) are taken out in the one that uninstalls it; an update adds its new ones and takes
// out those it no longer sets. One already in the list by its name and provider is left as it is, so what was written
// over an app's text stays. The app "Cookiescanner" adds those its scan finds besides (its worker.js), and more can be
// added by hand.
import { config } from '@site/config';
import type { Change, RepoFile } from './github';
import { slugify } from './schema';
import { categoryOf, type CookieCategory } from '../lib/cookieCategories.mjs';
import type { AppCookie } from './store';

/** A cookie in the list, as its file has it; `app`: the app that added it; `new`: added by the app "Cookiescanner" and not
 * yet looked through (first in the list, marked, until it is saved: FolderCollection.fresh); `scanned`: added by it, kept
 * when saved (its tab "Problems" says when the site no longer sets it). */
export type CookieEntry = {
  name: string;
  provider: string;
  purpose: string;
  lasts?: string;
  category: CookieCategory;
  app?: string;
  new?: boolean;
  scanned?: boolean;
};

/** Whether a file is one of the list's. */
export const inCookieList = (path: string) => path.startsWith(`${config.cookieList}/`) && path.endsWith('.json');

function entryOf(file: RepoFile): Partial<CookieEntry> {
  try {
    return JSON.parse(file.text) ?? {};
  } catch {
    return {};
  }
}

const same = (a: { name?: string; provider?: string }, b: { name?: string; provider?: string }) =>
  a.name === b.name && (a.provider ?? '') === (b.provider ?? '');

/** The changes to the list when an app is installed or updated with `cookies` (its cookies.json, in the site's
 * language), or uninstalled (null), from the site's files now (see above). */
export function cookieChanges(app: string, cookies: AppCookie[] | null, files: RepoFile[]): Change[] {
  const list = files.filter((f) => inCookieList(f.path)).map((file) => ({ file, entry: entryOf(file) }));
  const wanted = (cookies ?? []).filter((c) => c.name?.trim());
  const changes: Change[] = list
    .filter(({ entry }) => entry.app === app && !wanted.some((c) => same(c, entry)))
    .map(({ file }) => ({ path: file.path, content: null, oid: file.oid }));
  const taken = new Set(list.map(({ file }) => file.path));
  for (const c of wanted) {
    if (list.some(({ entry }) => same(c, entry))) continue;
    const slug = slugify(`${c.name!.replace(/\*/g, ' x ')} ${c.provider ?? ''}`) || 'cookie';
    let path = `${config.cookieList}/${slug}.json`;
    for (let n = 2; taken.has(path); n++) path = `${config.cookieList}/${slug}-${n}.json`;
    taken.add(path);
    const entry: CookieEntry = {
      name: c.name!,
      provider: c.provider ?? '',
      purpose: c.purpose,
      ...(c.lasts ? { lasts: c.lasts } : {}),
      category: categoryOf(c),
      app,
    };
    changes.push({ path, content: `${JSON.stringify(entry, null, 2)}\n`, oid: null });
  }
  return changes;
}
