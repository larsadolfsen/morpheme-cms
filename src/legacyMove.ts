// The legacy move: a store app or theme installed under its old id (folder `src/apps/mailchimp/`) moves to its permanent
// id (`app_` or `theme_` plus 16 hex) when it is updated. Exposes legacyOf (is a legacy copy installed?) and moveChanges
// (one list of changes: new folder, old files deleted, every id rewritten; docs/store-ids.md Table 1). Pure; the site's
// paths are passed in (store.ts binds them to the site's config). Depends on lib/folderChanges.mjs.
import type { Change, RepoFile } from './github';
import { folderChanges } from '../lib/folderChanges.mjs';
import type { StoreRecord } from './store';

/** Where a site keeps what names an app or a theme (the site's config, and the popups' folder). */
export type SitePaths = {
  appsFolder: string;
  themesFolder: string;
  installed: string;
  settings: string;
  theme: string;
  icons: string;
  blockSettings: string;
  popups: string;
  cookieList: string;
};

type Next = { files: { path: string; content: string | Uint8Array }[]; record: StoreRecord };

/** The old id of a catalog entry (`entry.legacy`) when a folder of that name is installed from the store (`folders`: the
 * apps or themes the site has, with `store` when the folder has a store.json); else null (none, or the site's own). */
export function legacyOf(entry: { legacy?: string }, folders: { id: string; store?: unknown }[]): string | null {
  return entry.legacy && folders.some((f) => f.id === entry.legacy && f.store) ? entry.legacy : null;
}

const parse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** A file with a value changed (`change` gives the new JSON, or undefined when nothing in it names the legacy id). */
function rewrite(files: RepoFile[], change: (json: any) => any): Change[] {
  return files.flatMap((f) => {
    const json = parse(f.text);
    const out = json && typeof json === 'object' ? change(json) : undefined;
    return out === undefined ? [] : [{ path: f.path, content: `${JSON.stringify(out, null, 2)}\n`, oid: f.oid }];
  });
}

const inFolder = (site: RepoFile[], folder: string) => site.filter((f) => f.path.startsWith(`${folder}/`) && f.path.endsWith('.json'));
const only = (site: RepoFile[], path: string) => site.filter((f) => f.path === path);

/** The changes that make the folder `current` (the legacy folder, or the item's own when it has no legacy) the store's
 * version of `entry` in its permanent folder. With a legacy id they also delete the legacy folder's files and rewrite
 * every value that names it (`site`: the site's files now). In one commit. */
export function moveChanges(
  entry: { id: string },
  legacy: string | null,
  next: Next,
  current: RepoFile[],
  site: RepoFile[],
  paths: SitePaths,
): Change[] {
  const isApp = entry.id.startsWith('app_');
  const folder = (id: string) => `${isApp ? paths.appsFolder : paths.themesFolder}/${id}`;
  if (!legacy) return folderChanges(folder(entry.id), current, next);
  const swap = (v: unknown) => (v === legacy ? entry.id : undefined);
  const changes = [...folderChanges(folder(entry.id), [], next), ...folderChanges(folder(legacy), current, null)];
  if (isApp) {
    changes.push(
      ...rewrite(only(site, paths.installed), (j) =>
        Array.isArray(j.installed) && j.installed.includes(legacy)
          ? { ...j, installed: [...new Set(j.installed.map((x: unknown) => (x === legacy ? entry.id : x)))].sort() }
          : undefined,
      ),
      ...rewrite(inFolder(site, paths.popups), (j) => (swap(j.type) ? { ...j, type: entry.id } : undefined)),
      ...rewrite(inFolder(site, paths.cookieList), (j) => (swap(j.app) ? { ...j, app: entry.id } : undefined)),
      ...rewrite(only(site, paths.blockSettings), (j) => {
        const off = Array.isArray(j.off)
          ? j.off.map((x: unknown) => (typeof x === 'string' && x.endsWith(`/${legacy}`) ? `${x.slice(0, -legacy.length)}${entry.id}` : x))
          : [];
        return off.some((x: unknown, i: number) => x !== j.off[i]) ? { ...j, off } : undefined;
      }),
    );
    // The settings file is renamed with its content kept.
    const old = site.find((f) => f.path === `${paths.settings}/${legacy}.json`);
    if (old)
      changes.push(
        { path: old.path, content: null, oid: old.oid },
        { path: `${paths.settings}/${entry.id}.json`, content: old.text, oid: null },
      );
  } else {
    changes.push(
      ...rewrite(only(site, paths.theme), (j) => (swap(j.theme) ? { ...j, theme: entry.id } : undefined)),
      ...rewrite(only(site, paths.icons), (j) =>
        typeof j.pack === 'string' && j.pack.startsWith(`${legacy}/`)
          ? { ...j, pack: `${entry.id}${j.pack.slice(legacy.length)}` }
          : undefined,
      ),
    );
  }
  return changes;
}

/** The site's files as they are after `changes` (a changed file with its new text, a deleted one gone, a new one added),
 * for what must be worked out from the site after a move (the cookie list). */
export function appliedTo(site: RepoFile[], changes: Change[]): RepoFile[] {
  const by = new Map(changes.map((c) => [c.path, c]));
  const kept = site.flatMap((f) => {
    const c = by.get(f.path);
    return !c ? [f] : typeof c.content === 'string' ? [{ ...f, text: c.content }] : [];
  });
  const added = changes.filter((c) => typeof c.content === 'string' && !site.some((f) => f.path === c.path));
  return [...kept, ...added.map((c) => ({ path: c.path, oid: '', text: c.content as string }))];
}

/** Two lists of changes as one: for a path in both, the later one wins (a file rewritten by the move, then deleted by the
 * cookie list), its `oid` that of the site's file; so no file is changed twice. */
export function mergeChanges(first: Change[], later: Change[]): Change[] {
  const oid = new Map(first.map((c) => [c.path, c.oid]));
  const paths = new Set(later.map((c) => c.path));
  return [...first.filter((c) => !paths.has(c.path)), ...later.map((c) => (oid.has(c.path) ? { ...c, oid: oid.get(c.path)! } : c))];
}
