// Whether the standard navigation drawer shows open while the standard side panel may be open beside the text (840-1199px:
// both do not fit). Exposes drawerShown(remembered, panelOpen, large, reopened); used by menuOpen.ts; no dependencies.

/** Whether the standard drawer shows open: remembered (sidebar.ts), panelOpen (the standard side panel is open), large (window
 * at least `large`), reopened (the menu button opened it while the panel is open). */
export function drawerShown(remembered, panelOpen, large, reopened) {
  if (!remembered && !reopened) return false;
  if (panelOpen && !large && !reopened) return false;
  return true;
}
