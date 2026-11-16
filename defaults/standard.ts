// What the editor's standard blocks (packages/editor/src/standard/) take from the site on the site, as
// `@site/standard` (StandardSite in packages/editor/src/standard/site.ts): only their load.ts and the
// site's own pages that draw the same parts import it, never the editor, so it reads the content
// (astro:content) and uses the site's components.
import type { ListedPost, SourceItem, StandardSite } from '../src/standard/site';
import { libraryAltPart } from '../src/imageAlt.mjs';
import { itemOfEntry } from '../src/standard/rows/rows.mjs';
import { setListReader } from '../lib/lists.mjs';
import { coreListOf } from '../lib/coreLists.mjs';
import { asRowsOf, isEntryPath, parseDefinition } from '../lib/ownList.mjs';
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
import { altFor, libraryAlt, libraryImages, responsive } from '../site/images.mjs';
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
  imageAlt: p.data.image ? altFor(p.data.image, { alt: p.data.imageAlt, decorative: p.data.imageDecorative }).alt || undefined : undefined,
  date: p.data.date.toISOString(),
  minutes: readingMinutes(p.body),
});

let pages: Promise<Map<string, Page>> | undefined;
let tagPages: Promise<Set<string>> | undefined;
const byPath = () => (pages ??= getPages().then((all) => new Map(all.map((p) => [p.data.path, p]))));

// The lists the apps bring, by id, with the folder their entries are in and which of their fields fill a row (`asRows`, as app.json says it for a list in
// code); a contract 6 list is data (`fields` with kinds, lib/appLists.mjs): its id is `<app id>.<id>`, its entries are in `src/data/<app id>.<id>/`, and
// `page` says where `Show all` goes (a path, or `settings:<field>` for an address in the app's settings).
type AsRows = { title: string; text?: string; icon?: string; href?: string; tags?: string };
type ManifestList = {
  id: string;
  folder?: string;
  asRows?: AsRows;
  fields?: { id: string; kind: string }[];
  dropped?: string[];
  page?: string;
};
type ManifestOfApp = { api?: number; lists?: ManifestList[]; settings?: { values?: Record<string, unknown> } };
const appManifests = import.meta.glob<ManifestOfApp>('/src/apps/*/app.json', { eager: true, import: 'default' });
const rowLists = new Map<string, { folder: string; asRows: AsRows; page?: string; app?: string; settings?: Record<string, unknown> }>(
  Object.entries(appManifests).flatMap(([file, manifest]) =>
    (manifest.lists ?? []).flatMap((l) => {
      if (manifest.api === 6 && l.fields) {
        const app = file.split('/').at(-2)!;
        const id = `${app}.${l.id}`;
        return [
          [
            id,
            {
              folder: id,
              asRows: asRowsOf({ fields: l.fields as never, dropped: l.dropped }),
              page: l.page,
              app,
              settings: manifest.settings?.values,
            },
          ] as const,
        ];
      }
      return l.asRows && l.folder ? [[l.id, { folder: l.folder, asRows: l.asRows }] as const] : [];
    }),
  ),
);
const dataFiles = import.meta.glob<Record<string, unknown>>('@data/*/*.json', { import: 'default' });
// The lists the owner made: their definitions, `@data/<id>/_list.json`, as text (lib/ownList.mjs).
const ownDefinitions = import.meta.glob<string>('@data/*/_list.json', { query: '?raw', import: 'default' });

/** The address an app's list sends `Show all` to when it names a setting of the app: the owner's value (`src/data/apps/<app>.json`) over the app's own. */
const settingPage = async (
  app: string | undefined,
  values: Record<string, unknown> | undefined,
  field: string,
): Promise<string | undefined> => {
  const file = Object.keys(dataFiles).find((f) => f.endsWith(`/apps/${app}.json`));
  const saved = file ? await dataFiles[file]() : {};
  const value = saved[field] ?? values?.[field];
  return typeof value === 'string' && value.startsWith('/') ? value : undefined;
};

/** The entries of the core's lists (lib/coreLists.mjs) as the site has them, with the fields the declaration gives, and where `Show all` goes. */
const coreEntries: Record<string, () => Promise<{ entries: Record<string, unknown>[]; page: string }>> = {
  posts: async () => ({
    entries: (await getPosts()).map((p) => ({ ...listedPost(p), categories: p.data.categories })),
    page: standard.posts.all({}).href,
  }),
  testimonials: async () => ({
    entries: testimonials.map((t) => ({
      name: t.name,
      quote: t.quote[0],
      image: t.image,
      href: `${testimonialsPath}#${testimonialId(t)}`,
      categories: t.categories,
    })),
    page: testimonialsPath,
  }),
};

export const standard: StandardSite = {
  texts: blockTexts,
  // The items a list block reads: the blog's posts (their tags), the testimonials (the quote's first paragraph), or the entries of an app's
  // list that says its fields (`asRows`), in their order.
  async source(id): Promise<{ items: SourceItem[]; page?: string; missing?: boolean }> {
    // A list the core declares (lib/coreLists.mjs: the blog's posts, the testimonials): entries with its fields, then read like any list.
    const core = coreListOf(id);
    if (core) {
      const { entries, page } = await coreEntries[core.id]();
      return { items: entries.map((e) => itemOfEntry(e, core.asRows) as SourceItem), page };
    }
    // An app's list, else a list the owner made (its fields from its definition); no such list gives no items.
    let list = rowLists.get(id);
    if (!list) {
      const file = Object.keys(ownDefinitions).find((f) => f.split('/').slice(-2)[0] === id);
      const { definition } = file ? parseDefinition(await ownDefinitions[file]()) : {};
      if (!definition) return { items: [], missing: true };
      list = { folder: id, asRows: asRowsOf(definition) };
    }
    const folder = list.folder.split('/').pop();
    const entries = await Promise.all(
      Object.entries(dataFiles)
        .filter(([file]) => isEntryPath(file) && file.split('/').slice(-2)[0] === folder)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(async ([, load]) => load()),
    );
    entries.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    const page = list.page?.startsWith('settings:')
      ? await settingPage(list.app, list.settings, list.page.slice('settings:'.length))
      : list.page;
    return { items: entries.map((e) => itemOfEntry(e, list.asRows) as SourceItem), ...(page ? { page } : {}) };
  },
  // A new version of a page (/new/…) shows the openings of the new versions of the pages it links to.
  async pageOpening(href, preview) {
    const all = await byPath();
    const page = all.get(href);
    if (!page) return undefined;
    return openingText(((preview && all.get(PREVIEW + href.slice(1))) || page).body);
  },
  // Its heading; a page built in code (such as /contact/) by its name in the menu.
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
  images: {
    list: () => libraryImages(),
    tag: async (slug) => categoryName(slug),
  },
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
    // The sizes, and the text the Library has for it ("" when it is decorative there): a use with a text of its own puts that over it.
    image: (src) => {
      return { ...responsive(src), ...libraryAltPart(libraryAlt(src)) };
    },
  },
};

// The framework's reader (lib/lists.mjs readList) fetches entries through this.
setListReader((id) => standard.source(id));
