// The editor's autosave, without a screen (the form calls it; packages/editor/worker/autosave.js keeps the text in R2): `autosave(path, text, id?)`
// sends the text a little after the last change, restarts an idle timer, and moves the text to git (the waiting version) when the
// person leaves the page or the editor has been idle for a long time. The state is `saving`, `saved` or `notSaved`:
//   saving    a change is waiting for its turn or on its way to the Worker
//   saved     the Worker has the newest text (or git has it, after a flush)
//   notSaved  it could not be sent after the retries, or `R2 caching` is off (409 `off`): nothing is kept until `Save`
// A failed send is tried again after 1, 2, 4, 8 and 16 seconds (`retries`), and again on the next change or `retry()`.
// `createAutosave` takes what it needs from outside (`send`, `timers`, `now`), so it runs in a test; `autosaveClient` is the one the
// editor uses (fetch, the browser's timers). Exposes createAutosave, autosaveClient, watchLeaving, STATES. No dependencies.

/** @typedef {'saving' | 'saved' | 'notSaved'} AutosaveState */
export const STATES = ['saving', 'saved', 'notSaved'];

/** Time to wait after the last change before sending it, and after the last change before moving it to git (five minutes idle). */
export const DEBOUNCE_MS = 1500;
export const IDLE_MS = 5 * 60 * 1000;
const RETRY_MS = [1000, 2000, 4000, 8000, 16000];

/**
 * @param {{
 *   send: (call: { action: 'put' | 'flush'; path: string; id: string; text?: string; leaving?: boolean; create?: boolean; to?: string }) => Promise<{ ok: boolean; off?: boolean; committed?: boolean; path?: string }>,
 *   setTimer?: (fn: () => void, ms: number) => unknown,
 *   clearTimer?: (timer: unknown) => void,
 *   debounce?: number, idle?: number, retries?: number[],
 *   onFlushed?: (done: { path: string; id: string; wrote?: string }) => void,
 * }} options
 */
