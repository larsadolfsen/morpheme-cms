// The cookies the apps set (src/apps/<app>/cookies.json): each app names those it sets, with who sets them, what for,
// how long they last and their category (@morphemecms/cms/lib/cookieCategories.mjs: 'necessary', set also without a yes in
// the cookie banner, or 'preferences', 'statistics', 'marketing' or 'targeting', only after a yes to it), in the site's language, as its csp.json names what it loads; one without a name (those a service decides itself) is
// only a line on the app's page in the editor (`cookieList` in its index.ts, AppCookie in packages/editor/src/store.ts).
// Those with a name are added to the site's cookie list ("Lists" › "Cookies", which the standard block "Cookie list"
// shows) when the app is installed, and taken out when it is uninstalled (packages/editor/src/cookieList.ts). Read by
// the app Cookiescanner's step after the build (build.mjs, what it knows of a cookie) and by npm run check:content
// (appCookieProblems), so no TypeScript here.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { COOKIE_CATEGORIES, isCookieCategory } from '../lib/cookieCategories.mjs';

const TEXTS = ['name', 'provider', 'purpose', 'lasts'];

/** What is wrong with a list of cookies written in a file (an app's cookies.json), each as a sentence.
 * @param {unknown} list @param {string} file */
export function cookieProblems(list, file) {
  if (!Array.isArray(list)) return [`${file}: must be a list with one entry for each cookie.`];
  return list.flatMap((c, i) => {
    const at = `${file}: cookie ${i + 1}`;
    if (!c || typeof c !== 'object' || Array.isArray(c)) return [`${at} must be an object.`];
    return [
      ...Object.keys(c)
        .filter((k) => !TEXTS.includes(k) && k !== 'category')
        .map((k) => `${at} has the field ${k}, which doesn't exist (${[...TEXTS, 'category'].join(', ')}).`),
      ...TEXTS.filter((k) => k in c && typeof c[k] !== 'string').map((k) => `${at}: ${k} must be a text.`),
      ...(String(c.purpose ?? '').trim() ? [] : [`${at} is missing purpose.`]),
      // Without a name, only a line on the app's page; with one, a cookie in the cookie list.
      ...(c.name === undefined
        ? []
        : [
            ...(String(c.name).trim() ? [] : [`${at}: name is empty.`]),
            ...(String(c.provider ?? '').trim() ? [] : [`${at} is missing provider.`]),
            ...(isCookieCategory(c.category) ? [] : [`${at}: category must be ${COOKIE_CATEGORIES.join(', ')}.`]),
          ]),
    ];
  });
}

const read = (file) => JSON.parse(readFileSync(file, 'utf8'));

/** The cookies of each app (installed or not) in the repository at `root`, by the app's id. */
export function appCookies(root) {
  const apps = new URL('src/apps/', root);
  if (!existsSync(apps)) return {};
  return Object.fromEntries(
    readdirSync(apps, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(new URL(`${d.name}/cookies.json`, apps)))
      .map((d) => {
        try {
          const list = read(new URL(`${d.name}/cookies.json`, apps));
          return [d.name, Array.isArray(list) ? list : []];
        } catch {
          return [d.name, []];
        }
      }),
  );
}

/** What is wrong with the apps' cookies.json (npm run check:content). */
export function appCookieProblems(root = pathToFileURL(`${process.cwd()}/`)) {
  const apps = new URL('src/apps/', root);
  if (!existsSync(apps)) return [];
  return readdirSync(apps, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(new URL(`${d.name}/cookies.json`, apps)))
    .flatMap(({ name }) => {
      const file = `src/apps/${name}/cookies.json`;
      try {
        return cookieProblems(read(new URL(`${name}/cookies.json`, apps)), file);
      } catch {
        return [`${file}: is not JSON.`];
      }
    });
}
