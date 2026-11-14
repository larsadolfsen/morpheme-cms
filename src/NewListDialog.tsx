// `New list` (docs/superpowers/plans/2026-11-12-new-list.md, batch 7; the owner's decision of 13 November): the dialog the `New list` button on the
// `Lists` screen opens, with only the list's name. `Create` makes the list's waiting version (src/listDraft.ts; the owner's decision of 14 November: nothing
// is committed until the final `Save` on the list's page) with no fields and opens the new list's page, where the owner adds fields one at a time (`Add field`). The parts are ui.tsx's and the dialog is the editor's one pattern (ask.tsx): `Cancel` outlined, the main choice filled,
// no initial focus. The rules are lib/ownList.mjs (`idOf` refuses a name that is taken).
import { useEffect, useRef, useState } from 'react';
import { config } from '@site/editor';
import { Button, Dialog, TextField } from './ui';
import type { RepoFile } from './github';
import { t } from './i18n';
import { collectionsFor } from './site';
import { DEFINITION_VERSION, idOf } from '../lib/ownList.mjs';
import { definitionText } from '../lib/ownListEdit.mjs';
import { editListDraft, listDraftIds } from './listDraft';

export default function NewListDialog({ files, open, onClose }: { files: RepoFile[]; open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [label, setLabel] = useState('');
  const [problem, setProblem] = useState('');
  useEffect(() => {
    const el = dialog.current;
    if (open && el && !el.open) {
      setLabel('');
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
    return [...collectionsFor(files).map((c) => c.id), ...folders, ...listDraftIds()];
  };

  function create() {
    const named = idOf(label, taken());
    if (!named.id) return setProblem(named.suggestion ? t.ownList.nameTaken : t.ownList.nameNeeded);
    const text = definitionText({ version: DEFINITION_VERSION, label: label.trim(), fields: [], dropped: [] });
    editListDraft(named.id, text);
    dialog.current?.close();
    location.hash = `#list/${named.id}`;
  }

  return (
    <Dialog ref={dialog} tabIndex={-1} aria-label={t.ownList.new} onClose={onClose} className="focus:outline-none">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <h2 className="mb-4 text-body-large font-medium">{t.ownList.new}</h2>
        <TextField
          id="new-list-name"
          label={t.ownList.name}
          value={label}
          problem={problem || undefined}
          onChange={(e) => (setLabel(e.target.value), setProblem(''))}
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button kind="outlined" type="button" onClick={() => dialog.current?.close()}>
            {t.common.cancel}
          </Button>
          <Button kind="filled" type="submit">
            {t.ownList.make}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
