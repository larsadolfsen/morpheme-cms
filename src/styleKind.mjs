// Which style the two style buttons show (the toolbar's and the selection toolbar's): Text style and List. Each shows 'generic' (its
// own general icon) when the cursor is not in the text, else the kind the cursor is in, the one the menu marks, from activeOf's names
// (MarkdownEditor.tsx). A cursor in a heading is in a block with no text style, so Text style is generic (it never claims a body style
// there: the heading's own button shows its level); in a list, List shows the list and Text style the size of its text (a mark, lib/text-sizes.mjs). The order is the order of every list of the kinds: the text styles (the body styles from
// small to large, Label, the quote), then the lists.
export const TEXT_KINDS = ['small', 'medium', 'large', 'label', 'quote'];
export const LIST_KINDS = ['bullet', 'check', 'ordered'];
const HEADINGS = ['h1', 'h2', 'h3'];
export const STYLE_KINDS = [...TEXT_KINDS, ...LIST_KINDS];

export function styleKindOf(active, focused) {
  if (!focused) return 'generic';
  const on = new Set(active);
  if (HEADINGS.some((name) => on.has(name))) return 'generic';
  // In a list the text has a size (small, medium or large), the list stays.
  if (LIST_KINDS.some((name) => on.has(name))) return ['small', 'large'].find((name) => on.has(name)) ?? 'medium';
  return TEXT_KINDS.find((name) => on.has(name)) ?? 'medium';
}

export function listKindOf(active, focused) {
  if (!focused) return 'generic';
  const on = new Set(active);
  return LIST_KINDS.find((name) => on.has(name)) ?? 'generic';
}

// The heading button: the level the cursor is in (h1, h2, h3) while a heading is on, else 'generic' (its general H icon), in text, a
// list, a quote, or outside the text. Only an active style shows its own icon.
export function headingKindOf(active, focused) {
  if (!focused) return 'generic';
  const on = new Set(active);
  return HEADINGS.find((name) => on.has(name)) ?? 'generic';
}
