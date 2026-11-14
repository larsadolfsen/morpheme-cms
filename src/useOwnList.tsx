// What the page of a list the owner made (src/OwnList.tsx) and its edit page (src/OwnListEdit.tsx) share: the list's definition with its waiting changes
// (src/listDraft.ts), the items in git, `Save` (the definition and what it takes out of the items, as one commit) and `Delete list`. Nothing is committed until a
// `Save`, the page's own or an item's (App.tsx adds the waiting definition to that commit); only `Delete list` commits at once.
import { useMemo, useState, type ReactNode } from 'react';
import { config } from '@site/editor';
import { LoadingIndicator } from './ui';
import { ask } from './ask';
import { ConflictError, type RepoFile } from './github';
import { siteT, t } from './i18n';
import { kindAndName, lower, savedText, setUnsaved } from './deploy';
import { ownListOf } from './ownLists';
import { DEFINITION_VERSION, parseDefinition } from '../lib/ownList.mjs';
import { definitionText, entriesIn, filesOfList, listUses } from '../lib/ownListEdit.mjs';
import { definitionPath, discardListDraft, editListDraft, listDraftOf, pendingOf, useListDrafts } from './listDraft';
import { useFormPages, useUnsavedGuard } from './FormFrame';
import type { Env } from './App';

export type Definition = { version: 2; label: string; fields: { id: string; kind: string; label?: string }[]; dropped: string[] };

/** `files` are the site's files with the waiting definition in place (withListDrafts); `saved` are git's. */
export function useOwnList(id: string, files: RepoFile[], saved: RepoFile[], env: Env, pages: string[] = []) {
  const folder = `${config.folders.data}/${id}`;
  const draft = listDraftOf(id);
  const state = useListDrafts().find((d) => d.id === id)?.state;
  const committed = saved.find((f) => f.path === definitionPath(id));
  const parsed = parseDefinition(files.find((f) => f.path === definitionPath(id))?.text ?? '').definition as Definition | undefined;
  const definition: Definition = parsed ?? { version: DEFINITION_VERSION, label: id, fields: [], dropped: [] };
  const collection = useMemo(() => ownListOf(id, definition), [JSON.stringify(definition)]);
  const pending = !!draft;
  const [saving, setSaving] = useState(false);
  const without = draft?.without ?? [];

  /** A change to the definition: kept as the waiting version. */
  const change = (next: Definition, removed?: string) =>
    editListDraft(id, definitionText(next), removed && !without.includes(removed) ? [...without, removed] : without);

  async function save(): Promise<boolean> {
    const changes = pendingOf(id, saved);
    if (!changes.length) return (discardListDraft(id), true);
    const label = lower(definition.label);
    const what = committed ? t.app.changes.edited(label) : t.app.changes.created(kindAndName(t.ownList.list, definition.label));
    setSaving(true);
    env.notify({ text: t.common.saving });
    try {
      const oids = await env.commit(
        committed ? siteT.forms.commit.edit(label) : siteT.forms.commit.create(siteT.ownList.new, label),
        changes,
        what,
      );
      for (const c of changes) env.onSaved({ path: c.path, oid: oids[c.path], text: c.content });
      discardListDraft(id);
      env.notify({ text: savedText(what), kind: 'saved' });
      return true;
    } catch (e) {
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
      return false;
    } finally {
      setSaving(false);
    }
  }
  useUnsavedGuard(pending, save, () => discardListDraft(id));
  // The list's own screens (its page, its edit page, an item, a new item) are part of it: going to one keeps what waits, and the next save takes it along.
  useFormPages([`list/${id}`, `list/${id}/edit`, `new/${id}`, ...entriesIn(saved, folder).map((e: { path: string }) => e.path), ...pages]);

  // The items as git has them, minus the fields whose data is to go, for what `Remove field` counts.
  const entries = entriesIn(saved, folder).map((e: { path: string; data: Record<string, unknown> }) => ({
    ...e,
    data: Object.fromEntries(Object.entries(e.data).filter(([k]) => !without.includes(k))),
  }));
  const status: ReactNode = saving ? (
    t.app.busy.saving
  ) : pending ? (
    state === 'saved' ? (
      t.forms.versions.autosave.saved
    ) : state === 'notSaved' ? (
      t.forms.versions.autosave.notSaved
    ) : (
      <LoadingIndicator>{t.forms.versions.autosave.saving}</LoadingIndicator>
    )
  ) : undefined;

  /** `Delete list`: refused while a page or an app reads it; else it asks, then deletes the entries and the definition in one commit. */
  async function deleteList(): Promise<void> {
    const used = listUses(saved, id, collection.folder);
    if (used.length) return env.notify({ text: t.ownList.used(used.length), error: true });
    const all = filesOfList(saved, collection.folder);
    if (!(await ask(t.ownList.deleteAsk(definition.label, entries.length), t.common.delete))) return;
    discardListDraft(id);
    // The changes that are not saved go with the list; nothing asks about them on the way out.
    setUnsaved(false);
    // A list that was never saved is not in git: nothing is committed.
    if (!committed) {
      location.hash = '#lists';
      return;
    }
    setSaving(true);
    env.notify({ text: t.common.deleting });
    const changed = t.app.changes.deleted(kindAndName(t.ownList.list, definition.label));
    try {
      await env.commit(
        siteT.app.commit.delete(siteT.ownList.list, id),
        all.map((f: RepoFile) => ({ path: f.path, content: null, oid: f.oid })),
        changed,
      );
      env.forget(all.map((f: RepoFile) => f.path));
      location.hash = '#lists';
      env.notify({ text: savedText(changed), kind: 'saved' });
    } catch (e) {
      env.notify({ text: t.app.notDeleted((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  return { folder, definition, collection, committed, pending, saving, status, change, save, entries, without, deleteList };
}
