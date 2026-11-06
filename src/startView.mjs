/**
 * What the editor's start screen (Library.tsx Start, StartScreen.tsx) shows besides its FAB: the pages and blog posts
 * edited last in this browser, and what was updated since the last visit (the CMS and the apps from the store).
 * Exposes `nextRecent` and `changesSince`. Depends on nothing; the browser's storage is StartScreen.tsx's.
 */

/** How many paths are kept: more than shown, so a deleted page still leaves three. */
export const KEPT = 10;

/**
 * @typedef {{ path: string, at: number }} Edit
 */

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
  return [...[...new Set(saved)].map((path) => ({ path, at })), ...edits.filter((e) => !gone.has(e.path))]
    .filter((e) => !removed.includes(e.path))
    .slice(0, KEPT);
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
