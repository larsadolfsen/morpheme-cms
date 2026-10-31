// What the previews of the blocks (src/blocks/, previews.tsx) show from elsewhere on the site, from the files
// as the editor has them now: the pages (their titles and texts, for the topics and the services),
// the blog posts, the phone, e-mail and address (contact.json), the payment details (prices.json) and
// the texts of the "Book en tid" box (booking.json).
import type { RepoFile } from 'site-editor/src/github';
import type { StandardSiteData } from 'site-editor/src/standard/site';
import { readFields, splitFrontmatter } from 'site-editor/src/frontmatter.mjs';
import { readingMinutes } from '@interstellarcms/cms/site/format';
import { stateOf } from '@interstellarcms/cms/lib/status.mjs';
import { blockTexts } from '../data/site';
import { config } from './config';

export type SitePage = { path: string; title: string; body: string };
export type SitePost = {
  slug: string;
  title: string;
  date: Date;
  image?: string;
  imageAlt?: string;
  description?: string;
  categories: string[];
  minutes: number;
};
export type SiteData = {
  pages: SitePage[];
  /** The posts on the blog (only published ones, src/lib/status.mjs), newest first. */
  posts: SitePost[];
  contact: { name: string; role: string; phone: string; email: string; street: string; city: string };
  payment: { mobilePay: string; bank: string; reg: string; account: string };
  booking: { heading: string; text: string };
  /** The labels of the buttons "Book en tid" and "Ring …" (booking.json). */
  labels: { book: string; call: string };
  /** The texts every copy of a block has (its shared.ts, saved in blocks.json). */
  blocks: BlockTexts;
  /** The texts of the buttons of "Knapper" that go elsewhere than a page (config.buttonTargets). */
  buttons: StandardSiteData['buttons'];
  /** The tags not shown on the blog ("Blogkategori" off, src/data/categories.ts). */
  tagsOffBlog: string[];
};

export type BlockTexts = typeof blockTexts;

const text = (v: unknown) => (v == null ? '' : String(v));

export function siteOf(files: RepoFile[]): SiteData {
  const md = (folder: string) =>
    files
      .filter((f) => f.path.startsWith(`${folder}/`) && f.path.endsWith('.md'))
      .map((f) => {
        const { yaml, body } = splitFrontmatter(f.text);
        return { file: f.path.slice(folder.length + 1, -3), data: readFields(yaml) as Record<string, unknown>, body };
      });
  const json = (path: string) => {
    const file = files.find((f) => f.path === path);
    return (file ? JSON.parse(file.text) : {}) as Record<string, any>;
  };
  const contact = json('src/data/contact.json');
  const payment = json('src/data/prices.json').payment ?? {};
  const booking = json('src/data/booking.json');
  return {
    pages: md('src/content/pages').map(({ file, data, body }) => ({
      path: text(data.path) || `/${file.replace(/\/index$/, '')}/`,
      title: text(data.title),
      body,
    })),
    posts: md('src/content/blog')
      .filter(({ data }) => stateOf(data) === 'published')
      .map(({ file, data, body }) => ({
        slug: file,
        title: text(data.title),
        date: new Date(text(data.date)),
        image: text(data.image) || undefined,
        imageAlt: text(data.imageAlt) || undefined,
        description: text(data.description) || undefined,
        categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
        minutes: readingMinutes(body),
      }))
      .sort((a, b) => b.date.valueOf() - a.date.valueOf()),
    contact: {
      name: text(contact.name),
      role: text(contact.role),
      phone: text(contact.phone),
      email: text(contact.email),
      street: text(contact.street),
      city: text(contact.city),
    },
    payment: { mobilePay: text(payment.mobilePay), bank: text(payment.bank), reg: text(payment.reg), account: text(payment.account) },
    booking: { heading: text(booking.heading), text: text(booking.text) },
    labels: { book: text(booking.book), call: text(booking.call) },
    tagsOffBlog: files
      .filter((f) => f.path.startsWith('src/data/categories/') && f.path.endsWith('.json') && JSON.parse(f.text).blogCategory === false)
      .map((f) => f.path.slice('src/data/categories/'.length, -'.json'.length)),
    buttons: { booking: { text: text(booking.book) }, phone: { text: text(booking.call), after: text(contact.phone) } },
    // As the file has them now, each text falling back on the site's (a text not in the file yet).
    blocks: Object.fromEntries(
      Object.entries(blockTexts).map(([block, texts]) => [block, { ...texts, ...(json(config.blockTexts)[block] ?? {}) }]),
    ) as BlockTexts,
  };
}

