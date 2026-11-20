// A short text the site's owner writes as text in the editor (a page's introduction, the text under a section's
// heading), for a component that shows it inside its own <p>: bold, italic and links as they were
// written (Markdown, Astro's pipeline: typographic quotes too). Paragraphs are separated by a line break;
// anything that cannot stand inside a <p> (a list, an image) is shown as its text.
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { inlineOf } from './markdown';
import { rehypeEmphasize } from './rehype-emphasize.mjs';
import { rehypeAlign } from './text-align.mjs';

let processor: ReturnType<typeof createMarkdownProcessor> | undefined;

export async function inlineHtml(markdown: string): Promise<string> {
  processor ??= createMarkdownProcessor({ rehypePlugins: [rehypeEmphasize, rehypeAlign] });
  return inlineOf((await (await processor).render(markdown)).code.trim());
}

/** A longer text the site's owner writes in the editor (an answer in "Questions and answers") as HTML: paragraphs,
 * lists, bold, italic and links. */
export async function markdownHtml(markdown: string): Promise<string> {
  processor ??= createMarkdownProcessor({ rehypePlugins: [rehypeEmphasize, rehypeAlign] });
  return (await (await processor).render(markdown)).code.trim();
}
