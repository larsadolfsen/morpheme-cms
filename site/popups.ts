// The site's promotions: one JSON file per promotion in src/data/popups/, edited in the editor (/editor/,
// "Indhold" › "Promovering"), of a kind: the pop-up, or one an app adds (Mailchimp's pop-up, the bar at
// the bottom of a phone's screen). Each is shown on every page (`where`: "all") or on those picked for
// it (`pages`, their addresses), or on the blog posts with one of its tags and those tags' pages (`where`:
// "tags", `tags`). A pop-up opens `delay` seconds after the page opens, `scroll` % down it
// or as the visitor is about to leave it (`trigger`), until the visitor closes it
// (packages/editor/theme/components/Popup.astro); a kind an app adds without a part in the pop-up shows itself
// (its slots/), with its own fields in `data`.
import { getPosts, postPath } from './content';

type PopupData = {
  enabled?: boolean;
  /** Its kind: the standard one, or an app's (its id, e.g. "mailchimp": src/apps/<app>/popups/). */
  type?: string;
  /** On every page ("all"), on those in `pages` ("some", and without one), or on the blog posts with one
   * of `tags` and the tags' pages ("tags"). */
  where?: 'all' | 'some' | 'tags';
  /** The picture at the top (its address on the site). */
  image?: string;
  heading?: string;
  /** Paragraphs separated by a blank line. */
  text?: string;
  pages?: string[];
  /** The tags (their slugs) whose blog posts and pages it is on. */
  tags?: string[];
  /** When it opens: after `delay`, at `scroll`, or as the visitor is about to leave (without one, the time). */
  trigger?: 'time' | 'scroll' | 'exit';
  /** Seconds, as the editor's select writes them ("0", "5" …). */
  delay?: string;
  /** How far down the page, in % ("25" … "100"). */
  scroll?: string;
  /** Where its button goes: the booking sheet, the phone, a page (`href`), a PDF to download (`file`,
   * /filer/<name>.pdf), or no button. */
  button?: 'booking' | 'phone' | 'page' | 'file' | 'none';
  /** The button's own text; empty, the target's or the page's name ("Download PDF" for a PDF). */
  label?: string;
  href?: string;
  file?: string;
};

export type Popup = {
  /** The file name, e.g. "rabat-i-december": what the visitor's browser remembers it was closed by. */
  slug: string;
  /** "standard", or the id of the app whose kind it is (Popup.astro shows its part under the text). */
  type: string;
  image?: string;
  heading: string;
  /** One string per paragraph. */
  text: string[];
  /** On every page, or only on `pages` and the posts and pages of `tags`. */
  everywhere: boolean;
  pages: string[];
  tags: string[];
  trigger: 'time' | 'scroll' | 'exit';
  delay: number;
  scroll: number;
  button?: { to: 'booking' | 'phone' | 'page' | 'file'; label?: string; href?: string };
  /** The file as saved: the fields of an app's kind (the bar's button texts). */
  data: Record<string, unknown>;
};

const files = import.meta.glob<PopupData>('@data/popups/*.json', { eager: true, import: 'default' });

export const popups: Popup[] = Object.entries(files)
  .filter(([, p]) => p.enabled !== false)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([file, p]) => ({
    slug: file.replace(/^.*\/|\.json$/g, ''),
    type: p.type || 'standard',
    image: p.image || undefined,
    heading: p.heading ?? '',
    text: (p.text ?? '')
      .split(/\n\s*\n/)
      .map((t) => t.trim())
      .filter(Boolean),
    everywhere: p.where === 'all',
    pages: p.where === 'tags' ? [] : (p.pages ?? []),
    tags: p.where === 'tags' ? (p.tags ?? []) : [],
    trigger: p.trigger === 'scroll' || p.trigger === 'exit' ? p.trigger : 'time',
    delay: Number(p.delay) || 0,
    scroll: Number(p.scroll) || 25,
    button: !p.button || p.button === 'none' ? undefined : { to: p.button, label: p.label, href: p.button === 'file' ? p.file : p.href },
    data: p as Record<string, unknown>,
  }));

/** The promotions of a page, by its address (with or without the / at the end): those on every page,
 * those picked for it, and, on a blog post or a tag's page (/blog/kategori/<tag>/), those of its tags. */
export async function popupsAt(path: string) {
  const at = path.endsWith('/') ? path : `${path}/`;
  const tag = at.match(/^\/blog\/kategori\/([^/]+)\/$/)?.[1];
  const post = !tag && popups.some((p) => p.tags.length) ? (await getPosts({ unlisted: true })).find((p) => postPath(p) === at) : undefined;
  const tags = tag ? [tag] : (post?.data.categories ?? []);
  return popups.filter((p) => p.everywhere || p.pages.includes(at) || p.tags.some((t) => tags.includes(t)));
}
