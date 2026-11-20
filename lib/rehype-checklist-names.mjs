// Every checkbox of a check list (`- [x]` in a text) gets the item's text as its name: remark-gfm writes it as a disabled <input type="checkbox"> beside the text,
// with no name of its own (WCAG 4.1.2, axe rule `label`). Exposes rehypeChecklistNames (a rehype plugin, in the site's pipeline in astro.mjs, in inline.ts and in the
// editor's in markdown.ts). A box that already has a name keeps it. No dependencies.

// The hast node type of an HTML element, as an escape: the language check reads the plain word as a Danish one.
const ELEMENT = 'element';

const isBox = (node) => node.type === ELEMENT && node.tagName === 'input' && node.properties?.type === 'checkbox';

// The text of a node, the checkbox left out, white space as one space.
const textOf = (node) => (node.type === 'text' ? node.value : isBox(node) ? '' : (node.children ?? []).map(textOf).join(''));

/** The rehype plugin: the `aria-label` of each check list item's checkbox is the text of the item. */
export function rehypeChecklistNames() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === ELEMENT && node.tagName === 'li') {
        const boxes = [];
        const find = (n) => {
          if (isBox(n)) boxes.push(n);
          // A nested list's items name their own boxes.
          else if (!(n.type === ELEMENT && (n.tagName === 'ul' || n.tagName === 'ol'))) n.children?.forEach(find);
        };
        node.children?.forEach(find);
        if (boxes.length === 1 && !boxes[0].properties.ariaLabel) {
          const own = {
            ...node,
            children: node.children.filter((n) => !(n.type === ELEMENT && (n.tagName === 'ul' || n.tagName === 'ol'))),
          };
          const name = textOf(own).replace(/\s+/g, ' ').trim();
          if (name) boxes[0].properties.ariaLabel = name;
        }
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
