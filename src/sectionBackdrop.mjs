// Where the picture behind a section is drawn in the editor: one box that covers the section's parts, from the top of its first part to
// the bottom of its last, across the text's width (or the window's, for a section of the whole width). Exposes backdropBox (pure,
// from the parts' and the text's rectangles). Used by src/sectionFrame.ts.

/** The box of a section's picture, relative to the text field (the offsets `top` and `left`, and `width` and `height`).
 * @param {{ top: number, bottom: number }} first the section's first part
 * @param {{ top: number, bottom: number }} last the section's last part
 * @param {{ top: number, left: number, width: number }} host the text field
 * @param {{ full?: boolean, windowWidth?: number }} [options] full: across the whole window
 * @returns {{ top: number, left: number, width: number, height: number }} */
export function backdropBox(first, last, host, { full = false, windowWidth = 0 } = {}) {
  const top = first.top - host.top;
  const height = Math.max(0, last.bottom - first.top);
  // The whole width starts at the window's left edge and ends at its right edge, as on the site (blocks.css, .text-section-full).
  if (full && windowWidth > 0) return { top, left: -host.left, width: windowWidth, height };
  return { top, left: 0, width: host.width, height };
}
