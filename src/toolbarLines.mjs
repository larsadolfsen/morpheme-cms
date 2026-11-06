// Which tools of the text toolbar are on its first line, and whether the toolbar needs the arrow (a second line).
// Exposes toolbarLines. No dependencies, so node can import it; used by useToolbarLines.ts.

/** `items` are { width, margins, middle } for each tool or line between groups (margins: left plus right; middle: the
 * vertical middle of its box); `gap` is the space between them and `room` the width of the bar inside its padding.
 * Returns { overflows, marks }: marks has for each item { wrapped, lineStart, lineEnd }. A line between groups is
 * shorter than a button, so the lines are told apart by the middles. overflows is true when the items are wider
 * than the room, or when any item is wrapped (the width of the bar can be a fraction that `room` does not have). */
export function toolbarLines(items, gap, room) {
  const need = items.reduce((sum, item) => sum + item.width + item.margins, gap * Math.max(0, items.length - 1));
  const marks = items.map((item, i) => ({
    wrapped: item.middle > items[0].middle + 10,
    lineStart: i > 0 && item.middle > items[i - 1].middle + 10,
    lineEnd: i < items.length - 1 && items[i + 1].middle > item.middle + 10,
  }));
  return { overflows: need > room + 0.5 || marks.some((mark) => mark.wrapped), marks };
}
