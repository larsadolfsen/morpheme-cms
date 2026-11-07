// Reads and writes the site's file of apps (src/data/apps.json): the apps installed and those turned off ("off").
// Exposes readAppsFile, activeOf, appsFileText, withInstalled, withOff. No dependencies; lib/apps.mjs, src/apps.ts,
// site/apps.ts, src/store.ts, src/AppList.tsx and worker/index.js use it.

/** @typedef {{ installed: string[], off: string[] }} AppsState */

/** Sorted ids without duplicates; only strings are kept. @param {unknown} list @returns {string[]} */
const ids = (list) => [...new Set(Array.isArray(list) ? list.filter((id) => typeof id === 'string') : [])].sort();

/** The state with clean lists: `off` holds only ids that are installed. @param {AppsState} state @returns {AppsState} */
const clean = (state) => {
  const installed = ids(state.installed);
  return { installed, off: ids(state.off).filter((id) => installed.includes(id)) };
};

/** Reads the text of src/data/apps.json. Bad JSON, undefined, or wrong types give empty lists.
 * Keeps only string ids. Sorts and removes duplicates. Drops ids in `off` that are not in `installed`.
 * @param {string | undefined} text @returns {AppsState} */
export function readAppsFile(text) {
  try {
    const data = JSON.parse(text ?? '');
    return clean({ installed: data?.installed, off: data?.off });
  } catch {
    return { installed: [], off: [] };
  }
}

/** The active apps: `installed` minus `off`, sorted. @param {AppsState} state @returns {string[]} */
export function activeOf(state) {
  const { installed, off } = clean(state);
  return installed.filter((id) => !off.includes(id));
}

/** The file text: JSON.stringify with 2-space indentation plus a final "\n". Sorted lists, no duplicates.
 * `off` keeps only ids in `installed`. No `off` key when `off` is empty. Key order: installed, off.
 * @param {AppsState} state @returns {string} */
export function appsFileText(state) {
  const { installed, off } = clean(state);
  return JSON.stringify(off.length ? { installed, off } : { installed }, null, 2) + '\n';
}

/** The state with `id` installed (`yes` true) or uninstalled (`yes` false). Uninstall also removes `id` from `off`.
 * @param {AppsState} state @param {string} id @param {boolean} yes @returns {AppsState} */
export function withInstalled(state, id, yes) {
  const { installed, off } = clean(state);
  return yes
    ? { installed: ids([...installed, id]), off }
    : { installed: installed.filter((x) => x !== id), off: off.filter((x) => x !== id) };
}

/** The state with `id` deactivated (`off` true) or active (`off` false). No change when `id` is not installed.
 * @param {AppsState} state @param {string} id @param {boolean} off @returns {AppsState} */
export function withOff(state, id, off) {
  const now = clean(state);
  if (!now.installed.includes(id)) return now;
  return { installed: now.installed, off: off ? ids([...now.off, id]) : now.off.filter((x) => x !== id) };
}
