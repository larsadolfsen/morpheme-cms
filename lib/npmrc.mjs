// The install lines of a site's .npmrc: npm uses its cache first and skips the network checks (audit, fund), which makes the
// install on Cloudflare's build faster. The starter ships the file; the CMS update adds the missing lines to an existing site.
// Exposes INSTALL_DEFAULTS and withInstallDefaults. No dependencies, no I/O (runs in a Worker and in Node).

/** The settings, in the order they are written. */
export const INSTALL_DEFAULTS = { 'prefer-offline': 'true', audit: 'false', fund: 'false' };

/**
 * The text of the site's .npmrc with every missing setting added at the end; a setting the file has (any value) and every other
 * line stay as they are, and the file's line ending is kept. Giving the result back gives the same text.
 * @param {string | null | undefined} text the file's text, or nothing when the site has no .npmrc
 * @returns {string}
 */
export function withInstallDefaults(text) {
  const original = typeof text === 'string' ? text : '';
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const has = new Set();
  for (const line of original.split(/\r?\n/)) {
    const key = /^\s*([^#;=\s][^=]*?)\s*=/.exec(line)?.[1];
    if (key) has.add(key);
  }
  const missing = Object.entries(INSTALL_DEFAULTS).filter(([key]) => !has.has(key));
  if (!missing.length) return original;
  const body = original === '' || original.endsWith('\n') ? original : original + eol;
  return body + missing.map(([key, value]) => `${key}=${value}${eol}`).join('');
}
