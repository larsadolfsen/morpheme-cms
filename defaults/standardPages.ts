// The standard pages: the front page, the blog page, the 404 page, the contact page, the privacy policy and the cookie
// policy, each an ordinary page (src/content/pages/), chosen under "Settings" › "Appearance" › "Default pages"
// (config.standardPages, src/data/standard-pages.json: `{ "front": "<its address>", "blog": …, "notFound": …, "contact": …,
// "privacy": …, "cookies": … }`). The front page is shown at / by the theme's
// templates/Home.astro, each block a section of its own (packages/editor/site/home.ts); the blog page at /blog/ by templates/Blog.astro,
// and the 404 page as the page for an address that does not exist by templates/NotFound.astro (packages/editor/site/standardPages.ts).
// The front page's and the blog page's own addresses send on to where they are shown (packages/editor/worker/index.js); the 404 page's is
// not built (it is not found, so it shows the 404 page). The contact page is shown at its own address; the contact bar's
// "Contact", the footer's "Find us" and Google's contact details (the structured data) go to it. The privacy policy and
// the cookie policy are shown at their own addresses too; the cookie banner's "Read more" goes to the cookie policy (its
// heading about cookies, when it is the privacy policy: cookiesHref in packages/editor/site/standardPages.ts). What of a section of the front page is only text and pictures is
// written as text above its card (its lead, lead.ts in the block's folder, frontLeads.ts; packages/editor/src/sections.mjs): in the editor, when that page is open
// (EntryForm.tsx), and on the site, when it is read into sections. No React here, so the build can use it.
import type { Template } from '../src/schema';

export { frontLeads } from '../src/standard/frontLeads';

/** A standard page: its field in the file (`key`), its name there and in a message ("The front page …") in the site's language,
 * where it is shown (null: nowhere at an address, the 404 page; left out: at its own address), the rules its page has
 * besides a page's (`template`), the block it must have, by its type and name, and the standard page it may be the same
 * page as (`sameAs`, by its key; the others are different pages). */
export type StandardPage = {
  key: string;
  label: string;
  the: string;
  at?: string | null;
  template?: Template;
  needs?: { type: string; label: string };
  sameAs?: string;
};

export const standardPages: StandardPage[] = [
  {
    key: 'front',
    label: 'Front page',
    the: 'The front page',
    at: '/',
  },
  // The posts ("Blog posts"), once.
  {
    key: 'blog',
    label: 'Blog page',
    the: 'The blog page',
    at: '/blog/',
    template: { required: ['posts'], max: { posts: 1 } },
    needs: { type: 'posts', label: 'Blog posts' },
  },
  { key: 'notFound', label: '404 page', the: 'The 404 page', at: null },
  { key: 'contact', label: 'Contact page', the: 'The contact page' },
  { key: 'privacy', label: 'Privacy policy', the: 'The privacy policy' },
  // The cookies may be a part of the privacy policy.
  { key: 'cookies', label: 'Cookie policy', the: 'The cookie policy', sameAs: 'privacy' },
];

/** Whether the standard pages chosen (their addresses, by key) are different pages, as they must be, but for one that may
 * be the same page as another (`sameAs`). */
export function differentPages(paths: Record<string, string>): boolean {
  const own = standardPages.filter((p) => paths[p.key] && !(p.sameAs && paths[p.key] === paths[p.sameAs])).map((p) => paths[p.key]);
  return new Set(own).size === own.length;
}

/** The addresses of the pages that are the standard pages, by their key, from the file of the setting. */
export function standardPaths(text: string | undefined): Record<string, string> {
  try {
    const all = JSON.parse(text ?? '{}') as Record<string, unknown>;
    return Object.fromEntries(standardPages.flatMap((p) => (all[p.key] ? [[p.key, String(all[p.key])]] : [])));
  } catch {
    return {};
  }
}
