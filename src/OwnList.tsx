// The page of a list the owner made (`#list/<id>`; the owner's decision of 14 November: "Dynamic lists should work like testimonials, except the user decides what
// fields it has"): the same list page (Library.tsx `List`) and the same item page (DataForm.tsx) as the testimonials have, with the fields of the list's own
// definition. What is new here is only the list's menu (`Edit list`, `Delete list`), its sheet, and the waiting version: making the list and adding or changing
// its fields is kept (src/listDraft.ts) until a `Save`, the page's own or an item's (App.tsx adds the waiting definition to that commit).
import { useMemo, useRef, useState } from 'react';
import { DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react';
import { config } from '@site/editor';
import { List } from './Library';
import Screen from './Screen';
import { SaveBar, useFormPages, useUnsavedGuard } from './FormFrame';
import OwnListSheet from './OwnListSheet';
import AddFieldMenu from './AddFieldMenu';
import { Button, IconButton, LoadingIndicator, Menu, MenuItem, SupportingText } from './ui';
import { ConflictError, type RepoFile } from './github';
import { siteT, t } from './i18n';
import { kindAndName, lower, savedText } from './deploy';
import { ownListOf } from './ownLists';
import { DEFINITION_VERSION, parseDefinition } from '../lib/ownList.mjs';
import { definitionText, entriesIn } from '../lib/ownListEdit.mjs';
import { definitionPath, discardListDraft, editListDraft, listDraftOf, pendingOf, useListDrafts } from './listDraft';
import type { Env } from './App';

type Definition = { version: 2; label: string; fields: { id: string; kind: string; label?: string }[]; dropped: string[] };

/** `files` are the site's files with the waiting definition in place (withListDrafts); `saved` are git's. */
export default function OwnList({ id, files, saved, env }: { id: string; files: RepoFile[]; saved: RepoFile[]; env: Env }) {
  const folder = `${config.folders.data}/${id}`;
  const draft = listDraftOf(id);
  const state = useListDrafts().find((d) => d.id === id)?.state;
  const committed = saved.find((f) => f.path === definitionPath(id));
  const parsed = parseDefinition(files.find((f) => f.path === definitionPath(id))?.text ?? '').definition as Definition | undefined;
  const definition: Definition = parsed ?? { version: DEFINITION_VERSION, label: id, fields: [], dropped: [] };
  const collection = useMemo(() => ownListOf(id, definition), [JSON.stringify(definition)]);
  const pending = !!draft;
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const menuAt = useRef<HTMLSpanElement>(null);
  const addButton = useRef<HTMLSpanElement>(null);
  const sheet = useRef<{ remove: () => void; add: (kind: string) => void }>(null);
  const without = draft?.without ?? [];

  /** A change to the definition (the sheet's): kept as the waiting version. */
  const change = (next: Definition, removed?: string) =>
    editListDraft(id, definitionText(next), removed && !without.includes(removed) ? [...without, removed] : without);

  /** `Save`: the waiting definition and what it takes out of the items, as one commit. */
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
  // The list's own screens (an item, a new item) are part of it: going to one keeps what waits, and the next save takes it along.
  useFormPages([`list/${id}`, `new/${id}`, ...entriesIn(saved, folder).map((e: { path: string }) => e.path)]);

  // The items as git has them, minus the fields whose data is to go, for what `Remove field` counts.
  const entries = entriesIn(saved, folder).map((e: { path: string; data: Record<string, unknown> }) => ({
    ...e,
    data: Object.fromEntries(Object.entries(e.data).filter(([k]) => !without.includes(k))),
  }));
  const status = saving ? (
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

  const menuButton = (
    <span ref={menuAt}>
      <IconButton
        icon={DotsThreeVertical}
        label={t.ownList.menu}
        aria-haspopup="menu"
        aria-expanded={menu}
        onClick={() => setMenu(!menu)}
      />
    </span>
  );
  const after = (
    <>
      <Menu anchor={menu ? menuAt.current : null} label={t.ownList.menu} onClose={() => setMenu(false)}>
        <MenuItem
          icon={PencilSimple}
          onClick={() => {
            setMenu(false);
            setEditing(true);
          }}
        >
          {t.ownList.edit}
        </MenuItem>
        <MenuItem
          icon={Trash}
          onClick={() => {
            setMenu(false);
            sheet.current?.remove();
          }}
        >
          {t.ownList.delete}
        </MenuItem>
      </Menu>
      <OwnListSheet
        ref={sheet}
        collection={collection}
        definition={definition}
        entries={entries}
        saved={!!committed}
        files={saved}
        env={env}
        open={editing}
        onClose={() => setEditing(false)}
        onChange={change}
        onDeleting={() => discardListDraft(id)}
      />
      {pending && <SaveBar saving={saving} onSave={save} />}
    </>
  );

  if (definition.fields.length === 0)
    return (
      <Screen title={definition.label} back={{ href: '#lists', label: t.common.parts.lists }} status={status} pageActions={menuButton}>
        <div className="editor-text">
          <SupportingText>{t.ownList.noFields}</SupportingText>
          <span ref={addButton} className="mt-4 inline-block">
            <Button kind="filled" aria-haspopup="menu" aria-expanded={adding} onClick={() => setAdding(!adding)}>
              {t.ownList.addField}
            </Button>
          </span>
          <AddFieldMenu
            anchor={adding ? addButton.current : null}
            onPick={(kind) => sheet.current?.add(kind)}
            onClose={() => setAdding(false)}
          />
        </div>
        {after}
      </Screen>
    );
  return <List collection={collection} files={files} env={env} own={{ pageActions: menuButton, status, after }} />;
}
