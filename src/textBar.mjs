// The text's one bar (MarkdownEditor.tsx, docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md): which tools stand on the bar and
// which are in its `⋮` menu, from the bar's own inside width in dp (352 on a 375 px phone). There is no count of tools per screen width: the
// bar is a width budget. Each tool has a known width (TOOL_WIDTH, the one place; `check:screens` pins it to the drawn size) and the tools fill
// the bar from the left, in their order, while the next one fits. The first tool that does not fit, and every one after it, goes into the `⋮`
// (the order never skips a wide tool to place a narrow later one), so the room left on the bar is always narrower than the next tool: no gap.
// Undo, Redo and Insert block always stand at the right end, then the `⋮` when something is in it (it takes its width only then). The bar never
// scrolls and uses no timer. Exposes BUTTON, TOOL_WIDTH, toolWidth(...), planBar(...). No browser.

/** An icon button, and the `⋮`: 44 by 44 dp (ToolbarButton in ui.tsx). */
export const BUTTON = 44;

/**
 * The declared width of each tool that is not a plain 44 dp icon button, in dp. A tool with a menu and a chevron (Text style, List, Alignment,
 * Color) is the theme's text button with `width: 2.75rem` (toolbarMenuSize in ui.tsx): 44 dp too; the block selection's count with its cross
 * is two buttons wide. If a drawn width changes, change it here: `check:screens` fails when a button's drawn width is not this.
 */
export const TOOL_WIDTH = { style: BUTTON, list: BUTTON, align: BUTTON, color: BUTTON, 'block:count': BUTTON * 2 };

/** The width of one tool in dp. */
export const toolWidth = (id) => TOOL_WIDTH[id] ?? BUTTON;

/**
 * Splits the tools between the bar and the `⋮` menu. `context` are the tools of the place, in the order they stand at the left; `fixed` the
 * tools at the right end (Undo, Redo, Insert block). `width` is the bar's inside width in dp. When everything fits, nothing is in the `⋮`;
 * else the `⋮` takes a button, and the tools of the place fill the room left in order: the first tool that does not fit and every tool after it
 * go into the `⋮`. If even the fixed tools and the `⋮` do not fit (a very narrow phone), Redo then Undo go into the `⋮` before Insert block
 * does (Insert block is never in the `⋮`). `more`: the `⋮` is on the bar even when everything fits (a block's own menu, Section settings in
 * it), so it takes a button. `free`: the room left on the bar, in dp (less than the next tool's width while something is in the `⋮`).
 * @param {{ width: number, context: string[], fixed: string[], more?: boolean }} input
 * @returns {{ bar: { context: string[], fixed: string[] }, more: { context: string[], fixed: string[] }, overflow: boolean, free: number }}
 */
export function planBar({ width, context, fixed, more = false }) {
  const sum = (ids) => ids.reduce((n, id) => n + toolWidth(id), 0);
  const all = sum(context) + sum(fixed) + (more ? BUTTON : 0);
  if (all <= width) return { bar: { context, fixed }, more: { context: [], fixed: [] }, overflow: more, free: width - all };
  let room = width - BUTTON;
  // The fixed tools keep the bar first: Insert block, then Undo, then Redo.
  const keep = new Set();
  for (const id of ['insert', 'undo', 'redo'].filter((id) => fixed.includes(id))) {
    if (sum([...keep, id]) <= room) keep.add(id);
  }
  const fixedKept = fixed.filter((id) => keep.has(id));
  room -= sum(fixedKept);
  const barContext = [];
  for (const id of context) {
    if (toolWidth(id) > room) break;
    barContext.push(id);
    room -= toolWidth(id);
  }
  return {
    bar: { context: barContext, fixed: fixedKept },
    more: { context: context.slice(barContext.length), fixed: fixed.filter((id) => !keep.has(id)) },
    overflow: true,
    free: Math.max(room, 0),
  };
}
