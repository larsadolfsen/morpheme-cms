// Where the focus is when a basic modal <dialog> opens: on the dialog itself, no control and no ring (the owner's dialog rule;
// src/ask.tsx is the editor's pattern: tabIndex -1 and focus()). showModal() alone puts the focus on the first control, which
// then shows its focus ring as if it were the chosen one. A dialog with an `autofocus` control (a field to write in) keeps it.
// Used by dialogControl.ts and by the pop-ups' script (Popup.astro), which open their dialogs themselves.
export function openModal(el: HTMLDialogElement) {
  el.showModal();
  // The full-screen kind keeps the browser's (M3, Accessibility: focus lands on the first interactive element, the close icon).
  if (el.querySelector('[autofocus], .mo-is-full-screen')) return;
  el.tabIndex = -1;
  el.focus();
}
