// The app store ("Indstillinger" › "Appstore", #indstillinger/appstore, AppList.tsx): the apps that are not in the site
// and can be installed. The store is a GitHub repository (config.store) with a catalog (catalog.json): each app with
// its id, its version and the version of the contract it is written to (APP_API), its name, who made it, its icon
// (Phosphor's name), what it does (in a sentence, and more fully), its category and the words it is found by, what it
// adds (its blocks, the lists it brings and its kinds of the site's lists), what it needs (needsOf), the cookies it
// sets, its pictures, what is new in each version (its release notes), its texts in the editor's other languages (as an app's texts.ts), its
// licence and those of the third-party work it brings (StoreLicenses), and where its folder is in the
// repository at which commit, file by file with their blob ids.
// Installing one copies its folder into the site's (config.apps.folder/<id>/, at that commit, each file checked
// against its id), with a note of where it came from (store.json, StoreRecord), and puts it among the apps installed,
// in one commit (appChanges); the site's next build has it. Updating copies the newer version over it, and
// uninstalling deletes the folder, also in one commit each. What was made with it (its settings, its entries) is the
// site's data and stays.
// The store has themes too (`themes` in the catalog): each with its id, its version and the version of the contract it
// is written to (THEME_API), its name, who made it, its picture, what it is and gives the site, its pictures of a site
// in it, and its folder file by file. Installing one copies its folder into the site's themes (config.themes/<id>/,
// with its store.json), and it can then be chosen under "Udseende" › "Temaer"; updating and uninstalling are as for
// an app (themeChanges), and the theme in use cannot be uninstalled.
// The catalog is what is released: an app's or a theme's entry is written from its folder by `npm run store:release
// -- <id>` (scripts/store-release.mjs) when the owner releases it, not by each merge (packages/editor/scripts/releases.mjs). Until the real store exists, it is this repository's own (store/catalog.json, with the apps' folders in
// src/apps/ and the themes' in src/themes/).
import { config } from '@site/config';
import { loadBytes, loadFrom, type Change, type RepoFile } from './github';
import { locale, t } from './i18n';
import { hooksOf, type AppHook } from '../lib/hooks';
import type { StoreLicenses } from './licenses';

/** The version of the contract between the editor and an app (apps.ts: defineApp, its folder, and the theme's parts it
 * draws with: the standard blocks' and the UI components, @theme/blocks/… and @theme/ui/…, imported from
 * @morphemecms/cms): an app in the store says which it is written to, and only those the editor can run are
 * offered. Raised when an app written to the one before no longer works. */
export const APP_API = 1;

/** The version of the contract between the editor and a theme (what a theme must and may have, "Hvad et tema må" in
 * CLAUDE.md, themeProblems in packages/editor/site/theme.mjs, the standard theme's UI parts with Material 3's names and
 * variants, the motion scheme's --motion-* springs and motionSpring/motionTiming (@morphemecms/cms/lib/motion),
 * and the classes it styles): only themes written to it are offered. Raised when a theme written to the one before no
 * longer works. */
export const THEME_API = 2;

/** The kinds of apps, a filter in the store (t.apps.categories). */
export const appCategories = ['booking', 'newsletter', 'payment', 'analytics', 'content', 'design'] as const;
export type AppCategory = (typeof appCategories)[number];

/** A file of an app in the store: its path in the app's folder and its git blob id. */
export type StoreFile = { path: string; oid: string };

/** Something an app adds, as the catalog says it (its page before it is installed): its name, icon and what it is. */
export type StoreAdd = { label: string; icon: string; hint?: string };

/** What an app needs of the site, as its folder says (needsOf): its code on every page (slots/), what it loads from
 * other addresses and where its forms send to (its csp.json, by host), its own part of the site's Worker (worker.js),
 * a step when the site is built (build.mjs) and what it changes of what the site does itself (hooks/,
 * @morphemecms/cms/lib/hooks.ts; not in a catalog written before there were any). Shown on its page under "Rettigheder",
 * before it is installed. */
export type AppNeeds = { pages: boolean; loads: string[]; sends: string[]; server: boolean; build: boolean; changes?: AppHook[] };

