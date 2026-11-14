// The waiting version of a list the owner is making or changing (lib/ownListDraft.mjs, src/OwnListPage.tsx): kept in the editor (this module, while the tab is
// open) and, with R2 caching on, in the Worker under the list's `_list.json` (worker/autosave.js, the same /api/autosave as a page's), so it comes back when
// the tab was closed. Without R2 caching the Worker says so (409 `off`): the version is only in the editor and the line under the title says `Not saved`.
// Nothing of it is in git, and nothing builds the site, until the final `Save`.
import { useEffect, useState } from 'react';
import { config } from '@site/config';
import { deleteAutosave, loadAutosave } from './autosave.mjs';
import { isListDraftPath } from '../lib/autosave.mjs';
import { LIST_DRAFT_ID, parseDraft } from '../lib/ownListDraft.mjs';
import { DEFINITION_FILE, parseDefinition } from '../lib/ownList.mjs';

/** The text of each waiting version by the list's id; changed through the functions below. */
const drafts = new Map<string, string>();
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((fn) => fn());

/** The path of a list's definition. */
export const definitionPath = (id: string) => `${config.folders.data}/${id}/${DEFINITION_FILE}`;

export const listDraftOf = (id: string) => drafts.get(id);
export const listDraftIds = () => [...drafts.keys()];
export function setListDraft(id: string, text: string) {
  if (drafts.get(id) === text) return;
  drafts.set(id, text);
  changed();
}
export function clearListDraft(id: string) {
  if (drafts.delete(id)) changed();
}

const labelOf = (id: string, text: string) => parseDefinition(parseDraft(text)?.definition ?? '').definition?.label ?? id;
const shown = () => [...drafts.entries()].map(([id, text]) => ({ id, label: labelOf(id, text) }));

/** The lists with a waiting version, as `{ id, label }`. The caller is drawn again only when a list gets or loses one, or its name changes (not on each keystroke). */
export function useListDrafts() {
  const [, tick] = useState(0);
  useEffect(() => {
    let last = JSON.stringify(shown());
    const fn = () => {
      const now = JSON.stringify(shown());
      if (now === last) return;
      last = now;
      tick((n) => n + 1);
    };
    listeners.add(fn);
    return () => void listeners.delete(fn);
  }, []);
  return shown();
}

export type KeptState = 'saving' | 'saved' | 'notSaved';

/** Keeps the text in the Worker: `saved`, or `notSaved` when R2 caching is off or the Worker cannot be reached. */
export async function keepListDraft(id: string, text: string): Promise<KeptState> {
  try {
    const res = await fetch('/api/autosave', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: definitionPath(id), id: LIST_DRAFT_ID, text }),
      cache: 'no-store',
    });
    return res.ok ? 'saved' : 'notSaved';
  } catch {
    return 'notSaved';
  }
}

/** What the Worker keeps for a list, or null. */
export async function keptListDraft(id: string): Promise<string | null> {
  return (await loadAutosave(definitionPath(id), LIST_DRAFT_ID))?.text ?? null;
}

/** Throws away what the Worker keeps for a list (it was saved or discarded). */
export const dropKeptListDraft = (id: string) => deleteAutosave(definitionPath(id), LIST_DRAFT_ID);

/** The ids of the lists the Worker keeps a waiting version for (none when R2 caching is off). */
export async function keptListIds(): Promise<string[]> {
  try {
    const res = await fetch('/api/autosave', { cache: 'no-store' });
    if (!res.ok) return [];
    const { drafts: all } = (await res.json()) as { drafts?: { path: string; id: string }[] };
    const prefix = `${config.folders.data}/`;
    return (all ?? [])
      .filter(
        (d) =>
          d.id === LIST_DRAFT_ID &&
          isListDraftPath(d.path) &&
          d.path.startsWith(prefix) &&
          d.path.split('/').length === prefix.split('/').length + 1,
      )
      .map((d) => d.path.slice(prefix.length, -`/${DEFINITION_FILE}`.length));
  } catch {
    return [];
  }
}

/** Puts the waiting versions the Worker kept (the tab was closed with changes waiting) back in the editor; those it already has are left. */
export async function restoreKeptLists() {
  for (const id of await keptListIds()) {
    if (drafts.has(id)) continue;
    const text = await keptListDraft(id);
    if (text && parseDraft(text) && !drafts.has(id)) setListDraft(id, text);
  }
}
