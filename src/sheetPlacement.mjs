// The look of each step of the block sheet (BlockDialog.tsx). Owner, 15 Nov 2026: "Dialogs are only for short messages, not for settings"
// (docs/material-deviations.md, B3): from medium (600 dp) the block's fields, the settings of a row typed in place (`row`) and the
// section settings are the theme's standard side sheet beside the page; on a compact window (below medium, a phone) the fields and the section
// settings are a subpage of the page form (owner, 14 Nov: full-screen views are pages), the row settings the sheet from the bottom.
// The side sheet beside the page is live (liveSheet): each change goes to the block at once, with no Save or Cancel (liveSheet.mjs).
// Exposes sheetLook(step, pane), inPanel(step, pane), liveSheet(step, pane) and editsInPanel(pane, hasFields); no dependencies.

/** step: 'choose' | 'fields' | 'section' | 'row' | undefined; pane: the window is at least the `medium` breakpoint (600 dp), so the pane fits beside the
 * page; below it (a phone) the fields and section settings are a subpage. */
export function sheetLook(step, pane) {
  if (step === 'fields' || step === 'section') return pane ? 'side-sheet' : 'subpage';
  // The settings of a row typed in place (a List's icon and link): beside the page while the row is active, and a modal bottom sheet on a
  // compact window, which fits its content (half the height or less) so the block stays in view above it.
  if (step === 'row') return pane ? 'side-sheet' : 'sheet';
  return 'sheet';
}

/** true exactly when sheetLook(step, pane) === 'side-sheet'. */
export function inPanel(step, pane) {
  return sheetLook(step, pane) === 'side-sheet';
}

/** true when a sheet is live: each change of its fields goes to the block at once, and it has no Save, Cancel or Remove. Exactly the side
 * sheet beside the page; the subpage and the sheet from the bottom keep Save and Cancel. */
export function liveSheet(step, pane) {
  return inPanel(step, pane);
}

/** true when a card's pen is not needed, as a tap opens its fields in the side panel: the fields sheet is the side panel
 * (inPanel('fields', pane)) and the card has fields. Remove stays in the card's menu. */
export function editsInPanel(pane, hasFields) {
  return hasFields && inPanel('fields', pane);
}
