// A label in the editor (lib/eyebrow.mjs: its HTML): the node `eyebrow`, one line of plain text on any top-level line, read
// from its line of HTML (remarkSiteBlocks in markdown.mjs) and written back as it; Enter in it goes to the next line
// (eyebrowKeymap). Exposes eyebrowSchema and eyebrowKeymap. Depends on Milkdown and src/eyebrowState.mjs.
import { $nodeSchema, $useKeymap } from '@milkdown/kit/utils';
import { EYEBROW_CLASS, eyebrowHtml } from '../lib/eyebrow.mjs';
import { enterInLabel } from './eyebrowState.mjs';

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

// Before the text's own Enter (priority 50), which would split the label into two lines.
export const eyebrowKeymap = $useKeymap('eyebrow', {
  EnterInLabel: { shortcuts: 'Enter', priority: 100, command: () => enterInLabel },
});
