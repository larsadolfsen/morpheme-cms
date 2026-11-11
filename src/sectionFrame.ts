// The dotted line at the start of each H2 section of a page or blog post: sets data-section-part=start and
// data-section-color (the heading's section colour) on the first top-level node of an H2 section, which editor.css draws as a dotted line. Exposes
// sectionFrame (a Milkdown plugin). Uses lib/section-ranges.mjs and src/sectionState.mjs.
import { $prose } from '@milkdown/kit/utils';
import type { Node } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import { partKind, sectionRanges } from '../lib/section-ranges.mjs';
import { sectionColorOf } from './sectionState.mjs';

type Range = { from: number; to: number };

// The attributes of the part at `index` in a section: its place in the frame, and the section's colour (its H2's `section`).
function sectionAttrs(nodes: Node[], range: Range): Record<string, string> {
  const color = sectionColorOf(nodes, range);
  return { 'data-section-part': 'start', ...(color ? { 'data-section-color': color } : {}) };
}

/** The decorations of a document's sections. */
function sectionDecorations(doc: Node): Decoration[] {
  const parts: { node: Node; pos: number }[] = [];
  doc.forEach((node, pos) => void parts.push({ node, pos }));
  const nodes = parts.map(({ node }) => node);
  const ranges: Range[] = sectionRanges(nodes.map((node) => ({ kind: partKind(node.type.name, node.attrs.level) })));
  // Only an H2 section has a line (an H1 starts the page, a label before the heading is part of its section).
  const isH2 = (range: Range) => {
    const first = nodes[range.from];
    const heading = first.type.name === 'eyebrow' ? nodes[range.from + 1] : first;
    return heading?.type.name === 'heading' && heading.attrs.level === 2;
  };
  return ranges.filter(isH2).map((range) => {
    const { node, pos } = parts[range.from];
    return Decoration.node(pos, pos + node.nodeSize, sectionAttrs(nodes, range));
  });
}

/** on: false for a fixed page's text (MarkdownEditor's `sections`), whose headings are the names of its sections: no frame. */
export const sectionFrame = (on: boolean) =>
  $prose(
    () =>
      new Plugin({
        props: { decorations: on ? ({ doc }) => DecorationSet.create(doc, sectionDecorations(doc)) : () => null },
      }),
  );
