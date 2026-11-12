// The alignment of a paragraph or a smaller heading (the Align button of the text toolbar, MarkdownEditor.tsx): in the Markdown a line
// of HTML right before the block, <div data-align="center"></div>, which every Markdown reader shows as nothing. Left is the text's own
// alignment and has no line. The site turns the line into the class `text-align-center` (or `-right`) on the block after it
// (rehypeAlign, in the site's pipeline in astro.mjs and in markdown.ts); how the class looks is the standard theme's blocks.css, which
// every theme imports. Exposes ALIGNMENTS, alignClass, alignHtml, alignOf and rehypeAlign. No React or browser.

/** The alignments the editor offers; 'left' is the default and is written as no line. */
export const ALIGNMENTS = ['left', 'center', 'right'];

/** The class of an alignment (`text-align-center`); '' for left and for anything else. @param {string | null | undefined} align */
export const alignClass = (align) => (align === 'center' || align === 'right' ? `text-align-${align}` : '');

/** The line of HTML that aligns the block after it; '' for left (the default). @param {string | null | undefined} align */
export const alignHtml = (align) => (align === 'center' || align === 'right' ? `<div data-align="${align}"></div>` : '');

const LINE = /^<div data-align="(center|right)"\s*><\/div>$/;

/** The alignment a line of HTML sets ('center' or 'right'), or null for any other HTML. @param {string} html @returns {string | null} */
export const alignOf = (html) => String(html).trim().match(LINE)?.[1] ?? null;

// The hast node type of an HTML element, as an escape: the language check reads the plain word as a Danish one.
const ELEMENT = 'element';

/** The rehype plugin: each alignment line is taken out, and the next element after it gets the class of its alignment (its own classes kept). */
export function rehypeAlign() {
  return (tree) => {
    const walk = (node) => {
      const kids = node.children;
      if (!kids) return;
      for (let i = 0; i < kids.length; i++) {
        const child = kids[i];
        const align = child.type === ELEMENT && child.tagName === 'div' ? child.properties?.dataAlign : undefined;
        if (align !== 'center' && align !== 'right') continue;
        // The line and the line break after it go; the one before it stays as the block's.
        const gone = kids[i + 1]?.type === 'text' && !kids[i + 1].value.trim() ? 2 : 1;
        kids.splice(i, gone);
        const next = kids.slice(i).find((k) => k.type === ELEMENT);
        if (next) next.properties.className = [...[].concat(next.properties.className ?? []), alignClass(align)];
        i--;
      }
      kids.forEach(walk);
    };
    walk(tree);
  };
}
