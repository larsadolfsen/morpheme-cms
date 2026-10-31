// What the standard blocks take from a site, where they need more than their own fields and shared
// texts. On the site: the site's `@site/standard` (packages/editor/defaults/standard.ts, StandardSite); only the blocks'
// load.ts (and the site's own pages that draw the same parts) import it, never the editor, so it
// may read the site's content (astro:content) and use its components. In the editor: the site's data
// (BlockData.site, from the site's siteOf), which has StandardSiteData too. And in the site's config
// (@site/config): where the buttons can go (`buttonTargets`).
import type { CookieCategory } from '../../lib/cookieCategories.mjs';

/** Where a button of "Knapper" can go besides a page, as the site's config names it (its label in the
 * site's language, e.g. "Book en tid"), and what to know about it in the hint of a button's text. `pick`: it
 * opens something picked among those shown on the page (a relation with Option.on, e.g. "Åbn promovering"), in a
 * field named `pickLabel` (the button's `open`). */
export type ButtonTargetName = { value: string; label: string; note?: string; pick?: string; pickLabel?: string };

/** A button's text for where it goes, when it has none of its own (e.g. "Ring"), and what comes after
 * every text (e.g. the phone number). `open`: what the button opens on the page instead of going to its address
 * (its `data-open`, which a promotion on the page answers: "booking" the booking sheet, "promotion:<file name>" a
 * pop-up); without one there, the address is an ordinary link. */
export type ButtonText = { text: string; after?: string; open?: string };

/** Which posts a "Blogindlæg" block shows (its fields): those with any of `categories` (all when empty), with `show`
 * "all" all of them, else the newest `count` ('3' to '6') or with `order` "random" picked anew on each visit, or with
 * `show` "picked" those picked; and the tag "Alle indlæg" goes to (`link`). */
export type PostChoice = {
  show?: string;
  categories?: string[];
  count?: string;
  order?: string;
  picked?: string[];
  link?: string;
};

/** A blog post as "Blogindlæg" shows it: its address, title, description, picture (its file), date (ISO)
 * and reading time in minutes. */
export type ListedPost = {
  href: string;
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  date: string;
  minutes: number;
};

/** What the editor's drawings of the standard blocks take from the site's data (BlockData.site). */
export type StandardSiteData = {
  pages: { path: string; title: string }[];
  /** The posts on the blog, newest first, by file name, with what "Blogindlæg" shows of them (reading time in minutes). */
  posts: {
    slug: string;
    title: string;
    image?: string;
    imageAlt?: string;
    description?: string;
    date: Date;
    minutes: number;
    categories: string[];
  }[];
  /** The tags that are not on the blog (no page of their own): "Alle indlæg" does not go to them. */
  tagsOffBlog: string[];
  /** The texts of the buttons that go elsewhere than a page, by `buttonTargets` value. */
  buttons: Record<string, ButtonText>;
  /** The cookie list ("Cookies", standard/cookies/list.ts), as the files are now. */
  cookies: CookieItem[];
};

/** A cookie in the site's cookie list (cookieList.ts): its name (`*` for the rest of it), who sets it, what for, how
 * long it lasts and its category (necessary, or one the visitor says yes to in the cookie banner,
 * lib/cookieCategories.mjs). */
export type CookieItem = { name: string; provider: string; purpose?: string; lasts?: string; category: CookieCategory };

/** A testimonial as the site has it (its file name, its picture, the quote's paragraphs, its tags). */
export type TestimonialItem = {
  slug: string;
  name: string;
  /** Its picture (optional), by the name. */
  image?: string;
  context?: string;
  quote: string[];
  categories: string[];
  frontPage: boolean;
};

export type StandardSite = {
  /** The blocks' shared texts (shared.ts, with those saved over them), by type: for a block that shows another's
   * (Banner: the shared buttons, "Læs mere"). */
  texts: Record<string, Record<string, any>>;
  /** The opening of a page's text, by its address (Accordion: a row without a text of its own);
   * undefined when there is no such page. `preview`: the page is a new version (/ny/), so the opening
   * of the new version of the page, when there is one. */
  pageOpening(href: string, preview?: boolean): Promise<string | undefined>;
  /** A page's name on a button without a text of its own, by its address. */
  pageName(href: string): Promise<string>;
  /** A page's title, its name in a list of pages ("Links"), by its address; undefined when there is no such page. */
  pageTitle(href: string): Promise<string | undefined>;
  /** The buttons that go elsewhere than a page, by `buttonTargets` value: their address and text. */
  buttons: Record<string, ButtonText & { href: string }>;
  /** A button of a target that picks something (ButtonTargetName.pick): what it opens, by what is picked (a
   * promotion's file name), with its address without JavaScript and its text; undefined when there is no such. */
  picked(target: string, value: string): (ButtonText & { href: string }) | undefined;
  /** The cookie list ("Cookies"), for "Cookieliste". */
  cookies: CookieItem[];
  testimonials: {
    /** All of them, in their order. */
    list: TestimonialItem[];
    /** The page with all of them in full, and the anchor of one there (a short one links to it). */
    page: string;
    anchor(t: TestimonialItem): string;
    /** A tag's name, and its page when it has one. */
    tag(slug: string): Promise<{ name: string; href?: string }>;
  };
  posts: {
    /** The posts a choice shows, and whether they are picked at random on the page (then all it picks
     * from are there, and the page shows `count` of them). */
    choose(choice: PostChoice, count: number): Promise<{ posts: ListedPost[]; random: boolean }>;
    /** The posts on the blog with any of `categories` (all when empty), newest first. */
    list(categories: string[]): Promise<ListedPost[]>;
    /** Where its "Alle indlæg" goes: a tag's page, with the tag's name, or the blog. */
    all(choice: PostChoice): { href: string; tag?: string };
    /** A picture's sizes, for the browser to pick the one that fits (srcset, width and height). Also
     * the pictures on "Kort" (LinkCards.tsx). */
    image(src: string): { srcset?: string; width?: number; height?: number };
  };
};
