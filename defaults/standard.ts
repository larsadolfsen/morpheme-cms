// What the editor's standard blocks (packages/editor/src/standard/) take from the site on the site, as
// `@site/standard` (StandardSite in packages/editor/src/standard/site.ts): only their load.ts and the
// site's own pages that draw the same parts import it, never the editor, so it reads the content
// (astro:content) and uses the site's components.
import type { ListedPost, StandardSite } from '../src/standard/site';
import {
  categoryName,
  displayTitle,
  getCategories,
  getPages,
  getPosts,
  openingText,
  pageHeading,
  postPath,
  postsFor,
  testimonialId,
  type Page,
  type Post,
} from '../site/content';
import { allPostsCategory, allPostsLink } from '../site/home';
import { responsive } from '../site/images.mjs';
import { readingMinutes } from '../site/format';
import { testimonials, testimonialsPath } from '../site/testimonials';
import { cookieList } from '../site/cookieList';
import { PREVIEW } from '../site/noindex.mjs';
import { blockTexts, nav, site } from '../site/site';
import { popups } from '../site/popups';
import { opensOf } from '@site/opens';

// A post as "Blog posts" shows it.
const listedPost = (p: Post): ListedPost => ({
  href: postPath(p),
  title: p.data.title,
  description: p.data.description,
  image: p.data.image,
  imageAlt: p.data.imageDecorative ? undefined : p.data.imageAlt,
  date: p.data.date.toISOString(),
  minutes: readingMinutes(p.body),
});

let pages: Promise<Map<string, Page>> | undefined;
let tagPages: Promise<Set<string>> | undefined;
const byPath = () => (pages ??= getPages().then((all) => new Map(all.map((p) => [p.data.path, p]))));

export const standard: StandardSite = {
  texts: blockTexts,
  // A new version of a page (/ny/…) shows the openings of the new versions of the pages it links to.
  async pageOpening(href, preview) {
    const all = await byPath();
    const page = all.get(href);
    if (!page) return undefined;
    return openingText(((preview && all.get(PREVIEW + href.slice(1))) || page).body);
  },
  // Its heading; a page built in code (such as /kontakt/) by its name in the menu.
  async pageName(href) {
    const page = (await byPath()).get(href);
    return page ? pageHeading(page) : (nav.flatMap((n) => [n, ...(n.children ?? [])]).find((n) => n.href === href)?.label ?? href);
  },
  // Its title, as in the menu and the lists of pages; a page built in code by its name in the menu.
  async pageTitle(href) {
    const page = (await byPath()).get(href);
    return page ? displayTitle(page.data.title) : nav.flatMap((n) => [n, ...(n.children ?? [])]).find((n) => n.href === href)?.label;
  },
  // "Book an appointment" opens the booking sheet on the page (`data-open="booking"`, the app Calendly's), and
  // goes to the booking page without one there; "Call" has the number after its text.
  buttons: {
    booking: { href: site.bookingPath, text: site.labels.book, open: 'booking' },
    phone: { href: site.phoneHref, text: site.labels.call, after: site.phone },
  },
  // "Open promotion": a promotion turned on that a button can open (opens.ts). One that stands for a target does
  // what it does (the booking sheet: "Book an appointment"); a pop-up opens itself (`data-open="promotion:<file name>"`,
  // Popup.astro), with its heading as the text.
  picked(target, value) {
    const promotion = target === 'promotion' ? popups.find((p) => p.slug === value) : undefined;
    const opens = promotion && opensOf(promotion.type);
    if (!opens) return undefined;
    if (opens.as) return this.buttons[opens.as];
    return { href: `#${value}`, text: promotion.heading, open: `promotion:${value}` };
  },
  cookies: cookieList,
  testimonials: {
    list: testimonials,
    page: testimonialsPath,
    anchor: testimonialId,
    // Only a tag with posts has a page (/blog/tags/<slug>/).
    async tag(slug) {
      tagPages ??= getCategories().then((all) => new Set(all.map((c) => c.slug)));
      return {
        name: categoryName(slug),
        href: (await tagPages).has(slug) ? `/blog/tags/${slug}/` : undefined,
      };
    },
  },
  posts: {
    async choose(choice, count) {
      const { posts, random } = await postsFor(choice as Parameters<typeof postsFor>[0], count);
      return { posts: posts.map(listedPost), random };
    },
    async list(categories) {
      return (await getPosts()).filter((p) => !categories.length || p.data.categories.some((c) => categories.includes(c))).map(listedPost);
    },
    // A tag's page when the posts are from one blog tag (or one is picked for the link), else the blog.
    all(choice) {
      const tag = allPostsCategory(choice);
      return { href: allPostsLink(choice), tag: tag ? categoryName(tag) : undefined };
    },
    image: responsive,
  },
};
