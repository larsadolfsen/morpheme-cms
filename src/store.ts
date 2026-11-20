// The app store ("Settings" › "Appstore", #settings/appstore, AppList.tsx): the apps that are not in the site
// and can be installed. The store is reached through the site's Worker (/api/store/catalog, /api/store/files/<oid>;
// the Worker holds the site's key to it, and the editor never calls the store itself): each app of its catalog with
// its id, its version and the version of the contract it is written to (APP_API), its name, who made it, its icon
// (Phosphor's name), what it does (in a sentence, and more fully), its category and the words it is found by, what it
// adds (its blocks, the lists it brings and its kinds of the site's lists), what it needs (needsOf), the cookies it
// sets, its images, what is new in each version (its release notes), its texts in the editor's other languages (as an app's texts.ts), its
// licence and those of the third-party work it brings (StoreLicenses), and its folder file by file with their blob ids.
// Installing one copies its folder into the site's (config.apps.folder/<id>/, each file checked against its id), with a
// note of where it came from (store.json, StoreRecord; its `ref` is the version), and puts it among the apps installed,
// in one commit (appChanges); the site's next build has it. Updating copies the newer version over it, and
// uninstalling deletes the folder, also in one commit each. What was made with it (its settings, its entries) is the
// site's data and stays.
// The store has themes too (`themes` in the catalog): each with its id, its version and the version of the contract it
// is written to (THEME_API), its name, who made it, its image, what it is and gives the site, its images of a site
// in it, and its folder file by file. Installing one copies its folder into the site's themes (config.themes/<id>/,
// with its store.json), and it can then be chosen under "Appearance" › "Themes"; updating and uninstalling are as for
// an app (themeChanges), and the theme in use cannot be uninstalled.
// The catalog is what is released: an app's or a theme's entry is written from its folder by `npm run store:release
// -- <id>` (scripts/store-release.mjs) when the owner releases it, not by each merge (packages/editor/scripts/releases.mjs).
// A site whose Worker has no store key has no store (storeConnected): "Appstore" has only the site's own.
// Depends on storeFetch.ts (timedFetch) for requests to the store.
import { config } from '@site/config';
import type { Change, RepoFile } from './github';
import { blobId } from '../lib/git.mjs';
import { locale, t } from './i18n';
import { hooksOf, type AppHook } from '../lib/hooks';
import type { StoreLicenses } from './licenseData';
import { APP_API, APP_APIS, THEME_API } from '../lib/contracts.mjs';
import { RECORD, STANDARD, isText, validApp, validTheme } from '../lib/storeEntries.mjs';
import { categoryOf, type Category, type Role } from '../lib/storeCategories.mjs';
import { timedFetch } from './storeFetch';
import { appChanges as appChangesIn } from '../lib/appChanges.mjs';
import { placesOf, type AppPlaces } from '../lib/appPlaces.mjs';
import type { AppManifest } from '../lib/appManifest.mjs';
import { folderChanges } from '../lib/folderChanges.mjs';

// The contracts this editor runs (lib/contracts.mjs, also read by the site's Worker).
export { APP_API, THEME_API };

/** The main category of an app, one of CATEGORIES in lib/storeCategories.mjs (the one list, a filter in the store:
 * t.apps.categories; what belongs in each is in docs/store-categories.md). */
export type AppCategory = Category;

/** A file of an app in the store: its path in the app's folder and its git blob id. */
export type StoreFile = { path: string; oid: string };

/** Something an app adds, as the catalog says it (its page before it is installed): its name, icon and what it is. */
export type StoreAdd = { label: string; icon: string; hint?: string };

/** What an app needs of the site, as its folder says (needsOf): its code on every page (slots/), what it loads from
 * other addresses and where its forms send to (its csp.json, by host), its own part of the site's Worker (worker.js),
 * a step when the site is built (build.mjs) and what it changes of what the site does itself (hooks/,
 * @morphemecms/cms/lib/hooks.ts; not in a catalog written before there were any), whether it adds widgets to the
 * start screen (AppDefinition.widgets; not in a catalog written before there were any) and the access of each place of
 * it (`places`, lib/appPlaces.mjs: sandboxed or full access; not in a catalog written before there were any). Shown on
 * its page under "Permissions", before it is installed. */
