// Name, title, phone, email, address and CVR number: contact.json; the texts of "Book en tid": booking.json (the calendar
// is the app Calendly's, src/apps/calendly/); the menus: menu.json and mobile-menu.json; the shared texts of the other blocks: their shared.ts, with those saved in
// blocks.json over them (`blockTexts`).
// The site's owner edits them in the editor (/editor/); what the editor does not edit is the site's config
// (src/site/config.ts).
import contact from '@data/contact.json';
import booking from '@data/booking.json';
import menu from '@data/menu.json';
import mobileMenu from '@data/mobile-menu.json';
import blocks from '@data/blocks.json';
import standardPages from '@data/standard-pages.json';
import { config } from '@site/config';
import { sharedTexts, type SharedTexts } from '@morpheme/cms/src/shared';
import { standardShared } from '@morpheme/cms/src/standard/sharedTexts';

// The number with its country code: +45 when it has none (a number in Denmark, saved without it), else
// its own ("+46 70 12 34 56", picked in the editor).
const phoneIntl = `${contact.phone.trim().startsWith('+') ? '+' : '+45'}${contact.phone.replace(/\D/g, '')}`;
// The CVR number, when it is filled in ("Virksomheden" › "Kontakt").
const { cvr = '' } = contact as typeof contact & { cvr?: string };

export const site = {
  name: contact.name,
  role: contact.role,
  /** The site's own address, https://<domain> (config.ts). */
  url: `https://${config.domain}`,
  /** The site's language (config.ts, BCP 47: "da-DK"). */
  locale: config.locale,
  description: config.siteDescription,
  phone: contact.phone,
  phoneHref: `tel:${phoneIntl}`,
  /** For structured data: the country code and the digits. */
  phoneIntl,
  email: contact.email,
  address: { street: contact.street, city: contact.city },
  /** The CVR number, or empty: at the bottom of every page (the theme's Footer.astro) and in the structured data. */
  cvr,
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${`${contact.street}, ${contact.city}`.replace(/ /g, '+')}`,
  bookingPath: config.booking.path,
  /** The pages a booking or an order ends on (config.ts): no action bar there. */
  thanks: config.booking.thanks,
  /** The page about the owner, or '' (config.ts). */
  aboutPath: config.aboutPath,
  /** The block after every blog post, by its type, or '' (config.ts). */
  postEnd: config.postEnd,
  /** The page chosen as the contact page ("Indstillinger" › "Udseende" › "Standardsider", standard-pages.json). */
  contactPath: standardPages.contact,
  /** The shared texts of "Book en tid" (an app's booking block). */
  booking: { heading: booking.heading, text: booking.text },
  /** The labels of the buttons "Book en tid" and "Ring" (the number comes after). */
  labels: { book: booking.book, call: booking.call },
  /** The owner's picture (config.ts), or '' when the site has none. */
  portrait: config.picture?.src ?? '',
  portraitAlt: config.picture?.alt ?? '',
};

// Primary navigation (menu.json, "Hovedmenu"). Labels, URLs and sub-items started out as the old site's menu.
export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };
export const nav: NavItem[] = menu.items;
/** Whether the header has the menu and its button ("Aktiveret" under "Hovedmenu"). */
export const navShown = menu.enabled !== false;
/** The links in the bar under the header on a phone (mobile-menu.json, "Mobilmenu"); none when it is turned off. */
export const mobileNav: { label: string; href: string }[] = mobileMenu.enabled ? mobileMenu.items : [];
// Sub-items in alphabetical order (Danish: æ, ø, å last), in both the desktop and the mobile menu.
for (const item of nav) item.children?.sort((a, b) => a.label.localeCompare(b.label, 'da'));

/** The texts every copy of a block has ("Blokke" in the editor), with {…} for what differs, by
 * the block's type: those written in its shared.ts, with the saved ones (blocks.json) over them. The
 * standard blocks' first, so an app's block (src/apps/<app>/blocks/) by the same name has its own. */
export const blockTexts = sharedTexts(
  {
    ...standardShared,
    ...import.meta.glob<SharedTexts>('/src/apps/*/blocks/*/shared.ts', { eager: true, import: 'default' }),
  },
  blocks,
);
