// The versions of a page or blog post: the page file in src/content/ (the live version, or an unpublished page: `status: draft`) and
// the waiting versions, files of their own in src/drafts/ that no build reads, so saving one changes nothing on the site.
//   src/content/pages/about.md              the page file
//   src/drafts/pages/about.md               its waiting version (id `waiting`)
//   src/drafts/pages/about/<id>.md          more versions of it (id a plain slug); the core uses at most the first
// A version is `{ id, state, publishAt? }`: state `live` (the page file, published), `unpublished` (the page file, a draft) or
// `waiting` (a file in src/drafts/, `publishAt` in its front matter when it is scheduled, Danish time "2026-11-01T08:00").
// `publish`, `schedule`, `unpublish`, `discard` and `saveDraft` are plain text and path functions: they take the page
// `{ path, text, drafts }` (`drafts`: the text of each waiting version by id) and give the changes to commit,
// `{ path, text }` and `{ path, text: null }` to delete a file. The editor, the site's Worker and an app call the same ones,
// each with a version id (default `waiting`). No dependencies, so the Worker can use it.
import { isDue } from './scheduled.mjs';

export const DRAFTS = 'src/drafts';
export const WAITING = 'waiting';
const CONTENT = 'src/content';

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---/;
const line = (name) => new RegExp(`^${name}: *"?([^"\\r\\n]*)"?\\r?\\n?`, 'm');

/** @typedef {{ id: string; state: 'live' | 'unpublished' | 'waiting'; publishAt?: string }} Version */
/** @typedef {{ path: string; text: string; drafts?: Record<string, string> }} Page */
/** @typedef {{ path: string; text: string | null }} Change */

/** Whether a version id is allowed: a plain slug (not a number's place, and not `index`, which a page's own folder uses). @param {unknown} id */
export const isVersionId = (id) => typeof id === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(id) && id !== 'index';

/** The file of a page's version in src/drafts/, from the page file's path.
 * @param {string} livePath @param {string} [id] @returns {string} */
export function draftPath(livePath, id = WAITING) {
  if (!isVersionId(id)) throw new Error(`Not a version id: ${id}`);
  if (!livePath.startsWith(`${CONTENT}/`) || !livePath.endsWith('.md')) throw new Error(`Not a page file: ${livePath}`);
  const rest = livePath.slice(CONTENT.length + 1, -'.md'.length);
  return id === WAITING ? `${DRAFTS}/${rest}.md` : `${DRAFTS}/${rest}/${id}.md`;
}

/** The page file and the version id of a file in src/drafts/, or null for another file. The version `waiting` is `<page>.md`,
 * any other `<page>/<id>.md`; which one it is cannot be told from the path alone, so `pages` (the paths of the page
 * files that exist) decides: a draft of a page is the version of it whose page file is there, the longest match first.
 * @param {string} path @param {string[]} pages @returns {{ path: string; id: string } | null} */
export function pageOf(path, pages) {
  if (!path.startsWith(`${DRAFTS}/`) || !path.endsWith('.md')) return null;
  const rest = path.slice(DRAFTS.length + 1, -'.md'.length);
  const own = `${CONTENT}/${rest}.md`;
  const slash = rest.lastIndexOf('/');
  const other = slash > 0 ? `${CONTENT}/${rest.slice(0, slash)}.md` : '';
  // `<page>/<id>.md` when that page exists and the id is allowed; else the file is the waiting version of a page of its own name
  // (a page in a folder, `company/about`, is its own page, not a version of `company`).
  if (other && pages.includes(other) && isVersionId(rest.slice(slash + 1)) && !pages.includes(own))
    return { path: other, id: rest.slice(slash + 1) };
  return { path: own, id: WAITING };
}

/** The versions of a page: its file first, then each waiting one by id.
 * @param {Page} page @returns {Version[]} */
export function versionsOf(page) {
  const live = published(page.text);
  /** @type {Version[]} */
  const list = [{ id: 'live', state: live ? 'live' : 'unpublished' }];
  for (const [id, text] of Object.entries(page.drafts ?? {})) {
    const at = timeOf(text);
    list.push({ id, state: 'waiting', ...(at ? { publishAt: at } : {}) });
  }
  return list;
}

/** Whether a page file is published: no `status` (a stored `scheduled` is not yet, until its time). @param {string} text */
export const published = (text) => !/^status: *"?(draft|scheduled)"?\s*$/m.test(yamlOf(text));

/** Whether a page file is a draft (`status: draft`, not the stored `scheduled`). @param {string} text */
export const isDraftPage = (text) => /^status: *"?draft"?\s*$/m.test(yamlOf(text));

/** The time a waiting version goes live, or undefined. @param {string} text */
export const timeOf = (text) => yamlOf(text).match(line('publishAt'))?.[1] || undefined;

/** Whether a waiting version's time has come. @param {string} text @param {number} [now] */
export const isWaitingDue = (text, now = Date.now()) => {
  const at = timeOf(text);
  return at !== undefined && isDue(at, now);
};

/** Saves the text as a waiting version; a time already set on it stays (the text has none of its own).
 * @param {Page} page @param {string} text @param {string} [id] @returns {Change[]} */
