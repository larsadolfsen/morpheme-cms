// What the previews of the blocks (src/apps/<app>/blocks/, previews.tsx) show from elsewhere on the site, from the files
// as the editor has them now: the pages (their titles and texts, for the topics and the services),
// the blog posts, the phone, e-mail and address (contact.json), the payment details (payment.json) and
// the texts of the "Book an appointment" box (booking.json), the settings of the apps (src/apps/) and the cookie list.
import type { RepoFile } from '../src/github';
import type { StandardSiteData } from '../src/standard/site';
import { categoryOf } from '../lib/cookieCategories.mjs';
import { readFields, splitFrontmatter } from '../src/frontmatter.mjs';
import { readingMinutes } from '../site/format';
import { stateOf } from '../lib/status.mjs';
import { blockTexts } from '../site/site';
import { config } from '@site/config';

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
  /** The posts on the blog (only published ones, packages/editor/lib/status.mjs), newest first. */
  posts: SitePost[];
  contact: { name: string; role: string; phone: string; email: string; street: string; city: string };
  /** The bank details, and what else the site keeps in payment.json (a site's other ways to pay). */
  payment: { bank: string; reg: string; account: string } & Record<string, string>;
  booking: { heading: string; text: string };
  /** The labels of the buttons "Book an appointment" and "Call …" (booking.json). */
  labels: { book: string; call: string };
  /** The texts every copy of a block has (its shared.ts, saved in blocks.json). */
  blocks: BlockTexts;
  /** The texts of the buttons of "Buttons" that go elsewhere than a page (config.buttonTargets). */
  buttons: StandardSiteData['buttons'];
  /** The tags not shown on the blog ("Blog category" off, packages/editor/site/categories.ts). */
  tagsOffBlog: string[];
  /** The settings of the apps as saved (config.apps.settings), by the app's id; an app's blocks put
   * them over those in its settings.ts. */
  apps: Record<string, Record<string, unknown>>;
  /** The ids of the apps installed (config.apps.installed). */
  installed: string[];
  /** The cookie list ("Cookies", config.cookieList). */
  cookies: StandardSiteData['cookies'];
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
  const payment: Record<string, unknown> = json('src/data/payment.json') ?? {};
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
        imageAlt: (data.imageDecorative !== true && text(data.imageAlt)) || undefined,
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
    payment: {
      ...Object.fromEntries(Object.entries(payment).map(([k, v]) => [k, text(v)])),
      bank: text(payment.bank),
      reg: text(payment.reg),
      account: text(payment.account),
    },
    booking: { heading: text(booking.heading), text: text(booking.text) },
    labels: { book: text(booking.book), call: text(booking.call) },
    tagsOffBlog: files
      .filter((f) => f.path.startsWith('src/data/categories/') && f.path.endsWith('.json') && JSON.parse(f.text).blogCategory === false)
      .map((f) => f.path.slice('src/data/categories/'.length, -'.json'.length)),
    apps: Object.fromEntries(
      files
        .filter((f) => f.path.startsWith(`${config.apps.settings}/`) && f.path.endsWith('.json'))
        .map((f) => [f.path.slice(config.apps.settings.length + 1, -'.json'.length), json(f.path)]),
    ),
    installed: ((json(config.apps.installed).installed ?? []) as unknown[]).map(String),
    cookies: files
      .filter((f) => f.path.startsWith(`${config.cookieList}/`) && f.path.endsWith('.json'))
      .map((f) => json(f.path))
      .map((c) => ({
        name: text(c.name),
        provider: text(c.provider),
        purpose: text(c.purpose) || undefined,
        lasts: text(c.lasts) || undefined,
        category: categoryOf(c),
      })),
    buttons: { booking: { text: text(booking.book) }, phone: { text: text(booking.call), after: text(contact.phone) } },
    // As the file has them now, each text falling back on the site's (a text not in the file yet).
    blocks: Object.fromEntries(
      Object.entries(blockTexts).map(([block, texts]) => [block, { ...texts, ...(json(config.blockTexts)[block] ?? {}) }]),
    ) as BlockTexts,
  };
}
