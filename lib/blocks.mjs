// Blocks the site's owner puts in the text of a page in the editor (/editor/, the Milkdown plugin in
// packages/editor/src/markdown.mjs). Each is a folder in src/apps/<app>/blocks/, named by its type. In the Markdown each is
// one line of HTML that nothing else writes, e.g.
//   <div data-block="testimonials" data-props="{&quot;heading&quot;:&quot;Det siger kunderne&quot;}"></div>
// so the rest of the text, and every page without blocks, is rendered as before. On the site
// packages/editor/theme/components/RichText.astro shows the block's own component in its place.
const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescape = (s) =>
  s
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&lt;|&#60;|&#x3c;/gi, '<')
    .replace(/&gt;|&#62;|&#x3e;/gi, '>')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&amp;|&#38;|&#x26;/gi, '&');

/** The line of HTML for a block. */
export function blockHtml(type, props = {}) {
  const json = JSON.stringify(props);
  return json === '{}' ? `<div data-block="${type}"></div>` : `<div data-block="${type}" data-props="${escape(json)}"></div>`;
}

// A block as written by blockHtml, or as the site's HTML pipeline writes it again.
const BLOCK = /<div data-block="([a-z]+)"(?: data-props="([^"]*)")?\s*><\/div>/;

// Blocks that have become another block, by their old type: the block they are read as (its type and props), so a
// text from before keeps working on the site and in the editor, which writes the new block when the page is saved.
const FORMER = {
  // "Blog" became "Blog posts" with all the posts (with any of its tags), the newest large.
  blog: (props) => ({ type: 'posts', props: { ...props, show: 'all', design: 'featured' } }),
  // A "List" with each row on its own surface (its `design`, which is gone) is a "Segmented list" with its rows always open, as they were; any other
  // "List" stays one, and loses the design it never had.
  list: ({ design, ...props }) =>
    design === 'segmented' ? { type: 'segmented', props: { ...props, show: 'all' } } : { type: 'list', props },
};

// types: the blocks that count (the folders in src/apps/<app>/blocks/); null for any.
const read = (type, props, types) => {
  let block;
  try {
    block = { type, props: props ? JSON.parse(unescape(props)) : {} };
  } catch {
    return null;
  }
  if (FORMER[type]) block = FORMER[type](block.props);
  return types && !types.includes(block.type) ? null : block;
};

/** The block a piece of HTML is (and nothing else), or null; of any type unless types are given.
 * @param {string} html
 * @param {string[] | null} [types] */
export function parseBlock(html, types = null) {
  const m = html.trim().match(new RegExp(`^${BLOCK.source}$`));
  return m ? read(m[1], m[2], types) : null;
}

/** Every block in a text, hidden ones too, in order ({ type, props }), of any type. nested: also those in the text of a
 * block (a "Buttons" block in a "Banner"'s text, written in its props), each after the block it is in.
 * @param {string} html
 * @returns {{ type: string; props: Record<string, any> }[]} */
export function blocksIn(html, nested = false) {
  const found = [...html.matchAll(new RegExp(BLOCK.source, 'g'))].map((m) => read(m[1], m[2], null)).filter((b) => b !== null);
  if (!nested) return found;
  const inside = (b) =>
    Object.values(b.props).flatMap((v) => (typeof v === 'string' && v.includes('data-block=') ? blocksIn(v, true) : []));
  return found.flatMap((b) => [b, ...inside(b)]);
}

/** A text (Markdown) cut at its first block of a type (on a line of its own, as blockHtml writes it): the text before
 * it, and the block's line with the text after it ('' without one).
 * @param {unknown} markdown
 * @param {string} type
 * @returns {[string, string]} */
export function cutAtBlock(markdown, type) {
  const lines = String(markdown ?? '').split('\n');
  const at = lines.findIndex((line) => parseBlock(line, [type]));
  return at < 0 ? [lines.join('\n').trim(), ''] : [lines.slice(0, at).join('\n').trim(), lines.slice(at).join('\n').trim()];
}

/** Rendered HTML in pieces: text ({ html }) and the blocks of these types in it ({ type, props }); a
 * hidden block (`hidden`, "Hide on page" in the editor) is left out. */
export function splitBlocks(html, types) {
  const parts = [];
  const all = new RegExp(BLOCK.source, 'g');
  let last = 0;
  for (const m of html.matchAll(all)) {
    const block = read(m[1], m[2], types);
    if (!block) continue;
    parts.push({ html: html.slice(last, m.index) });
    if (!block.props.hidden) parts.push(block);
    last = m.index + m[0].length;
  }
  parts.push({ html: html.slice(last) });
  return parts.filter((p) => p.html === undefined || p.html.trim());
}
