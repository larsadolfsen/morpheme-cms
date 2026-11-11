// The Checklist block (type "checklist") has become a check list in the text (`- [x]` lines, "Check list" in the editor's text menu).
// This is the migration, so a text from before keeps working on the site, in the editor and in the preview, which write the check list
// when the page is saved (the same way as lib/remark-banner-section.mjs). Exposes remarkChecklists (a remark plugin: the site's pipeline
// in astro.mjs, lib/markdown.ts and the editor's in src/markdown.mjs) and checklistMarkdown (pure).
//
// The block's head (label, heading, intro) becomes plain text above the list: a paragraph each, the heading in bold. Its points are
// the list's items, each checked, so each shows a check mark as the block did. A hidden Checklist and one without points stay as they
// are: the block still works there.
// Depends on lib/blocks.mjs.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { parseBlock } from './blocks.mjs';

// Text as Markdown: the characters that mean something in one line of it.
const escape = (s) =>
  String(s)
    .replace(/\\/g, '\\\\')
    .replace(/([*_`[\]<>#~|])/g, '\\$1')
    .replace(/\s*\n\s*/g, ' ')
    .trim();

/** The Markdown a Checklist's props become: its head as paragraphs, then each point as a checked item; null when the Checklist is not
 * migrated (hidden, or no points).
 * @param {Record<string, any>} props `eyebrow`, `heading`, `intro` and `items` of the block
 * @returns {string | null} */
export function checklistMarkdown(props) {
  if (props.hidden) return null;
  const items = (Array.isArray(props.items) ? props.items : []).map((i) => (typeof i === 'string' ? escape(i) : '')).filter(Boolean);
  if (items.length === 0) return null;
  const head = [
    typeof props.eyebrow === 'string' && escape(props.eyebrow),
    typeof props.heading === 'string' && props.heading.trim() && `**${escape(props.heading)}**`,
    typeof props.intro === 'string' &&
      props.intro.trim() &&
      props.intro
        .trim()
        .split(/\n{2,}/)
        .map(escape)
        .join('\n\n'),
  ].filter(Boolean);
  return [...head, items.map((i) => `- [x] ${i}`).join('\n')].join('\n\n');
}

const parse = unified().use(remarkParse).use(remarkGfm);

// The HTML of a node that is a line of HTML on its own (also inside a paragraph, as Milkdown's reader has it).
const htmlOf = (node) => {
  const only = node?.type === 'paragraph' && node.children?.length === 1 ? node.children[0] : node;
  return only?.type === 'html' ? String(only.value) : '';
};

/** The remark plugin: each Checklist is replaced by the nodes of its check list. */
export function remarkChecklists() {
  return (tree) => {
    const nodes = tree.children;
    if (!nodes.some((n) => htmlOf(n).includes('data-block="checklist"'))) return;
    tree.children = nodes.flatMap((node) => {
      const block = parseBlock(htmlOf(node), ['checklist']);
      const markdown = block ? checklistMarkdown(block.props) : null;
      return markdown === null ? [node] : parse.parse(markdown).children;
    });
  };
}
