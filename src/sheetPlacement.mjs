// The look of each step of the block sheet (BlockDialog.tsx): a side sheet beside the page from expanded for the fields,
// the settings of a row typed in place (`row`) and the section settings, a modal side sheet below expanded for the fields (on a compact
// window, below medium, a subpage of the page form instead: owner, 14 Nov: full-screen views are pages), else the sheet from the bottom.
// The side sheet beside the page is live (liveSheet): each change goes to the block at once, with no Save or Cancel (liveSheet.mjs).
// Exposes sheetLook(step, expanded, compact), inPanel(step, expanded), liveSheet(step, expanded) and editsInPanel(expanded, hasFields); no dependencies.

/** step: 'choose' | 'fields' | 'section' | 'row' | undefined; expanded: the window is at least the `expanded` breakpoint; compact: it is
 * below the `medium` breakpoint (a phone). */
export function sheetLook(step, expanded, compact = false) {
  if (step === 'fields') return expanded ? 'side-sheet' : compact ? 'subpage' : 'modal-side-sheet';
  if (step === 'section') return expanded ? 'side-sheet' : 'sheet';
  // The settings of a row typed in place (a List's icon and link): beside the page from expanded, open while the row is active, and a
  // modal bottom sheet below it, which fits its content (half the height or less) so the block stays in view above it.
  if (step === 'row') return expanded ? 'side-sheet' : 'sheet';
  return 'sheet';
}

/** true exactly when sheetLook(step, expanded) === 'side-sheet'. */
export function inPanel(step, expanded) {
  return sheetLook(step, expanded) === 'side-sheet';
}

/** true when a sheet is live: each change of its fields goes to the block at once, and it has no Save, Cancel or Remove. Exactly the side
 * sheet beside the page (from expanded); the modal side sheet and the sheet from the bottom keep Save and Cancel. */
export function liveSheet(step, expanded) {
  return inPanel(step, expanded);
}

/** true when a card's pen is not needed, as a tap opens its fields in the side panel: the fields sheet is the side panel
 * (inPanel('fields', expanded)) and the card has fields. Remove stays in the card's menu. */
export function editsInPanel(expanded, hasFields) {
  return hasFields && inPanel('fields', expanded);
}
