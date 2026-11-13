// `Edit list` (docs/superpowers/plans/2026-11-12-new-list.md, batch 6): a bottom sheet over the page of a list the owner made, with its name, a switch for
// each of the six fields (the title is always on) and `Delete list` at the bottom. A name is saved when the field is left, a switch at once, each in its
// own commit of `_list.json`. A field switched off is only hidden (`dropped`): its data stays in the items, and the sheet says in how many, with
// `Remove data` (it asks, then takes the key out of every item and out of the definition in one commit). `Delete list` is refused while a page or an
// app reads the list; else it asks, then deletes the entries and the definition in one commit (they stay in the history, under Deleted). The rules
// are lib/ownList.mjs and lib/ownListEdit.mjs.
import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react';
import { BottomSheet, Button, SheetBody, SheetTitle, SwitchRow, SupportingText, TextField } from './ui';
import { ask } from './ask';
import { ConflictError, type RepoFile } from './github';
import { siteT, t } from './i18n';
import { kindAndName, lower, savedText } from './deploy';
import { FIELDS, parseDefinition } from '../lib/ownList.mjs';
import { confirmDrop, definitionText, entriesIn, filesOfList, heldBy, listUses, renamed, toggleField } from '../lib/ownListEdit.mjs';
import type { OwnedList } from './schema';
import type { Env } from './App';

export default function OwnListSheet({
  collection,
  files,
  env,
  open,
  onClose,
  onRemoved,
  onDeleting,
  ref,
}: {
  /** `remove`: the list menu's `Delete list`, which asks and deletes without opening the sheet. */
  ref?: Ref<{ remove: () => void }>;
  collection: OwnedList;
  files: RepoFile[];
  env: Env;
  open: boolean;
  onClose: () => void;
  /** A field's data was removed for good from these entries (path, new oid, new text): the page forgets it too. */
  onRemoved: (field: string, saved: { path: string; oid: string; text: string }[]) => void;
  /** The list is being deleted: the page stops saving it. */
  onDeleting: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const path = `${collection.folder}/_list.json`;
  const id = collection.id;
  const file = files.find((f) => f.path === path);
  const definition = file ? parseDefinition(file.text).definition : undefined;
  const [label, setLabel] = useState(definition?.label ?? collection.label);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const sheet = dialog.current;
    if (open && sheet && !sheet.open) sheet.showModal();
    if (!open && sheet?.open) sheet.close();
  }, [open]);
  useEffect(() => setLabel(definition?.label ?? collection.label), [definition?.label]);
  // (Hooks first: the handle is made before the sheet decides it has nothing to show.)

  const fail = (e: unknown) =>
    env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
  /** Writes the definition (and the items that changed with it) as one commit. */
  async function write(
    next: typeof definition,
    entries: { path: string; data: unknown }[] = [],
    what = t.app.changes.edited(lower(next!.label)),
  ) {
    setBusy(true);
    env.notify({ text: t.common.saving });
    try {
      const text = definitionText(next);
      const changes = [
        { path, content: text, oid: file!.oid },
        ...entries.map((e) => ({
          path: e.path,
          content: `${JSON.stringify(e.data, null, 2)}\n`,
          oid: files.find((f) => f.path === e.path)?.oid ?? null,
        })),
      ];
      const oids = await env.commit(siteT.forms.commit.edit(lower(next!.label)), changes, what);
      const saved = changes.map((c) => ({ path: c.path, oid: oids[c.path], text: c.content }));
      for (const s of saved) env.onSaved(s);
      env.notify({ text: savedText(what), kind: 'saved' });
      return saved.filter((s) => s.path !== path);
    } catch (e) {
      fail(e);
      return null;
    } finally {
      setBusy(false);
    }
  }

  useImperativeHandle(ref, () => ({ remove: () => void deleteList() }));

  const rename = () => {
    if (!definition) return;
    const next = renamed(definition, label);
    if (next.label === definition.label) return setLabel(definition.label);
    void write(next);
  };
  if (!definition) return null;
  const dropped = definition.dropped ?? [];
  const entries = entriesIn(files, collection.folder);

  async function remove(field: string) {
    const name = FIELDS.some((f) => f.id === field) ? t.ownList[field as keyof typeof t.ownList] : field;
    const n = heldBy(entries, field);
    if (!(await ask(t.ownList.removeDataAsk(String(name), n), t.ownList.removeData))) return;
    const done = confirmDrop(definition, field, entries);
    const saved = await write(done.definition, done.entries);
    if (saved) onRemoved(field, saved);
  }

  async function deleteList() {
    const used = listUses(files, id, collection.folder);
    if (used.length) return env.notify({ text: t.ownList.used(used.length), error: true });
    const all = filesOfList(files, collection.folder);
    if (!(await ask(t.ownList.deleteAsk(definition!.label, entries.length), t.common.delete))) return;
    onDeleting();
    setBusy(true);
    env.notify({ text: t.common.deleting });
    const change = t.app.changes.deleted(kindAndName(t.ownList.list, definition!.label));
    try {
      await env.commit(
        siteT.app.commit.delete(siteT.ownList.list, id),
        all.map((f: RepoFile) => ({ path: f.path, content: null, oid: f.oid })),
        change,
      );
      env.forget(all.map((f: RepoFile) => f.path));
      dialog.current?.close();
      location.hash = '#lists';
      env.notify({ text: savedText(change), kind: 'saved' });
    } catch (e) {
      env.notify({ text: t.app.notDeleted((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      ref={dialog}
      aria-label={t.ownList.edit}
      onClose={(e) => e.target === e.currentTarget && onClose()}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
    >
      <SheetTitle title={t.ownList.edit} onClose={() => dialog.current?.close()} />
      <SheetBody onSubmit={(e) => e.preventDefault()}>
        <TextField
          label={t.ownList.name}
          value={label}
          disabled={busy}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={rename}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), rename())}
        />
        <div>
          <p className="mb-1 font-medium">{t.ownList.fields}</p>
          {FIELDS.map((f) => {
            const on = definition.fields.includes(f.id) && !dropped.includes(f.id);
            const held = dropped.includes(f.id) ? heldBy(entries, f.id) : 0;
            return (
              <div key={f.id}>
                <SwitchRow
                  label={t.ownList[f.id as 'icon']}
                  selected={on}
                  disabled={busy || f.id === 'title'}
                  // Off: nothing to keep when no item has data for it, so it is removed at once; else it is hidden until the data is removed.
                  onChange={(selected) =>
                    void write(
                      selected || heldBy(entries, f.id) > 0
                        ? toggleField(definition, f.id, selected)
                        : confirmDrop(definition, f.id, []).definition,
                    )
                  }
                />
                {f.id === 'title' && <SupportingText className="mt-1">{t.ownList.titleOn}</SupportingText>}
                {dropped.includes(f.id) && (
                  <div className="mb-2">
                    <SupportingText>{t.ownList.held(held)}</SupportingText>
                    {held > 0 && (
                      <Button kind="text" disabled={busy} onClick={() => void remove(f.id)}>
                        {t.ownList.removeData}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button
          kind="text"
          disabled={busy}
          style={{ '--button-text-text': 'var(--mo-error)' } as CSSProperties}
          onClick={() => void deleteList()}
        >
          {t.ownList.delete}
        </Button>
      </SheetBody>
    </BottomSheet>
  );
}
