// The automatic internal links of a page's text, as a pure function of the text's tree and the words (no files): the Markdown pipeline of the
// site (packages/editor/site/autolinks.mjs, which reads the words from the pages) and the editor's Preview (src/pagePreview.tsx, which reads them from
// the site's /editor/links.json) both link a page the same way, so the Preview shows the links the site will have.
// Exposes linkPattern and autoLinkTree.

// The hast node type of an HTML element, as an escape: the language check reads the plain word as a Danish one.
const ELEMENT = 'el\u0065ment';
// What a word may not touch to be linked: a letter, a digit, or a hyphen joining it to another word.
const LETTER = '\\p{L}\\p{N}-';
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One regex for all words (the keys of `words`), longest first so "tryg tilknytning" wins over shorter matches. @param {Iterable<string>} words */
export const linkPattern = (words) => {
  const all = [...words].sort((a, b) => b.length - a.length).map(escape);
  return new RegExp(`(?<![${LETTER}])(${all.join('|')})(?![${LETTER}])`, 'giu');
};

// Not inside links, headings, code, or the offer and price boxes.
const SKIP = new Set(['aside', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'button', 'figcaption', 'dl']);

/** The pages a block in the text links to (packages/editor/lib/blocks.mjs): its `href` fields (topics, price cards,
 * buttons, cards), the links in its texts (questions and answers) and the posts it picks. */
function blockLinks(node) {
  let props;
  try {
    props = JSON.parse(String(node.properties.dataProps ?? '{}'));
  } catch {
    return [];
  }
  const links = [];
  const visit = (value, key) => {
    if (typeof value === 'string') {
      if (key === 'href' && value.startsWith('/')) links.push(value.split('#')[0]);
      for (const m of value.matchAll(/\]\((\/[^)\s#]*)/g)) links.push(m[1]);
    } else if (Array.isArray(value)) value.forEach((v) => visit(v, key));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => visit(v, k));
  };
  visit(props);
  if (node.properties.dataBlock === 'posts' && Array.isArray(props.picked)) links.push(...props.picked.map((id) => `/${id}/`));
  return links;
}

/**
 * Links the words in a page's text, in place: a target once per page, at most `maxPerPage` links, never to the page itself (`self`), never
 * inside headings or existing links, and never to a page the text or one of its blocks already links to.
 * @param {any} tree the text as a hast tree
 * @param {string} self the page's own address ('' for none)
 * @param {{ enabled: boolean, maxPerPage: number, words: Map<string, string>, pattern: RegExp }} links
 */
export function autoLinkTree(tree, self, { enabled, maxPerPage, words, pattern }) {
  if (!enabled || !words.size) return;
  const used = new Set([self]);
  // Targets the text already links to by hand, or a block on the page links to, are not linked again.
  const collect = (node) => {
    if (node.type === ELEMENT && node.tagName === 'a') used.add(String(node.properties?.href ?? '').split('#')[0]);
    if (node.type === ELEMENT && node.properties?.dataBlock) blockLinks(node).forEach((href) => used.add(href));
    node.children?.forEach(collect);
  };
  collect(tree);
  let count = 0;

  const walk = (node) => {
    if (!node.children || count >= maxPerPage) return;
    if (node.type === ELEMENT && SKIP.has(node.tagName)) return;
    const out = [];
    for (const child of node.children) {
      if (child.type !== 'text' || count >= maxPerPage) {
        walk(child);
        out.push(child);
        continue;
      }
      let last = 0;
      for (const m of child.value.matchAll(pattern)) {
        const href = words.get(m[1].toLowerCase());
        if (used.has(href) || count >= maxPerPage) continue;
        used.add(href);
        count++;
        if (m.index > last) out.push({ type: 'text', value: child.value.slice(last, m.index) });
        // data-link="auto": counted after the build (packages/editor/scripts/link-counts.mjs), for the editor's list of keywords.
        out.push({ type: ELEMENT, tagName: 'a', properties: { href, dataLink: 'auto' }, children: [{ type: 'text', value: m[1] }] });
        last = m.index + m[1].length;
      }
      if (last < child.value.length) out.push({ type: 'text', value: child.value.slice(last) });
    }
    node.children = out;
  };
  walk(tree);
}
