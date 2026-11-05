// The look of each step of the block sheet (BlockDialog.tsx): 'panel' for the fields and section settings on a large
// screen, 'full-screen' for the fields below large, else 'sheet'. Exposes sheetLook(step, large) and inPanel(step, large);
// no dependencies.

/** step: 'choose' | 'fields' | 'section' | undefined; large: the window is at least the `large` breakpoint. */
export function sheetLook(step, large) {
  if (step === 'fields') return large ? 'panel' : 'full-screen';
  if (step === 'section') return large ? 'panel' : 'sheet';
  return 'sheet';
}

/** Unchanged results: true exactly when sheetLook(step, large) === 'panel'. */
export function inPanel(step, large) {
  return sheetLook(step, large) === 'panel';
}
