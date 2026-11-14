// `Edit list` (docs/superpowers/plans/2026-11-12-new-list.md, batch 6; the owner's decision of 13 November): a bottom sheet over the page of a list the owner
// made, with its name, its fields (each with a name the owner can change and `Remove field`; `Add field` adds one of any kind, as many of a kind as wanted)
// and `Delete list` at the bottom. A change is kept as the list's waiting version (the page's `change`, src/OwnListPage.tsx) and committed once, with the page's final
// `Save` (the owner's decision of 14 November); only `Delete list` commits at once. A field belongs to the list and is on
// by default; only the owner's own `Shown` switch hides it (`dropped`): its data stays in the items, and the sheet says in how many, with `Remove data`.
// `Remove field` asks, then takes the field and its data out of every item (at the final `Save`). `Delete list` is refused while a page or an
// app reads the list; else it asks, then deletes the entries and the definition in one commit (they stay in the history, under Deleted). The rules
// are lib/ownList.mjs and lib/ownListEdit.mjs.
import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react';
import { BottomSheet, Button, SheetBody, SheetTitle, SwitchRow, SupportingText, TextField } from './ui';
import AddFieldMenu from './AddFieldMenu';
import { kindNames } from './ownLists';
import { ask } from './ask';
import type { RepoFile } from './github';
import { siteT, t } from './i18n';
import { kindAndName, savedText, setUnsaved } from './deploy';
import { nameOf } from '../lib/ownList.mjs';
import { addField, confirmDrop, filesOfList, heldBy, listUses, renamed, renameField, toggleField } from '../lib/ownListEdit.mjs';
import type { OwnedList } from './schema';
import type { Env } from './App';

type Definition = { version: 2; label: string; fields: { id: string; kind: string; label?: string }[]; dropped: string[] };

export default function OwnListSheet({
  collection,
  definition,
  entries,
  saved,
  files,
  env,
  open,
  onClose,
  onChange,
  onDeleting,
  ref,
}: {
  /** `remove`: the list menu's `Delete list`, which asks and deletes without opening the sheet. */
  ref?: Ref<{ remove: () => void; add: (kind: string) => void }>;
  collection: OwnedList;
  /** The list's definition as it is now, with the changes that are not saved. */
  definition: Definition;
  /** The items in git, parsed (`{ path, data }`): what `Remove field` and `Remove data` count. */
  entries: { path: string; data: Record<string, unknown> }[];
  /** The list is in git (a list that is not saved yet has nothing to delete there). */
  saved: boolean;
  files: RepoFile[];
  env: Env;
  open: boolean;
  onClose: () => void;
  /** The definition changed (a field added, renamed, switched, or a name); `removed`: a field whose data is to go from every item at the final `Save`. */
  onChange: (next: Definition, removed?: string) => void;
  /** The list is being deleted: the page stops saving it. */
  onDeleting: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = collection.id;
  const [label, setLabel] = useState(definition.label);
  const [busy, setBusy] = useState(false);
  const addAt = useRef<HTMLSpanElement>(null);
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    const sheet = dialog.current;
    if (open && sheet && !sheet.open) sheet.showModal();
    if (!open && sheet?.open) sheet.close();
  }, [open]);
  useEffect(() => setLabel(definition.label), [definition.label]);
  // (Hooks first: the handle is made before the sheet decides it has nothing to show.)

  useImperativeHandle(ref, () => ({
    remove: () => void deleteList(),
    add: (kind: string) => onChange(addField(definition, kind).definition),
  }));

  const rename = () => {
    const next = renamed(definition, label);
    if (next.label === definition.label) return setLabel(definition.label);
    onChange(next);
  };
  const dropped = definition.dropped ?? [];

  async function remove(field: string, confirm: string) {
    const f = definition.fields.find((x: { id: string }) => x.id === field);
    const name = f ? nameOf(definition, f, kindNames()) : field;
    const n = heldBy(entries, field);
    if (!(await ask(t.ownList.removeDataAsk(String(name), n), confirm))) return;
    onChange(confirmDrop(definition, field, []).definition, field);
  }

  async function deleteList() {
    const used = listUses(files, id, collection.folder);
    if (used.length) return env.notify({ text: t.ownList.used(used.length), error: true });
    const all = filesOfList(files, collection.folder);
    if (!(await ask(t.ownList.deleteAsk(definition.label, entries.length), t.common.delete))) return;
    onDeleting();
    // The changes that are not saved go with the list; nothing asks about them on the way out.
    setUnsaved(false);
    // A list that was never saved is not in git: nothing is committed.
    if (!saved) {
      dialog.current?.close();
      location.hash = '#lists';
      return;
    }
    setBusy(true);
    env.notify({ text: t.common.deleting });
    const change = t.app.changes.deleted(kindAndName(t.ownList.list, definition.label));
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
          {definition.fields.map((f: { id: string; kind: string; label?: string }) => {
            const off = dropped.includes(f.id);
            const held = off ? heldBy(entries, f.id) : 0;
            return (
              <div key={f.id} className="mb-3">
                <FieldName
                  kind={t.ownList[f.kind as 'icon']}
                  value={nameOf(definition, f, kindNames())}
                  disabled={busy}
                  onSave={(name) => {
                    const own = name.trim() === nameOf(definition, { ...f, label: undefined }, kindNames()) ? '' : name;
                    if (own !== (f.label ?? '')) onChange(renameField(definition, f.id, own));
                  }}
                />
                <SwitchRow
                  label={t.ownList.shown}
                  selected={!off}
                  disabled={busy}
                  // The owner's own choice, on for every new field. Off: nothing to keep when no item has data for it, so it is removed at once; else it is hidden until the data is removed.
                  onChange={(selected) =>
                    onChange(
                      selected || heldBy(entries, f.id) > 0
                        ? toggleField(definition, f.id, selected)
                        : confirmDrop(definition, f.id, []).definition,
                    )
                  }
                />
                {off ? (
                  <div className="mb-2">
                    <SupportingText>{t.ownList.held(held)}</SupportingText>
                    {held > 0 && (
                      <Button kind="text" disabled={busy} onClick={() => void remove(f.id, t.ownList.removeData)}>
                        {t.ownList.removeData}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button kind="text" disabled={busy} onClick={() => void remove(f.id, t.ownList.removeField)}>
                    {t.ownList.removeField}
                  </Button>
                )}
              </div>
            );
          })}
          <span ref={addAt} className="inline-block">
            <Button kind="outlined" disabled={busy} aria-haspopup="menu" aria-expanded={adding} onClick={() => setAdding(!adding)}>
              {t.ownList.addField}
            </Button>
          </span>
          <AddFieldMenu
            anchor={adding ? addAt.current : null}
            onPick={(kind) => onChange(addField(definition, kind).definition)}
            onClose={() => setAdding(false)}
          />
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

/** A field's name: typed, and saved when the box is left or Enter is pressed. */
function FieldName({ kind, value, disabled, onSave }: { kind: string; value: string; disabled: boolean; onSave: (name: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <TextField
      label={`${t.ownList.fieldName} (${kind.toLowerCase()})`}
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave(text)}
      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onSave(text))}
    />
  );
}
