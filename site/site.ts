// Name, title, phone, email, address and CVR number: contact.json; the profiles and share buttons: social.json (optional, an
// older site has none); the texts of "Book an appointment": booking.json (the calendar is the app Calendly's, morpheme-apps/apps/calendly/);
// the menus: menu.json and mobile-menu.json; the shared texts of the other blocks: their shared.ts, with those saved in
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
import { settings } from './settings';
import { socialOf } from './social.mjs';
import { headerOf, sortedNav } from './header.mjs';
import { sharedTexts, type SharedTexts } from '@morphemecms/cms/src/shared';
import { standardShared } from '@morphemecms/cms/src/standard/sharedTexts';

// The number with its country code: +45 when it has none (a number in Denmark, saved without it), else
// its own ("+46 70 12 34 56", picked in the editor).
const phoneIntl = `${contact.phone.trim().startsWith('+') ? '+' : '+45'}${contact.phone.replace(/\D/g, '')}`;
// The CVR number, when it is filled in ("Business" › "Contact").
const { cvr = '' } = contact as typeof contact & { cvr?: string };

// Optional file: an older site has no social.json, so it is read with a glob, not an import.
const socialFile = Object.values(import.meta.glob<Record<string, unknown>>('/src/data/social.json', { eager: true, import: 'default' }))[0];

// Optional file (header.json, "Header"): a site without it keeps the header as it is.
const headerFile = Object.values(import.meta.glob<Record<string, unknown>>('/src/data/header.json', { eager: true, import: 'default' }))[0];
/** The header's button (in place of the phone icon, or null) and the side of the mobile menu button. */
export const header = headerOf(headerFile);

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
  /** The page chosen as the contact page ("Settings" › "Appearance" › "Default pages", standard-pages.json). */
  contactPath: standardPages.contact,
  /** The anchor on the contact page where the directions are (config.ts, found in the content when the site sets none). */
  contactAnchor: settings.contactAnchor,
  /** The shared texts of "Book an appointment" (an app's booking block). */
  booking: { heading: booking.heading, text: booking.text },
  /** The labels of the buttons "Book an appointment" and "Call" (the number comes after). */
  labels: { book: booking.book, call: booking.call },
  /** The owner's image (config.ts), or '' when the site has none. */
  portrait: config.picture?.src ?? '',
  portraitAlt: config.picture?.alt ?? '',
  /** Profiles and share buttons (Company › Social media, social.json); all buttons on without the file. */
  social: socialOf(socialFile),
  /** The logo in the structured data (config.ts), '/logo.svg' unless the site says otherwise. */
  logo: config.logo || '/logo.svg',
};

// Primary navigation (menu.json, "Main menu"). Labels, URLs and sub-items started out as the old site's menu.
export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };
// Sub-items in alphabetical order (Danish order: ae, oe and aa letters last), in both the desktop and the mobile menu.
export const nav: NavItem[] = sortedNav(menu.items);
/** Whether the header has the menu and its button ("Activated" under "Main menu"). */
export const navShown = menu.enabled !== false;
/** The links in the bar under the header on a phone (mobile-menu.json, "Mobile menu"); none when it is turned off. */
export const mobileNav: { label: string; href: string }[] = mobileMenu.enabled ? mobileMenu.items : [];

// "Segmented list" has the link text of the "Expandable list" it replaces ("Blocks" › "Expandable list"), so a text a site saved there still shows.
// The return type keeps the index signature: a site reads `blockTexts.about`, `.buttons`, `.offer` … as `Record<string, any>`.
const withSegmented = (texts: Record<string, Record<string, any>>): Record<string, Record<string, any>> => ({
  ...texts,
  segmented: { ...texts.accordion, ...texts.segmented },
});

/** The texts every copy of a block has ("Blocks" in the editor), with {…} for what differs, by
 * the block's type: those written in its shared.ts, with the saved ones (blocks.json) over them. The
 * standard blocks' first, so an app's block (src/apps/<app>/blocks/) by the same name has its own. */
export const blockTexts = withSegmented(
  sharedTexts(
    {
      ...standardShared,
      ...import.meta.glob<SharedTexts>('/src/apps/*/blocks/*/shared.ts', { eager: true, import: 'default' }),
    },
    blocks,
  ),
);
