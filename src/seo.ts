// The SEO rating at the top of "Search engines" on a page and a blog post (EntryForm.tsx): a few
// checks of the text and the Google fields, each fine or not, with what is fine or wrong in one sentence
// (CheckList in ui.tsx), like the SEO audits of Google Lighthouse that can be judged from the page's own
// content. It never keeps the form from being saved. Pure functions of the form's values and the Markdown
// of its text, so they are easy to try on their own. What is used when a Google field is empty is what
// Base.astro does: the title, else the "Short description", else the site's own.
import { siteLocale, t } from './i18n';
import { isVague, vagueLinksOf } from './vagueLink';
import { decorativeOf } from '../lib/crop.mjs';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { searchedAs } from './googleResult.mjs';

/** What the rating looks at: a blog post (whose title is its H1) or a page (whose H1 is in its text). */
export type SeoInput = {
  post: boolean;
  title: string;
  /** The text, as Markdown (without the front matter). */
  body: string;
  seoTitle?: string;
  seoDescription?: string;
  /** "Short description", used when there is no Google description. */
  description?: string;
  /** What is used instead of an empty Google description on a page without a "Short description" (a fixed page's
   * introduction), in a few words; without it, the site's own description. */
  descriptionFrom?: string;
  /** The H1 of a page that has it in a field of its own (a fixed page: "Heading (H1)"), not in its text. */
  h1?: string;
  /** "Main keyword". */
  keyword?: string;
  /** "No index" (noindex). */
  noindex?: boolean;
  /** "Canonical URL": the address of the page Google should count as the original. */
  canonical?: string;
  /** What the editor knows (env.relations): the pages and fixed pages by their address, the blog posts by their
   * name, to see if the canonical page is among them. */
  relations?: { pages?: { value: string }[]; fixed?: { value: string }[]; blog?: { value: string }[] };
};

export type SeoCheck = { ok: boolean; text: string; fix?: string };

/** The input of a page's or a post's rating from its fields (as in its form or its file) and its text: the same in its
 * form (EntryForm.tsx) and in the list of them all ("SEO rating", SeoScores.tsx). */
export function seoInputOf(values: Record<string, unknown>, body: string, post: boolean, relations: SeoInput['relations']): SeoInput {
  const text = (name: string) => String(values[name] ?? '');
  return {
    post,
    body,
    title: text('title'),
    seoTitle: text('seoTitle'),
    seoDescription: text('seoDescription'),
    description: text('description'),
    keyword: text('keyword'),
    noindex: values.noindex === true,
    canonical: text('canonical'),
    relations,
  };
}

/** The rating of a page or a post as it is saved, from its file (front matter and text): the lists of them (SeoScores.tsx,
 * and the pages and posts with "Show SEO rating", Library.tsx). */
export function fileRating(text: string, post: boolean, relations: SeoInput['relations']): SeoCheck[] {
  const { yaml, body } = splitFrontmatter(text);
  return seoRating(seoInputOf(readFields(yaml), body, post, relations));
}

/** The fields under "Search engines", in every form that has them (EntryForm.tsx, DataForm.tsx): the Google texts, the
 * keywords, the canonical address, noindex and nofollow. */
export const SEO_FIELDS = ['seoTitle', 'seoDescription', 'keyword', 'keywords', 'canonical', 'noindex', 'nofollow'];

/** The fields under "Social media", after them: the image, the title and the description when the page is shared
 * (a fixed page and a tag have only the image). */
export const SHARE_FIELDS = ['shareImage', 'shareTitle', 'shareDescription'];

/** What a page shows when a link to it is shared (Facebook, LinkedIn, a message), worked out as Base.astro writes its
 * og: tags: the title when shared, else the Google title, else the page's own with the site's name after it (the front
 * page's without; a page without a title: only the site's name, as `searchedAs` has it); the description when shared,
 * else the Google description, else the page's own (`description`: its "Short description", a fixed page's introduction), else the site's; the image when shared, else the page's own
 * (`image`: "Image at the top", else the first image in the text), else the site's. */
export type ShareInput = {
  /** The page's own title as the site has it: a page's H1, a post's title, a fixed page's heading, a tag's name. */
  title: string;
  front?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  shareTitle?: string;
  shareDescription?: string;
  shareImage?: string;
  description?: string;
  image?: string;
  /** The site's name, description and image (`sharing` in @site/editor). */
  site: { name: string; description: string; image: string };
};

export const sharedAs = (input: ShareInput) => {
  const searched = searchedAs(input);
  return {
    title: input.shareTitle?.trim() || searched.title,
    description: input.shareDescription?.trim() || searched.description,
    image: input.shareImage || input.image || input.site.image,
  };
};

/** The first image in a text (its address), not one in the text of a block in it (a "Banner"'s, on its line of HTML),
 * as the site picks it (firstImage in packages/editor/site/images.mjs). */
export const firstImage = (body: string): string | undefined =>
  body.replace(/^<div data-block=.*$/gm, '').match(/!\[[^\]]*\]\(([^)\s]+)\)/)?.[1];

