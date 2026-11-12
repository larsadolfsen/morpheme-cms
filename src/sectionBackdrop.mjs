// Where the picture behind a section is drawn in the editor: one box that covers the section's parts, from the top of its first part to
// the bottom of its last, across the text's width (or the window's, for a section of the whole width). Exposes backdropBox (pure,
// from the parts' and the text's rectangles). Used by src/sectionFrame.ts.

/** The box of a section's picture, relative to the text field (the offsets `top` and `left`, and `width` and `height`).
 * @param {{ top: number, bottom: number }} first the section's first part
 * @param {{ top: number, bottom: number }} last the section's last part
 * @param {{ top: number, left: number, width: number }} host the text field
 * @param {{ full?: boolean, bleed?: number }} [options] full: across the whole width, out to the text field's edges (bleed: its side padding)
 * @returns {{ top: number, left: number, width: number, height: number }} */
export function backdropBox(first, last, host, { full = false, bleed = 0 } = {}) {
  const top = first.top - host.top;
  const height = Math.max(0, last.bottom - first.top);
  // The whole width reaches the text field's edges, past its padding (editor.css, data-section-width).
  if (full) return { top, left: -bleed, width: host.width + 2 * bleed, height };
  return { top, left: 0, width: host.width, height };
}
