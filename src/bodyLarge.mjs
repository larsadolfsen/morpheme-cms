// An intro paragraph in the editor (lib/body-large.mjs: its HTML): the node `bodyLarge`, one block of plain text, read
// from its line of HTML (remarkSiteBlocks in markdown.mjs) and written back as it. Exposes bodyLargeSchema. Depends on
// Milkdown.
import { $nodeSchema } from '@milkdown/kit/utils';
import { alignClass, alignHtml } from '../lib/text-align.mjs';
import { BODY_LARGE_CLASS, bodyLargeHtml } from '../lib/body-large.mjs';

/** @type {import('@milkdown/kit/utils').$NodeSchema<'bodyLarge'>} */
export const bodyLargeSchema = $nodeSchema('bodyLarge', () => ({
  group: 'block',
  content: 'text*',
  marks: '',
  attrs: { align: { default: null, validate: 'string|null' } },
  defining: true,
  parseDOM: [{ tag: `p.${BODY_LARGE_CLASS}`, priority: 60 }],
  toDOM: (node) => ['p', { class: [BODY_LARGE_CLASS, alignClass(node.attrs.align)].filter(Boolean).join(' ') }, 0],
  parseMarkdown: {
    match: (node) => node.type === 'bodyLarge',
    runner: (state, node, type) => {
      state.openNode(type, { align: node.align ?? null });
      if (node.value) state.addText(String(node.value));
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'bodyLarge',
    runner: (state, node) => {
      if (node.attrs.align) state.addNode('html', undefined, alignHtml(node.attrs.align));
      state.addNode('html', undefined, bodyLargeHtml(node.textContent));
    },
  },
}));
