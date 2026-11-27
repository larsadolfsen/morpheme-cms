// A question in the editor's own dialog instead of the browser's confirm(), whose buttons can only
// say "Cancel" and "OK". ask() opens it and tells which button was tapped; choose() offers more
// than one answer, a text to write (a new address), and notes to read first (what an update brings);
// <Ask /> is in App.tsx.
import { useEffect, useId, useRef, useState } from 'react';
import { Button, DateTimeField, Dialog, TextField } from './ui';
import { t } from './i18n';

type Choice = { value: string; label: string };
type Question = {
  title?: string;
  /** What to read first, each with its heading (an update's release notes, by version), above the text. */
  notes?: { title: string; text: string }[];
  /** Empty: only the notes. */
  text: string;
  choices: Choice[];
  /** A text to write, as it is to begin with, and what it is; `type: 'datetime'`: a date and a time ("2026-03-01T12:00") to pick. */
  input?: { label: string; value: string; type?: 'datetime' };
  /** false: no "Cancel", only the choices (a message to read); Esc is still null. */
  cancel?: boolean;
  /** The choices in one row in reading order, the confirming one last (M3's basic dialog: "The confirmation button is
   * always closest to the edge"), with no "Cancel" button; Esc is still null. The confirming one is `choices[0]` all the same. */
  confirmLast?: boolean;
  /** The main choice deletes something: it is a text button with an error-colour label (every action of a dialog is a text button, as Material 3's basic dialog). */
  danger?: boolean;
  resolve: (answer: { choice: string; text: string } | null) => void;
};

let open: (q: Question) => void = () => {};

// "Cancel" (or Esc) gives false, `yes` gives true.
export const ask = (text: string, yes: string, danger = false) =>
  new Promise<boolean>((resolve) => open({ text, choices: [{ value: 'yes', label: yes }], danger, resolve: (a) => resolve(!!a) }));

/** The choice tapped (the first is the main one) and the text written; null for "Cancel". */
export const choose = (question: Omit<Question, 'resolve'>) =>
  new Promise<{ choice: string; text: string } | null>((resolve) => open({ ...question, resolve }));

/** A sheet closed with changes: "Keep your changes?" with Discard and Keep, the confirming one last. Keep them in the page
 * ('keep', as the sheet's own Save or Insert does), leave them ('discard'), or stay in the sheet (null: Esc or a tap beside it). */
export const closeChanged = () =>
  choose({
    title: t.app.unsavedSheetTitle,
    text: t.app.unsavedSheet,
    choices: [
      { value: 'keep', label: t.app.keep },
      { value: 'discard', label: t.app.discard },
    ],
    confirmLast: true,
  }).then((a) => (a?.choice ?? null) as 'keep' | 'discard' | null);

export function Ask() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [text, setText] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  // The dialog is named by its headline, or by its text when it has none, and described by its text (WCAG 4.1.2; a reader says both on arrival, as no control has the focus).
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    open = (q) => {
      setQuestion(q);
      setText(q.input?.value ?? '');
      dialog.current?.showModal();
    };
  }, []);

  const answer = (choice: string | null) => {
    question?.resolve(choice === null ? null : { choice, text });
    setQuestion(null);
    dialog.current?.close();
  };

  const choices = question?.choices ?? [];
  // More than one answer: one under the other, the main one first, as they would not fit in a row;
  // one answer: "Cancel" before it in a row. The main one is filled, the others, and "Cancel",
  // white with a frame, all alike. The shared Dialog moves the focus to the first control when it opens (Material 3); Esc is still "Cancel".
  const row = !!question?.confirmLast;
  const many = choices.length > 1 && !row;
  return (
    <Dialog
      ref={dialog}
      tabIndex={-1}
      aria-labelledby={question?.title ? titleId : question?.text ? textId : undefined}
      aria-describedby={question?.title && question.text ? textId : undefined}
      onCancel={() => answer(null)}
      className="mo-editor-ask-dialog"
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (choices[0]) answer(choices[0].value);
        }}
      >
        {question?.title && (
          <h2 id={titleId} className="mo-editor-ask-title">
            {question.title}
          </h2>
        )}
        {!!question?.notes?.length && (
          <div className="mo-editor-ask-notes">
            {question.notes.map((n) => (
              <section key={n.title}>
                <h3 className="mo-editor-settings-strong">{n.title}</h3>
                {n.text.split(/\n\s*\n/).map((p, i) => (
                  <p key={i} className="mo-editor-ask-note">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        )}
        {question?.text && (
          <p id={textId} className={question.notes?.length ? 'mo-editor-ask-follow' : ''}>
            {question.text}
          </p>
        )}
        {question?.input && (
          <div className="mo-editor-ask-follow">
            {question.input.type === 'datetime' ? (
              <DateTimeField id="ask-input" label={question.input.label} value={text} onChange={setText} />
            ) : (
              <TextField id="ask-input" label={question.input.label} autoFocus value={text} onChange={(e) => setText(e.target.value)} />
            )}
          </div>
        )}
        <div className={`mo-editor-ask-buttons ${many ? 'mo-editor-ask-buttons-stacked' : 'mo-row-end'}`}>
          {row &&
            [...choices].reverse().map((c, i, all) => (
              <Button
                key={c.value}
                kind="text"
                tone={question?.danger && i === all.length - 1 ? 'error' : undefined}
                onClick={() => answer(c.value)}
              >
                {c.label}
              </Button>
            ))}
          {!many && !row && (
            <Button kind="text" onClick={() => answer(null)}>
              {t.common.cancel}
            </Button>
          )}
          {!row &&
            choices.map((c, i) => (
              <Button key={c.value} kind="text" tone={question?.danger && i === 0 ? 'error' : undefined} onClick={() => answer(c.value)}>
                {c.label}
              </Button>
            ))}
          {many && question?.cancel !== false && (
            <Button kind="text" onClick={() => answer(null)}>
              {t.common.cancel}
            </Button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