export function saveDraft(page, text, id = WAITING) {
  const at = timeOf(text) ?? timeOf(page.drafts?.[id] ?? '');
  const next = at && !timeOf(text) ? setLine(text, 'publishAt', at) : text;
  return [{ path: draftPath(page.path, id), text: setLine(next, 'status', null) }];
}

/** The text of a page file that is a draft (never published, or unpublished): `status: draft` whatever the text says, so a text from
 * the form that was made published still cannot take the page live; only `Publish` does. @param {string} text */
export const draftPage = (text) => setLine(text, 'status', 'draft');

/** Makes a version live: the waiting version replaces the page file (without `status` and `publishAt`) and its file goes. A page
 * that is an unpublished draft and has no waiting version becomes published as it is. Nothing to do when it is live with nothing waiting.
 * @param {Page} page @param {string} [id] @returns {Change[]} */
export function publish(page, id = WAITING) {
  const waiting = page.drafts?.[id];
  if (waiting === undefined) {
    if (published(page.text)) return [];
    return [{ path: page.path, text: clean(page.text) }];
  }
  return [
    { path: page.path, text: clean(waiting) },
    { path: draftPath(page.path, id), text: null },
  ];
}

/** Sets the time a version goes live (Danish time, "2026-11-01T08:00"), or removes it with `null`. A page without that waiting
 * version gets one made of the page file, so a draft page or a live page can be scheduled as it is.
 * @param {Page} page @param {string | null} at @param {string} [id] @returns {Change[]} */
export function schedule(page, at, id = WAITING) {
  if (at !== null && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(at)) throw new Error(`Not a time: ${at}`);
  const text = page.drafts?.[id];
  if (text === undefined && at === null) return [];
  const base = text ?? setLine(page.text, 'status', null);
  return [{ path: draftPath(page.path, id), text: setLine(base, 'publishAt', at) }];
}

/** A page on the stored status Scheduled (an older site) as a draft with its time on a waiting version: the page file becomes a
 * draft, and its text without `status` and `publishAt` waits with the time. Nothing for a page that is not Scheduled.
 * @param {Page} page @returns {Change[]} */
export function migrateScheduled(page) {
  if (!/^status: *"?scheduled"?\s*$/m.test(yamlOf(page.text))) return [];
  const at = timeOf(page.text);
  const waiting = clean(page.text);
  return [
    { path: page.path, text: setLine(setLine(page.text, 'publishAt', null), 'status', 'draft') },
    { path: draftPath(page.path), text: at ? setLine(waiting, 'publishAt', at) : waiting },
  ];
}

/** Takes the page off the site: it becomes a draft. Waiting versions stay. @param {Page} page @returns {Change[]} */
export function unpublish(page) {
  if (!published(page.text) && !/^status: *"?scheduled"?\s*$/m.test(yamlOf(page.text))) return [];
  return [{ path: page.path, text: setLine(setLine(page.text, 'publishAt', null), 'status', 'draft') }];
}

/** Throws a waiting version away. @param {Page} page @param {string} [id] @returns {Change[]} */
export function discard(page, id = WAITING) {
  return page.drafts?.[id] === undefined ? [] : [{ path: draftPath(page.path, id), text: null }];
}

/** The waiting versions whose time has come, oldest time first, one per page: the next to publish.
 * @param {{ path: string; text: string; drafts: Record<string, string> }[]} pages @param {number} [now]
 * @returns {{ page: (typeof pages)[number]; id: string }[]} */
export function due(pages, now = Date.now()) {
  return pages.flatMap((page) => {
    const ready = Object.entries(page.drafts)
      .filter(([, text]) => isWaitingDue(text, now))
      .sort(([, a], [, b]) => String(timeOf(a)).localeCompare(String(timeOf(b))));
    return ready.length ? [{ page, id: ready[0][0] }] : [];
  });
}

// --- front matter lines, written as the editor writes them (src/frontmatter.mjs): text in double quotes.

/** @param {string} text */
const yamlOf = (text) => text.match(FENCE)?.[1] ?? '';

/** The text without `status` and `publishAt`: as it is when published. @param {string} text */
export const clean = (text) => setLine(setLine(text, 'status', null), 'publishAt', null);

/** The text with a front matter line set to a value (in double quotes), or removed with `null`.
 * @param {string} text @param {string} name @param {string | null} value */
function setLine(text, name, value) {
  const match = text.match(FENCE);
  const eol = /\r\n/.test(match?.[0] ?? text) ? '\r\n' : '\n';
  const yaml = match?.[1] ?? '';
  const had = line(name).test(yaml);
  const next =
    value === null ? yaml.replace(line(name), '') : had ? yaml.replace(line(name), `${name}: ${JSON.stringify(value)}${eol}`) : null;
  const body = match ? text.slice(match[0].length) : text;
  const lines = next ?? (yaml ? `${yaml}${eol}${name}: ${JSON.stringify(value)}` : `${name}: ${JSON.stringify(value)}`);
  const trimmed = lines.replace(/(\r?\n)+$/, '');
  if (!trimmed && value === null) return match ? `---${eol}---${body}` : text;
  return `---${eol}${trimmed}${eol}---${body}`;
}
