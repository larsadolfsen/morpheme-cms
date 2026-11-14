// The waiting version of a list the owner is making or changing (src/OwnListPage.tsx, src/listDraft.ts): until the final `Save` nothing of it is in git.
// It is one text, kept in the editor and, with R2 caching on, in the Worker (worker/autosave.js, the key of `_list.json`): the definition as
// it would be saved, the rows as typed (each with the file it already is, if any) and the fields whose data is to be removed from the
// entries. Pure code, no browser and no React.

/** The version id of a list's waiting version (as lib/versions.mjs `WAITING`). */
export const LIST_DRAFT_ID = 'waiting';

/**
 * @param {{ definition: string; rows: { slug?: string; row: Record<string, any> }[]; without?: string[] }} draft
 * @returns {string}
 */
export function draftText({ definition, rows, without = [] }) {
  return JSON.stringify({ version: 1, definition, rows, ...(without.length ? { without } : {}) });
}

/** The draft a text holds, or null when it is not one. @param {string} text */
export function parseDraft(text) {
  try {
    const value = JSON.parse(text);
    if (value?.version !== 1 || typeof value.definition !== 'string' || !Array.isArray(value.rows)) return null;
    const rows = value.rows.filter((r) => r && typeof r.row === 'object' && r.row !== null && !Array.isArray(r.row));
    const without = Array.isArray(value.without) ? value.without.filter((x) => typeof x === 'string') : [];
    return {
      definition: /** @type {string} */ (value.definition),
      rows: /** @type {{ slug?: string; row: Record<string, any> }[]} */ (
        rows.map((r) => ({ ...(typeof r.slug === 'string' && r.slug ? { slug: r.slug } : {}), row: r.row }))
      ),
      without,
    };
  } catch {
    return null;
  }
}

/**
 * What the final `Save` writes for the definition: the file, as one change, or nothing when the working text is the saved one.
 * @param {{ path: string; text: string; committed: { oid: string; text: string } | undefined }} input
 * @returns {{ path: string; content: string; oid: string | null }[]}
 */
export function definitionChange({ path, text, committed }) {
  return committed?.text === text ? [] : [{ path, content: text, oid: committed?.oid ?? null }];
}
