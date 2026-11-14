// The waiting version of a list the owner is making or changing (lib/ownListDraft.mjs, src/OwnList.tsx): its definition, kept in the editor (this module, while the
// tab is open) and, with R2 caching on, in the Worker under the list's `_list.json` (worker/autosave.js, the same /api/autosave as a page's), so it comes back when
// the tab was closed. Without R2 caching the Worker says so and the version is only in the editor: the line under the title says `Not saved`. Nothing of it is in
// git, and nothing builds the site, until a `Save` (the list's own, or an item's, which takes it along).
import { useEffect, useState } from 'react';
import { config } from '@site/config';
import { deleteAutosave, loadAutosave } from './autosave.mjs';
import { isListDraftPath } from '../lib/autosave.mjs';
import { draftText, LIST_DRAFT_ID, parseDraft, pendingChanges } from '../lib/ownListDraft.mjs';
import { DEFINITION_FILE, parseDefinition } from '../lib/ownList.mjs';
import type { RepoFile } from './github';

export type KeptState = 'saving' | 'saved' | 'notSaved';
type Draft = { definition: string; without: string[] };

/** The waiting version of each list by its id; changed through the functions below. */
const drafts = new Map<string, Draft>();
const kept = new Map<string, KeptState>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((fn) => fn());
/** How long after the last change the version is sent to the Worker (as a page's autosave, src/autosave.mjs). */
const KEEP_AFTER = 1500;

/** The path of a list's definition. */
export const definitionPath = (id: string) => `${config.folders.data}/${id}/${DEFINITION_FILE}`;
const folderOf = (id: string) => `${config.folders.data}/${id}`;

export const listDraftOf = (id: string) => drafts.get(id);
export const listDraftIds = () => [...drafts.keys()];

/** Makes or changes a list's waiting version (`without`: fields whose data is to go from every item at the save), kept in the Worker a moment later. */
export function editListDraft(id: string, definition: string, without: string[] = drafts.get(id)?.without ?? []) {
  drafts.set(id, { definition, without });
  kept.set(id, 'saving');
  clearTimeout(timers.get(id));
  const text = draftText({ definition, without });
  timers.set(
    id,
    setTimeout(async () => {
      timers.delete(id);
      if (!drafts.has(id)) return;
      kept.set(id, await keepListDraft(id, text));
      changed();
    }, KEEP_AFTER),
  );
  changed();
}

/** The version was saved or the owner discarded it: nothing is waiting, in the editor or in the Worker. */
export function discardListDraft(id: string) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  kept.delete(id);
  if (!drafts.delete(id)) return;
  void dropKeptListDraft(id);
  changed();
}

/** A waiting version put back from the Worker (the tab was closed): in the editor only, it is in the Worker already. */
function restoreListDraft(id: string, text: string) {
  const draft = parseDraft(text);
  if (!draft || drafts.has(id)) return;
  drafts.set(id, draft);
  kept.set(id, 'saved');
  changed();
}

/** The lists with a waiting version, `{ id, label, state }`; the caller is drawn again when any of them changes. */
export function useListDrafts() {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((n) => n + 1);
    listeners.add(fn);
    return () => void listeners.delete(fn);
  }, []);
  return [...drafts.entries()].map(([id, d]) => ({
    id,
    label: parseDefinition(d.definition).definition?.label ?? id,
    state: kept.get(id) ?? ('saving' as KeptState),
  }));
}

/** The files with each waiting definition in place of the one in git (a new list gets its file, with no oid): what a list's own screens read. */
export function withListDrafts(files: RepoFile[]): RepoFile[] {
  if (!drafts.size) return files;
  const paths = new Set([...drafts.keys()].map(definitionPath));
  return [
    ...files.filter((f) => !paths.has(f.path)),
    ...[...drafts.entries()].map(([id, d]) => ({
      path: definitionPath(id),
      oid: files.find((f) => f.path === definitionPath(id))?.oid ?? '',
      text: d.definition,
    })),
  ];
}

/** What a save of anything in this list also writes: its waiting definition and the items that lose a field's data (none without a waiting version). */
export function pendingOf(id: string, files: RepoFile[]) {
  const draft = drafts.get(id);
  return draft
    ? (pendingChanges({ path: definitionPath(id), folder: folderOf(id), draft, files }) as {
        path: string;
        content: string;
        oid: string | null;
      }[])
    : [];
}

/** Lists whose waiting version is what git has now (it was saved) have nothing waiting any more. */
export function settleListDrafts(files: RepoFile[]) {
  for (const [id, d] of [...drafts]) {
    if (d.without.length) continue;
    if (files.find((f) => f.path === definitionPath(id))?.text === d.definition) discardListDraft(id);
  }
}

/** Keeps the text in the Worker: `saved`, or `notSaved` when R2 caching is off or the Worker cannot be reached. */
async function keepListDraft(id: string, text: string): Promise<KeptState> {
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

const dropKeptListDraft = (id: string) => deleteAutosave(definitionPath(id), LIST_DRAFT_ID);

/** Puts the waiting versions the Worker kept (the tab was closed with changes waiting) back in the editor; those it already has are left. */
export async function restoreKeptLists() {
  try {
    const res = await fetch('/api/autosave', { cache: 'no-store' });
    if (!res.ok) return;
    const { drafts: all } = (await res.json()) as { drafts?: { path: string; id: string }[] };
    const prefix = `${config.folders.data}/`;
    for (const d of all ?? []) {
      if (
        d.id !== LIST_DRAFT_ID ||
        !isListDraftPath(d.path) ||
        !d.path.startsWith(prefix) ||
        d.path.split('/').length !== prefix.split('/').length + 1
      )
        continue;
      const id = d.path.slice(prefix.length, -`/${DEFINITION_FILE}`.length);
      if (drafts.has(id)) continue;
      const stored = await loadAutosave(d.path, LIST_DRAFT_ID);
      if (stored?.text) restoreListDraft(id, stored.text);
    }
  } catch {}
}
