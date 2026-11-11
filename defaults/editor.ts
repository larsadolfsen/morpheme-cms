// What the editor edits on a site, and how: the one place the editor (packages/editor/, the package
// @morphemecms/cms) takes the site from, as `@site/editor`. This and the other files of defaults/ are a site's
// standard parts: a site has them unless its src/site/ has a file of the same name (siteFile in site/theme.mjs), which
// may take the standard one from @morphemecms/cms/defaults/<file> and add its own.
//   collections   the parts of the site and their fields (collections.ts)
//   groups, settings, lists, header, icons   the menu (five sections), the rows of the Settings screen (Appearance, Developer,
//                 Licenses, Morpheme, Privacy) and the start screen ("Appearance" starts with "Theme store", the store's themes)
//   appearance    the site's own parts under "Appearance" (a row of Settings), after the colours ("Default pages")
//   companyParts, blockParts   the screens under "Business" and "Blocks" (company.ts, blockTexts.ts)
//   partScreens   parts of the start screen that are screens with parts of their own (privacy.ts)
//   seoParts      the site's own parts under "Search engine optimization" (#seo/<id>), in the menu under "Content" (internalLinks.ts)
//   relationsOf, usedBy, keptBy   what a field picks from, what cannot be deleted, and what cannot be saved so (rules.ts)
//   siteProblems  what is wrong by the site's own rules, before it is built (rules.ts)
//   usesOf, countsOf   the places that use an entry (a tag's "Used on") and their number at it in its list (rules.ts)
//   testimonialsOf             the testimonials the blocks show (rules.ts)
//   siteOf        what the blocks' previews show from the rest of the site (sitedata.ts)
//   fixedPages, everyFixedPage   how the front page's sections look in the editor (the theme's editor/previews.tsx)
//   sectionLooks, headingLooks   how the text of the front page looks in the editor (the theme's editor/looks.mjs)
//   standardPages, standardPaths, frontLeads   the front page, the blog page, the 404 page and the others, and how the front page is
//                 written (standardPages.ts)
//   colorFields, colorPairs, colorRoles, defaultColors   the colors under "Colors" and their Material roles (colors.ts)
//   siteName      the title of the start screen and the way back to it
//   sharing       what a page shared on social media shows when it has nothing of its own (Base.astro)
import {
  Article,
  Browser,
  Buildings,
  Certificate,
  Chats,
  DeviceMobile,
  FileText,
  House,
  FolderSimple,
  Gauge,
  GearSix,
  GlobeSimple,
  List as ListIcon,
  MagnifyingGlass,
  Megaphone,
  ListChecks,
  Newspaper,
  PaintBrushBroad,
  Palette,
  PuzzlePiece,
  Shapes,
  ShareNetwork,
  ShieldCheck,
  SidebarSimple,
  Signpost,
  Smiley,
  Sparkle,
  SquareHalfBottom,
  SquaresFour,
  Sticker,
  Storefront,
  Swatches,
  Tag,
  ToggleRight,
  WaveSine,
  Wrench,
  type Icon,
} from '@phosphor-icons/react';
import type { Part, PartScreen } from '../src/schema';
import { site } from '../site/site';
import { privacy } from '@site/privacy';
import { internalLinks } from '@site/internalLinks';

import { config } from '@site/config';
export { config };
import { collections, standardPageFieldsOf } from '@site/collections';
import { drawActionBar, drawPopup } from '@site/popup';

// A pop-up and an action bar ("Promotion") drawn beside their form (popup.tsx), and an app's kind with a
// part in the pop-up's box (Mailchimp's signup: drawPart; an app's other kinds have their own drawing). Set here, as
// collections.ts is also read by packages/editor/scripts/editor-roundtrip.mjs in plain Node, which cannot read JSX.
const promotions = collections.find((c) => c.id === 'popups');
if (promotions?.kind === 'folder') {
  promotions.draws = { standard: (values, data) => drawPopup(values, data), bookingbar: drawActionBar };
  promotions.drawPart = drawPopup;
}
export { collections };
export { companyParts } from '@site/company';
export { blockParts } from '@site/blockTexts';
export { countsOf, keptBy, relationsOf, siteProblems, testimonialsOf, usedBy, usesOf, whatIsAt, type Use } from '@site/rules';
export { siteOf, type SiteData } from '@site/sitedata';
export { everyFixedPage, fixedPages, Texts, type Props } from '@theme/editor/previews';
export { HEADINGS as headingLooks, LOOKS as sectionLooks } from '@theme/editor/looks.mjs';
export { frontLeads, standardPages, standardPaths, type StandardPage } from '@site/standardPages';
export { colorFields, colorPairs, colorRoles, defaultColors } from '@site/colors';

/** Parts of the start screen that are a screen with parts, each a screen of its own: "Privacy" (privacy.ts). The
 * settings of the apps, also those that measure (Google Analytics …) or add a kind of promotion (Calendly, Mailchimp),
 * are on their own app pages under "Apps" (AppList.tsx settingsRoute). */
export const partScreens: PartScreen[] = [privacy];

/** The site's own parts under "Search engine optimization", each a screen of its own at #seo/<id>, after the editor's
 * "Redirects": "Internal links" (internalLinks.ts). */
export const seoParts = [internalLinks];

