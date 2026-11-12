// The body styles Body medium and Body small in the editor (lib/body-sizes.mjs: their HTML): the nodes `bodyMedium` and `bodySmall`, each one
// block of plain text, read from its line of HTML (remarkSiteBlocks in markdown.mjs) and written back as it. Exposes bodySizeSchemas.
// Depends on Milkdown.
import { $nodeSchema } from '@milkdown/kit/utils';
import { BODY_SIZES, bodySizeHtml } from '../lib/body-sizes.mjs';

export const bodySizeSchemas = BODY_SIZES.map(({ node: name, className }) =>
  $nodeSchema(name, () => ({
    group: 'block',
    content: 'text*',
    marks: '',
    defining: true,
    parseDOM: [{ tag: `p.${className}`, priority: 60 }],
    toDOM: () => ['p', { class: className }, 0],
    parseMarkdown: {
      match: (node) => node.type === name,
      runner: (state, node, type) => {
        state.openNode(type);
        if (node.value) state.addText(String(node.value));
        state.closeNode();
      },
    },
    toMarkdown: {
      match: (node) => node.type.name === name,
      runner: (state, node) => {
        state.addNode('html', undefined, bodySizeHtml(className, node.textContent));
      },
    },
  })),
);