export function createAutosave({
  send,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (t) => clearTimeout(/** @type {any} */ (t)),
  debounce = DEBOUNCE_MS,
  idle = IDLE_MS,
  retries = RETRY_MS,
  onFlushed,
}) {
  /** @type {Map<string, { path: string; id: string; text: string; make: { create?: boolean; to?: string }; dirty: boolean; unflushed: boolean; sending: boolean; failed: boolean; off: boolean; tries: number; timer?: unknown; idleTimer?: unknown }>} */
  const items = new Map();
  /** @type {Set<(state: AutosaveState) => void>} */
  const listeners = new Set();
  let last = /** @type {AutosaveState} */ ('saved');

  /** The state of all: not saved if any is, else saving if any is, else saved. */
  function state() {
    const all = [...items.values()];
    if (all.some((i) => i.off || i.failed)) return 'notSaved';
    if (all.some((i) => i.dirty || i.sending)) return 'saving';
    return 'saved';
  }
  function emit() {
    const now = state();
    if (now === last) return;
    last = now;
    for (const fn of listeners) fn(now);
  }
  const keyOf = (path, id) => `${path}\n${id}`;

  /** Sends the newest text now; on failure the next try is scheduled. */
  async function sendNow(item) {
    clearTimer(item.timer);
    item.timer = undefined;
    if (item.sending || !item.dirty || item.off) return;
    item.sending = true;
    const text = item.text;
    let answer;
    try {
      answer = await send({ action: 'put', path: item.path, id: item.id, text, ...item.make });
    } catch {
      answer = { ok: false };
    }
    item.sending = false;
    if (answer.off) {
      item.off = true;
      item.dirty = false;
    } else if (answer.ok) {
      item.tries = 0;
      item.failed = false;
      // A change made while sending is still to be sent.
      item.dirty = item.text !== text;
      if (item.dirty) item.timer = setTimer(() => sendNow(item), debounce);
      // The idle timer is there again after a failed flush.
      item.idleTimer ??= setTimer(() => flush(item.path, item.id), idle);
    } else if (item.tries < retries.length) {
      item.timer = setTimer(() => sendNow(item), retries[item.tries++]);
    } else {
      item.failed = true;
    }
    emit();
  }

  /** The text of a page's version changed. `make`: a new page or post (`create`, with `to` the page file it is made as), or a draft page
   * that is to move to `to` (the H1 changed): the Worker (worker/autosave.js) does it when it moves the text to git. */
  function autosave(path, text, id = 'waiting', make = {}) {
    const key = keyOf(path, id);
    const item = items.get(key) ?? {
      path,
      id,
      text,
      make,
      dirty: false,
      unflushed: false,
      sending: false,
      failed: false,
      off: false,
      tries: 0,
    };
    items.set(key, item);
    if (item.off) return;
    item.text = text;
    item.make = make;
    item.dirty = true;
    item.unflushed = true;
    item.failed = false;
    item.tries = 0;
    clearTimer(item.timer);
    item.timer = setTimer(() => sendNow(item), debounce);
    clearTimer(item.idleTimer);
    item.idleTimer = setTimer(() => flush(path, id), idle);
    emit();
  }

  /** Moves the page's text to git now: what is waiting is sent with the flush, so one request does both. Gives whether it worked. */
  async function flush(path, id = 'waiting', { leaving = false } = {}) {
    const item = items.get(keyOf(path, id));
    if (!item || item.off) return false;
    clearTimer(item.timer);
    clearTimer(item.idleTimer);
    item.timer = item.idleTimer = undefined;
    const text = item.text;
    // An autosave already in the Worker is flushed without its text (it has it); a change not yet sent goes with the flush.
    const wasDirty = item.dirty;
    item.sending = true;
    let answer;
    try {
      answer = await send({ action: 'flush', path, id, ...(wasDirty ? { text } : {}), ...item.make, leaving });
    } catch {
      answer = { ok: false };
    }
    item.sending = false;
    if (answer.off) item.off = true;
    else if (answer.ok) {
      item.failed = false;
      item.tries = 0;
      // Saved in git: nothing is left in R2 unless the text changed while the flush was on its way.
      if (item.text === text) {
        item.dirty = false;
        item.unflushed = false;
      } else item.timer = setTimer(() => sendNow(item), debounce);
      // Git has a new waiting version: the form takes its file (its blob id) so the next save does not clash with it.
      // (`wrote`: the page file that has it, when the Worker made a new page or moved a draft.)
      if (answer.committed && !leaving) onFlushed?.({ path, id, ...(answer.path ? { wrote: answer.path } : {}) });
    } else {
      // Not in git: the text is still to be sent (`retry()`, or the next change).
      item.failed = true;
      item.dirty = true;
    }
    emit();
    return answer.ok === true;
  }

  /** The person leaves the page: everything not yet in git is sent in one request each (they cannot wait). */
  async function leave() {
    await Promise.all([...items.values()].filter((i) => i.unflushed && !i.off).map((i) => flush(i.path, i.id, { leaving: true })));
  }

  /** Tries again at once what failed. */
  async function retry() {
    await Promise.all([...items.values()].filter((i) => i.failed && !i.off).map((i) => ((i.failed = false), (i.tries = 0), sendNow(i))));
  }

  /** The page's text is no longer waiting for anything (saved with `Save`, or its draft discarded): forget it, and its autosave is deleted by the caller. */
  function forget(path, id = 'waiting') {
    const item = items.get(keyOf(path, id));
    if (!item) return;
    clearTimer(item.timer);
    clearTimer(item.idleTimer);
    items.delete(keyOf(path, id));
    emit();
  }

  return {
    autosave,
    flush,
    leave,
    retry,
    forget,
    state,
    /** Calls `fn` with the state each time it changes; gives the way to stop. @param {(state: AutosaveState) => void} fn */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** The one the editor uses: requests to the Worker's /api/autosave, the browser's timers. `fetcher`: `fetch`. */
export function autosaveClient(fetcher = (...args) => fetch(...args), options = {}) {
  const send = async ({ action, path, id, text, leaving, create, to }) => {
    const flush = action === 'flush';
    const body = JSON.stringify({
      path,
      id,
      ...(text === undefined ? {} : { text }),
      ...(create ? { create } : {}),
      ...(to ? { to } : {}),
    });
    // `keepalive` lets the request finish after the page has gone, but is limited to 64 KB of body.
    const keepalive = leaving && body.length < 60_000;
    const res = await fetcher(flush ? '/api/autosave/flush' : '/api/autosave', {
      method: flush ? 'POST' : 'PUT',
      headers: { 'content-type': 'application/json' },
      body,
      cache: 'no-store',
      ...(keepalive ? { keepalive } : {}),
    });
    if (res.status === 409) {
      const said = await res.json().catch(() => ({}));
      // `off`: `R2 caching` is off. `moved`: the branch moved while flushing; the autosave is still in R2 and the next flush works.
      return { ok: false, off: said.error === 'off' };
    }
    // 404 `page` on a flush: the page file is gone and the Worker has thrown the autosave away: nothing more to keep.
    const said = flush && res.ok ? await res.json().catch(() => ({})) : {};
    return { ok: res.ok || (flush && res.status === 404), committed: said.committed === true, ...(said.path ? { path: said.path } : {}) };
  };
  return createAutosave({ send, ...options });
}

/** What the Worker keeps for a page's version: `{ text, savedAt }`, or null when it has none (or cannot be asked). */
export async function loadAutosave(path, id = 'waiting', fetcher = (...args) => fetch(...args)) {
  try {
    const res = await fetcher(`/api/autosave?${new URLSearchParams({ path, id })}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const stored = await res.json();
    return typeof stored?.text === 'string' && typeof stored.savedAt === 'number' ? stored : null;
  } catch {
    return null;
  }
}

/** Throws away what the Worker keeps for a page's version (it was saved, discarded or left); never fails. */
export async function deleteAutosave(path, id = 'waiting', fetcher = (...args) => fetch(...args)) {
  try {
    await fetcher(`/api/autosave?${new URLSearchParams({ path, id })}`, { method: 'DELETE', keepalive: true });
  } catch {}
}

/** Whether a stored autosave is to be put back when a page opens: it has other text than the version in git, and was saved after git's
 * file was (`gitAt`: when the file was last saved, or null when that is not known). @param {{ text: string; savedAt: number }} stored
 * @param {string} gitText @param {Date | null | undefined} gitAt */
export const restorable = (stored, gitText, gitAt) => stored.text !== gitText && (!gitAt || stored.savedAt > gitAt.getTime());

/** Calls `client.leave()` when the page is left or hidden (the tab closed, another app on a phone), and gives the way to stop. */
export function watchLeaving(client, target = globalThis) {
  const onHide = () => {
    if (target.document?.visibilityState === 'hidden' || target.document === undefined) client.leave();
  };
  const onPageHide = () => client.leave();
  target.addEventListener('pagehide', onPageHide);
  target.document?.addEventListener('visibilitychange', onHide);
  return () => {
    target.removeEventListener('pagehide', onPageHide);
    target.document?.removeEventListener('visibilitychange', onHide);
  };
}
