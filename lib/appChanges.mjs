// The changes that install, update or uninstall an app from the store: its folder (folderChanges) and the site's file of
// apps (apps.json), where the app is added or removed and its place in "off" is kept. Exposes appChanges (src/store.ts).
// Depends on ./folderChanges.mjs and ./appsFile.mjs.
import { appsFileText, readAppsFile, withInstalled } from './appsFile.mjs';
import { folderChanges } from './folderChanges.mjs';

/** The changes that make an app's folder (`folder`, its files now `current`) the store's version, or remove it (`next`
 * null: uninstalling); and the site's file of apps (`appsPath`, `file`: it now, if there is one) with the app among those
 * installed or not. An update keeps the app turned off; uninstalling takes it out of "off". In one commit.
 * @param {string} folder @param {string} appsPath @param {string} id
 * @param {{ path: string, oid: string }[]} current
 * @param {Parameters<typeof folderChanges>[2]} next
 * @param {{ text: string, oid: string } | undefined} file
 * @returns {ReturnType<typeof folderChanges>} */
export function appChanges(folder, appsPath, id, current, next, file) {
  const changes = folderChanges(folder, current, next);
  const text = appsFileText(withInstalled(readAppsFile(file?.text), id, !!next));
  if (text !== file?.text) changes.push({ path: appsPath, content: text, oid: file?.oid || null });
  return changes;
}
