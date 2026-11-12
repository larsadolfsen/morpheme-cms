// An intro paragraph in the editor (lib/body-large.mjs: its HTML): the node `bodyLarge`, one block of plain text, read
// from its line of HTML (remarkSiteBlocks in markdown.mjs) and written back as it. Exposes bodyLargeSchema. Depends on
// Milkdown.
import { $nodeSchema } from '@milkdown/kit/utils';
import { BODY_LARGE_CLASS, bodyLargeHtml } from '../lib/body-large.mjs';

/** @type {import('@milkdown/kit/utils').$NodeSchema<'bodyLarge'>} */
export const bodyLargeSchema = $nodeSchema('bodyLarge', () => ({
  group: 'block',
  content: 'text*',
  marks: '',
  defining: true,
  parseDOM: [{ tag: `p.${BODY_LARGE_CLASS}`, priority: 60 }],
  toDOM: () => ['p', { class: BODY_LARGE_CLASS }, 0],
  parseMarkdown: {
    match: (node) => node.type === 'bodyLarge',
    runner: (state, node, type) => {
      state.openNode(type);
      if (node.value) state.addText(String(node.value));
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'bodyLarge',
    runner: (state, node) => {
      state.addNode('html', undefined, bodyLargeHtml(node.textContent));
    },
  },
}));
