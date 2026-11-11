// Gives an app the site data its read scopes name (pages, cookies, apps, csp.allowed) from a site folder, only the keys asked for. Exposes readsFor.
// Reuses stateOf, blocksIn, splitFrontmatter/readFields (src/frontmatter.mjs), categoryOf, activeApps, readManifest, cookiesFor, joined.
// Not in pages: drafts, unlisted pages, and /new/ versions (the isPreview rule of site/noindex.mjs, which needs a site config to import).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { activeApps } from './apps.mjs';
import { cookiesFor, readManifest } from './appManifest.mjs';
import { blocksIn } from './blocks.mjs';
import { categoryOf } from './cookieCategories.mjs';
import { joined } from './cspSources.mjs';
import { inPreview } from './previewAddress.mjs';
import { stateOf } from './status.mjs';
import { readFields, splitFrontmatter } from '../src/frontmatter.mjs';

/** @typedef {import('./appManifest.mjs').ReadScope} ReadScope
 * @typedef {import('./appManifest.mjs').AppCookieDecl} AppCookieDecl
 * @typedef {{ address: string, title: string, blocks: string[], text?: string }} PageRead
 * @typedef {{ name: string, provider: string, category: string, file: string }} CookieRead
 * @typedef {{ id: string, version: string, settings: Record<string, unknown>, cookies: AppCookieDecl[], csp: Record<string, string[]> }} AppRead
 * @typedef {{ pages?: PageRead[], cookies?: { banner: boolean, list: CookieRead[] }, apps?: AppRead[], 'csp.allowed'?: string[] }} SiteReads */

/** The parsed JSON file, or `fallback` when it is missing or not JSON. @param {string} file @param {any} fallback */
function json(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

/** The .md files in a folder, recursively, as paths relative to it with `/`, sorted. @param {string} dir @returns {string[]} */
function markdownIn(dir) {
  try {
    return readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .map((f) => f.split('\\').join('/'))
      .filter((f) => f.endsWith('.md'))
      .sort();
  } catch {
    return [];
  }
}

/** The published pages and posts: a page's own `path`, else /<file>/ (as getPages and postPath in site/content.ts), by address.
 * @param {string} root @param {boolean} withText @returns {PageRead[]} */
function pagesOf(root, withText) {
  /** @type {PageRead[]} */
  const found = [];
  for (const [folder, own] of [
    ['pages', true],
    ['blog', false],
  ]) {
    const dir = join(root, 'src/content', folder);
    for (const file of markdownIn(dir)) {
      const { yaml, body } = splitFrontmatter(readFileSync(join(dir, file), 'utf8'));
      const data = readFields(yaml);
      // An unlisted page is only on its address, and an app reading the pages (a sitemap, a search) should not list it.
      if (stateOf(data) !== 'published') continue;
      const address = own && typeof data.path === 'string' ? data.path : `/${file.slice(0, -'.md'.length)}/`;
      if (inPreview(address)) continue; // a new version, under the old address /ny/ too
      const types = [...new Set(blocksIn(body).map((b) => b.type))];
      found.push({
        address,
        title: typeof data.title === 'string' ? data.title : '',
        blocks: types,
        ...(withText && { text: body.trim() }),
      });
    }
  }
  return found.sort((a, b) => (a.address < b.address ? -1 : a.address > b.address ? 1 : 0));
}

/** The cookie banner flag and the cookie list: one file per cookie in src/data/cookie-list/ (config.cookieList; `file` is its name).
 * @param {string} root @returns {{ banner: boolean, list: CookieRead[] }} */
function cookiesOf(root) {
  const dir = join(root, 'src/data/cookie-list');
  let files = [];
  try {
    files = readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .sort();
  } catch {}
  const list = files.map((file) => {
    const c = json(join(dir, file), {});
    const text = (/** @type {unknown} */ v) => (v == null ? '' : String(v));
    return { name: text(c.name), provider: text(c.provider), category: categoryOf(c), file };
  });
  return { banner: json(join(root, 'src/data/cookies.json'), {}).enabled === true, list };
}

/** The active apps with what they declare. A contract 4 app (app.json) is read by readManifest, and left out when it is invalid;
 * an older app by its cookies.json, csp.json and saved settings, and the version in its index.ts ('' without one).
 * @param {string} root @returns {AppRead[]} */
function appsOf(root) {
  /** @type {AppRead[]} */
  const apps = [];
  for (const id of activeApps(root)) {
    const dir = join(root, 'src/apps', id);
    const saved = json(join(root, 'src/data/apps', `${id}.json`), {});
    const { manifest, problems } = readManifest(dir);
    if (manifest) {
      const settings = { ...manifest.settings?.values, ...saved };
      apps.push({ id, version: manifest.version, settings, cookies: cookiesFor(manifest, settings), csp: manifest.csp ?? {} });
    } else if (!problems.length) {
      let code = '';
      try {
        code = readFileSync(join(dir, 'index.ts'), 'utf8');
      } catch {}
      const cookies = json(join(dir, 'cookies.json'), []);
      apps.push({
        id,
        version: /\bversion:\s*['"]([^'"]+)['"]/.exec(code)?.[1] ?? '',
        settings: saved,
        cookies: (Array.isArray(cookies) ? cookies : []).map((c) => ({ ...c, duration: c.duration ?? c.lasts })),
        csp: json(join(dir, 'csp.json'), {}),
      });
    }
  }
  return apps;
}

/** What the scopes give, from the site folder at `root`; only the keys asked for. `pages.text` also gives `pages`.
 * @param {ReadScope[]} scopes @param {string} root @returns {Promise<SiteReads>} */
export async function readsFor(scopes, root) {
  /** @type {SiteReads} */
  const reads = {};
  if (scopes.includes('pages') || scopes.includes('pages.text')) reads.pages = pagesOf(root, scopes.includes('pages.text'));
  if (scopes.includes('cookies')) reads.cookies = cookiesOf(root);
  if (scopes.includes('apps')) reads.apps = appsOf(root);
  if (scopes.includes('csp.allowed')) {
    reads['csp.allowed'] = [...new Set(Object.values(joined(json(join(root, 'src/data/csp.json'), {}))).flat())];
  }
  return reads;
}
