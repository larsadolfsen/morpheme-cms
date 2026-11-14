// How the text's one bar moves when its context changes (MarkdownEditor.tsx; docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md, section 4).
// A context is '' (nothing: only the main tools), 'text' (the cursor is in the text) or 'block:<name>' (a block typed in place is active).
// Exposes barSlideKind(from, to). No browser.

/**
 * What the bar does when its context goes from `from` to `to`:
 * 'enter' the contextual tools slide in from the left and push the main tools right (the first entry from nothing),
 * 'leave' the contextual tools slide out to the left and the main tools slide back (the context ends),
 * 'change' no second slide: the contextual tools change in place with the theme's fade (text, then a block, then a Table),
 * 'none' nothing moves.
 * @param {string} from @param {string} to @returns {'enter' | 'leave' | 'change' | 'none'}
 */
export function barSlideKind(from, to) {
  if (from === to) return 'none';
  if (from === '') return 'enter';
  if (to === '') return 'leave';
  return 'change';
}
