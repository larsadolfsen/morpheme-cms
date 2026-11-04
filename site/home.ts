// The front page: the page chosen under "Indstillinger" › "Udseende" › "Standardsider" (src/data/standard-pages.json,
// packages/editor/defaults/standardPages.ts), read
// into sections for the theme's templates/Home.astro: each block a section of its own (its type says how it looks,
// e.g. a theme's components/home/), with the text above it that is its own (its lead), and the rest of the text
// as sections of text ("text": a heading and Markdown). The types below are the standard blocks'; an app's block is a
// section too, by its own type, which the theme that draws it types itself (e.g. its components/home/sections.ts).
// A section under a coloured heading has its colour as `sectionColor` (src/sections.mjs).
import setting from '@data/standard-pages.json';
import { getPages, type Page, type PostChoice } from './content';
import { isBlogCategory } from './categories';
import { pageH1, partsOfMarkdown, sectionsFromParts } from '@morphemecms/cms/src/sections.mjs';
import { frontLeads } from '@site/standardPages';

type Link = { label: string; href: string };

type Sections = {
  // The standard block "Banner" (type "hero"; text: Markdown, with its heading, the subtitle and the introduction, its
  // picture, its "Knapper" block and the text under it: heroParts in packages/editor/src/standard/hero/fields.ts).
  hero: { text: string; placement?: string; width?: string };
  // The standard block "Foldeliste" with a heading and an introduction.
  accordion: { heading: string; intro: string; items: (Link & { text?: string; more?: Link[] })[] };
  // The standard block "Udtalelser" (show 'front': the front page's).
  testimonials: { heading: string; show?: string };
  // The standard block "Kort" with a heading (design: '' an icon, 'image' a picture, 'text' neither).
  cards: { heading: string; design?: string; items: { icon?: string; image?: string; title: string; text: string; href?: string }[] };
  steps: { heading: string; items: { title: string; text: string }[] };
  // show "categories" (the default): `count` posts (3 when not set, postCount in the standard block
  // Blogindlæg's shared.ts) in any of `categories` (all posts when empty),
  // the newest or (order "random") picked anew on each visit; "picked": the posts in `picked`.
  posts: { heading: string } & PostChoice;
  text: { heading?: string; body: string };
};

/** The category its "Alle indlæg" goes to: the one picked for the link (`link`), else the one its
 * posts are from when they are from exactly one; null for the whole blog, also when that tag is not a
 * blog category (it has no page). */
export const allPostsCategory = (choice: { show?: string; categories?: string[]; link?: string }) => {
  const slug = choice.link || (choice.show !== 'picked' && choice.categories?.length === 1 ? choice.categories[0] : null);
  return slug && isBlogCategory(slug) ? slug : null;
};
/** Where its "Alle indlæg" goes: that category, else the blog. */
export const allPostsLink = (choice: { show?: string; categories?: string[]; link?: string }) => {
  const category = allPostsCategory(choice);
  return category ? `/blog/kategori/${category}/` : '/blog/';
};

export type SectionType = keyof Sections;
export type HomeSection = { [T in SectionType]: { type: T; hidden?: boolean; sectionColor?: string } & Sections[T] }[SectionType];

/** The address of the page that is the front page; its own address sends on to / (packages/editor/worker/index.js). */
export const frontPath = setting.front;

/** The front page: the page, its heading (H1, at the top of its text; `headingHtml` with its colours, when a word in it
 * has one) and its sections shown on the site. */
export type FrontPage = { page: Page; heading: string; headingHtml?: string; sections: HomeSection[] };

export async function frontPage(): Promise<FrontPage> {
  const page = (await getPages({ previews: false })).find((p) => p.data.path === frontPath);
  if (!page) throw new Error(`src/data/standard-pages.json: forsiden, ${frontPath}, findes ikke, eller den er en kladde.`);
  const sections = sectionsFromParts(partsOfMarkdown(page.body ?? ''), frontLeads, { colors: true }) as HomeSection[];
  const h1 = pageH1(page.body);
  return { page, heading: h1.heading || page.data.title, headingHtml: h1.html, sections: sections.filter((s) => !s.hidden) };
}

/** The (shown) section of a type, if the front page has one. */
export const sectionOf = <T extends SectionType>(sections: HomeSection[], type: T) =>
  sections.find((s): s is Extract<HomeSection, { type: T }> => s.type === type);
