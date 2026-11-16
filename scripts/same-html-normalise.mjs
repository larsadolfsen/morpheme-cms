// What check-same-html.mjs compares: the pages that guard the lists and the blocks, with the content hash of every built asset name taken out.
// Exposes GUARDED_PAGES and withoutAssetHashes. No imports.

/** The pages whose HTML must stay the same: the 0.17 fixture's (lists, sources, own blocks: the Testimonials, Blog posts and Dynamic list blocks
 * among them) and the demo's Blocks page. Every other page and file (robots.txt, sitemaps, the other pages) may change on purpose. */
export const GUARDED_PAGES = [
  'fixture-lists/index.html',
  'fixture-sources/index.html',
  'fixture-own-blocks/index.html',
  'blocks/index.html',
];

/** The page's text with the content hash of each built asset taken out of its name (`_astro/MobileMenu.CexCd42L.js` becomes
 * `_astro/MobileMenu.js`), in an `src`, an `href` and an inline import. The bundler names a chunk after its content, and the site's chunk of
 * the editor's texts changes with every text of the editor, which says nothing about how a block is drawn. @param {string} html */
export const withoutAssetHashes = (html) =>
  html.replace(/((?:_astro\/|\.\/)[\w.\-/]*?)\.[A-Za-z0-9_-]{8}(\.(?:js|css|webp|avif|png|jpe?g|gif|svg|woff2?|mjs))(?![\w-])/g, '$1$2');