/** The title of the start screen, and of the way back to it on every other screen. */
export const siteName = site.name;

/** What a page shared on social media shows when it has nothing of its own (Base.astro): the site's name after its
 * title, its description and its picture (the owner's, config.picture). For the preview under "Social media" (sharedAs in seo.ts). */
export const sharing = { name: site.name, description: site.description, picture: site.portrait };

/** The icon of each part on the start screen and in the sidebar, by its id. */
export const icons: Record<string, Icon> = {
  home: Gauge,
  blog: Newspaper,
  pages: FileText,
  header: Browser,
  menu: ListIcon,
  'mobile-menu': DeviceMobile,
  tags: Tag,
  popups: Megaphone,
  company: Buildings,
  // The sections of the main menu that are not also a part ("Business" is the part "company"'s icon).
  content: Article,
  global: GlobeSimple,
  settings: GearSix,
  blocks: SquaresFour,
  files: FolderSimple,
  privacy: ShieldCheck,
  lists: ListChecks,
  footer: SquareHalfBottom,
  seo: MagnifyingGlass,
  redirects: Signpost,
  appearance: PaintBrushBroad,
  'block-settings': ToggleRight,
  apps: PuzzlePiece,
  appstore: Storefront,
  'store-plugins': PuzzlePiece,
  'store-connectors': ShareNetwork,
  'store-themes': Palette,
  'theme-store': Storefront,
  morpheme: Sparkle,
  developer: Wrench,
  licenses: Certificate,
  assistants: Chats,
  // The screens under "Appearance" (Library.tsx Theme), the first the store's themes.
  themes: Swatches,
  colors: Palette,
  logo: Sticker,
  'icon-packs': Smiley,
  motion: WaveSine,
  'side-column': SidebarSimple,
  parts: Shapes,
};

/** The site's own parts under "Appearance" (#appearance), after the colours, each a screen of its own at #appearance/<id>:
 * "Default pages", which pages are the front page, the blog page, the 404 page and the contact page, as a list
 * (standardPageFieldsOf in collections.ts; the privacy policy and the cookie policy are under "Privacy", privacy.ts). */
export const appearance: Part[] = [
  {
    id: 'default-pages',
    label: 'Default pages',
    icon: House,
    file: config.standardPages,
    fields: standardPageFieldsOf('front', 'blog', 'notFound', 'contact'),
    rows: true,
  },
];

// The editor's menu: five sections in a fixed order, shown in the order written here, never A–Z. "Dashboard" is a link to the
// start screen (`href`) without a list; the others have a list of parts, each an id: the content the owner writes and
// uploads ("Content": the pages, the blog, the short lists, the pop-ups, the tags, the files, "internal links" (seoParts)
// and "redirects", Redirects.tsx), the business ("Business": the logo and icon first (company/logo, BrandForm.tsx), then the
// section of the editor's part "company": its parts, name, contact and booking, are its rows; lib/menu.mjs), the blocks
// ("Blocks": their shared texts, and "Block selection", which of them can be put in) and the apps ("Apps": the apps that
// come with the site, src/apps/, AppList.tsx, and "appstore").
// Appearance, Developer, Licenses, Morpheme and Privacy are not sections of the menu: they are the rows of the Settings
// screen (`settings` below), opened by the cog at the bottom of the drawer and the rail.
// Each part is a collection (collections.ts), except those named above, "privacy"'s (partScreens) and the editor's own
// "company" (companyParts), "blocks" (blockParts), id files (the pictures, PDFs, videos and zip files), "header", "lists"
// and "block-settings" (BlockSettings.tsx).
// `flat` (Apps) has no list of its own: its rows stand under its label on the first level, with the apps installed after them.
export const groups: { id: string; title: string; href?: string; flat?: boolean; ids: string[] }[] = [
  { id: 'home', title: 'Dashboard', href: '#', ids: [] },
  {
    id: 'content',
    title: 'Content',
    ids: ['pages', 'blog', 'lists', 'popups', 'tags', 'files', internalLinks.id, 'redirects'],
  },
  { id: 'company', title: 'Business', ids: ['logo', 'company'] },
  { id: 'blocks', title: 'Blocks', ids: ['blocks', 'block-settings'] },
  { id: 'apps', title: 'Apps', flat: true, ids: ['appstore', 'store-connectors', 'store-plugins', 'store-themes', 'apps'] },
];

/** The rows of the Settings screen (#settings), A–Z by their names there: how the site looks ("Appearance": the theme store,
 * the header with the menus and the footer, the theme, the icon packs, the motion, the side column, the colors, the
 * standard pages (appearance) and the editor's parts: Colors.tsx, BrandForm.tsx and Parts.tsx), the developer screens,
 * the licenses, the CMS ("Morpheme") and "Privacy" (privacy.ts). Not in `groups`: the cog opens them. */
export const settings: string[] = ['appearance', 'assistants', 'developer', 'licenses', 'morpheme', 'privacy'];

/** The site's own short lists, on a screen of their own under "Lists" (#lists), with those the standard blocks
 * bring ("Testimonials") and the apps (their lists.ts). */
export const lists: string[] = [];

/** What is in the header on every page, on one screen under "Appearance" › "Header" (#appearance/header, HeaderSettings.tsx). */
export const header = ['menu', 'mobile-menu', 'header-button'];
