// What the start screen (Library.tsx Start) shows over its FAB: at the top a notice of what was updated since the last
// visit in this browser (the CMS and the apps installed from the store), with a close button in its corner, and the last
// three pages and blog posts edited here, each a row that opens its form. Kept in this browser: the versions seen
// (closing the notice sees them) and the paths edited last (App.tsx onSaved, rememberEdit). Exposes rememberEdit,
// UpdatesNotice and RecentEdits. The logic is startView.mjs's; the rows and the notice are ui.tsx's.
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
import { changesSince, nextRecent, type Edit, type Versions } from './startView.mjs';
import type { RepoFile } from './github';
import { GroupTitle, ListItem, Notice, plainListClass } from './ui';
import { INFO_KEY } from '../lib/appRoute.mjs';

const EDITS = 'editor-recent-edits';
const SEEN = 'editor-seen-versions';
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

/** The lists edited from the start screen: pages and blog posts (START_FAB). */
const startLists = collections.filter((c) => START_FAB.includes(c.id));
const startListOf = (path: string) => collectionOf(startLists, path)?.collection;

/** After a save: the file saved (`path`) is the newest edit when it is a page or a blog post; `removed` (the address a
 * post had, a page deleted) is no longer one. */
export function rememberEdit(path: string, removed: string[] = []) {
  const saved = startListOf(path) ? [path] : [];
  if (!saved.length && !removed.length) return;
  const edits = read<Edit[]>(EDITS);
  keep(EDITS, nextRecent(Array.isArray(edits) ? edits : [], saved, removed));
}

/** The last three pages and blog posts edited in this browser that are still there, newest first, in the theme's
 * standard list: each with its list's icon, its title, and its kind and when it was saved. Nothing before the first. */
export function RecentEdits({ files }: { files: RepoFile[] }) {
  const [edits] = useState(() => read<Edit[]>(EDITS) ?? []);
  const rows = (Array.isArray(edits) ? edits : []).flatMap((edit) => {
    const collection = startListOf(edit.path);
    const file = collection && files.find((f) => f.path === edit.path);
    return collection && file ? [{ edit, collection, file }] : [];
  });
  if (!rows.length) return null;
  return (
    <section className="mb-8">
      <GroupTitle>{t.library.recentEdits}</GroupTitle>
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
    </section>
  );
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
  const [changes, setChanges] = useState(() => changesSince(read<Versions>(SEEN), now));
  // Nothing to tell: these are the versions seen (also an app installed since, which is no update).
  useEffect(() => {
    if (!changes.length) keep(SEEN, now);
  }, [changes.length, JSON.stringify(now)]);
  if (!changes.length) return null;
  const close = () => {
    keep(SEEN, now);
    setChanges([]);
  };
  return (
    <div className="mb-8">
      <Notice title={t.library.updatesTitle} onClose={close}>
        <ul className="space-y-1">
          {changes.map((c) => {
            const app = c.id === 'cms' ? null : apps.find((a) => a.id === c.id);
            const name = app ? app.label : t.library.cmsName;
            const href = app ? `#apps/${app.id}/${INFO_KEY}` : `#${CMS_ROUTE}`;
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
