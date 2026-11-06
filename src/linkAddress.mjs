// The pure parts of the list of links (LinkList.tsx): an address as typed made one (typedLink), what is wrong with an
// address (problemOf), the name and the shown form of a link (nameOf, shownAddress).
// Exposes typedLink, problemOf, nameOf, shownAddress. Uses networkOf and hostOf of site/social.mjs.
import { hostOf, networkOf } from '../site/social.mjs';

// A real scheme: letters, then ":" not followed by a digit (mailto:, ftp:); "host:443/path" is a host with a port.
const SCHEME = /^[a-z][a-z0-9+.-]*:(?!\d)/i;

/**
 * An address as typed, as one: https:// before one without it (instagram.com/acme), and in place of http://.
 * @param {string} typed
 * @returns {string}
 */
export function typedLink(typed) {
  const text = typed.trim();
  if (!text) return '';
  if (/^https:\/\//i.test(text)) return text;
  if (/^http:\/\//i.test(text)) return `https://${text.slice('http://'.length)}`;
  if (SCHEME.test(text)) return text;
  return `https://${text.replace(/^\/+/, '')}`;
}

/**
 * What is wrong with an address: none (null), not one, or one already in the list (but for the link itself).
 * @param {string} url
 * @param {number | null} index  the place of the link being changed (null: a new one)
 * @param {unknown[]} urls  the addresses in the list
 * @param {{ pattern?: [string, string], noAddress: string, twice: string }} rules
 * @returns {string | null}
 */
export function problemOf(url, index, urls, rules) {
  if (!url) return rules.noAddress;
  if (rules.pattern && !new RegExp(rules.pattern[0]).test(url)) return rules.pattern[1];
  if (urls.some((u, i) => i !== index && String(u ?? '').trim() === url)) return rules.twice;
  return null;
}

/**
 * A link's name: its network's, or its host for one not known (the address itself when it is not one).
 * @param {string} url
 * @returns {string}
 */
export const nameOf = (url) => networkOf(url)?.name ?? (hostOf(url) || url);

/**
 * The address as it is shown under its name: without https:// and the slash at the end.
 * @param {string} url
 * @returns {string}
 */
export const shownAddress = (url) => url.replace(/^https:\/\//i, '').replace(/\/$/, '');
