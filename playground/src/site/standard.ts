// What the editor's standard blocks (packages/editor/src/standard/) take from this site on the site, as
// `@site/standard` (StandardSite in packages/editor/src/standard/site.ts): only their Site.astro and the
// site's own pages that draw the same parts import it, never the editor, so it reads the content
// (astro:content) and uses the site's components.
import type { StandardSite } from 'site-editor/src/standard/site';
import {
  categoryName,
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
} from '@interstellarcms/cms/site/content';
import { allPostsCategory, allPostsLink } from '@data/home';
import { responsive } from '@interstellarcms/cms/site/images.mjs';
import { readingMinutes } from '@interstellarcms/cms/site/format';
import { testimonials, testimonialsPath } from '@data/testimonials';
import { cookieList } from '@interstellarcms/cms/site/cookieList';
import { PREVIEW } from '@interstellarcms/cms/site/noindex.mjs';
import { blockTexts, nav, site } from '@interstellarcms/cms/site/site';
import { popups } from '@interstellarcms/cms/site/popups';

// A post as "Blogindlæg" shows it.
const listedPost = (p: any) => ({
  href: postPath(p),
  title: p.data.title,
  description: p.data.description,
  image: p.data.image,
  imageAlt: p.data.imageDecorative ? undefined : p.data.imageAlt,
  date: p.data.date instanceof Date ? p.data.date.toISOString() : String(p.data.date ?? ''),
  minutes: readingMinutes(p.body ?? ''),
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
  async pageTitle(href) {
    const page = (await byPath()).get(href);
    return page ? page.data.title : nav.flatMap((n) => [n, ...(n.children ?? [])]).find((n) => n.href === href)?.label;
  },
  // "Book en tid" opens the booking sheet (BookingSheet.astro); "Ring" has the number after its text.
  buttons: {
    booking: { href: site.bookingPath, text: site.labels.book, open: 'booking' },
    phone: { href: site.phoneHref, text: site.labels.call, after: site.phone },
  },
  picked(target, value) {
    const promotion = target === 'promotion' ? popups.find((p) => p.slug === value) : undefined;
    if (!promotion) return undefined;
    return { href: `#${value}`, text: promotion.heading, open: `promotion:${value}` };
  },
  cookies: cookieList,
  testimonials: {
    list: testimonials,
    page: testimonialsPath,
    anchor: testimonialId,
    // Only a tag with posts has a page (/blog/kategori/<slug>/).
    async tag(slug) {
      tagPages ??= getCategories().then((all) => new Set(all.map((c) => c.slug)));
      return { name: categoryName(slug), href: (await tagPages).has(slug) ? `/blog/kategori/${slug}/` : undefined };
    },
    // The meditation group has participants, not clients.
    label: (path) => (path === '/selvudvikling/meditationsgruppe/' ? 'Udtalelser fra deltagere' : 'Udtalelser fra klienter'),
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
