// On a page the first heading of the text is its H1 by itself and no later heading is: a ProseMirror plugin for Milkdown
// that, after a change to the text, sets the levels by headingLevels (lib/heading-levels.mjs). Exposes firstHeading, which
// MarkdownEditor.tsx uses when it gets `h1` (pages), as the round-trip check does; topHeadings reads the headings. Only top-level headings count.
import { $prose } from '@milkdown/kit/utils';
import { Plugin } from '@milkdown/kit/prose/state';
import { headingLevels } from '../lib/heading-levels.mjs';

/** The top-level headings of a document, with their positions.
 * @param {import('@milkdown/kit/prose/model').Node} doc
 * @returns {{ node: import('@milkdown/kit/prose/model').Node, pos: number }[]} */
export const topHeadings = (doc) => {
  const found = [];
  doc.forEach((node, pos) => void (node.type.name === 'heading' && found.push({ node, pos })));
  return found;
};

/** @type {import('@milkdown/kit/utils').$Prose} */
export const firstHeading = $prose(
  () =>
    new Plugin({
      appendTransaction: (transactions, _before, state) => {
        // Only after a change the user made: not when the page is only opened, where Milkdown's own steps (the heading ids,
        // the free lines) change the document too, but are kept out of undo (addToHistory false).
        if (!transactions.some((tr) => tr.docChanged && tr.getMeta('addToHistory') !== false)) return null;
        const found = topHeadings(state.doc);
        const levels = headingLevels(found.map(({ node }) => node.attrs.level));
        let tr = null;
        found.forEach(({ node, pos }, i) => {
          if (node.attrs.level === levels[i]) return;
          // The heading keeps its size, so the positions after it stay the same.
          tr ??= state.tr;
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, level: levels[i] });
        });
        return tr;
      },
    }),
);
