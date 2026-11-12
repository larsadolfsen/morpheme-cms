// A page or blog post that gets a new address (URL under "Other fields", EntryForm.tsx): the old
// address sends visitors on to the new one (301), from src/data/redirects.json, which the Worker reads
// (packages/editor/worker/index.js) and follows to where it ends, so there is one redirect and no chain. The links to
// the old address in the texts, the menu and the other files are changed to the new one in the same
// commit. Before it is saved, the redirects are checked for a loop.
import { slugify } from './schema';
import { config } from '@site/config';
import { t } from './i18n';
import { retargetLink } from '../lib/retarget.mjs';

export const REDIRECTS = config.redirects;

/** Old address -> new address, e.g. "/om/" -> "/om-mig/". */
export type Redirects = Record<string, string>;

/** What is typed as an address, as one: "/ny-side/" (a page may have more parts, "/ydelser/raadgivning/";
 * a blog post only one). With or without the slashes or the site's domain; '' when nothing is left. */
export function addressOf(typed: string, kind: 'page' | 'post'): string {
  const parts = typed
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .split('/')
    .map(slugify)
    .filter(Boolean);
  if (!parts.length) return '';
  return kind === 'post' ? `/${parts.join('-')}/` : `/${parts.join('/')}/`;
}

/** The redirects read from their file (an empty list without it). */
export const readRedirects = (text: string | undefined): Redirects => (text ? (JSON.parse(text) as Redirects) : {});

/** The redirects written as their file: by old address, one to a line. */
export const writeRedirects = (redirects: Redirects) =>
  `${JSON.stringify(Object.fromEntries(Object.entries(redirects).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`;

// Where an address ends when it is sent on, and a loop when it comes back to one it has been at.
function follow(redirects: Redirects, from: string): { end: string; loop: string[] | null } {
  const seen = [from];
  let at = from;
  while (redirects[at.split('#')[0]] !== undefined) {
    at = redirects[at.split('#')[0]];
    if (seen.includes(at.split('#')[0])) return { end: at, loop: [...seen, at] };
    seen.push(at);
  }
  return { end: at, loop: null };
}

/** The redirects when a page moves from one address to another (from null: a new page at `to`): `to`
 * is a page now, so it no longer sends on; `from` sends on to `to`, and so does every address that
 * sent on to `from`. A message instead when they would send in a loop. */
export function moveRedirects(redirects: Redirects, from: string | null, to: string): Redirects | string {
  const next: Redirects = {};
  for (const [old, target] of Object.entries(redirects)) {
    if (old === to) continue;
    const [base, part] = target.split('#');
    next[old] = from && base === from ? (part === undefined ? to : `${to}#${part}`) : target;
  }
  if (from && from !== to) next[from] = to;
  for (const old of Object.keys(next)) {
    const { end, loop } = follow(next, old);
    if (loop) return t.app.addressLoop(loop.join(' → '));
    // One redirect to where it ends, not a chain.
    next[old] = end;
  }
  return next;
}

export const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A text with its links to an old address changed to the new one: in Markdown links, in HTML and in
 * the JSON of the data files and of the blocks (&quot;…&quot;), also with the site's domain before it,
 * and with a #part or ?query after it. Not an address that only starts with it (a page under it). */
export const retarget = (text: string, from: string, to: string): string => retargetLink(text, from, to, config.domain);
