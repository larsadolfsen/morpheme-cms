// Which style the two style buttons show (the toolbar's and the selection toolbar's): Text style and List. Each shows 'generic' (its
// own general icon) when the cursor is not in the text, else the kind the cursor is in, the one the menu marks, from activeOf's names
// (MarkdownEditor.tsx). A cursor in a block with no text style (a heading) shows Body medium (the plain paragraph) on Text style; in a list,
// Text style is generic and List shows the list. The order is the order of every list of the kinds: the text styles (the body styles from
// small to large, Label, the quote), then the lists.
export const TEXT_KINDS = ['small', 'medium', 'large', 'label', 'quote'];
export const LIST_KINDS = ['bullet', 'check', 'ordered'];
export const STYLE_KINDS = [...TEXT_KINDS, ...LIST_KINDS];

export function styleKindOf(active, focused) {
  if (!focused) return 'generic';
  const on = new Set(active);
  if (LIST_KINDS.some((name) => on.has(name))) return 'generic';
  return TEXT_KINDS.find((name) => on.has(name)) ?? 'medium';
}

export function listKindOf(active, focused) {
  if (!focused) return 'generic';
  const on = new Set(active);
  return LIST_KINDS.find((name) => on.has(name)) ?? 'generic';
}
