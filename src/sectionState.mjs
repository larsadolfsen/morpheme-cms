// The section colour in the editor's document (the *Sektionsfarve* button, MarkdownEditor.tsx; the frame, sectionFrame.ts): the
// top-level H2 the cursor is in (sectionHeading), setting its colour (setSectionColor) and the colour of a section (sectionColorOf).
// Only ProseMirror's state; depends on lib/section-marker.mjs. No Milkdown, no browser.
import { SECTION_COLORS } from '../lib/section-marker.mjs';

/** The top-level H2 the cursor is in, with its colour, or null. @param {import('@milkdown/kit/prose/state').EditorState} state
 * @returns {{ pos: number, color: string | null } | null} */
export function sectionHeading(state) {
  const { $from } = state.selection;
  const node = $from.parent;
  if ($from.depth !== 1 || node.type.name !== 'heading' || node.attrs.level !== 2) return null;
  return { pos: $from.before(1), color: node.attrs.section ?? null };
}

/** Gives the H2 the cursor is in this colour (null: none). False when it is not in an H2, or the colour is not one of the theme's.
 * @param {{ state: import('@milkdown/kit/prose/state').EditorState, dispatch: (tr: import('@milkdown/kit/prose/state').Transaction) => void }} view
 * @param {string | null} color */
export function setSectionColor(view, color) {
  const at = sectionHeading(view.state);
  if (!at || (color !== null && !SECTION_COLORS.includes(color))) return false;
  const heading = view.state.doc.nodeAt(at.pos);
  if (at.color !== color) view.dispatch(view.state.tr.setNodeMarkup(at.pos, undefined, { ...heading.attrs, section: color }));
  return true;
}

/** The colour of the section made of nodes[range.from..range.to] (sectionRanges): its H2's, null without one.
 * @param {import('@milkdown/kit/prose/model').Node[]} nodes @param {{ from: number, to: number }} range @returns {string | null} */
export function sectionColorOf(nodes, range) {
  const heading = nodes.slice(range.from, range.to + 1).find((n) => n.type.name === 'heading' && n.attrs.level === 2);
  return heading?.attrs.section ?? null;
}
