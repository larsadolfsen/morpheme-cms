// The critical CSS of a built page, made by beasties (https://github.com/danielroe/beasties): the rules of the page's stylesheets that
// match its markup, with the layer order, the custom properties and the fonts they need. Kept apart from lib/criticalCss.mjs
// so another extractor fits the same function; when beasties cannot be loaded the pages keep their plain stylesheet link.

/** The extractor for a built site in a folder, or `undefined` when beasties is not there. @param {string} root */
export async function beastiesExtractor(root) {
  let Beasties;
  try {
    ({ default: Beasties } = await import('beasties'));
  } catch {
    return undefined;
  }
  // Nothing is moved or removed: the stylesheet stays whole (pruneSource: false) and the link is left to lib/criticalCss.mjs (preload: false).
  const beasties = new Beasties({
    path: root,
    publicPath: '/',
    preload: false,
    pruneSource: false,
    inlineThreshold: 0,
    minimumExternalSize: 0,
    logLevel: 'silent',
  });
  return async ({ html }) => {
    const out = await beasties.process(html);
    const had = new Set([...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]));
    const made = [...out.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].filter((m) => !had.has(m[0]));
    return made.map((m) => m[1]).join('');
  };
}