export type AppNeeds = {
  pages: boolean;
  loads: string[];
  sends: string[];
  server: boolean;
  build: boolean;
  changes?: AppHook[];
  widgets?: boolean;
  places?: AppPlaces;
  /** The kinds of the site's data it reads (`reads` of its app.json), shown with its hosts. */
  reads?: string[];
};

/** What an app needs, from the paths of the files in its folder, its csp.json (a contract 4 app's `csp` in its app.json),
 * whether its index.ts has widgets (they are code in it, not a file) and its app.json (`manifest`; null for an app
 * written to contract 2 or 3, which has none). */
export function needsOf(
  files: string[],
  csp: Partial<Record<string, string[]>> = {},
  widgets = false,
  manifest: AppManifest | null = null,
): AppNeeds {
  const hosts = (kinds: string[]) => [...new Set(kinds.flatMap((k) => csp[k] ?? []).map((a) => a.replace(/^https:\/\//, '')))].sort();
  return {
    pages: files.some((f) => f.startsWith('slots/')),
    loads: hosts(['script', 'style', 'img', 'connect', 'frame']),
    sends: hosts(['form']),
    server: files.includes('worker.js'),
    build: files.includes('build.mjs'),
    changes: hooksOf(files).hooks,
    widgets,
    places: placesOf(files, manifest),
    ...(manifest?.reads?.length ? { reads: [...manifest.reads] } : {}),
  };
}

/** A cookie an app sets (also one a service sets in its own frame, as Calendly's), from its cookies.json, on its page
 * under "Cookies": its name (`_ga`, `_ga_*`; none for those a service decides itself, only on its page), what it is
 * for and how long it lasts; with a name, also who sets it and its category (lib/cookieCategories.mjs: `necessary`,
 * also without a yes in the cookie banner, or one the visitor says yes to; `when` in an app from before them, categoryOf),
 * for the cookie list in the cookie policy (the site's packages/editor/site/appCookies.mjs). */
export type AppCookie = { name?: string; provider?: string; purpose: string; lasts?: string; category?: string; when?: string };

/** An image of an app in its store page, picked to give an idea of it (`screenshots` in its index.ts, as a theme's):
 * what it shows (`shows`: one of its blocks, `block:<type>`; a variant of its kind of a list, `kind:<list>:<n>`, 0
 * without variants; one of its lists, `list:<id>`; its settings, `settings`, with made-up `values`, never the
 * site's own; its own page, `page`; the old Danish words still work for one
 * release, lib/appShots.mjs) and what it says under it (`label`, an app's text). Only made-up content, never the
 * site's (packages/editor/scripts/app-screenshots.mjs takes them with the examples). */
export type AppShot = { shows: string; label: string; values?: Record<string, unknown> };

/** An image of an app as the catalog has it: its file in the app's screenshots/ and what it says under it. */
export type AppScreenshot = { file: string; label: string };

export { shotOf, shotFile, shotFiles } from '../lib/appShots.mjs';

/** The folder of an app's images. */
export const SCREENSHOTS = 'screenshots';

/** An app in the store's catalog. */
export type StoreApp = {
  id: string;
  /** Its readable name for addresses (`publisher/name`). */
  handle?: string;
  version: string;
  api: number;
  label: string;
  publisher: string;
  icon: string;
  hint: string;
  description?: string;
  /** What is new in each version, by the version (AppDefinition.releaseNotes): before it is updated (notesSince). */
  releaseNotes?: Record<string, string>;
  /** Its main category and its subcategory of it, as the catalog has them, read with categoryOf: an older id is mapped to
   * its new one, one it does not know leaves them out, and the app stays in the catalog. */
  category?: AppCategory;
  subcategory?: string;
  /** Connector or plugin, as the catalog has it (read with roleOf: with none, an outside host or `mcp` makes a connector, else a plugin), and the service a connector
   * connects to (when the entry names it; else its hosts, serviceOf). */
  role?: Role;
  service?: string;
  /** A connector's MCP server, as its entry in the catalog carries it (`mcp` of its app.json): shown before install as
   * its host and the tools it uses (AppInfoTab). */
  mcp?: { server: string; auth?: string; tools?: string[] };
  keywords?: string[];
  /** What it needs of the site; the cookies it sets, and whether it asks in the cookie banner first (AppDefinition
   * .cookies); its images. */
  needs?: AppNeeds;
  /** The names of the kinds of notifications it sends (AppDefinition.notifications). */
  notifies?: string[];
  cookies?: AppCookie[];
  consent?: boolean;
  screenshots?: AppScreenshot[];
  /** Its own licence and the third-party work it brings, each with its licence (its `license` and `thirdParty`; not in
   * a catalog written before they were). */
  licenses?: StoreLicenses;
  /** Its blocks, the lists it brings and its kinds of the site's lists (by the list's id). */
  adds: { blocks: StoreAdd[]; lists: StoreAdd[]; kinds: (StoreAdd & { list: string })[] };
  /** Its texts in the editor's other languages, by the text as it is written. */
  texts?: Partial<Record<string, Record<string, string>>>;
  /** Its folder, file by file. */
  files: StoreFile[];
};

/** A theme in the store's catalog: as its theme.json has it (its texts by the editor's language), its images of a
 * site in it (screenshots/<n>-<key>.jpg, t.library.themeShots) and its folder, file by file. */
export type StoreTheme = {
  id: string;
  handle?: string;
  version: string;
  api: number;
  name: string;
  author: string;
  icon: string;
  /** Its main category and its subcategory of it, as the catalog has them, read with categoryOf: an older id is mapped to
   * its new one, one it does not know leaves them out, and the theme stays in the catalog. */
  category?: Category;
  subcategory?: string;
  description?: Record<string, string>;
  highlights?: Record<string, string[]>;
  /** What is new in each version, by the language and then the version, as its theme.json has it. */
  releaseNotes?: Record<string, Record<string, string>>;
  screenshots?: { file: string; key: string }[];
  /** Its own licence and the third-party work it brings, as its theme.json declares them (not in a catalog written
   * before they were). */
  licenses?: StoreLicenses;
  /** The icon packs it brings (its icon-packs/<id>/, with their pack.json: name, who made it, licence), installed with it
   * and chosen under "Appearance" › "Icon packs". */
  iconPacks?: { id: string; name: string; author: string; license: string }[];
  files: StoreFile[];
};

/** A theme of the catalog as the editor shows it: its texts in the editor's language, and its words for the search. */
export type ShownTheme = Omit<StoreTheme, 'description' | 'highlights' | 'releaseNotes'> & {
  description?: string;
  highlights: string[];
  releaseNotes?: Record<string, string>;
  words: string;
};

/** An app of the catalog as the editor shows it: its texts in the editor's language, its name as the catalog writes
 * it (for the commits), and all its words in both, for the search. */
export type ShownApp = StoreApp & { written: string; words: string };

/** Where an app installed from the store came from: its version, the version again as `ref` (an older store.json has
 * the store's commit there) and its files (store.json). */
export type StoreRecord = { version: string; ref: string; files: StoreFile[] };

/** The store's address in the editor, under "Settings" (its apps), the address of its themes under Appearance
 * (STORE_THEMES, "Theme store"), and that of a developer's page (DEVELOPER_ROUTE/<slug>); no app can have the id of the
 * last one. The store's old address is in src/movedRoutes.mjs. */
export const STORE_ROUTE = 'settings/appstore';
/** The installed connectors and plugins (Apps in the menu): installed/connectors and installed/plugins; the themes are
 * under appearance/themes. */
export const INSTALLED_ROUTE = 'installed';
export const STORE_THEMES = 'appearance/theme-store';
export const DEVELOPER_ROUTE = 'apps/developer';

/** An app's folder in the site, and the note in it of where it came from. */
export const appFolder = (id: string) => `${config.apps.folder}/${id}`;
/** A theme's folder in the site; the standard theme's is always there. */
export const themeFolder = (id: string) => `${config.themes}/${id}`;
export const STANDARD_THEME = STANDARD;
export { RECORD };

/** Whether a version is newer than another ("1.10.0" than "1.9.2"). */
export function newer(a: string, b: string): boolean {
  const parts = (v: string) => v.split(/[.-]/).map((n) => Number.parseInt(n, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  return false;
}

/** Whether a version has a higher first number than another ("2.0.0" than "1.9.2"): it has changes that can break
 * something, so it is not updated to on its own (autoUpdate in AppList.tsx). */
export const breaking = (a: string, b: string) => (Number.parseInt(a, 10) || 0) > (Number.parseInt(b, 10) || 0);

/** What an update brings: the release notes of the versions after the one installed (`from`) up to the new one (`to`),
 * the newest first. */
export function notesSince(notes: Record<string, string> | undefined, from: string, to: string): { version: string; text: string }[] {
  return Object.entries(notes ?? {})
    .filter(([v, text]) => isText(text) && newer(v, from) && !newer(v, to))
    .sort(([a], [b]) => (newer(a, b) ? -1 : 1))
    .map(([version, text]) => ({ version, text }));
}

// Release notes as the catalog has them: only texts, by their version.
const notesOf = (x: unknown) =>
  x && typeof x === 'object' && !Array.isArray(x)
    ? Object.fromEntries(Object.entries(x).filter((e): e is [string, string] => isText(e[1])))
    : undefined;

const validStoreApp = (a: any): a is StoreApp => validApp(a, APP_APIS);
const validStoreTheme = (x: any): x is StoreTheme => validTheme(x, THEME_API);

/** The apps in a catalog (catalog.json, as text) the editor can install, with their texts in its language. */
export function catalogApps(text: string): ShownApp[] {
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    return [];
  }
  const apps: unknown[] = Array.isArray(json?.apps) ? json.apps : [];
  return apps.filter(validStoreApp).map((a) => {
    const own = a.texts?.[locale];
    const say = (s: string) => own?.[s] ?? s;
    const add = <A extends StoreAdd>(x: A): A => ({ ...x, label: say(x.label), ...(x.hint ? { hint: say(x.hint) } : {}) });
    const keywords = a.keywords ?? [];
    // Lenient: an unknown or older category only leaves the app without one (categoryOf), never out of the catalog.
    const { category, subcategory, ...rest } = a;
    return {
      ...rest,
      ...categoryOf(category, subcategory),
      label: say(a.label),
      hint: say(a.hint),
      ...(a.description ? { description: say(a.description) } : {}),
      releaseNotes: Object.fromEntries(Object.entries(notesOf(a.releaseNotes) ?? {}).map(([v, x]) => [v, say(x)])),
      keywords: keywords.map(say),
      notifies: (Array.isArray(a.notifies) ? a.notifies : []).filter(isText).map(say),
      cookies: (Array.isArray(a.cookies) ? a.cookies : [])
        .filter((c) => isText(c?.purpose))
        .map((c) => ({
          ...c,
          purpose: say(c.purpose),
          ...(c.lasts ? { lasts: say(c.lasts) } : {}),
        })),
      screenshots: (Array.isArray(a.screenshots) ? a.screenshots : [])
        .filter((x) => isText(x?.file) && isText(x?.label) && a.files.some((f) => f.path === `${SCREENSHOTS}/${x.file}`))
        .map((x) => ({ ...x, label: say(x.label) })),
      adds: { blocks: a.adds.blocks.map(add), lists: a.adds.lists.map(add), kinds: a.adds.kinds.map(add) },
      written: a.label,
      words: [a.label, a.hint, a.publisher, ...keywords, ...[a.label, a.hint, ...keywords].map(say)].join(' ').toLowerCase(),
    };
  });
}

/** The themes in a catalog (catalog.json, as text) the editor can install, with their texts in its language (else the
 * first they have). */
export function catalogThemes(text: string): ShownTheme[] {
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    return [];
  }
  const themes: unknown[] = Array.isArray(json?.themes) ? json.themes : [];
  const inLocale = <T>(x?: Record<string, T>) => x && (x[locale] ?? Object.values(x)[0]);
  return themes.filter(validStoreTheme).map((x) => {
    const description = inLocale(x.description);
    const highlights = inLocale(x.highlights) ?? [];
    const { category, subcategory, ...rest } = x;
    return {
      ...rest,
      ...categoryOf(category, subcategory),
      description: typeof description === 'string' ? description : undefined,
      highlights: Array.isArray(highlights) ? highlights.filter(isText) : [],
      releaseNotes: notesOf(inLocale(x.releaseNotes)),
      screenshots: (Array.isArray(x.screenshots) ? x.screenshots : []).filter(
        (s) => isText(s?.file) && isText(s?.key) && x.files.some((f) => f.path === `${SCREENSHOTS}/${s.file}`),
      ),
      iconPacks: (Array.isArray(x.iconPacks) ? x.iconPacks : []).filter(
        (p) => [p?.id, p?.name, p?.author, p?.license].every(isText) && x.files.some((f) => f.path === `icon-packs/${p.id}/pack.json`),
      ),
      words: [x.name, x.author, ...Object.values(x.description ?? {}), ...Object.values(x.highlights ?? {}).flat()].join(' ').toLowerCase(),
    };
  });
}

// The catalog, read once while the editor is open (again after it could not be read).
let catalog: Promise<string> | null = null;

// The catalog as the site's Worker passes it on: `{ connected: false }` when the site has no key to the store.
function catalogText(): Promise<string> {
  catalog ??= timedFetch(fetch, '/api/store/catalog').then(
    (res) => {
      if (!res.ok) throw new Error(t.apps.storeFailed);
      return res.text();
    },
    () => {
      throw new Error(t.apps.storeFailed);
    },
  );
  catalog.catch(() => (catalog = null));
  return catalog;
}

/** Makes the catalog be read again, the next time it is asked for (after the site is connected or disconnected). */
export function forgetCatalog(): void {
  catalog = null;
}

/** Whether the site's Worker has a store key; without one, "Appstore" has only the site's own apps and themes. Fails when
 * the catalog cannot be read. */
export const storeConnected = (): Promise<boolean> =>
  catalogText().then((text) => {
    try {
      return JSON.parse(text)?.connected !== false;
    } catch {
      return true;
    }
  });

/** The store's apps. Fails when the catalog cannot be read. */
export const readCatalog = (): Promise<ShownApp[]> => catalogText().then(catalogApps);

/** The store's themes. Fails when the catalog cannot be read. */
export const readThemes = (): Promise<ShownTheme[]> => catalogText().then(catalogThemes);

// A file from the store by its blob id (through the site's Worker), checked against the id.
async function readFile(oid: string): Promise<Uint8Array> {
  const res = await timedFetch(fetch, `/api/store/files/${oid}`);
  if (!res.ok) throw new Error(t.apps.storeFailed);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if ((await blobId(bytes)) !== oid) throw new Error(t.apps.storeFailed);
  return bytes;
}

// The text of a file, or null when it is binary (a NUL, or not UTF-8), as GitHub told them apart before.
function textOf(bytes: Uint8Array): string | null {
  if (bytes.includes(0)) return null;
  try {
    // ignoreBOM keeps a leading BOM in the text, so it encodes back to the same bytes (and the same blob id).
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** An app's (or a theme's) files from the store, each checked against its blob id; text files as text. */
export async function readApp(app: {
  files: StoreFile[];
  label?: string;
  name?: string;
}): Promise<{ path: string; content: string | Uint8Array }[]> {
  return Promise.all(
    app.files.map(async (f) => {
      try {
        const bytes = await readFile(f.oid);
        return { path: f.path, content: textOf(bytes) ?? bytes };
      } catch {
        throw new Error(t.apps.storeBroken(app.label ?? app.name ?? f.path));
      }
    }),
  );
}

/** An app's images from the store (its screenshots/, AppScreenshot), each as an address in this browser (a blob:)
 * with what it shows; one that cannot be read is left out. */
export async function readScreenshots(app: StoreApp): Promise<{ src: string; label: string }[]> {
  const types: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const read = await Promise.all(
    (app.screenshots ?? []).map(async (x) => {
      const oid = app.files.find((f) => f.path === `${SCREENSHOTS}/${x.file}`)?.oid;
      const type = types[x.file.split('.').pop()!.toLowerCase()];
      if (!oid || !type) return null;
      try {
        const bytes = await readFile(oid);
        return { src: URL.createObjectURL(new Blob([bytes as BlobPart], { type })), label: x.label };
      } catch {
        return null;
      }
    }),
  );
  return read.filter((x) => !!x);
}

/** A theme's images of a site in it from the store (its screenshots/), each as an address in this browser (a blob:)
 * with what it shows (its key, t.library.themeShots); one that cannot be read is left out. */
export async function readThemeScreenshots(theme: Pick<StoreTheme, 'screenshots' | 'files'>): Promise<{ key: string; src: string }[]> {
  const read = await Promise.all(
    (theme.screenshots ?? []).map(async (x) => {
      const oid = theme.files.find((f) => f.path === `${SCREENSHOTS}/${x.file}`)?.oid;
      if (!oid) return null;
      try {
        const bytes = await readFile(oid);
        return { key: x.key, src: URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/jpeg' })) };
      } catch {
        return null;
      }
    }),
  );
  return read.filter((x) => !!x);
}

/** The changes that make a theme's folder in the site (`current`, its files now) the store's version, with the note of
 * where it came from, or remove it (`next` null: uninstalling). In one commit. */
export function themeChanges(
  id: string,
  current: RepoFile[],
  next: { files: { path: string; content: string | Uint8Array }[]; record: StoreRecord } | null,
): Change[] {
  return folderChanges(themeFolder(id), current, next);
}

/** The changes that make an app's folder in the site (`current`, its files now) the store's version, with the note of
 * where it came from, or remove it (`next` null: uninstalling); and the site's file of apps (`file`) with it among those
 * installed or not, an update keeping it turned off (lib/appChanges.mjs). In one commit. */
export function appChanges(
  id: string,
  current: RepoFile[],
  next: { files: { path: string; content: string | Uint8Array }[]; record: StoreRecord } | null,
  file: RepoFile | undefined,
): Change[] {
  return appChangesIn(appFolder(id), config.apps.installed, id, current, next, file);
}

/** The note in an app's (or a theme's) folder of where it came from (store.json), from its files now (`current`). */
export function recordIn(current: RepoFile[], root: string): StoreRecord | undefined {
  try {
    const record = JSON.parse(current.find((f) => f.path === `${root}/${RECORD}`)?.text ?? '');
    return isText(record?.version) && Array.isArray(record.files) ? record : undefined;
  } catch {
    return undefined;
  }
}

/** The files of an app installed from the store that were changed in the site since (in its folder, `current`, not
 * as its note says), by their paths in the folder: an update writes over them. */
export function changedFiles(id: string, record: StoreRecord, current: RepoFile[], root = appFolder(id)): string[] {
  const folder = `${root}/`;
  const own = current.map((f) => ({ path: f.path.slice(folder.length), oid: f.oid }));
  return [
    ...own.filter((f) => f.path !== RECORD && record.files.find((r) => r.path === f.path)?.oid !== f.oid).map((f) => f.path),
    ...record.files.filter((r) => !own.some((f) => f.path === r.path)).map((r) => r.path),
  ];
}
