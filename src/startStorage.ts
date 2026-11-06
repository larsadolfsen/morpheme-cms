// What the start screen keeps in this browser (localStorage): the paths saved last, the versions seen, and when the
// "Continue" card was closed. Exposes `readStored`, `keepStored`, the keys, `storedEdits`, `storedSeen`, `startListOf`
// and `rememberEdit` (App.tsx onSaved). The rules for what is usable are startView.mjs's.
import { START_FAB } from './fabScreens';
import { collectionOf } from './schema';
import { collections } from './site';
import { nextRecent, unversioned, validEdits, versioned, type Versions } from './startView.mjs';

export const EDITS = 'editor-recent-edits';
export const SEEN = 'editor-seen-versions';
export const CLOSED = 'editor-continue-closed';

export function readStored<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

export function keepStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** The edits kept in this browser: only the usable ones, none when the stored data has another version. */
export const storedEdits = () => validEdits(unversioned(readStored(EDITS)));

/** The versions seen at the last visit; null when there are none or the stored data is not usable. */
export function storedSeen(): Versions | null {
  const seen = unversioned(readStored(SEEN)) as Versions | null;
  return seen && typeof seen === 'object' ? seen : null;
}

/** The lists edited from the start screen: pages and blog posts (START_FAB). */
const startLists = collections.filter((c) => START_FAB.includes(c.id));
export const startListOf = (path: string) => collectionOf(startLists, path)?.collection;

/** After a save: the file saved (`path`) is the newest edit when it is a page or a blog post; `removed` (the address a
 * post had, a page deleted) is no longer one. */
export function rememberEdit(path: string, removed: string[] = []) {
  const saved = startListOf(path) ? [path] : [];
  if (!saved.length && !removed.length) return;
  keepStored(EDITS, versioned(nextRecent(storedEdits(), saved, removed)));
}
