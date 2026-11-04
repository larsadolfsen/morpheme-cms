// A blog post's lead: its first paragraph, when its text starts with one (theme/layouts/PostLayout.astro draws it larger,
// with the featured picture after it; src/pagePreview.tsx does the same in the editor). Exposes splitLead.
/** @param {string} html @returns {{ lead: string, rest: string }} */
export function splitLead(html) {
  const m = /^(?:\s|<!--[\s\S]*?-->)*(<p(?:\s[^>]*)?>([\s\S]*?)<\/p>)/i.exec(html);
  if (m && m[2].replace(/<[^>]*>/g, '').trim() !== '') {
    return { lead: m[1], rest: html.slice(m[0].length).trimStart() };
  }
  return { lead: '', rest: html };
}
