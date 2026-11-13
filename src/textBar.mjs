// The text's one bar (MarkdownEditor.tsx, docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md, section 3): which tools stand
// on the bar and which are in its `⋮` menu, from the bar's own width (the box's, which sits inside the page's 16 dp edges: 343 dp at 375 px, in
// the spec's numbers). Its buttons are 44 dp wide (owner decision, spec section 8), the divider between the contextual and the main tools 17 dp
// (1 dp line and 8 dp each side). The bar never scrolls and
// uses no timer: a slot is a tool, Undo, Redo or the `⋮`. Exposes BUTTON, DIVIDER, slotsFor(width, divider), planBar(...). No browser.

export const BUTTON = 44;
export const DIVIDER = 17;

/** How many 44 dp slots fit in a bar `width` dp wide (its inside width): the bar of a 375 px phone is 341 wide (7 slots), of a 360 px phone 326 (7), of a 320 px phone 286 (6). `divider`: the divider is drawn (a context is on). */
export function slotsFor(width, divider = true) {
  return Math.max(0, Math.floor((width - (divider ? DIVIDER : 0)) / BUTTON));
}

/**
 * Splits the tools between the bar and the `⋮` menu. `context` are the contextual tools (their ids, in the order they stand on a wide bar),
 * `main` the main tools (Insert, Undo, Redo, Section settings). What the bar keeps first, in this order: the first `primary` contextual tools,
 * Undo, Redo, then the other contextual tools, then the other main tools. When everything fits, nothing is in `⋮`; else `⋮` takes a slot, and the
 * tools past what fits go into it, the contextual ones first, then the main ones. The bar keeps the order the tools were given in.
 * @param {{ slots: number, context: string[], main: string[], primary?: number }} input
 * @returns {{ bar: { context: string[], main: string[] }, more: { context: string[], main: string[] }, overflow: boolean }}
 */
export function planBar({ slots, context, main, primary = 4 }) {
  if (context.length + main.length <= slots) return { bar: { context, main }, more: { context: [], main: [] }, overflow: false };
  const history = main.filter((id) => id === 'undo' || id === 'redo');
  const priority = [
    ...context.slice(0, primary),
    ...history,
    ...context.slice(primary),
    ...main.filter((id) => id !== 'undo' && id !== 'redo'),
  ];
  const kept = new Set(priority.slice(0, Math.max(0, slots - 1)));
  const split = (ids) => [ids.filter((id) => kept.has(id)), ids.filter((id) => !kept.has(id))];
  const [barContext, moreContext] = split(context);
  const [barMain, moreMain] = split(main);
  return { bar: { context: barContext, main: barMain }, more: { context: moreContext, main: moreMain }, overflow: true };
}
