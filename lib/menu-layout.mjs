// How the editor's main menu is laid out at a window width (Material 3 breakpoint): whether the full-height navigation rail
// stands, which way the rail expands, and whether the top bar keeps the menu button. Exposes menuLayout (pure). No dependencies.

/** @typedef {import('./breakpoints.mjs').Breakpoint} Breakpoint */

/** The main menu's layout in a window in breakpoint `width`: compact has no rail (modal drawer, menu button in the top bar);
 * medium has the rail and expands it as a modal drawer over the content; expanded and wider expand it beside the content.
 * @param {Breakpoint} width
 * @returns {{ rail: boolean, expanded: 'modal' | 'standard', menuButtonInTopBar: boolean }} */
export function menuLayout(width) {
  if (width === 'compact') return { rail: false, expanded: 'modal', menuButtonInTopBar: true };
  if (width === 'medium') return { rail: true, expanded: 'modal', menuButtonInTopBar: false };
  return { rail: true, expanded: 'standard', menuButtonInTopBar: false };
}
