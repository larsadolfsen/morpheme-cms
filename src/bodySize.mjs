// A paragraph in a smaller body style in the editor (lib/body-size.mjs: its HTML): the nodes `bodyMedium` and `bodySmall`,
// each one block of plain text, read from its line of HTML (remarkSiteBlocks in markdown.mjs) and written back as it.
// Exposes bodyMediumSchema and bodySmallSchema. Depends on Milkdown.
import { $nodeSchema } from '@milkdown/kit/utils';
import { bodySizeClass, bodySizeHtml } from '../lib/body-size.mjs';

const schemaOf = (size, name) =>
  $nodeSchema(name, () => ({
    group: 'block',
    content: 'text*',
    marks: '',
    defining: true,
    parseDOM: [{ tag: `p.${bodySizeClass(size)}`, priority: 60 }],
    toDOM: () => ['p', { class: bodySizeClass(size) }, 0],
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
        state.addNode('html', undefined, bodySizeHtml(size, node.textContent));
      },
    },
  }));

export const bodyMediumSchema = schemaOf('medium', 'bodyMedium');
export const bodySmallSchema = schemaOf('small', 'bodySmall');
