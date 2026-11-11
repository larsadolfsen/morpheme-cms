// Markdown as HTML in the editor, at once: as the site makes it (Astro's pipeline, inline.ts: GitHub's Markdown,
// typographic quotes, the HTML written in it) with what runs in a browser, so a block drawn in the editor shows its
// text as on the site (bold, italic, links, lists). The site itself uses Astro's (inline.ts), which does not run in a
// browser.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { rehypeEmphasize } from './rehype-emphasize.mjs';
import { remarkBannerSections } from './remark-banner-section.mjs';

/** The pipeline, also for a whole page's text (pagePreview.tsx). */
export const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBannerSections)
  .use(remarkSmartypants)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeEmphasize)
  .use(rehypeStringify, { allowDangerousHtml: true });

/** A short text's HTML made to stand inside a <p> of its own: its paragraphs separated by a line break, and anything
 * that cannot stand there (a list, a picture) as its text, still escaped HTML. */
export function inlineOf(html: string): string {
  const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)];
  if (paragraphs.map((m) => m[0]).join('\n') === html) return paragraphs.map((m) => m[1]).join('<br>');
  return html
    .replace(/<img\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// A link only drawn: without its address it looks as one, but leads nowhere from the editor.
const drawn = (html: string) => html.replace(/<a\b([^>]*?)\s+href="[^"]*"/g, '<a$1');

/** A longer text (an answer, a hero's text) as HTML to draw in the editor: paragraphs, lists, bold, italic and links
 * (only drawn). */
export const markdownNow = (markdown: string) => drawn(String(processor.processSync(markdown)).trim());

/** A short text for a component that shows it inside its own <p> (inlineHtml on the site). */
export const inlineNow = (markdown: string) => inlineOf(markdownNow(markdown));
