// The front page (src/pages/index.astro): its sections in order, from src/data/home.json,
// which is edited in the editor (/editor/, "Sider" > "Faste sider" > "Forsiden").
// Each section has a `type` that says how it looks.
// Keep in step with the `home` fields in src/site/collections.ts.
import data from './home.json';
import type { PostChoice } from '@interstellarcms/cms/site/content';
import { isBlogCategory } from './categories';

type Link = { label: string; href: string };
type Card = { title: string; text: string; more: string };

type Sections = {
  // text: Markdown, the subtitle and the introduction as paragraphs, under the page's heading (Hero.astro).
  hero: { text: string; image?: string; imageAlt?: string; reassurance: string; quoteFrom?: string };
  topics: { heading: string; intro: string; items: (Link & { more?: Link[] })[] };
  testimonials: { heading: string };
  about: { heading: string; paragraphs: string[]; credentialsHeading: string; credentials: { text: string; icon: string }[] };
  ways: { heading: string; therapy: Card; couples: Card; online: Card };
  book: { image?: string; imageAlt?: string; intro: string; title: string; quote: string; quoteSource: string };
  steps: { heading: string; items: { title: string; text: string }[] };
  prices: { heading: string; notes?: string[] };
  posts: { heading: string } & PostChoice;
  where: { image?: string; imageAlt?: string; heading: string; note: string };
  text: { heading?: string; body: string };
};

export const allPostsCategory = (choice: { show?: string; categories?: string[]; link?: string }) => {
  const slug = choice.link || (choice.show !== 'picked' && choice.categories?.length === 1 ? choice.categories[0] : null);
  return slug && isBlogCategory(slug) ? slug : null;
};

export const allPostsLink = (choice: { show?: string; categories?: string[]; link?: string }) => {
  const category = allPostsCategory(choice);
  return category ? `/blog/kategori/${category}/` : '/blog/';
};

export type SectionType = keyof Sections;
export type HomeSection = { [T in SectionType]: { type: T; hidden?: boolean } & Sections[T] }[SectionType];

type Home = { heading: string; sections: HomeSection[]; seoTitle?: string; seoDescription?: string };
const home = data as Home;

export const homeSections = (home.sections ?? []).filter((s) => !s.hidden);
