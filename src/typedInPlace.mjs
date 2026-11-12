// Whether a block is typed in place: it says how (`inline`, InlineSpec) and has what draws it (`inlineView`: a standard block's
// in inlineViews.tsx, an app's Inline.tsx). `inline` alone is not enough: a block with no view keeps its sheet (the card that opens it,
// and the sheet a new one is made in), so an app's block that says `inline` without Inline.tsx still can be filled in.
/** @param {{ inline?: unknown, inlineView?: unknown } | undefined | null} block */
export const typedInPlace = (block) => !!block?.inline && !!block.inlineView;
