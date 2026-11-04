// The dotted frame round each H2 section of a page or blog post: sets data-section-part (start, middle, end, only) and
// data-section-color (the H2's section colour) on the top-level nodes of a section, which editor.css draws. Exposes
// sectionFrame (a Milkdown plugin). Uses lib/section-ranges.mjs and src/sectionState.mjs.
import { $prose } from '@milkdown/kit/utils';
import type { Node } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import { partKind, sectionPart, sectionRanges } from '../lib/section-ranges.mjs';
import { sectionColorOf } from './sectionState.mjs';

type Range = { from: number; to: number };

// The attributes of the part at `index` in a section: its place in the frame, and the section's colour (its H2's `section`).
function sectionAttrs(nodes: Node[], range: Range, index: number): Record<string, string> {
  const color = sectionColorOf(nodes, range);
  return { 'data-section-part': sectionPart(index, range), ...(color ? { 'data-section-color': color } : {}) };
}

/** The decorations of a document's sections. */
function sectionDecorations(doc: Node): Decoration[] {
  const parts: { node: Node; pos: number }[] = [];
  doc.forEach((node, pos) => void parts.push({ node, pos }));
  const nodes = parts.map(({ node }) => node);
  const ranges: Range[] = sectionRanges(nodes.map((node) => ({ kind: partKind(node.type.name, node.attrs.level) })));
  return ranges.flatMap((range) =>
    parts
      .slice(range.from, range.to + 1)
      .map(({ node, pos }, i) => Decoration.node(pos, pos + node.nodeSize, sectionAttrs(nodes, range, range.from + i))),
  );
}

/** on: false for a fixed page's text (MarkdownEditor's `sections`), whose H2s are the names of its sections: no frame. */
export const sectionFrame = (on: boolean) =>
  $prose(
    () =>
      new Plugin({
        props: { decorations: on ? ({ doc }) => DecorationSet.create(doc, sectionDecorations(doc)) : () => null },
      }),
  );
