// Whether a new page shows the message that its first heading becomes the page's H1 (EntryForm.tsx): the first
// HINT_TIMES times a new page opens in this browser, counted in its storage. No dependencies, so node can import it.

export const HINT_KEY = 'editor-first-heading-hint';
export const HINT_TIMES = 7;

/** Counts one more new page and tells whether its message is shown. Without storage (blocked: reading it may throw), it is not.
 * @param {() => Pick<Storage, 'getItem' | 'setItem'> | undefined} [storageOf] */
export function takeHint(storageOf = () => globalThis.localStorage) {
  try {
    const storage = storageOf();
    const shown = Number.parseInt(storage?.getItem(HINT_KEY) ?? '0', 10) || 0;
    if (!storage || shown >= HINT_TIMES) return false;
    storage.setItem(HINT_KEY, String(shown + 1));
    return true;
  } catch {
    return false;
  }
}
