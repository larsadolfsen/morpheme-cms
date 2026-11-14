// The text's one bar (MarkdownEditor.tsx, docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md): which tools stand on the bar and
// which are in its `⋮` menu, from the bar's own width (the box's: 352 dp on a 375 px phone, 14 Nov owner decision). The bar has no divider. The
// tools of the place (text, table, block) stand at the left; Undo, Redo and Insert block always stand at the right end, in that order, then the
// `⋮` when something is in it. Every button, one with an arrow too (Text style, Lists), is 44 dp wide. The bar never scrolls
// and uses no timer. Exposes BUTTON, planBar(...). No browser.

export const BUTTON = 44;

/**
 * Splits the tools between the bar and the `⋮` menu. `context` are the tools of the place, in the order they stand at the left; `fixed` the
 * tools at the right end (Undo, Redo, Insert block). `width` is the bar's inside width in dp. When everything fits, nothing is in the `⋮`;
 * else the `⋮` takes a button, and the tools of the place that do not fit go into it: the first tool that does not fit and every tool after it
 * (the order never skips). If even the fixed tools and the `⋮` do not fit (a very narrow phone), Redo then Undo go into the `⋮` before Insert
 * block does (Insert block is never in the `⋮`). `more`: the `⋮` is on the bar even when everything fits (a block's own menu, Section
 * settings in it), so it takes a button.
 * @param {{ width: number, context: string[], fixed: string[], more?: boolean }} input
 * @returns {{ bar: { context: string[], fixed: string[] }, more: { context: string[], fixed: string[] }, overflow: boolean, short?: number }}
 */
export function planBar({ width, context, fixed, more = false }) {
  const sum = (ids) => ids.reduce((n, id) => n + BUTTON, 0);
  if (sum(context) + sum(fixed) + (more ? BUTTON : 0) <= width)
    return { bar: { context, fixed }, more: { context: [], fixed: [] }, overflow: more };
  let room = width - BUTTON;
  // The fixed tools keep the bar first: Insert block, then Undo, then Redo.
  const keep = new Set();
  for (const id of ['insert', 'undo', 'redo'].filter((id) => fixed.includes(id))) {
    if (sum([...keep, id]) <= room) keep.add(id);
  }
  const fixedKept = fixed.filter((id) => keep.has(id));
  room -= sum(fixedKept);
  const barContext = [];
  let used = 0;
  for (const id of context) {
    if (used + BUTTON > room) break;
    barContext.push(id);
    used += BUTTON;
  }
  const moreContext = context.slice(barContext.length);
  const first = moreContext[0];
  return {
    bar: { context: barContext, fixed: fixedKept },
    more: { context: moreContext, fixed: fixed.filter((id) => !keep.has(id)) },
    overflow: true,
    short: first ? used + BUTTON - room : 0,
  };
}
