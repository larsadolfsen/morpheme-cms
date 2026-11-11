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
  make,
  skip,
}: {
  /** The version being edited can be autosaved (a published page's changes, not the live page or a new page). */
  on: boolean;
  /** The page file. */
  path: string;
  dirty: boolean;
  text: () => string | null;
  /** Git got the text (as the waiting version, as a draft page file, or as the new page file `wrote`): the form takes its file. */
  flushed: (wrote?: string) => void;
  /** A new page or post (`create`; `path` a placeholder that never exists) or a draft to move after its H1 (`to`): the page file it is to be. */
  make?: () => { create?: boolean; to?: string };
  /** The form is as it was opened (a new page nobody wrote in): nothing is kept, and nothing is left behind. */
  skip?: () => boolean;
}) {
  const latest = useRef({ on, path, dirty, text, flushed, make, skip });
  latest.current = { on, path, dirty, text, flushed, make, skip };
  const client = useRef<ReturnType<typeof autosaveClient>>(null);
  client.current ??= autosaveClient(undefined, {
    onFlushed: (done: { path: string; wrote?: string }) => {
      // The Worker made a page file or moved the draft: the autosave of the file it was is done with.
      if (done.wrote && done.wrote !== done.path) client.current!.forget(done.path);
      latest.current.flushed(done.wrote);
    },
  });
  const [state, setState] = useState<AutosaveState>('saved');
  const [blocked, setBlocked] = useState(false);
  // A change was made and its text is not read yet: it is not saved.
  const [reading, setReading] = useState(false);
  const timer = useRef(0);
  // Whether the Worker may have something for this page that the form has not thrown away, and under which file (a new page's is a
  // placeholder, and `path` is the page file once the Worker has made it).
  const kept = useRef(false);
  const keptAt = useRef('');

  const forgetIt = () => {
    clearTimeout(timer.current);
    if (!kept.current) return;
    kept.current = false;
    client.current!.forget(keptAt.current);
    void deleteAutosave(keptAt.current);
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
      // Written in and erased again: a new page is as the form opened it, so what was kept goes and no file is made.
      if (now.on && now.dirty && now.skip?.()) return forgetIt();
      const written = now.on && now.dirty ? now.text() : null;
      setBlocked(written === null && now.dirty);
      if (written === null) return;
      kept.current = true;
      keptAt.current = now.path;
      client.current!.autosave(now.path, written, 'waiting', now.make?.());
    }, READ_MS);
  }

  return { touch, state: (blocked ? 'notSaved' : reading ? 'saving' : state) as AutosaveState };
}
