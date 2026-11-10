// Rewrites links to a changed public address inside a text: the one pattern behind `retarget` (src/addresses.ts, the
// editor, a page that gets a new address) and scripts/retarget-links.mjs (a site's links to a renamed prefix).
// Pure. Depends on nothing.

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// What may come right before an address: a quote, "(", &quot; or the site's own domain (never empty: an empty domain would match anywhere).
const before = (domain) => `(?<=["'(]|&quot;${domain ? `|${escape(domain)}` : ''})`;

/**
 * A text with its links to an address changed: in Markdown links, in HTML and in the JSON of data files and blocks
 * (&quot;…&quot;), also with the site's domain before it, and with a #part or ?query after it. Not an address that only
 * starts with it (a page under it).
 * @param {string} text @param {string} from @param {string} to @param {string} [domain]
 */
export function retargetLink(text, from, to, domain = '') {
  const at = new RegExp(`${before(domain)}${escape(from)}(?=["')#?\\s]|&quot;)`, 'g');
  return text.replace(at, to);
}

/**
 * The same for every address under an old prefix (`/blog/kategori/` and `/blog/kategori/x/`), the rest of the address kept.  // language-ok: an old public address
 * Not a prefix that only appears inside a longer path (`/blog/a/blog/kategori/`).  // language-ok: an old public address
 * @param {string} text @param {string} from @param {string} to @param {string} [domain]
 */
export function retargetPrefix(text, from, to, domain = '') {
  return text.replace(new RegExp(`${before(domain)}${escape(from)}`, 'g'), to);
}
