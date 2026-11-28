// The text's one bar (MarkdownEditor.tsx, docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md): which tools stand on the bar and
// which are in its `⋮` menu, from the bar's own inside width in dp (352 on a 375 px phone). There is no count of tools per screen width: the
// bar is a width budget. Each tool has a known width (TOOL_WIDTH, the one place; `check:screens` pins it to the drawn size) and the tools fill
// the bar from the left, in their order, while the next one fits. The first tool that does not fit, and every one after it, goes into the `⋮`
// (the order never skips a wide tool to place a narrow later one), so the room left on the bar is always narrower than the next tool: no gap.
// Undo, Redo and Insert block always stand at the right end, then the `⋮` when something is in it (it takes its width only then). A page's
// Preview (`spare`) stands before Undo only while every other tool fits too: when the contextual tools fill the bar it is the first to go
// into the `⋮` (docs/superpowers/specs/2026-11-14-one-save-while-writing-design.md, 3.3). The bar never scrolls and uses no timer.
// Exposes BUTTON, TOOL_WIDTH, toolWidth(...), planBar(...). No browser.

/** The space between two tools: the toolbar's gap, 8 dp (md.comp.toolbar.docked min-spacing is 4 dp). */
export const GAP = 8;

/** The theme's small icon button, in dp, when the theme does not say (Material 3's 40 dp; `--mo-comp-icon-button-small-container-height`). A theme may set another size
 * (Venus: 48 dp), and the bar measures it (`icon` of planBar), so no theme overflows the bar. */
export const ICON = 40;

/** An icon button, and the `⋮`, with the space after it, at the default icon size: 40 dp and the gap, which is its 48 dp target (ToolbarButton in ui.tsx). */
export const BUTTON = ICON + GAP;

/**
 * The declared width of each tool that is not a plain 44 dp icon button, in dp. A tool with a menu and a chevron (Text style, List, Alignment,
 * Color) is the theme's text button with `width: 3rem` (toolbarMenuSize in ui.tsx): 48 dp and the gap; the block selection's count with its cross
 * is two buttons wide. If a drawn width changes, change it here: `check:screens` fails when a button's drawn width is not this.
 */
const MENU_BUTTON = 48 + GAP;
export const TOOL_WIDTH = { style: MENU_BUTTON, list: MENU_BUTTON, align: MENU_BUTTON, color: MENU_BUTTON, 'block:count': MENU_BUTTON * 2 };

/** The width of one tool in dp. `widths`: the widths of the tools whose width is their label's (a text button such as Alt text, measured once
 * per language and drawn at exactly that width: textButtonWidth in MarkdownEditor.tsx), over TOOL_WIDTH. `icon`: the theme's small icon button in dp (ICON),
 * the width of every plain icon button and of the `⋮`. */
export const toolWidth = (id, widths = {}, icon = ICON) => (widths[id] === undefined ? (TOOL_WIDTH[id] ?? icon + GAP) : widths[id] + GAP);

/**
 * Splits the tools between the bar and the `⋮` menu, with `spare` tools (a page's Preview) first in the main tools: they stand on the bar,
 * before the fixed tools, only while everything fits with them; else they are in the `⋮` (first of its fixed tools) and the rest is split
 * as without them, with the `⋮` on the bar.
 * @param {{ width: number, context: string[], fixed: string[], spare?: string[], more?: boolean, widths?: Record<string, number>, icon?: number }} input
 * @returns {{ bar: { context: string[], fixed: string[] }, more: { context: string[], fixed: string[] }, overflow: boolean, free: number }}
 */
export function planBar({ spare = [], ...input }) {
  if (!spare.length) return planTools(input);
  const { width, context, fixed, more = false, icon = ICON } = input;
  const { widths = {} } = input;
  const all = [...context, ...spare, ...fixed].reduce((n, id) => n + toolWidth(id, widths, icon), 0) + (more ? icon + GAP : 0);
  if (all <= width)
    return { bar: { context, fixed: [...spare, ...fixed] }, more: { context: [], fixed: [] }, overflow: more, free: width - all };
  const plan = planTools({ width, context, fixed, more: true, widths, icon });
  return { ...plan, more: { context: plan.more.context, fixed: [...spare, ...plan.more.fixed] } };
}

/**
 * Splits the tools between the bar and the `⋮` menu. `context` are the tools of the place, in the order they stand at the left; `fixed` the
 * tools at the right end (Undo, Redo, Insert block). `width` is the bar's inside width in dp. When everything fits, nothing is in the `⋮`;
 * else the `⋮` takes a button, and the tools of the place fill the room left in order: the first tool that does not fit and every tool after it
 * go into the `⋮`. If even the fixed tools and the `⋮` do not fit (a very narrow phone), Redo then Undo go into the `⋮` before Insert block
 * does (Insert block is never in the `⋮`). `more`: the `⋮` is on the bar even when everything fits (a block's own menu, Section settings in
 * it), so it takes a button. `free`: the room left on the bar, in dp (less than the next tool's width while something is in the `⋮`).
 * `widths`: the widths of the text buttons (toolWidth).
 * @param {{ width: number, context: string[], fixed: string[], more?: boolean, widths?: Record<string, number>, icon?: number }} input
 * @returns {{ bar: { context: string[], fixed: string[] }, more: { context: string[], fixed: string[] }, overflow: boolean, free: number }}
 */
function planTools({ width, context, fixed, more = false, widths = {}, icon = ICON }) {
  const w = (id) => toolWidth(id, widths, icon);
  const BUTTON = icon + GAP;
  const sum = (ids) => ids.reduce((n, id) => n + w(id), 0);
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
    if (w(id) > room) break;
    barContext.push(id);
    room -= w(id);
  }
  return {
    bar: { context: barContext, fixed: fixedKept },
    more: { context: context.slice(barContext.length), fixed: fixed.filter((id) => !keep.has(id)) },
    overflow: true,
    free: Math.max(room, 0),
  };
}
