// Whether the person last used the keyboard or a pointer (a mouse, a finger, a pen), kept as `data-mo-input="keyboard"` or `"pointer"` on <html>.
// A text field matches :focus-visible whenever it has the focus, also after a click or a tap (the browser's rule for text input), so a ring that
// :focus-visible alone draws on a field shows after a mouse click. A rule that wants the ring for the keyboard only reads this too:
// `:root[data-mo-input='keyboard'] … :focus-visible`. Used by the search bar and the search view (search.css); WCAG 2.2 AA, 2.4.7 (Focus Visible).

let tracking = false;

/** Starts keeping `data-mo-input` up to date; once for the page, safe to call again. Capturing listeners, so no stopped event is missed. */
export default function trackInputModality() {
  if (tracking || typeof document === 'undefined') return;
  tracking = true;
  const root = document.documentElement;
  const set = (mode: 'keyboard' | 'pointer') => {
    if (root.getAttribute('data-mo-input') !== mode) root.setAttribute('data-mo-input', mode);
  };
  // A key that does not move the focus or work a control (a modifier on its own) is not the keyboard "being used".
  document.addEventListener('keydown', (e) => !['Shift', 'Control', 'Alt', 'Meta'].includes(e.key) && set('keyboard'), true);
  document.addEventListener('pointerdown', () => set('pointer'), true);
}
