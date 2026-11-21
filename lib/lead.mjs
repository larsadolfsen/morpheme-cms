// A blog post's lead: its first paragraph, when its text starts with one (theme/layouts/PostLayout.astro draws it larger,
// with the featured image after it; src/pagePreview.tsx does the same in the editor). Exposes splitLead.
import { stripAll } from './stripAll.mjs';

/** Where the text starts after leading white space and HTML comments. @param {string} html */
function textStart(html) {
  let i = 0;
  for (;;) {
    while (i < html.length && /\s/.test(html[i])) i++;
    if (!html.startsWith('<!--', i)) return i;
    const end = html.indexOf('-->', i + 4);
    if (end < 0) return i;
    i = end + 3;
  }
}

/** @param {string} html @returns {{ lead: string, rest: string }} */
export function splitLead(html) {
  const start = textStart(html);
  const m = /^<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i.exec(html.slice(start));
  if (m && stripAll(m[1], /<[^>]*>/g).trim() !== '') {
    return { lead: m[0], rest: html.slice(start + m[0].length).trimStart() };
  }
  return { lead: '', rest: html };
}
