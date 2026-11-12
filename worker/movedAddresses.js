// The public addresses that got a new name: old prefix -> new prefix, shipped with each CMS version (a site's own
// redirects are data the package cannot write to). Exposes MOVED_PREFIXES and movedAddress (pure); worker/index.js asks it.
// A line is added here in the same pull request that renames the pages, never before: the Worker answers first.

/**
 * Old address prefix (with both slashes) and its new prefix. A line is added in the pull request that renames the pages:
 * `/blog/kategori/` became `/blog/tags/`, and `/ny/` became `/new/`.  // language-ok: an old public address
 * scripts/retarget-links.mjs reads this list to rewrite a site's own links.
 * @type {[string, string][]}
 */
export const MOVED_PREFIXES = [
  ['/blog/kategori/', '/blog/tags/'], // language-ok: an old public address
  ['/ny/', '/new/'], // language-ok: an old public address
];

/**
 * The new address of a path that starts with an old prefix, the rest of it kept (a nested slug, `?` and `#` parts); else
 * undefined. A new prefix never starts with an old one, so the answer is never moved again.
 * @param {string} path
 * @param {[string, string][]} [prefixes]
 * @returns {string | undefined}
 */
export function movedAddress(path, prefixes = MOVED_PREFIXES) {
  for (const [old, now] of prefixes) if (path.startsWith(old)) return now + path.slice(old.length);
  return undefined;
}
