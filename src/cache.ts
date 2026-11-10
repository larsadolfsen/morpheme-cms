// The site's files as the editor last loaded them, kept in this browser (IndexedDB), with the commit
// they are from and who was logged in. The editor opens with them at once, and loads the files from
// GitHub again only when the branch has a newer commit (App.tsx). Cleared on "Log out".
import type { RepoFile, Viewer } from './github';

/** folders: which folders the files are from (App.tsx FOLDERS), so files kept by an editor that
 * loaded fewer folders (before "Medier") are loaded again. */
export type Cached = { commit: string; files: RepoFile[]; user: Viewer; folders?: string };

const STORE = 'cache';
const KEY = 'files';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('editor', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readCache(): Promise<Cached | null> {
  try {
    const db = await open();
    return await new Promise((resolve) => {
      const request = db.transaction(STORE).objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve((request.result as Cached | undefined) ?? null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Keeps the files; null forgets them. */
export async function writeCache(cached: Cached | null) {
  try {
    const store = (await open()).transaction(STORE, 'readwrite').objectStore(STORE);
    if (cached) store.put(cached, KEY);
    else store.delete(KEY);
  } catch {}
}
