// A page's text as HTML without its H1, which the layout draws in its own place (above the picture, PageLayout.astro).
// Exposes withoutH1 (pure); the H1 is the first one wherever it stands, as pageH1 (src/sections.mjs) reads it. No dependencies.

/** The html without its first <h1>…</h1> and the white space after it.
 * @param {string} html
 * @returns {string} */
export const withoutH1 = (html) => html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>\s*/, '');
