// Type-ahead for a menu (M3 menus accessibility: "Letters: Focus moves to the next menu item starting with letter"): the index of the next item whose label
// starts with the typed letter, after the one the focus is on, round the end. Shared by the theme's dropdown menu (dropdownMenu.script.ts, the site) and the
// editor's menus (ui.tsx), so a menu answers a letter the same way in both. Exposes isTypeAheadKey, nextByLetter. Pure, no dependencies.

/** Whether a key press is a letter to type ahead with: one character that is not a space, with no Ctrl, Alt or Meta held. */
export function isTypeAheadKey(e) {
  return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.trim() !== '';
}

/**
 * @param {string[]} labels the items' labels, in order
 * @param {number} at the item the focus is on, or -1
 * @param {string} key the letter typed
 * @returns {number | undefined} the next item that starts with it, or undefined when none does
 */
export function nextByLetter(labels, at, key) {
  const letter = key.toLocaleLowerCase();
  const starts = (label) => label.trim().toLocaleLowerCase().startsWith(letter);
  for (let step = 1; step <= labels.length; step++) {
    const i = (((at + step) % labels.length) + labels.length) % labels.length;
    if (starts(labels[i])) return i;
  }
  return undefined;
}
