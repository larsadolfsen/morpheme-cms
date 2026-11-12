// Which text style the text-style button shows (the toolbar's and the selection toolbar's): 'generic' (the H icon) when the cursor is
// not in the text, else the style the cursor is in, the one the menu marks, from activeOf's names (MarkdownEditor.tsx). A cursor in a
// block with no style of the list (a heading) shows the first, the paragraph.
export const STYLE_KINDS = ['text', 'large', 'label', 'bullet', 'check', 'ordered', 'quote'];

export function styleKindOf(active, focused) {
  if (!focused) return 'generic';
  const on = new Set(active);
  return STYLE_KINDS.find((name) => on.has(name)) ?? STYLE_KINDS[0];
}
