// A label above a heading in the editor (lib/eyebrow.mjs: its HTML): the node `eyebrow`, one line of plain text, read
// from its line of HTML (remarkSiteBlocks in markdown.mjs) and written back as it; a label with no heading after it
// becomes a paragraph (eyebrowKeeper), and Enter in it goes to its heading (eyebrowKeymap). Exposes eyebrowSchema,
// eyebrowKeeper and eyebrowKeymap. Depends on Milkdown and src/eyebrowState.mjs.
import { $nodeSchema, $prose, $useKeymap } from '@milkdown/kit/utils';
import { Plugin } from '@milkdown/kit/prose/state';
import { EYEBROW_CLASS, eyebrowHtml } from '../lib/eyebrow.mjs';
import { enterInLabel, looseLabels } from './eyebrowState.mjs';

/** @type {import('@milkdown/kit/utils').$NodeSchema<'eyebrow'>} */
export const eyebrowSchema = $nodeSchema('eyebrow', () => ({
  group: 'block',
  content: 'text*',
  marks: '',
  defining: true,
  // Before a paragraph's own rule.
  parseDOM: [{ tag: `p.${EYEBROW_CLASS}`, priority: 60 }],
  toDOM: () => ['p', { class: EYEBROW_CLASS }, 0],
  parseMarkdown: {
    match: (node) => node.type === 'eyebrow',
    runner: (state, node, type) => {
      state.openNode(type);
      if (node.value) state.addText(String(node.value));
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'eyebrow',
    runner: (state, node) => {
      state.addNode('html', undefined, eyebrowHtml(node.textContent));
    },
  },
}));

// A label whose heading has gone (deleted, or turned into text) is a paragraph with its text.
/** @type {import('@milkdown/kit/utils').$Prose} */
export const eyebrowKeeper = $prose(
  () =>
    new Plugin({
      appendTransaction: (_, __, state) => {
        const loose = looseLabels(state.doc);
        if (!loose.length) return null;
        const tr = state.tr;
        for (const at of loose) tr.setNodeMarkup(at, state.schema.nodes.paragraph);
        return tr;
      },
    }),
);

// Before the text's own Enter (priority 50), which would split the label into two lines.
export const eyebrowKeymap = $useKeymap('eyebrow', {
  EnterInLabel: { shortcuts: 'Enter', priority: 100, command: () => enterInLabel },
});
