// What the start screen (Library.tsx Start) shows over its FAB: at the top a notice of what was updated since the last
// visit in this browser (the CMS and the apps installed from the store), and "Continue where you left off", a card with
// the last three pages and blog posts saved, each a row that opens its form; each closes with the button in its top end
// corner. Kept in this browser: the versions seen (closing the notice sees them), the paths saved last here (App.tsx
// onSaved, rememberEdit) and when the card was closed. Exposes rememberEdit, UpdatesNotice and ContinueCard. The logic
// is startView.mjs's; the rows, the card and the notice are the theme's (ui.tsx).
import { useEffect, useState } from 'react';
import { version } from '../package.json';
import { locale, t } from './i18n';
import { CMS_ROUTE } from './CmsPage';
import { START_FAB } from './fabScreens';
import { nameOf } from './deploy';
import { installedApps } from './apps';
import { collectionOf } from './schema';
import { apps, collections, icons } from './site';
import { when } from './when';
import { loadSavedTimes, saved } from './savedTimes';
import { changesSince, continueShown, latestEdits, nextRecent, unversioned, validEdits, versioned, type Versions } from './startView.mjs';
import type { RepoFile } from './github';
import type { Env } from './App';
import { SiteCard } from './themeUi';
import { CloseButton, ListItem, Notice, plainListClass } from './ui';
import { appHref } from './AppList';
import { INFO_KEY } from '../lib/appRoute.mjs';

const EDITS = 'editor-recent-edits';
const SEEN = 'editor-seen-versions';
const CLOSED = 'editor-continue-closed';
const SHOWN = 3;

/** A list's singular as it starts a line: "side" as "Side". */
const capital = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

function read<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

function keep(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** The edits kept in this browser: only the usable ones, none when the stored data has another version. */
const storedEdits = () => validEdits(unversioned(read(EDITS)));

/** The lists edited from the start screen: pages and blog posts (START_FAB). */
const startLists = collections.filter((c) => START_FAB.includes(c.id));
const startListOf = (path: string) => collectionOf(startLists, path)?.collection;

/** After a save: the file saved (`path`) is the newest edit when it is a page or a blog post; `removed` (the address a
 * post had, a page deleted) is no longer one. */
export function rememberEdit(path: string, removed: string[] = []) {
  const saved = startListOf(path) ? [path] : [];
  if (!saved.length && !removed.length) return;
  keep(EDITS, versioned(nextRecent(storedEdits(), saved, removed)));
}

/** "Continue where you left off": a card with the last three pages and blog posts saved, newest first, in the theme's
 * standard list (its list's icon, its title, its kind and when it was saved), each opening its form. Those saved in this
 * browser and, once GitHub has answered, those saved on the site by anyone (env.savedAt). The close button in its top
 * end corner hides it until something is saved after that; with nothing saved yet it says where they will be. */
export function ContinueCard({ files, savedAt }: { files: RepoFile[]; savedAt: Env['savedAt'] }) {
  const [edits] = useState(storedEdits);
  const [closedAt, setClosedAt] = useState(() => read<number>(CLOSED));
  const startFiles = files.filter((f) => startListOf(f.path));
  // When each page and post was last saved on the site, from the cache the lists use (savedTimes.ts); null until GitHub
  // has answered (or could not).
  const [history, setHistory] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    let live = true;
    const fromCache = () =>
      Object.fromEntries(startFiles.flatMap((f) => (saved.has(f.path) ? [[f.path, saved.get(f.path)!.date.getTime()]] : [])));
    loadSavedTimes(savedAt, startFiles).then(
      () => live && setHistory(fromCache()),
      () => live && setHistory(fromCache()),
    );
    return () => {
      live = false;
    };
  }, [startFiles.map((f) => `${f.path}@${f.oid}`).join()]);
  const rows = latestEdits(edits, history ?? {}).flatMap((edit) => {
    const collection = startListOf(edit.path);
    const file = collection && files.find((f) => f.path === edit.path);
    return collection && file ? [{ edit, collection, file }] : [];
  });
  if (!continueShown(closedAt, rows[0]?.edit.at)) return null;
  const close = () => {
    const now = Date.now();
    keep(CLOSED, now);
    setClosedAt(now);
  };
  return (
    <SiteCard kind="outlined" as="section" aria-labelledby="continue-title" className="relative mb-8 [--card-padding:1rem_0_0.5rem]">
      <h2 id="continue-title" className="ps-4 pe-14 pb-2 font-medium">
        {t.library.continueTitle}
      </h2>
      <CloseButton onClick={close} />
      {rows.length ? (
        <ul className={plainListClass}>
          {rows.slice(0, SHOWN).map(({ edit, collection, file }) => (
            <ListItem
              key={edit.path}
              href={`#${edit.path}`}
              icon={icons[collection.id]}
              headline={nameOf(collection, file)}
              supporting={t.library.recentEdit(capital(collection.singular ?? collection.label), when(new Date(edit.at)))}
              truncate
            />
          ))}
        </ul>
      ) : (
        <p className="px-4 pb-2 text-sm text-muted">{history ? t.library.continueEmpty : t.app.loading}</p>
      )}
    </SiteCard>
  );
}

/** The versions seen at the last visit; null when there are none or the stored data is not usable. */
function storedSeen(): Versions | null {
  const seen = unversioned(read(SEEN)) as Versions | null;
  return seen && typeof seen === 'object' ? seen : null;
}

/** The CMS's version and those of the apps installed from the store, as the editor is built with them now. */
function versionsNow(files: RepoFile[]): Versions {
  const installed = installedApps(files);
  return {
    cms: version,
    apps: Object.fromEntries(apps.filter((a) => a.store && installed.includes(a.id)).map((a) => [a.id, a.store!.version])),
  };
}

/** At the top of the start screen: what was updated since the last visit in this browser, each a link to what is new
 * in it (the CMS's page, an app's Information tab), with a close button that marks it seen. The first visit, and a
 * visit with nothing new, only notes the versions. */
export function UpdatesNotice({ files }: { files: RepoFile[] }) {
  const now = versionsNow(files);
  const [changes, setChanges] = useState(() => changesSince(storedSeen(), now));
  // Nothing to tell: these are the versions seen (also an app installed since, which is no update).
  useEffect(() => {
    if (!changes.length) keep(SEEN, versioned(now));
  }, [changes.length, JSON.stringify(now)]);
  if (!changes.length) return null;
  const close = () => {
    keep(SEEN, versioned(now));
    setChanges([]);
  };
  return (
    <div className="mb-8">
      <Notice title={t.library.updatesTitle} onClose={close}>
        <ul className="space-y-1">
          {changes.map((c) => {
            const app = c.id === 'cms' ? null : apps.find((a) => a.id === c.id);
            const name = app ? app.label : t.library.cmsName;
            const href = app ? `${appHref(app)}/${INFO_KEY}` : `#${CMS_ROUTE}`;
            return (
              <li key={c.id}>
                <a href={href} className="underline underline-offset-2 hover:text-accent">
                  {t.library.updatedTo(name, c.version)}
                </a>
              </li>
            );
          })}
        </ul>
      </Notice>
    </div>
  );
}
