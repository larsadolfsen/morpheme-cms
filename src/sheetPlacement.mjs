// The look of each step of the block sheet (BlockDialog.tsx): a side sheet beside the page from medium for the fields
// and the section settings, a modal side sheet below medium for the fields, else the sheet from the bottom.
// Exposes sheetLook(step, medium) and inPanel(step, medium); no dependencies.

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
