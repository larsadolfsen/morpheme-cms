// The public addresses that got a new name: old prefix -> new prefix, shipped with each CMS version (a site's own
// redirects are data the package cannot write to). Exposes MOVED_PREFIXES and movedAddress (pure); worker/index.js asks it.
// A line is added here in the same pull request that renames the pages, never before: the Worker answers first.

/**
 * Old address prefix (with both slashes) and its new prefix. Empty until the pages are renamed: `/blog/kategori/` and  // language-ok: an old public address
 * `/ny/` still serve pages, and a redirect from them would send visitors to a 404. The rename adds  // language-ok: an old public address
 * `['/blog/kategori/', '/blog/tags/']` and `['/ny/', '/new/']`.  // language-ok: an old public address
 * @type {[string, string][]}
 */
export const MOVED_PREFIXES = [];

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
