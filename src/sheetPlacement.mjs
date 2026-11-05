// The look of each step of the block sheet (BlockDialog.tsx): a side sheet beside the page from medium for the fields
// and the section settings, a modal side sheet below medium for the fields, else the sheet from the bottom.
// Exposes sheetLook(step, medium), inPanel(step, medium) and editsInPanel(medium, hasFields); no dependencies.

/** step: 'choose' | 'fields' | 'section' | undefined; medium: the window is at least the `medium` breakpoint (600px). */
export function sheetLook(step, medium) {
  if (step === 'fields') return medium ? 'side-sheet' : 'modal-side-sheet';
  if (step === 'section') return medium ? 'side-sheet' : 'sheet';
  return 'sheet';
}

/** true exactly when sheetLook(step, medium) === 'side-sheet'. */
export function inPanel(step, medium) {
  return sheetLook(step, medium) === 'side-sheet';
}

/** true when a card's pen and trash move into the side panel: the fields sheet is the side panel (inPanel('fields', medium)) and the card has fields. */
export function editsInPanel(medium, hasFields) {
  return hasFields && inPanel('fields', medium);
}
