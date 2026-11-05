// Waits for the cursor to stand still (the menu over a text at a still cursor, selectionMenu in MarkdownEditor.tsx):
// restart on every move or keypress, and onStill runs once it has been still for the delay. Exposes stillTimer.
// No dependencies, no browser.

/** @param {number} delay ms @param {() => void} onStill @returns {{ restart(): void, stop(): void }} */
export function stillTimer(delay, onStill) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  const stop = () => clearTimeout(timer);
  return {
    restart() {
      stop();
      timer = setTimeout(onStill, delay);
    },
    stop,
  };
}
