// The site's content collections (pages and blog posts): their status, paths, headings, and a page's text without its H1.
// Exposes getPages, getPosts, pageHeading, pageHeadingHtml, withoutH1 and h1SectionColor. Depends on astro:content and lib/.
import { getCollection, type CollectionEntry } from 'astro:content';
import { categories, isBlogCategory } from './categories';
import { displayTitle } from './text';
import { isPreview } from './noindex.mjs';
import { stateOf } from '@morphemecms/cms/lib/status.mjs';
import { pageH1 } from '@morphemecms/cms/src/sections.mjs';
import { h1SectionColor, withoutH1 } from '@morphemecms/cms/lib/without-h1.mjs';

// From text.ts, which the editor uses too (it has no content collections).
export { displayTitle, openingText } from './text';
// withoutH1 and h1SectionColor: a page's text without its H1 (and its marker), and the colour of the H1's section (PageLayout.astro).
export { h1SectionColor, stateOf, withoutH1 };

export type Post = CollectionEntry<'blog'>;
// Every page has a path: its own, or /<file name>/ for pages created in the editor.
export type Page = CollectionEntry<'pages'> & { data: { path: string } };

export const postPath = (post: Post) => `/${post.id}/`;

// What a page or post is on this site (packages/editor/lib/status.mjs); in dev a draft is on it, as if published.
const stateHere = (data: { status?: string; publishAt?: string }) => {
  const state = stateOf(data);
  return state === 'draft' && import.meta.env.DEV ? 'published' : state;
};
// Whether a page or post in that state is built: a published one, and with `unlisted` a hidden one.
const shown = (state: ReturnType<typeof stateOf>, unlisted: boolean) => state === 'published' || (unlisted && state === 'unlisted');

// The posts on the blog and in every list of posts; with `unlisted`, also those that only open on
// their address (Hidden; the pages of the posts are made for those too). A draft is not on the site.
export async function getPosts({ unlisted = false } = {}) {
  return (await getCollection('blog', ({ data }) => shown(stateHere(data), unlisted))).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

/** Which posts a "Blog posts" block or the front page's section shows (packages/editor/site/home.ts): those in
 * any of `categories` (all when empty), the newest `count`, or with `order` "random" all of them,
 * to show `count` of at random on the page (the theme's PostList.tsx); or with `show` "picked" those picked. */
export async function postsFor(
  { show = 'categories', categories = [], order = 'newest', picked = [] }: PostChoice,
  count: number,
): Promise<{ posts: Post[]; random: boolean }> {
  const posts = await getPosts();
  if (show === 'picked') return { posts: picked.map((id) => posts.find((p) => p.id === id)).filter((p) => p !== undefined), random: false };
  const pool = posts.filter((p) => !categories.length || p.data.categories.some((c) => categories.includes(c)));
  const random = order === 'random' && pool.length > count;
  return { posts: random ? pool : pool.slice(0, count), random };
}
export type PostChoice = {
  /** "all": all of them, which "Blog posts" lists itself (StandardSite.posts.list), not by this. */
  show?: 'all' | 'categories' | 'picked';
  categories?: string[];
  /** How many, '3' to '6' (postCount in the standard block Blog posts' shared.ts). */
  count?: string;
  order?: 'newest' | 'random';
  picked?: string[];
  /** The category "All posts" goes to (allPostsCategory in packages/editor/site/home.ts). */
  link?: string;
};

// The pages on the site, also the hidden ones (Hidden; with `unlisted: false` not those) and, like the
// posts, the drafts on the editor's preview; with `previews: false`, not the new versions of pages under /ny/.
export async function getPages({ previews = true, unlisted = true } = {}): Promise<Page[]> {
  const pages = await getCollection('pages', ({ data }) => shown(stateHere(data), unlisted));
  for (const page of pages) page.data.path ??= `/${page.id}/`;
  return (previews ? pages : pages.filter((p) => !isPreview(p.data.path!))) as Page[];
}

const categoryNames = new Map(categories.map((c) => [c.slug, c.name]));
export const categoryName = (slug: string) => categoryNames.get(slug) ?? slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

// The blog categories that actually have posts, most used first: the pills on the blog index and
// the pages /blog/kategori/<slug>/.
export async function getCategories() {
  const posts = await getPosts();
  const counts = new Map<string, number>();
  for (const p of posts) for (const c of p.data.categories.filter(isBlogCategory)) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([slug, count]) => ({ slug, name: categoryName(slug), count }));
}

export function parentPage(page: Page, all: Page[]) {
  const folder = page.data.path.replace(/[^/]+\/$/, '');
  if (folder === '/') return undefined;
  return all.find((p) => p.data.path === folder);
}

// The H1 of a page: the heading at the top of its text ("# …", pageH1), else its title.
export const pageHeading = (page: Page) => pageH1(page.body ?? '').heading ?? displayTitle(page.data.title);

/** The H1 of a page as HTML, when a word in it has a colour (<span class="color-accent">, packages/editor/lib/text-colors.mjs),
 * for the layout to draw in its place; else undefined, and the layout draws pageHeading. */
export const pageHeadingHtml = (page: Page): string | undefined => pageH1(page.body ?? '').html;

/** Anchor for a testimonial on the testimonials page, e.g. "marie-louise-eriksen". */
export const testimonialId = (t: { name: string }) =>
  t.name
    .toLowerCase()
    .replace(/\u00e6/g, 'ae')
    .replace(/\u00f8/g, 'oe')
    .replace(/\u00e5/g, 'aa')
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
