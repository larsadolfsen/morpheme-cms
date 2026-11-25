// What the update's build installs of the site's store themes and apps, and what stops it: the target CMS's contracts against
// each item installed from the store, the store's catalog (filtered to those contracts) and the site's copies. Exposes
// planInstall, acceptsContract, installsFile and parseInstalls. No dependencies, no I/O (scripts/build-install.mjs does the I/O;
// the editor reads the installs file on its first start, src/AppList.tsx commitBuildInstalls).
import { validApp, validTheme } from './storeEntries.mjs';

/** The file the build writes beside its output (served as /editor/build-installs.json) for the editor's first start. */
export const installsFile = 'build-installs.json';

/**
 * Whether a contract is one the target reads.
 * @param {'app' | 'theme'} kind
 * @param {number | undefined} api
 * @param {{ theme: number, apps: number[] }} next
 */
export const acceptsContract = (kind, api, next) =>
  kind === 'theme' ? api === next.theme : next.apps.includes(/** @type {number} */ (api));

/** Orders versions ("1.10.0" after "1.9.2"). @param {string} a @param {string} b */
const compareVersions = (a, b) => {
  const parts = (v) =>
    String(v)
      .split(/[.-]/)
      .map((n) => Number.parseInt(n, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
};

const parse = (text) => {
  try {
    return JSON.parse(text ?? '');
  } catch {
    return null;
  }
};

/**
 * @typedef {{ kind: 'app' | 'theme', id: string, record: string | null, changed: string[] }} Item an item of the site's apps or themes folder;
 *   `record`: its store.json text (null: none, a site copy); `changed`: the files of the folder that differ from the record
 * @typedef {{ kind: 'app' | 'theme', id: string, why: 'site-copy' | 'changed' | 'no-accepted-version', version?: string, files?: string[] }} Problem
 * @typedef {{ kind: 'app' | 'theme', id: string, label: string, from: string, version: string, files: { path: string, oid: string }[] }} Install
 */

/**
 * What the build installs and what stops it. An item the target accepts is left alone; one it does not takes the store's
 * version for the target's contracts (`catalog`: the store's answer to `/store/catalog?app=<n>&theme=<n>`, read to those
 * contracts). One with no such version, a site copy (a folder named as a store id with no store.json) and an item whose files were
 * changed in the site are each named in `problems`, and the build stops: it never guesses and never writes over the site's own work.
 * @param {object} o
 * @param {Item[]} o.items the site's folders named as a store id
 * @param {Map<string, { api: number } | { missing: true } | null>} o.answers by `<kind>:<id>`, the store's answer for the item's installed `id@version`
 * @param {{ apps?: unknown[], themes?: unknown[] }} o.catalog
 * @param {{ theme: number, apps: number[] }} o.next the contracts of the target CMS
 * @returns {{ install: Install[], problems: Problem[] }}
 */
export function planInstall({ items, answers, catalog, next }) {
  /** @type {Install[]} */
  const install = [];
  /** @type {Problem[]} */
  const problems = [];
  for (const { kind, id, record, changed } of items) {
    const installed = parse(record);
    if (!installed || typeof installed.version !== 'string') {
      problems.push({ kind, id, why: 'site-copy' });
      continue;
    }
    const answer = answers.get(`${kind}:${id}`) ?? null;
    if (answer && 'api' in answer && acceptsContract(kind, answer.api, next)) continue;
    // The newest of the versions the target accepts (the catalog may hold one list per contract it reads, joined).
    const entry = (kind === 'theme' ? (catalog.themes ?? []) : (catalog.apps ?? []))
      .filter((x) => x?.id === id && (kind === 'theme' ? validTheme(x, next.theme) : validApp(x, next.apps)))
      .sort((a, b) => compareVersions(b.version, a.version))[0];
    if (!entry) {
      problems.push({ kind, id, why: 'no-accepted-version', version: installed.version });
    } else if (entry.version === installed.version) {
      continue; // the store's version for the target is the one installed
    } else if (changed.length) {
      problems.push({ kind, id, why: 'changed', files: changed });
    } else {
      install.push({
        kind,
        id,
        label: String(kind === 'theme' ? entry.name : entry.label),
        from: installed.version,
        version: entry.version,
        files: entry.files.map(({ path, oid }) => ({ path, oid })),
      });
    }
  }
  return { install, problems };
}

/**
 * The installs file's text as the editor reads it: the installs it has, each valid; nothing else is kept.
 * @param {unknown} text
 * @returns {Install[]}
 */
export function parseInstalls(text) {
  const list = parse(typeof text === 'string' ? text : null)?.installs;
  const text1 = (v) => typeof v === 'string' && v !== '';
  return (Array.isArray(list) ? list : []).filter(
    (x) =>
      (x?.kind === 'app' || x?.kind === 'theme') &&
      [x.id, x.label, x.from, x.version].every(text1) &&
      Array.isArray(x.files) &&
      x.files.length > 0 &&
      x.files.every((f) => text1(f?.path) && text1(f?.oid)),
  );
}

/**
 * The new text of worker/apps.js the build leaves with the installs (an installed app with a Worker part is in it), as the
 * editor commits it with the last app; null when there is none.
 * @param {unknown} text
 * @returns {string | null}
 */
export function parseWorkers(text) {
  const workers = parse(typeof text === 'string' ? text : null)?.workers;
  return typeof workers === 'string' && workers !== '' ? workers : null;
}

/**
 * What the editor's first start does with an install the build left (src/AppList.tsx commitBuildInstalls): commits it only
 * when the item is in the site as the store's own (it has a record), is older than the install, and no file of it was changed
 * in the site. An item the site has already at that version or newer (an earlier start, another tab, the user), one that was
 * uninstalled and one changed in the site is left as it is: the editor never writes over the site's own work.
 * @param {{ version: string }} install
 * @param {{ version: string } | undefined} record the store.json of the item's folder in the site now (undefined: none)
 * @param {string[]} changed the files of the folder that differ from the record
 * @param {(a: string, b: string) => boolean} newer whether the first version is newer than the second (src/store.ts)
 * @returns {'commit' | 'done' | 'gone' | 'changed'}
 */
export function firstStart(install, record, changed, newer) {
  if (!record) return 'gone';
  if (!newer(install.version, record.version)) return 'done';
  return changed.length ? 'changed' : 'commit';
}

/**
 * The site's files after some changes, for the next item's changes to be made from (several installs share the file of apps and the
 * cookie list): a changed file has its new text and keeps its blob id; a deleted one is gone; a new one has no blob id.
 * @template {{ path: string, text?: string, oid?: string | null }} F
 * @param {F[]} files @param {{ path: string, content: string | Uint8Array | null, oid?: string | null }[]} changes @returns {F[]}
 */
export function applyChanges(files, changes) {
  const out = files.filter((f) => !changes.some((c) => c.path === f.path && c.content === null));
  for (const c of changes) {
    if (c.content === null) continue;
    const text = typeof c.content === 'string' ? c.content : new TextDecoder().decode(c.content);
    const at = out.findIndex((f) => f.path === c.path);
    if (at >= 0) out[at] = { ...out[at], text };
    else out.push(/** @type {F} */ ({ path: c.path, text, oid: c.oid ?? null }));
  }
  return out;
}

/**
 * Several items' changes as one commit's: a path changed by more than one keeps the last content and the first blob id (the file as the
 * site has it).
 * @template {{ path: string, content: unknown, oid?: string | null }} C
 * @param {C[]} changes @returns {C[]}
 */
export function mergeChanges(changes) {
  /** @type {Map<string, C>} */
  const by = new Map();
  for (const c of changes) by.set(c.path, by.has(c.path) ? { ...c, oid: by.get(c.path)?.oid } : c);
  return [...by.values()];
}
