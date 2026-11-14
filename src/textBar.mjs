// The text's one bar (MarkdownEditor.tsx, docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md, section 3): which tools stand
// on the bar and which are in its `⋮` menu, from the bar's own width (the box's, which sits inside the page's 16 dp edges: 343 dp at 375 px, in
// the spec's numbers). Its buttons are 44 dp wide (owner decision, spec section 8), the divider between the contextual and the main tools 17 dp
// (1 dp line and 8 dp each side). The bar never scrolls and
// uses no timer: a slot is a tool, Undo, Redo or the `⋮`. Exposes BUTTON, DIVIDER, slotsFor(width, divider), planBar(...). No browser.

export const BUTTON = 44;
export const DIVIDER = 17;

/** How many 44 dp slots fit in a bar `width` dp wide (its inside width): the bar of a 375 px phone is 341 wide, of a 360 px phone 326, of a 320 px phone 286.
 * `dividers`: how many dividers are drawn (one between the contextual and the main tools while a context is on, one between Undo and Redo and Insert block).
 * With two dividers: 6 slots at 375 and 360 px, 5 at 320. */
export function slotsFor(width, dividers = 2) {
  return Math.max(0, Math.floor((width - dividers * DIVIDER) / BUTTON));
}

/**
 * Splits the tools between the bar and the `⋮` menu. `context` are the contextual tools (their ids, in the order they stand on a wide bar),
 * `main` the main tools (Undo, Redo, Section settings, Insert block). What the bar keeps first, in this order: Insert block (never in the `⋮`: the owner's
 * decision, 13 Nov), Undo, Redo, the first `primary` contextual tools, the other contextual tools, the other main tools (Section settings). When
 * everything fits, nothing is in `⋮`; else `⋮` takes a slot, and the tools past what fits go into it, the contextual ones first, then the main
 * ones. The bar keeps the order the tools were given in. `more`: the `⋮` is on the bar even when everything fits (a block's own menu: Hide,
 * Move, Remove), so it takes a slot.
 * @param {{ slots: number, context: string[], main: string[], primary?: number, more?: boolean }} input
 * @returns {{ bar: { context: string[], main: string[] }, more: { context: string[], main: string[] }, overflow: boolean }}
 */
export function planBar({ slots, context, main, primary = 4, more = false }) {
  if (context.length + main.length + (more ? 1 : 0) <= slots)
    return { bar: { context, main }, more: { context: [], main: [] }, overflow: more };
  const history = main.filter((id) => id === 'undo' || id === 'redo');
  const priority = [
    ...main.filter((id) => id === 'insert'),
    ...history,
    ...context.slice(0, primary),
    ...context.slice(primary),
    ...main.filter((id) => id !== 'insert' && id !== 'undo' && id !== 'redo'),
  ];
  const kept = new Set(priority.slice(0, Math.max(0, slots - 1)));
  const split = (ids) => [ids.filter((id) => kept.has(id)), ids.filter((id) => !kept.has(id))];
  const [barContext, moreContext] = split(context);
  const [barMain, moreMain] = split(main);
  return { bar: { context: barContext, main: barMain }, more: { context: moreContext, main: moreMain }, overflow: true };
}
