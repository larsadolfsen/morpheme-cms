// The blog page, the 404 page and the cookie policy: the pages chosen under "Indstillinger" › "Udseende" › "Standardsider"
// (src/data/standard-pages.json, packages/editor/defaults/standardPages.ts), read for the theme's templates/Blog.astro (at /blog/) and
// templates/NotFound.astro (the page for an address that does not exist): the page, its heading (the H1 at the top of
// its text, else its title), its introduction (the first paragraph of the text before its first heading or block) and the
// rest, shown, as sections: text ("text": a heading and Markdown) and each block by its type, with its fields; and where
// the cookie banner's "Læs mere" goes (cookiesHref).
import { slug } from 'github-slugger';
import paths from '@data/standard-pages.json';
import { getPages, type Page } from './content';
import { pageH1, partsOfMarkdown, sectionsFromParts } from '@morphemecms/cms/src/sections.mjs';

/** The addresses of the pages that are the front page, the blog page, the 404 page, the contact page, the privacy policy
 * and the cookie policy (their own addresses: the front page is shown at /, the blog page at /blog/, the 404 page at none,
 * the others at their own). */
export const standardPaths: {
  front: string;
  blog: string;
  notFound: string;
  contact: string;
  privacy: string;
  cookies: string;
} = paths;

export type PageSection = { type: string; hidden?: boolean; heading?: string; body?: string } & Record<string, any>;
export type StandardPageView = { page: Page; heading: string; intro?: string; sections: PageSection[] };

async function read(key: 'blog' | 'notFound'): Promise<StandardPageView> {
  const page = (await getPages({ previews: false })).find((p) => p.data.path === standardPaths[key]);
  if (!page) throw new Error(`src/data/standard-pages.json: siden ${standardPaths[key]} findes ikke, eller den er en kladde.`);
  const sections = (sectionsFromParts(partsOfMarkdown(page.body ?? '')) as PageSection[]).filter((s) => !s.hidden);
  // The introduction: the first paragraph of a text without a heading at the top; the rest of that text stays a section.
  let intro: string | undefined;
  const first = sections[0];
  if (first?.type === 'text' && !first.heading && first.body) {
    const [paragraph, ...rest] = first.body.trim().split(/\n\s*\n/);
    intro = paragraph.trim();
    if (rest.length) first.body = rest.join('\n\n');
    else sections.shift();
  }
  return { page, heading: pageH1(page.body).heading || page.data.title, intro, sections };
}

/** The blog page, shown at /blog/. */
export const blogPage = () => read('blog');
/** The 404 page, shown for an address that does not exist. */
export const notFoundPage = () => read('notFound');

/** The addresses the standard pages are shown at, by their own: the front page's at /, the blog page's at /blog/. */
export const shownAt = (path: string) => (path === standardPaths.front ? '/' : path === standardPaths.blog ? '/blog/' : path);

/** Where the cookie banner's "Læs mere" goes: the cookie policy, and when it is the privacy policy, its first heading about
 * cookies (its id, as Astro gives it: github-slugger), if it has one. */
export async function cookiesHref(): Promise<string> {
  const path = standardPaths.cookies;
  if (path !== standardPaths.privacy) return path;
  const page = (await getPages({ previews: false })).find((p) => p.data.path === path);
  const heading = (page?.body ?? '').match(/^#{2,6}\s+(.*cookie.*?)\s*#*\s*$/im)?.[1];
  return heading ? `${path}#${slug(heading)}` : path;
}
