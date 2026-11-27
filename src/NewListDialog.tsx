// `New list` (docs/superpowers/plans/2026-11-12-new-list.md, batch 7; the owner's decision of 13 November): the dialog the `New list` button on the
// `Lists` screen opens, with only the list's name. `Create` makes the list's waiting version (src/listDraft.ts; the owner's decision of 14 November: nothing
// is committed until the final `Save` on the list's page) with no fields and opens the new list's page, where the owner adds fields one at a time (`Add field`). The parts are ui.tsx's and the dialog is the editor's one pattern (ask.tsx): `Cancel` outlined, the main choice filled,
// no initial focus. The rules are lib/ownList.mjs (`idOf` refuses a name that is taken).
import { useEffect, useId, useRef, useState } from 'react';
import { config } from '@site/editor';
import { Button, Dialog, TextField, atLeastNow } from './ui';
import { usePane } from './PaneHost';
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
  // From medium (600 dp) the new list's name is asked in the pane beside the page (owner, 15 Nov 2026: a form is a pane, not a dialog), below it in
  // the dialog; taken when it opens and kept while it is open.
  const [inPane, setInPane] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const headingId = useId();
  useEffect(() => {
    const el = dialog.current;
    if (open) {
      setLabel('');
      setProblem('');
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const wide = atLeastNow('medium');
      setInPane(wide);
      if (!wide && el && !el.open) {
        el.showModal();
        // No button or field has the focus to begin with, so none looks chosen (as the editor's other dialogs).
        el.focus();
      }
    } else {
      if (el?.open) el.close();
      setInPane(false);
    }
  }, [open]);
  // The dialog or the pane goes (the page is told when the pane has gone, as it is when the dialog closes).
  const closeIt = async () => {
    if (inPane) {
      await pane.close();
      onClose();
    } else dialog.current?.close();
  };

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
    void closeIt();
    location.hash = `#list/${named.id}`;
  }

  const nameField = (
    <TextField
      id="new-list-name"
      label={t.ownList.name}
      value={label}
      problem={problem || undefined}
      onChange={(e) => (setLabel(e.target.value), setProblem(''))}
    />
  );
  const pane = usePane(
    inPane && open
      ? {
          headline: t.ownList.new,
          headlineId: headingId,
          beforeClose: async () => {
            await closeIt();
            return false;
          },
          opener: opener.current,
          onBack: () => void closeIt(),
          backLabel: t.common.back,
          actions: (
            <>
              <Button kind="filled" onClick={create}>
                {t.ownList.make}
              </Button>
              <Button kind="outlined" onClick={() => void closeIt()}>
                {t.common.cancel}
              </Button>
            </>
          ),
          children: (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create();
              }}
            >
              {nameField}
            </form>
          ),
        }
      : null,
  );

  return (
    <>
      <Dialog ref={dialog} tabIndex={-1} aria-label={t.ownList.new} onClose={onClose} className="mo-editor-quiet-focus">
        {!inPane && (
          <form
            method="dialog"
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <h2 className="mo-type-body-large mo-editor-dialog-title">{t.ownList.new}</h2>
            {nameField}
            <div className="mo-editor-dialog-actions">
              <Button kind="text" type="button" onClick={() => void closeIt()}>
                {t.common.cancel}
              </Button>
              <Button kind="text" type="submit">
                {t.ownList.make}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
      {pane.portal}
    </>
  );
}
