// The look of each step of the block sheet (BlockDialog.tsx): a side sheet beside the page from expanded for the fields
// and the section settings, a modal side sheet below expanded for the fields, else the sheet from the bottom.
// Exposes sheetLook(step, expanded), inPanel(step, expanded) and editsInPanel(expanded, hasFields); no dependencies.

/** step: 'choose' | 'fields' | 'section' | undefined; expanded: the window is at least the `expanded` breakpoint. */
export function sheetLook(step, expanded) {
  if (step === 'fields') return expanded ? 'side-sheet' : 'modal-side-sheet';
  if (step === 'section') return expanded ? 'side-sheet' : 'sheet';
  return 'sheet';
}

/** true exactly when sheetLook(step, expanded) === 'side-sheet'. */
export function inPanel(step, expanded) {
  return sheetLook(step, expanded) === 'side-sheet';
}

/** true when a card's pen and trash move into the side panel: the fields sheet is the side panel (inPanel('fields', expanded)) and the card has fields. */
export function editsInPanel(expanded, hasFields) {
  return hasFields && inPanel('fields', expanded);
}
