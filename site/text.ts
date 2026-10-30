// Text from the pages, shared by the site (content.ts) and the editor's previews of the blocks
// (a theme's editor/previews.tsx), which has no content collections. A word in colour (<span class="color-accent">,
// @interstellarcms/cms/lib/text-colors.mjs) is its text.
import { withoutColors } from '@interstellarcms/cms/lib/text-colors.mjs';
import { config } from '@site/config';

// A title can end in a word for search engines after a dash (`titleEnd` in the site's config, " – Roskilde"): kept
// in <title>, left out of the heading.
const escaped = config.titleEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const END = config.titleEnd ? new RegExp(`\\s+[–-]\\s+${escaped}$`) : null;
export const displayTitle = (title: string) => (END ? title.replace(END, '') : title);

// A page's own opening words: the first sentences of the body as plain text.
export function openingText(markdown: string | undefined, max = 240) {
  const text = (markdown ?? '')
    .split(/\n{2,}/)
    .filter((p) => !/^\s*(#|!\[|<|\||-|\*\*?[^*]+:\*\*?\s*$)/.test(p))
    .map((p) =>
      withoutColors(p)
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[*_`>]/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((p) => p.length > 40)
    .join(' ');
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return end > 80 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '...';
}

// A short text written as Markdown (an introduction: bold, italic, links; packages/editor/lib/inline.ts) as plain
// text, for a meta description.
export const plainText = (markdown: string) =>
  withoutColors(markdown)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|__|[*`]|\b_|_\b/g, '')
    .replace(/\\([!-/:-@[-`{-~])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
