// Where the page scrolls to keep the text cursor in view (MarkdownEditor.tsx, keepCaret). ProseMirror's own scroll only knows the window's edges
// (with a 5 px margin), so after a key or a tap that moves the cursor it left the cursor under the text bar, which sticks at the top, or under
// the Save bar and the on-screen keyboard at the bottom. `top` and `bottom` are the free band between the bars, in px from the top of the
// visible screen; `margin` is the room kept around the cursor. Gives the px to scroll by (negative: up), 0 when the cursor is in the band.
export function caretScrollStep({ rectTop, rectBottom, top, bottom, margin = 8 }) {
  const room = bottom - top - 2 * margin;
  // A rect taller than the band (a block's field): its top goes to the top edge, as the browser's own scroll does.
  if (rectBottom - rectTop > room) return Math.round(rectTop - top - margin);
  if (rectTop < top + margin) return Math.round(rectTop - top - margin);
  if (rectBottom > bottom - margin) return Math.round(rectBottom - bottom + margin);
  return 0;
}
