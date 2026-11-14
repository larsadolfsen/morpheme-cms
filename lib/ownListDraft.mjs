// The waiting version of a list the owner is making or changing (src/listDraft.ts, src/OwnList.tsx): until a `Save` nothing of it is in git.
// It is one text, kept in the editor and, with R2 caching on, in the Worker (worker/autosave.js, under the list's `_list.json`): the definition as
// it would be saved, and the fields whose data is to be removed from the entries. The items are not in it: each item is saved on its own page
// (as a testimonial is), and a save of any of them takes the waiting definition with it. Pure code, no browser and no React.
import { dropField, isEntryPath } from './ownList.mjs';

/** The version id of a list's waiting version (as lib/versions.mjs `WAITING`). */
export const LIST_DRAFT_ID = 'waiting';

/** @param {{ definition: string; without?: string[] }} draft @returns {string} */
export function draftText({ definition, without = [] }) {
  return JSON.stringify({ version: 2, definition, ...(without.length ? { without } : {}) });
}

/** The draft a text holds, or null when it is not one. @param {string} text */
export function parseDraft(text) {
  try {
    const value = JSON.parse(text);
    if (typeof value?.definition !== 'string' || ![1, 2].includes(value.version)) return null;
    const without = Array.isArray(value.without) ? value.without.filter((x) => typeof x === 'string') : [];
    return { definition: /** @type {string} */ (value.definition), without };
  } catch {
    return null;
  }
}

/**
 * Everything a `Save` writes for a list that has a waiting version: the definition (when it differs from git's, a new list has no oid) and every
 * item that holds data of a field that is to go (`without`), as the files `{ path, content, oid }`.
 * @param {{ path: string; folder: string; draft: { definition: string; without: string[] }; files: { path: string; oid: string; text: string }[] }} input
 */
export function pendingChanges({ path, folder, draft, files }) {
  const committed = files.find((f) => f.path === path);
  /** @type {{ path: string; content: string; oid: string | null }[]} */
  const changes = committed?.text === draft.definition ? [] : [{ path, content: draft.definition, oid: committed?.oid || null }];
  if (!draft.without.length) return changes;
  for (const f of files) {
    if (!f.path.startsWith(`${folder}/`) || !isEntryPath(f.path)) continue;
    let data;
    try {
      data = JSON.parse(f.text);
    } catch {
      continue;
    }
    const [next] = draft.without.reduce((all, field) => dropField(all, field), [data]);
    if (next !== data) changes.push({ path: f.path, content: `${JSON.stringify(next, null, 2)}\n`, oid: f.oid });
  }
  return changes;
}