/** What an app needs, from the paths of the files in its folder and its csp.json. */
export function needsOf(files: string[], csp: Partial<Record<string, string[]>> = {}): AppNeeds {
  const hosts = (kinds: string[]) => [...new Set(kinds.flatMap((k) => csp[k] ?? []).map((a) => a.replace(/^https:\/\//, '')))].sort();
  return {
    pages: files.some((f) => f.startsWith('slots/')),
    loads: hosts(['script', 'style', 'img', 'connect', 'frame']),
    sends: hosts(['form']),
    server: files.includes('worker.js'),
    build: files.includes('build.mjs'),
    changes: hooksOf(files).hooks,
  };
}

/** A cookie an app sets (also one a service sets in its own frame, as Calendly's), from its cookies.json, on its page
 * under "Cookies": its name (`_ga`, `_ga_*`; none for those a service decides itself, only on its page), what it is
 * for and how long it lasts; with a name, also who sets it and its category (lib/cookieCategories.mjs: `necessary`,
 * also without a yes in the cookie banner, or one the visitor says yes to; `when` in an app from before them, categoryOf),
 * for the cookie list in the cookie policy (the site's packages/editor/site/appCookies.mjs). */
export type AppCookie = { name?: string; provider?: string; purpose: string; lasts?: string; category?: string; when?: string };

/** A picture of an app in its store page, picked to give an idea of it (`screenshots` in its index.ts, as a theme's):
 * what it shows (`shows`: one of its blocks, `blok:<type>`; a variant of its kind of a list, `slags:<list>:<n>`, 0
 * without variants; one of its lists, `liste:<id>`; its settings, `indstillinger`, with made-up `values`, never the
 * site's own; its own page, `side`) and what it says under it (`label`, an app's text). Only made-up content, never the
 * site's (packages/editor/scripts/app-screenshots.mjs takes them with the examples). */
export type AppShot = { shows: string; label: string; values?: Record<string, unknown> };

/** A picture of an app as the catalog has it: its file in the app's screenshots/ and what it says under it. */
export type AppScreenshot = { file: string; label: string };

/** What an app adds, as a picture of it can show it (shotOf). */
type Shown = {
  kinds?: Record<string, { variants?: unknown[] }>;
  lists?: { id: string }[];
  settings?: unknown;
  page?: unknown;
};

/** Whether a picture shows something the app has (AppShot.shows): one of its blocks (`blocks`: their types), a variant
 * of its kind of a list, one of its lists, its settings or its own page. */
export function shotOf(shows: string, app: Shown, blocks: string[]): boolean {
  const [what, key = '', n] = shows.split(':');
  if (what === 'blok') return blocks.includes(key);
  if (what === 'slags') {
    const kind = app.kinds?.[key];
    return !!kind && /^\d+$/.test(n ?? '') && Number(n) < Math.max(1, kind.variants?.length ?? 0);
  }
  if (what === 'liste') return !!app.lists?.some((l) => l.id === key);
  if (what === 'indstillinger') return !!app.settings && !key;
  return what === 'side' && !!app.page && !key;
}

/** The file of an app's picture in its screenshots/, by its place among them and what it shows. */
export const shotFile = (i: number, shows: string) => `${i + 1}-${shows.replace(/:/g, '-')}.jpg`;

/** The folder of an app's pictures. */
export const SCREENSHOTS = 'screenshots';

/** An app in the store's catalog. */
export type StoreApp = {
  id: string;
  version: string;
  api: number;
  label: string;
  publisher: string;
  icon: string;
  hint: string;
  description?: string;
  /** What is new in each version, by the version (AppDefinition.releaseNotes): before it is updated (notesSince). */
  releaseNotes?: Record<string, string>;
  category?: AppCategory;
  keywords?: string[];
  /** What it needs of the site; the cookies it sets, and whether it asks in the cookie banner first (AppDefinition
   * .cookies); its pictures. */
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
  /** Where its folder is in the store's repository, and at which commit. */
  path: string;
  ref: string;
  files: StoreFile[];
};

/** A theme in the store's catalog: as its theme.json has it (its texts by the editor's language), its pictures of a
 * site in it (screenshots/<n>-<key>.jpg, t.library.themeShots) and where its folder is in the store's repository. */
export type StoreTheme = {
  id: string;
  version: string;
  api: number;
  name: string;
  author: string;
  icon: string;
  description?: Record<string, string>;
  highlights?: Record<string, string[]>;
  /** What is new in each version, by the language and then the version, as its theme.json has it. */
  releaseNotes?: Record<string, Record<string, string>>;
  screenshots?: { file: string; key: string }[];
  /** Its own licence and the third-party work it brings, as its theme.json declares them (not in a catalog written
   * before they were). */
  licenses?: StoreLicenses;
  /** The icon packs it brings (its icon-packs/<id>/, with their pack.json: name, who made it, licence), installed with it
   * and chosen under "Udseende" › "Ikonpakker". */
  iconPacks?: { id: string; name: string; author: string; license: string }[];
  path: string;
  ref: string;
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

/** Where an app installed from the store came from: its version, the store's commit and its files (store.json). */
export type StoreRecord = { version: string; ref: string; files: StoreFile[] };

/** The store's address in the editor, under "Indstillinger" (its apps; its themes at STORE_THEMES), its address
 * before (STORE_BEFORE, which opens it, App.tsx MOVED), and that of a developer's page (DEVELOPER_ROUTE/<slug>); no
 * app can have the ids of the last two. */
export const STORE_ROUTE = 'indstillinger/appstore';
export const STORE_THEMES = 'indstillinger/appstore/temaer';
export const STORE_BEFORE = 'apps/butik';
export const DEVELOPER_ROUTE = 'apps/udvikler';

/** An app's folder in the site, and the note in it of where it came from. */
export const appFolder = (id: string) => `${config.apps.folder}/${id}`;
/** A theme's folder in the site; the standard theme's is always there. */
export const themeFolder = (id: string) => `${config.themes}/${id}`;
export const STANDARD_THEME = 'saturn';
export const RECORD = 'store.json';

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

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const isAdd = (v: any) => isText(v?.label) && isText(v?.icon);
const ID = /^[a-z0-9][a-z0-9-]*$/;
// A file's path in an app's folder: only within it.
const isPath = (v: unknown) => isText(v) && v.split('/').every((part) => part !== '' && part !== '.' && part !== '..');

/** Whether an entry of the catalog has what an app needs, written to the contract the editor runs, with files only in
 * its own folder, and not the store's own address. */
function valid(a: any): a is StoreApp {
  return (
    ID.test(a?.id ?? '') &&
    ![STORE_BEFORE, DEVELOPER_ROUTE].includes(`apps/${a.id}`) &&
    isText(a.version) &&
    a.api === APP_API &&
    [a.label, a.publisher, a.icon, a.hint, a.path, a.ref].every(isText) &&
    Array.isArray(a.files) &&
    a.files.length > 0 &&
    a.files.every((f: any) => isText(f?.oid) && isPath(f?.path) && f.path !== RECORD) &&
    ['blocks', 'lists', 'kinds'].every((k) => Array.isArray(a.adds?.[k]) && a.adds[k].every(isAdd))
  );
}

/** The apps in a catalog (catalog.json, as text) the editor can install, with their texts in its language. */
export function catalogApps(text: string): ShownApp[] {
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    return [];
  }
  const apps: unknown[] = Array.isArray(json?.apps) ? json.apps : [];
  return apps.filter(valid).map((a) => {
    const own = a.texts?.[locale];
    const say = (s: string) => own?.[s] ?? s;
    const add = <A extends StoreAdd>(x: A): A => ({ ...x, label: say(x.label), ...(x.hint ? { hint: say(x.hint) } : {}) });
    const keywords = a.keywords ?? [];
    return {
      ...a,
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

/** Whether an entry of the catalog has what a theme needs, written to the contract the editor runs, with files only
 * in its own folder; never the standard theme, which every site has. */
function validTheme(x: any): x is StoreTheme {
  return (
    ID.test(x?.id ?? '') &&
    x.id !== STANDARD_THEME &&
    x.api === THEME_API &&
    [x.version, x.name, x.author, x.icon, x.path, x.ref].every(isText) &&
    Array.isArray(x.files) &&
    x.files.length > 0 &&
    x.files.every((f: any) => isText(f?.oid) && isPath(f?.path) && f.path !== RECORD)
  );
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
  return themes.filter(validTheme).map((x) => {
    const description = inLocale(x.description);
    const highlights = inLocale(x.highlights) ?? [];
    return {
      ...x,
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

/** Whether the site has an app store (config.store); without one, "Appstore" has only the site's own apps and themes. */
export const hasStore = !!config.store;

// The store's repository; only asked for what is in its catalog, so never without one.
const storeRepo = () => {
  if (!config.store) throw new Error(t.apps.noStore);
  return config.store;
};

function catalogText(): Promise<string> {
  if (!config.store) return Promise.resolve('{}');
  catalog ??= loadFrom(config.store, config.store.branch, [config.store.catalog]).then(([file]) => {
    if (file?.text == null) throw new Error(t.apps.storeFailed);
    return file.text;
  });
  catalog.catch(() => (catalog = null));
  return catalog;
}

/** The store's apps. Fails when the catalog cannot be read. */
export const readCatalog = (): Promise<ShownApp[]> => catalogText().then(catalogApps);

/** The store's themes. Fails when the catalog cannot be read. */
export const readThemes = (): Promise<ShownTheme[]> => catalogText().then(catalogThemes);

/** An app's (or a theme's) files from the store (its folder at the catalog's commit), each checked against its blob id. */
export async function readApp(app: {
  path: string;
  ref: string;
  files: StoreFile[];
  label?: string;
  name?: string;
}): Promise<{ path: string; content: string | Uint8Array }[]> {
  const found = await loadFrom(
    storeRepo(),
    app.ref,
    app.files.map((f) => `${app.path}/${f.path}`),
  );
  return Promise.all(
    app.files.map(async (f) => {
      const file = found.find((x) => x.path === `${app.path}/${f.path}`);
      if (!file || file.oid !== f.oid) throw new Error(t.apps.storeBroken(app.label ?? app.name ?? app.path));
      return { path: f.path, content: file.text ?? (await loadBytes(f.oid, undefined, storeRepo())) };
    }),
  );
}

/** An app's pictures from the store (its screenshots/, AppScreenshot), each as an address in this browser (a blob:)
 * with what it shows; one that cannot be read is left out. */
export async function readScreenshots(app: StoreApp): Promise<{ src: string; label: string }[]> {
  const types: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const read = await Promise.all(
    (app.screenshots ?? []).map(async (x) => {
      const oid = app.files.find((f) => f.path === `${SCREENSHOTS}/${x.file}`)?.oid;
      const type = types[x.file.split('.').pop()!.toLowerCase()];
      if (!oid || !type) return null;
      try {
        const bytes = await loadBytes(oid, undefined, storeRepo());
        return { src: URL.createObjectURL(new Blob([bytes as BlobPart], { type })), label: x.label };
      } catch {
        return null;
      }
    }),
  );
  return read.filter((x) => !!x);
}

/** A theme's pictures of a site in it from the store (its screenshots/), each as an address in this browser (a blob:)
 * with what it shows (its key, t.library.themeShots); one that cannot be read is left out. */
export async function readThemeScreenshots(theme: Pick<StoreTheme, 'screenshots' | 'files'>): Promise<{ key: string; src: string }[]> {
  const read = await Promise.all(
    (theme.screenshots ?? []).map(async (x) => {
      const oid = theme.files.find((f) => f.path === `${SCREENSHOTS}/${x.file}`)?.oid;
      if (!oid) return null;
      try {
        const bytes = await loadBytes(oid, undefined, storeRepo());
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

/** The changes that make a folder in the site (`current`, its files now) the store's version of an app or a theme, with
 * the note of where it came from, or remove it (`next` null). */
function folderChanges(
  folder: string,
  current: RepoFile[],
  next: { files: { path: string; content: string | Uint8Array }[]; record: StoreRecord } | null,
): Change[] {
  const now = new Map(current.map((f) => [f.path, f.oid]));
  const wanted: { path: string; content: string | Uint8Array; oid?: string }[] = next
    ? [
        ...next.files.map((f) => ({
          path: `${folder}/${f.path}`,
          content: f.content,
          oid: next.record.files.find((r) => r.path === f.path)?.oid,
        })),
        { path: `${folder}/${RECORD}`, content: `${JSON.stringify(next.record, null, 2)}\n` },
      ]
    : [];
  return [
    // A file the site has as it is in the store is left as it is.
    ...wanted
      .filter((w) => !w.oid || now.get(w.path) !== w.oid)
      .map((w) => ({ path: w.path, content: w.content, oid: now.get(w.path) ?? null })),
    ...current.filter((f) => !wanted.some((w) => w.path === f.path)).map((f) => ({ path: f.path, content: null, oid: f.oid })),
  ];
}

/** The changes that make an app's folder in the site (`current`, its files now) the store's version, with the note of
 * where it came from, or remove it (`next` null: uninstalling); and the site's file of apps with it among those
 * installed or not (`installed`: their ids now, `file`: the file). In one commit. */
export function appChanges(
  id: string,
  current: RepoFile[],
  next: { files: { path: string; content: string | Uint8Array }[]; record: StoreRecord } | null,
  installed: string[],
  file: RepoFile | undefined,
): Change[] {
  const changes = folderChanges(appFolder(id), current, next);
  const ids = [...new Set(installed.filter((x) => x !== id).concat(next ? [id] : []))].sort();
  const text = `${JSON.stringify({ installed: ids }, null, 2)}\n`;
  if (text !== file?.text) changes.push({ path: config.apps.installed, content: text, oid: file?.oid || null });
  return changes;
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
