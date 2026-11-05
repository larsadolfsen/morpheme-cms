// Where a step of the block sheet (BlockDialog.tsx) is shown: in a side panel at the window's end edge on a large screen
// for the fields of a block and the section settings, else in the dialog (the choice of block always is).
// Exposes inPanel(step, large); no dependencies.

/** Whether a step ('choose', 'fields', 'section' or none) is shown in the side panel; large: the window is at least
 * the `large` breakpoint. */
export function inPanel(step, large) {
  return !!large && (step === 'fields' || step === 'section');
}