/** The longest a Google title is shown, and the length a Google description is best between. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 160;

const H1 = /^ {0,3}#(?!#)[ \t]+\S/;
const HEADING = /^ {0,3}#{1,6}([ \t]|$)/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** The lines of a text outside fenced code, with their numbers. */
function outsideCode(body: string): { line: string; at: number }[] {
  const lines = body.split(/\r?\n/);
  const out: { line: string; at: number }[] = [];
  let fence: string | null = null;
  lines.forEach((line, at) => {
    const opens = FENCE.exec(line)?.[1];
    if (fence) {
      if (opens && opens[0] === fence[0] && opens.length >= fence.length) fence = null;
    } else if (opens) fence = opens;
    else out.push({ line, at });
  });
  return out;
}

/** The H1 headings of a text (ATX lines "# …", not in fenced code), as plain text, with their line numbers. */
export function h1s(body: string): { text: string; at: number }[] {
  return outsideCode(body)
    .filter(({ line }) => H1.test(line))
    .map(({ line, at }) => ({ text: plain(line.replace(/^ {0,3}#[ \t]+/, '').replace(/[ \t]+#+[ \t]*$/, '')), at }));
}

/** Whether the first line of a text that is not blank is an H1. */
export function h1First(body: string): boolean {
  const first = body.split(/\r?\n/).find((line) => line.trim());
  return !!first && H1.test(first);
}

/** The first paragraph of a text, as plain text: the first lines together that are not a heading, a block
 * (HTML), an image alone, a line across or fenced code. Empty when there is none. */
export function firstParagraph(body: string): string {
  const lines = outsideCode(body);
  const text = (line: string) =>
    line.trim() &&
    !HEADING.test(line) &&
    !/^\s*</.test(line) &&
    !/^\s*!\[[^\]]*\]\([^)]*\)\s*$/.test(line) &&
    !/^ {0,3}([-*_])( *\1){2,} *$/.test(line);
  const start = lines.findIndex(({ line }) => text(line));
  if (start < 0) return '';
  const paragraph: string[] = [];
  for (let i = start; i < lines.length && lines[i].line.trim() && (i === start || lines[i].at === lines[i - 1].at + 1); i++)
    paragraph.push(lines[i].line);
  return plain(paragraph.join(' '));
}

/** Markdown as plain text: without links' addresses, images and the marks for bold, italic and code. */
export function plain(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]+/g, '')
    .replace(/\\(.)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The number of characters in a text, as Google counts them (an emoji is one). */
export const lengthOf = (text: string) => [...text.trim()].length;

/** Whether a word or words are in a text, whatever the case. */
export const hasWord = (text: string, word: string) =>
  !!word.trim() && plain(text).toLocaleLowerCase().includes(word.trim().replace(/\s+/g, ' ').toLocaleLowerCase());

/** The text of a body outside fenced code, code spans and HTML comments, in paragraphs, so a link or an image
 * is never read across two of them. */
function paragraphs(body: string): string[] {
  const kept = new Set(outsideCode(body).map(({ at }) => at));
  return body
    .split(/\r?\n/)
    .map((line, at) => (kept.has(at) ? line : ''))
    .join('\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n[ \t]*\n/)
    .map((p) => p.replace(/(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, ''));
}

// A link's or an image's text in brackets (with escapes and one level of brackets in it, as an image in a link),
// and its address in parentheses (maybe in <>, with a title after it), as Milkdown writes them: the text the first
// group, the address the second.
const LABEL = String.raw`((?:\\.|[^\\\[\]]|\[(?:\\.|[^\\\[\]])*\])*)`;
const DEST = String.raw`\(\s*(<[^>\n]*>|(?:\\.|[^\\()\s]|\((?:\\.|[^\\()\s])*\))*)(?:\s+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^()\\])*\)))?\s*\)`;
const IMAGE = new RegExp(String.raw`(?<!\\)!\[${LABEL}\]${DEST}`, 'g');
const LINK = new RegExp(String.raw`(?<![\\!])\[${LABEL}\]${DEST}`, 'g');
const IMG = /(?<!\\)<img\b[^>]*>/gi;
const ALT = /\salt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;
const A = /(?<!\\)<a\b[^>]*>([\s\S]*?)<\/a\s*>/gi;

/** The images in a text (`![…](…)`, and `<img>` in its HTML), each by its alternative text, as plain text (empty
 * when it has none), and whether it is decorative: marked so in its address ("Decorative image", crop.mjs), or in
 * HTML with alt="". The blocks (`<div data-block=…>`) are not images of the text. */
export function images(body: string): { alt: string; decorative: boolean }[] {
  return paragraphs(body).flatMap((p) => [
    ...[...p.matchAll(IMAGE)].map((m) => ({
      alt: plain(m[1]),
      decorative: decorativeOf(m[2].replace(/^<(.*)>$/, '$1')).decorative,
    })),
    ...[...p.matchAll(IMG)].map((m) => {
      const attribute = ALT.exec(m[0]);
      const alt = (attribute?.[1] ?? attribute?.[2] ?? attribute?.[3] ?? '').trim();
      return { alt, decorative: !!attribute && !alt };
    }),
  ]);
}

/** The links in a text (`[…](…)`, and `<a>` in its HTML), each by its text, as plain text. */
export function links(body: string): string[] {
  return paragraphs(body).flatMap((p) => [...[...p.matchAll(LINK)].map((m) => plain(m[1])), ...[...p.matchAll(A)].map((m) => plain(m[1]))]);
}

// Link texts that say nothing about where the link goes (Lighthouse's "Links do not have descriptive text"): the list of the site's language.
/** Whether a link's text is only a vague phrase ("click here", "Read more →"), whatever the case and punctuation. */
export const vague = (text: string) => isVague(text, vagueLinksOf(siteLocale));

/** An address as the editor keeps a page's: from / to /, without what is after # or ?. */
const pathOf = (address: string) => {
  const path = address.trim().replace(/[?#].*$/, '');
  return path ? `/${path}/`.replace(/\/{2,}/g, '/') : '';
};

/** Whether the canonical address is a page, a fixed page or a blog post the editor knows; null when it cannot
 * say: no address, nothing known, or an address on another site (https://…). */
export function canonicalFound(canonical: string, relations: SeoInput['relations']): boolean | null {
  const path = pathOf(canonical);
  if (!path || !relations || /^([a-z][a-z\d+.-]*:|\/\/)/i.test(canonical.trim())) return null;
  return [...(relations.pages ?? []), ...(relations.fixed ?? []), ...(relations.blog ?? [])].some((o) => pathOf(o.value) === path);
}

/** The checks, in the order they are shown: at most ten. First whether Google may show the page at all (noindex and
 * Canonical URL, only when they are set), then its H1, its Google title and description and its keyword, and last
 * the images and links of its text (only when it has some). */
export function seoRating(input: SeoInput): SeoCheck[] {
  const r = t.forms.seoRating;
  const { post } = input;
  const checks: SeoCheck[] = [];
  // Hidden from search engines: only said when it is so, as most pages are not.
  if (input.noindex) checks.push({ ok: false, text: r.noindex(post), fix: r.fixNoindex(post) });
  const canonical = canonicalFound(input.canonical ?? '', input.relations);
  if (canonical === false) checks.push({ ok: false, text: r.noCanonical, fix: r.fixCanonical });
  // A page's H1 is in its text, just one and at the top; a post's is its title, a fixed page's its own field.
  const ownH1 = input.h1 !== undefined;
  const headings = post || ownH1 ? [] : h1s(input.body);
  if (!post && !ownH1) {
    const n = headings.length;
    checks.push(
      n === 1
        ? { ok: true, text: r.oneH1 }
        : n === 0
          ? { ok: false, text: r.noH1, fix: r.fixNoH1 }
          : { ok: false, text: r.manyH1(n), fix: r.fixManyH1 },
    );
    if (n) checks.push(h1First(input.body) ? { ok: true, text: r.h1First } : { ok: false, text: r.h1NotFirst, fix: r.fixH1First });
  }
  const title = lengthOf(input.seoTitle ?? '');
  checks.push(
    !title
      ? { ok: false, text: r.noTitle(post), fix: r.fixTitle }
      : title > TITLE_MAX
        ? { ok: false, text: r.longTitle(title), fix: r.fixTitle }
        : { ok: true, text: r.goodTitle(title) },
  );
  const description = lengthOf(input.seoDescription ?? '');
  checks.push(
    !description
      ? {
          ok: false,
          text: input.descriptionFrom ? r.noDescriptionFrom(input.descriptionFrom) : r.noDescription(!!input.description?.trim()),
          fix: r.fixDescription,
        }
      : description < DESCRIPTION_MIN
        ? { ok: false, text: r.shortDescription(description), fix: r.fixDescription }
        : description > DESCRIPTION_MAX
          ? { ok: false, text: r.longDescription(description), fix: r.fixDescription }
          : { ok: true, text: r.goodDescription(description) },
  );
  const keyword = input.keyword?.trim();
  if (keyword) {
    // In the H1 (not asked of a page without one, which is said above), and in the first paragraph.
    const h1 = post ? input.title : ownH1 ? input.h1 : headings[0]?.text;
    if (h1 != null) {
      const inH1 = hasWord(h1, keyword);
      checks.push({ ok: inH1, text: r.keywordInH1(keyword, post, inH1), fix: inH1 ? undefined : r.fixKeywordInH1(post) });
    }
    const inText = hasWord(firstParagraph(input.body), keyword);
    checks.push({ ok: inText, text: r.keywordInText(keyword, inText), fix: inText ? undefined : r.fixKeywordInText });
  }
  const shown = images(input.body);
  if (shown.length) {
    const without = shown.filter((image) => !image.alt && !image.decorative).length;
    checks.push(without ? { ok: false, text: r.noAlt(without), fix: r.fixAlt } : { ok: true, text: r.allAlt });
  }
  const texts = links(input.body);
  if (texts.length) {
    const first = texts.find(vague);
    checks.push(first ? { ok: false, text: r.vagueLink(first), fix: r.fixLink } : { ok: true, text: r.goodLinks(texts.length) });
  }
  return checks;
}
