// A page or post and its waiting versions as the editor holds them: the page file and the files in src/drafts/ among the
// editor's loaded files (`files`, `{ path, oid, text }`), and the changes the functions of lib/versions.mjs give as the editor's own
// (`{ path, content, oid }`, `content: null` to delete a file), for `env.commit`. Exposes `pageOf` and `commitChanges`. Depends on lib/versions.mjs.
import { DRAFTS, pageOf as pageOfDraft, versionsOf } from '../lib/versions.mjs';

/** @typedef {{ path: string; oid: string; text: string }} RepoFile */
/** @typedef {{ path: string; content: string | Uint8Array | null; oid: string | null }} Change */

/** The page file with the waiting versions of it that are loaded: what `publish`, `schedule`, `unpublish` and `discard` take.
 * @param {RepoFile[]} files @param {RepoFile} page
 * @returns {{ path: string; text: string; drafts: Record<string, string> }} */
export function pageOf(files, page) {
  const pages = files.filter((f) => f.path.endsWith('.md') && !f.path.startsWith(`${DRAFTS}/`)).map((f) => f.path);
  /** @type {Record<string, string>} */
  const drafts = {};
  for (const f of files) {
    const at = f.path.startsWith(`${DRAFTS}/`) ? pageOfDraft(f.path, pages) : null;
    if (at && at.path === page.path) drafts[at.id] = f.text;
  }
  return { path: page.path, text: page.text, drafts };
}

/** The versions of a page or post that are loaded: the page file, then each waiting one (lib/versions.mjs `versionsOf`).
 * @param {RepoFile[]} files @param {RepoFile} page */
export const versionsFor = (files, page) => versionsOf(pageOf(files, page));

/** What the functions of lib/versions.mjs give, as the editor commits it: each file with the blob id it has now (`null` for a new file),
 * a deleted file only when it is there.
 * @param {{ path: string; text: string | null }[]} changes @param {RepoFile[]} files @returns {Change[]} */
export function commitChanges(changes, files) {
  return changes.flatMap((c) => {
    const there = files.find((f) => f.path === c.path);
    if (c.text === null) return there ? [{ path: c.path, content: null, oid: there.oid }] : [];
    return [{ path: c.path, content: c.text, oid: there?.oid || null }];
  });
}
