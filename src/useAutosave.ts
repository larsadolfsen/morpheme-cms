// The form's autosave (src/autosave.mjs, the Worker's /api/autosave): the page's waiting version is sent to the Worker a moment after each
// change and moved to git when the person leaves or has been idle. `text` gives the text of the version as the form would save it, or null
// when it cannot be saved now (a field that is wrong, a picture not uploaded yet): the state is then `notSaved`. Only with Faster editor on:
// without it the Worker says so (409) and the state is `notSaved` until `Save`.
import { useEffect, useRef, useState } from 'react';
import { autosaveClient, deleteAutosave, watchLeaving } from './autosave.mjs';

export type AutosaveState = 'saving' | 'saved' | 'notSaved';

/** How long after the last change the text is read from the form (reading the text editor is not free). */
const READ_MS = 400;

export function useAutosave({
  on,
  path,
  dirty,
  text,
  flushed,
}: {
  /** The version being edited can be autosaved (a published page's changes, not the live page or a new page). */
  on: boolean;
  /** The page file. */
  path: string;
  dirty: boolean;
  text: () => string | null;
  /** Git got the text as the waiting version: the form takes its file. */
  flushed: () => void;
}) {
  const latest = useRef({ on, path, dirty, text, flushed });
  latest.current = { on, path, dirty, text, flushed };
  const client = useRef<ReturnType<typeof autosaveClient>>(null);
  client.current ??= autosaveClient(undefined, { onFlushed: () => latest.current.flushed() });
  const [state, setState] = useState<AutosaveState>('saved');
  const [blocked, setBlocked] = useState(false);
  // A change was made and its text is not read yet: it is not saved.
  const [reading, setReading] = useState(false);
  const timer = useRef(0);
  // Whether the Worker may have something for this page that the form has not thrown away.
  const kept = useRef(false);

  const forgetIt = () => {
    clearTimeout(timer.current);
    if (!kept.current) return;
    kept.current = false;
    client.current!.forget(latest.current.path);
    void deleteAutosave(latest.current.path);
  };

  useEffect(() => {
    const c = client.current!;
    const stop = c.subscribe(setState);
    const stopLeaving = watchLeaving(c);
    const online = () => void c.retry();
    window.addEventListener('online', online);
    return () => {
      stop();
      stopLeaving();
      window.removeEventListener('online', online);
      // The form is left with something unsaved that was not saved first (the person chose Discard): what was kept goes.
      forgetIt();
    };
  }, []);

  // Saved, discarded or switched away from: nothing is waiting in the Worker any more.
  useEffect(() => {
    if (!dirty) {
      forgetIt();
      setBlocked(false);
      setReading(false);
    }
  }, [dirty]);

  /** The form changed: the text is read after a moment and sent. */
  function touch() {
    if (!latest.current.on) return;
    clearTimeout(timer.current);
    setReading(true);
    timer.current = window.setTimeout(() => {
      setReading(false);
      const now = latest.current;
      const written = now.on && now.dirty ? now.text() : null;
      setBlocked(written === null && now.dirty);
      if (written === null) return;
      kept.current = true;
      client.current!.autosave(now.path, written);
    }, READ_MS);
  }

  return { touch, state: (blocked ? 'notSaved' : reading ? 'saving' : state) as AutosaveState };
}
