// A question in the editor's own dialog instead of the browser's confirm(), whose buttons can only
// say "Cancel" and "OK". ask() opens it and tells which button was tapped; choose() offers more
// than one answer, a text to write (a new address), and notes to read first (what an update brings);
// <Ask /> is in App.tsx.
import { useEffect, useRef, useState } from 'react';
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
  resolve: (answer: { choice: string; text: string } | null) => void;
};

let open: (q: Question) => void = () => {};

// "Cancel" (or Esc) gives false, `yes` gives true.
export const ask = (text: string, yes: string) =>
  new Promise<boolean>((resolve) => open({ text, choices: [{ value: 'yes', label: yes }], resolve: (a) => resolve(!!a) }));

/** The choice tapped (the first is the main one) and the text written; null for "Cancel". */
export const choose = (question: Omit<Question, 'resolve'>) =>
  new Promise<{ choice: string; text: string } | null>((resolve) => open({ ...question, resolve }));

/** A sheet closed with changes: keep them ('keep', with the sheet's main button's text: Save, Insert),
 * leave them ('discard'), or stay in the sheet (null, "Cancel"). */
export const closeChanged = (keep: string) =>
  choose({
    text: t.app.unsavedSheet,
    choices: [
      { value: 'keep', label: keep },
      { value: 'discard', label: t.app.discard },
    ],
  }).then((a) => (a?.choice ?? null) as 'keep' | 'discard' | null);

export function Ask() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [text, setText] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);

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
  // white with a frame, all alike. No button has the focus to begin with (the dialog has it), so none
  // of them looks chosen; Esc is still "Cancel".
  const many = choices.length > 1;
  useEffect(() => {
    if (question && !question.input) dialog.current?.focus();
  }, [question]);
  return (
    <Dialog ref={dialog} tabIndex={-1} onCancel={() => answer(null)} className="focus:outline-none">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (choices[0]) answer(choices[0].value);
        }}
      >
        {question?.title && <h2 className="mb-2 text-lg font-medium">{question.title}</h2>}
        {!!question?.notes?.length && (
          <div className="-mx-6 max-h-[50vh] space-y-4 overflow-y-auto px-6">
            {question.notes.map((n) => (
              <section key={n.title}>
                <h3 className="font-medium">{n.title}</h3>
                {n.text.split(/\n\s*\n/).map((p, i) => (
                  <p key={i} className="mt-1 text-on-surface-variant">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        )}
        {question?.text && <p className={question.notes?.length ? 'mt-4' : ''}>{question.text}</p>}
        {question?.input && (
          <div className="mt-4">
            {question.input.type === 'datetime' ? (
              <DateTimeField id="ask-input" label={question.input.label} value={text} onChange={setText} />
            ) : (
              <TextField id="ask-input" label={question.input.label} autoFocus value={text} onChange={(e) => setText(e.target.value)} />
            )}
          </div>
        )}
        <div className={`mt-6 flex gap-2 ${many ? 'flex-col' : 'justify-end'}`}>
          {!many && (
            <Button kind="outlined" onClick={() => answer(null)}>
              {t.common.cancel}
            </Button>
          )}
          {choices.map((c, i) => (
            <Button key={c.value} kind={i === 0 ? 'filled' : 'outlined'} onClick={() => answer(c.value)}>
              {c.label}
            </Button>
          ))}
          {many && question?.cancel !== false && (
            <Button kind="outlined" onClick={() => answer(null)}>
              {t.common.cancel}
            </Button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
