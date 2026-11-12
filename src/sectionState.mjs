// The section settings in the editor's document (the *Section settings* button, MarkdownEditor.tsx; the frame, sectionFrame.ts): the
// top-level H1 or H2 the cursor is in (sectionHeading), setting its colour, picture and width (setSection), and the
// settings of a section (sectionSettingsOf). Only ProseMirror's state; depends on lib/section-marker.mjs. No Milkdown, no browser.
import { colorOf } from '../lib/section-marker.mjs';

/** The settings a heading has: its colour (null: none), the picture behind its section, the picture's description and
 * whether it goes across the whole window ('full').
 * @param {{ attrs: Record<string, any> }} heading
 * @returns {{ color: string | null, picture: string | null, alt: string | null, width: string | null }} */
export const sectionSettingsOf = ({ attrs }) => ({
  color: attrs.section ?? null,
  picture: attrs.sectionPicture ?? null,
  alt: attrs.sectionAlt ?? null,
  width: attrs.sectionWidth ?? null,
});

/** The section the cursor is in: the top-level H1 or H2 it is in, or else the nearest one above it (a section runs to the next H1 or H2),
 * with its settings, or null before the first. @param {import('@milkdown/kit/prose/state').EditorState} state
 * @returns {{ pos: number, level: number, color: string | null, picture: string | null, alt: string | null, width: string | null } | null} */
export function sectionHeading(state) {
  const { $from } = state.selection;
  if ($from.depth < 1) return null;
  for (let i = $from.index(0); i >= 0; i--) {
    const node = state.doc.child(i);
    if (node.type.name !== 'heading' || node.attrs.level > 2) continue;
    let pos = 0;
    for (let j = 0; j < i; j++) pos += state.doc.child(j).nodeSize;
    return { pos, level: node.attrs.level, ...sectionSettingsOf(node) };
  }
  return null;
}

/** Gives the section the cursor is in (its H1 or H2) these settings: `color` (null or '' none, else one of the theme's), `picture`,
 * `alt` and `width` ('full'); a setting left out stays. False when it is not in one, or the colour is not one of the theme's.
 * @param {{ state: import('@milkdown/kit/prose/state').EditorState, dispatch: (tr: import('@milkdown/kit/prose/state').Transaction) => void }} view
 * @param {{ color?: string | null, picture?: string | null, alt?: string | null, width?: string | null }} settings */
export function setSection(view, settings) {
  const at = sectionHeading(view.state);
  if (!at) return false;
  const color = settings.color || null;
  if (color !== null && colorOf(color) !== color) return false;
  const heading = view.state.doc.nodeAt(at.pos);
  const attrs = { ...heading.attrs };
  if ('color' in settings) attrs.section = color;
  if ('picture' in settings) attrs.sectionPicture = settings.picture || null;
  // The description and the width belong to a picture: without one they are cleared, so nothing is left unseen in the file.
  if ('alt' in settings) attrs.sectionAlt = settings.alt || null;
  if ('width' in settings) attrs.sectionWidth = settings.width === 'full' ? 'full' : null;
  if (!attrs.sectionPicture) attrs.sectionAlt = null;
  if (JSON.stringify(attrs) !== JSON.stringify(heading.attrs)) view.dispatch(view.state.tr.setNodeMarkup(at.pos, undefined, attrs));
  return true;
}

/** Gives the H1 or H2 the cursor is in this colour (null: none). False when it is not in one, or the colour is not one of the theme's.
 * @param {Parameters<typeof setSection>[0]} view @param {string | null} color */
export const setSectionColor = (view, color) => setSection(view, { color });

/** The settings of the section made of nodes[range.from..range.to] (sectionRanges): its H1's or H2's, none without one.
 * @param {import('@milkdown/kit/prose/model').Node[]} nodes @param {{ from: number, to: number }} range */
export function sectionOf(nodes, range) {
  const heading = nodes.slice(range.from, range.to + 1).find((n) => n.type.name === 'heading' && n.attrs.level <= 2);
  return heading ? sectionSettingsOf(heading) : { color: null, picture: null, alt: null, width: null };
}

/** The colour of the section made of nodes[range.from..range.to]: its H1's or H2's, null without one.
 * @param {import('@milkdown/kit/prose/model').Node[]} nodes @param {{ from: number, to: number }} range @returns {string | null} */
export const sectionColorOf = (nodes, range) => sectionOf(nodes, range).color;
