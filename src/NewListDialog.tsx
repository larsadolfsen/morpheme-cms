// `New list` (docs/superpowers/plans/2026-11-12-new-list.md, batch 7): the dialog the `New list` button on the `Lists` screen opens, with the
// list's name and a switch for each of the six fields (the title is always on). `Create` writes `src/data/<id>/_list.json` as one commit and opens
// the new list's page. The parts are ui.tsx's and the dialog is the editor's one pattern (ask.tsx): `Cancel` outlined, the main choice filled,
// no initial focus. The rules are lib/ownList.mjs (`idOf` refuses a name that is taken, `FIELDS` is the fixed set).
import { useEffect, useRef, useState } from 'react';
import { config } from '@site/editor';
import { Button, Dialog, SwitchRow, SupportingText, TextField } from './ui';
import { ConflictError, type RepoFile } from './github';
import { siteT, t } from './i18n';
import { kindAndName, lower, savedText } from './deploy';
import { collectionsFor } from './site';
import { DEFINITION_FILE, FIELDS, idOf } from '../lib/ownList.mjs';
import { definitionText } from '../lib/ownListEdit.mjs';
import type { Env } from './App';

/** The fields a new list starts with; the owner switches the others on. */
const START = ['icon', 'title', 'text', 'href'];

export default function NewListDialog({ files, env, open, onClose }: { files: RepoFile[]; env: Env; open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [label, setLabel] = useState('');
  const [fields, setFields] = useState<string[]>(START);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const el = dialog.current;
    if (open && el && !el.open) {
      setLabel('');
      setFields(START);
      setProblem('');
      el.showModal();
      // No button or field has the focus to begin with, so none looks chosen (as the editor's other dialogs).
      el.focus();
    }
    if (!open && el?.open) el.close();
  }, [open]);

  /** Every id and folder in use: the collections, and the folders of the data folder. */
  const taken = () => {
    const prefix = `${config.folders.data}/`;
    const folders = files.filter((f) => f.path.startsWith(prefix)).map((f) => f.path.slice(prefix.length).split('/')[0]);
    return [...collectionsFor(files).map((c) => c.id), ...folders];
  };

  async function create() {
    const named = idOf(label, taken());
    if (!named.id) return setProblem(named.suggestion ? t.ownList.nameTaken : t.ownList.nameNeeded);
    const id = named.id;
    const name = label.trim();
    const path = `${config.folders.data}/${id}/${DEFINITION_FILE}`;
    const text = definitionText({
      version: 1,
      label: name,
      fields: FIELDS.map((f: { id: string }) => f.id).filter((f: string) => fields.includes(f)),
      dropped: [],
    });
    const change = t.app.changes.created(kindAndName(t.ownList.list, name));
    setBusy(true);
    env.notify({ text: t.common.saving });
    try {
      const oids = await env.commit(
        siteT.forms.commit.create(siteT.ownList.new, lower(name)),
        [{ path, content: text, oid: null }],
        change,
      );
      env.onSaved({ path, oid: oids[path], text });
      env.notify({ text: savedText(change), kind: 'saved' });
      dialog.current?.close();
      location.hash = `#list/${id}`;
    } catch (e) {
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog ref={dialog} tabIndex={-1} aria-label={t.ownList.new} onClose={onClose} className="focus:outline-none">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <h2 className="mb-4 text-body-large font-medium">{t.ownList.new}</h2>
        <TextField
          id="new-list-name"
          label={t.ownList.name}
          value={label}
          disabled={busy}
          problem={problem || undefined}
          onChange={(e) => (setLabel(e.target.value), setProblem(''))}
        />
        <p className="mt-4 mb-1 font-medium">{t.ownList.fields}</p>
        {FIELDS.map((f: { id: string }) => (
          <div key={f.id}>
            <SwitchRow
              label={t.ownList[f.id as 'icon']}
              selected={fields.includes(f.id)}
              disabled={busy || f.id === 'title'}
              onChange={(on) => setFields(on ? [...fields, f.id] : fields.filter((x) => x !== f.id))}
            />
            {f.id === 'title' && <SupportingText className="mt-1">{t.ownList.titleOn}</SupportingText>}
          </div>
        ))}
        <div className="mt-6 flex justify-end gap-2">
          <Button kind="outlined" type="button" onClick={() => dialog.current?.close()}>
            {t.common.cancel}
          </Button>
          <Button kind="filled" type="submit" disabled={busy}>
            {t.ownList.make}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
