// What "Parts" (#developer/parts: Parts.tsx, BlockParts.tsx) shows the parts and blocks with: made-up pages, posts, tags,
// testimonials, the lists' made-up rows (`examples` of a list), cookies and contact details in the editor's language,
// the apps' made-up settings (AppSettings.example), and a plain picture, never what the site has, so the parts look the
// same on every site.
import { categoryOf } from '../lib/cookieCategories.mjs';
import type { BlockData } from './blocks';
import { siteOf } from '@site/editor';
import { t } from './i18n';
import { apps, listExamples } from './site';
import { withDefaults } from './check';
import type { FolderCollection } from './schema';

/** A plain picture: a sun over two hills, in soft grey. */
export const examplePicture = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#e6e3df"/><circle cx="470" cy="120" r="48" fill="#cfc9c2"/><path d="M0 330 170 190l140 120 90-70 240 160H0z" fill="#b9b2aa"/></svg>',
)}`;

const slug = (s: string) =>
  s
    .toLocaleLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** The made-up site: what the blocks and fields take from the site (BlockData), and the options to pick from. */
export function exampleData(): BlockData {
  const e = t.parts.examples;
  const pages = e.pages.map((title) => ({ path: `/${slug(title)}/`, title, body: '' }));
  const tags = e.tags.map((name) => ({ value: slug(name), label: name }));
  const posts = e.posts.map((title, i) => ({
    slug: slug(title),
    title,
    date: new Date(2026, 9, 20 - i * 7),
    image: examplePicture,
    description: e.text,
    categories: [tags[i % tags.length].value],
    minutes: 3 + i,
  }));
  const testimonials = e.testimonials.map((x, i) => ({
    slug: slug(x.name),
    name: x.name,
    // The first with a picture, the others with the theme's mark.
    image: i === 0 ? examplePicture : undefined,
    context: x.context,
    quote: x.quote,
    categories: [tags[i % tags.length].value],
    frontPage: true,
  }));
  const site = {
    ...siteOf([]),
    pages,
    posts,
    contact: e.contact,
    payment: e.payment,
    booking: e.booking,
    labels: e.labels,
    buttons: { booking: { text: e.labels.book }, phone: { text: e.labels.call, after: e.contact.phone } },
    cookies: e.cookies.map((c) => ({ ...c, category: categoryOf(c) })),
    apps: Object.fromEntries(apps.flatMap((a) => (a.settings ? [[a.id, { ...a.settings.values, ...a.settings.example }]] : []))),
  };
  return {
    lists: listExamples,
    testimonials,
    relations: {
      pages: pages.map((p) => ({ value: p.path, label: p.title })),
      fixed: [],
      blog: posts.map((p) => ({ value: p.slug, label: p.title })),
      categories: tags,
      testimonials: testimonials.map((x) => ({ value: x.slug, label: x.name })),
      promotions: [],
    },
    site,
  };
}

/** An entry of a kind of a list of kinds (a pop-up, Mailchimp's) as an example: a new one of the kind, with the
 * defaults of the fields it has, the made-up name, heading and text, and the plain picture. "Parts" draws each kind
 * with it, and "Blokindstillinger" an app's kind no entry is made with. */
export function kindExample(list: FolderCollection, kind: string): Record<string, unknown> {
  const name = list.kinds!;
  const fields = list.fields.filter((f) => f.only?.field !== name || f.only.is.includes(kind));
  return withDefaults(fields, { ...t.parts.examples.entry, image: examplePicture, [name]: kind });
}
