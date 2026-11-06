/**
 * What the editor's start screen (Library.tsx Start, ContinueCard.tsx, UpdatesNotice.tsx) shows besides its FAB: the pages and blog posts
 * edited last in this browser, and what was updated since the last visit (the CMS and the apps from the store).
 * Exposes `STORE_VERSION`, `versioned`, `unversioned`, `validEdits`, `nextRecent`, `latestEdits`, `continueShown` and `changesSince`.
 * Depends on nothing; the browser's storage is startStorage.ts's.
 */

/** How many paths are kept: more than shown, so a deleted page still leaves three. */
export const KEPT = 10;

/** The version of the stored data's shape: data stored with another one is dropped, not read. */
export const STORE_VERSION = 1;

/**
 * @typedef {{ path: string, at: number }} Edit
 */

/**
 * Data as it is stored, with the version of its shape.
 * @template T
 * @param {T} data
 * @returns {{ v: number, data: T }}
 */
export const versioned = (data) => ({ v: STORE_VERSION, data });

/**
 * The data of a stored value, or null when it has no version or another one (a later shape, a hand-edited value).
 * @param {unknown} stored
 * @returns {unknown}
 */
export function unversioned(stored) {
  return stored && typeof stored === 'object' && stored.v === STORE_VERSION ? (stored.data ?? null) : null;
}

/**
 * The entries of a stored list that can be used: those with a string `path` and a finite number `at`. Anything that is
 * not a list gives an empty one.
 * @param {unknown} list
 * @returns {Edit[]}
 */
export function validEdits(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((e) => e && typeof e.path === 'string' && typeof e.at === 'number' && Number.isFinite(e.at));
}

/**
 * The pages and posts edited last, newest first, after a save at `at`: the saved paths first (in the order given),
 * each once, without the removed ones (a post that got a new address, a deleted page), at most KEPT.
 * @param {Edit[]} edits
 * @param {string[]} saved
 * @param {string[]} [removed]
 * @param {number} [at]
 * @returns {Edit[]}
 */
export function nextRecent(edits, saved, removed = [], at = Date.now()) {
  const gone = new Set([...removed, ...saved]);
  return [...[...new Set(saved)].map((path) => ({ path, at })), ...validEdits(edits).filter((e) => !gone.has(e.path))]
    .filter((e) => !removed.includes(e.path))
    .slice(0, KEPT);
}

/**
 * The pages and posts saved last, newest first: those saved in this browser (`edits`) and when each file was last
 * saved on the site by anyone (`history`, from GitHub, by path), each path once at its latest time.
 * @param {Edit[]} edits
 * @param {Record<string, number>} history
 * @returns {Edit[]}
 */
export function latestEdits(edits, history) {
  const at = new Map(Object.entries(history));
  for (const e of validEdits(edits)) at.set(e.path, Math.max(e.at, at.get(e.path) ?? 0));
  return [...at].map(([path, time]) => ({ path, at: time })).sort((a, b) => b.at - a.at);
}

/**
 * Whether "Continue where you left off" is shown: until it is closed (`closedAt`), and again once something is saved
 * after that (`latestAt`, the newest edit's time).
 * @param {unknown} closedAt (anything but a number counts as not closed)
 * @param {number | undefined} latestAt
 * @returns {boolean}
 */
export function continueShown(closedAt, latestAt) {
  if (typeof closedAt !== 'number' || !Number.isFinite(closedAt) || !closedAt) return true;
  return (latestAt ?? 0) > closedAt;
}

/**
 * @typedef {{ cms: string, apps: Record<string, string> }} Versions
 */

/**
 * What has a version other than at the last visit: the CMS (`id` "cms") and each app installed then and now, with its
 * version now. Nothing at the first visit (`seen` null): there is nothing to compare with. An app installed since is
 * not an update.
 * @param {Versions | null} seen
 * @param {Versions} now
 * @returns {{ id: string, version: string }[]}
 */
export function changesSince(seen, now) {
  if (!seen) return [];
  const changed = [];
  if (seen.cms && now.cms && seen.cms !== now.cms) changed.push({ id: 'cms', version: now.cms });
  for (const [id, version] of Object.entries(now.apps)) {
    const before = seen.apps?.[id];
    if (before && version && before !== version) changed.push({ id, version });
  }
  return changed;
}
