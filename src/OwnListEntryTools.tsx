// The list's own tools on the page of one of its items (the owner's report of 14 November: an item showed its fields and `Delete item`, and no way to add a
// field): `Add field` and `Edit list` under the fields, with the same sheet as the list's page (OwnListSheet.tsx). A change is the list's waiting version
// (src/listDraft.ts), and the item's `Save` takes it along (DataForm.tsx, App.tsx ownEnv). `Remove field` keeps the data until the owner confirms in the sheet.
import { useMemo, useRef, useState } from 'react';
import { config } from '@site/editor';
import OwnListSheet from './OwnListSheet';
import OwnListFieldButtons from './OwnListFieldButtons';
import { ownListOf } from './ownLists';
import { DEFINITION_VERSION, parseDefinition } from '../lib/ownList.mjs';
import { addField, definitionText, entriesIn } from '../lib/ownListEdit.mjs';
import { definitionPath, discardListDraft, editListDraft, listDraftOf, useListDrafts, withListDrafts } from './listDraft';
import type { RepoFile } from './github';
import type { Env } from './App';

type Definition = { version: 2; label: string; fields: { id: string; kind: string; label?: string }[]; dropped: string[] };

/** `files` are git's (env.files); the waiting definition is read from the list's draft. */
export default function OwnListEntryTools({ id, env }: { id: string; env: Env }) {
  useListDrafts();
  const saved = env.files;
  const draft = listDraftOf(id);
  const shown = withListDrafts(saved);
  const parsed = parseDefinition(shown.find((f: RepoFile) => f.path === definitionPath(id))?.text ?? '').definition as
    Definition | undefined;
  const definition: Definition = parsed ?? { version: DEFINITION_VERSION, label: id, fields: [], dropped: [] };
  const collection = useMemo(() => ownListOf(id, definition), [JSON.stringify(definition)]);
  const [editing, setEditing] = useState(false);
  const without = draft?.without ?? [];
  const sheet = useRef(null);
  const folder = `${config.folders.data}/${id}`;
  const entries = entriesIn(saved, folder).map((e: { path: string; data: Record<string, unknown> }) => ({
    ...e,
    data: Object.fromEntries(Object.entries(e.data).filter(([k]) => !without.includes(k))),
  }));
  const change = (next: Definition, removed?: string) =>
    editListDraft(id, definitionText(next), removed && !without.includes(removed) ? [...without, removed] : without);
  return (
    <>
      <OwnListFieldButtons onAdd={(kind) => change(addField(definition, kind).definition)} onEdit={() => setEditing(true)} />
      <OwnListSheet
        ref={sheet}
        collection={collection}
        definition={definition}
        entries={entries}
        saved={saved.some((f: RepoFile) => f.path === definitionPath(id))}
        files={saved}
        env={env}
        open={editing}
        onClose={() => setEditing(false)}
        onChange={change}
        onDeleting={() => discardListDraft(id)}
      />
    </>
  );
}
