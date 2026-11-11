// What the Worker (worker/autosave.js) and the editor (src/autosave.mjs) agree on for an autosaved draft: the key it has in R2, how big it
// may be, how long it is kept and when it is moved to git. Plain functions, no dependencies, so both can use it.
// An autosave is the text of one version of one page, by the page file's path and the version id (lib/versions.mjs, default `waiting`).
import { draftPath, isVersionId, WAITING } from './versions.mjs';

/** The most bytes of text one autosave may hold (a long page is far below it; an image is never in the text). */
export const MAX_BYTES = 1024 * 1024;
/** How long an autosave may sit in R2 without a save to git before the Worker's hourly job moves it there (it is idle). */
export const IDLE_MS = 24 * 60 * 60 * 1000;
/** How long an autosave is kept at most; the Worker deletes older ones that it could not move to git. */
export const EXPIRE_MS = 30 * 24 * 60 * 60 * 1000;
/** The first part of every key in R2. */
export const PREFIX = 'autosave';

/** Whether a page file's path is allowed: a markdown file in src/content/, no `..`. @param {unknown} path */
export function isPagePath(path) {
  if (typeof path !== 'string' || path.length > 500 || path.includes('\\') || path.split('/').includes('..')) return false;
  try {
    draftPath(path);
    return true;
  } catch {
    return false;
  }
}

/** The key of an autosave in R2 under a site's own prefix (`<owner>/<repo>`): `<site>/autosave/<page path>/<version id>`.
 * Throws for a path or an id that is not allowed. @param {string} site @param {string} path @param {string} [id] */
export function autosaveKey(site, path, id = WAITING) {
  if (!isPagePath(path)) throw new Error(`Not a page file: ${path}`);
  if (!isVersionId(id)) throw new Error(`Not a version id: ${id}`);
  return `${site}/${PREFIX}/${path}/${id}`;
}

/** The page file and version id of a key made by `autosaveKey`, or null. @param {string} site @param {string} key */
export function parseKey(site, key) {
  const start = `${site}/${PREFIX}/`;
  if (!key.startsWith(start)) return null;
  const rest = key.slice(start.length);
  const slash = rest.lastIndexOf('/');
  const path = rest.slice(0, slash);
  const id = rest.slice(slash + 1);
  return slash > 0 && isPagePath(path) && isVersionId(id) ? { path, id } : null;
}

/** The size of a text in bytes. @param {string} text */
export const byteLength = (text) => new TextEncoder().encode(text).length;

/** What the Worker does with an autosave that was saved at `savedAt`: keep it, move it to git (idle), or delete it (expired, and not moved).
 * @param {number} savedAt @param {number} now @param {boolean} canFlush whether the Worker can save to git @returns {'keep' | 'flush' | 'delete'} */
export function sweepAction(savedAt, now, canFlush) {
  const age = now - savedAt;
  if (age >= EXPIRE_MS) return 'delete';
  return age >= IDLE_MS && canFlush ? 'flush' : 'keep';
}
