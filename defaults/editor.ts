// What the editor edits on a site, and how: the one place the editor (packages/editor/, the package
// @morphemecms/cms) takes the site from, as `@site/editor`. This and the other files of defaults/ are a site's
// standard parts: a site has them unless its src/site/ has a file of the same name (siteFile in site/theme.mjs), which
// may take the standard one from @morphemecms/cms/defaults/<file> and add its own.
//   collections   the parts of the site and their fields (collections.ts)
//   groups, lists, header, icons   the start screen
//   appearance    the site's own parts under "Udseende", after the logo and icon ("Standardsider")
//   companyParts, blockParts   the screens under "Virksomheden" and "Blokke" (company.ts, blockTexts.ts)
//   partScreens   parts of the start screen that are screens with parts of their own (privacy.ts)
//   seoParts      the site's own parts under "Søgemaskineoptimering", after the redirects (internalLinks.ts)
//   relationsOf, usedBy, keptBy   what a field picks from, what cannot be deleted, and what cannot be saved so (rules.ts)
//   siteProblems  what is wrong by the site's own rules, before it is built (rules.ts)
//   usesOf, countsOf   the places that use an entry (a tag's "Bruges på") and their number at it in its list (rules.ts)
//   testimonialsOf             the testimonials the blocks show (rules.ts)
//   siteOf        what the blocks' previews show from the rest of the site (sitedata.ts)
//   fixedPages, everyFixedPage   how the front page's sections look in the editor (the theme's editor/previews.tsx)
//   sectionLooks, headingLooks   how the text of the front page looks in the editor (the theme's editor/looks.mjs)
//   standardPages, standardPaths, frontLeads   the front page, the blog page, the 404 page and the others, and how the front page is
//                 written (standardPages.ts)
//   colorFields, colorPairs, colorRoles, defaultColors   the colours under "Farver" and their Material roles (colors.ts)
//   siteName      the title of the start screen and the way back to it
//   sharing       what a page shared on social media shows when it has nothing of its own (Base.astro)
import {
  Browser,
  Buildings,
  Certificate,
  ChartLineUp,
  DeviceMobile,
  FileText,
  House,
  FolderSimple,
  List as ListIcon,
  MagnifyingGlass,
  Megaphone,
  ListChecks,
  Newspaper,
  PaintBrushBroad,
  Palette,
  PuzzlePiece,
  Shapes,
  ShieldCheck,
  SidebarSimple,
  Signpost,
  Smiley,
  SlidersHorizontal,
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

// A pop-up and an action bar ("Promovering") drawn beside their form (popup.tsx), and an app's kind with a
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

/** Parts of the start screen that are a screen with parts, each a screen of its own: "Privatliv" (privacy.ts), and
 * "Analytics" and "Promovering" with the settings of the apps installed that measure (Google Analytics, Google Ads,
 * Google Tag Manager) and of those that add a kind of promotion (Calendly, Mailchimp), by their kind
 * (AppDefinition.category, the app store's); the apps' own pages under "Apps" only install them. */
export const partScreens: PartScreen[] = [
  { id: 'maaling', label: 'Analytics', parts: [], apps: ['analytics'] },
  { id: 'promovering', label: 'Promovering', parts: [], apps: ['booking', 'newsletter'] },
  privacy,
];

/** The site's own parts under "Søgemaskineoptimering", each a screen of its own at #seo/<id>, after the editor's
 * "Videresendelser": "Interne links" (internalLinks.ts). */
export const seoParts = [internalLinks];

/** The title of the start screen, and of the way back to it on every other screen. */
export const siteName = site.name;

/** What a page shared on social media shows when it has nothing of its own (Base.astro): the site's name after its
 * title, its description and its picture (the owner's, config.picture). For the preview under "Sociale medier" (sharedAs in seo.ts). */
export const sharing = { name: site.name, description: site.description, picture: site.portrait };

/** The icon of each part on the start screen and in the sidebar, by its id. */
export const icons: Record<string, Icon> = {
  blog: Newspaper,
  pages: FileText,
  header: Browser,
  menu: ListIcon,
  mobilmenu: DeviceMobile,
  kategorier: Tag,
  popups: Megaphone,
  virksomheden: Buildings,
  blokke: SquaresFour,
  filer: FolderSimple,
  privatliv: ShieldCheck,
  maaling: ChartLineUp,
  promovering: SlidersHorizontal,
  lister: ListChecks,
  footer: SquareHalfBottom,
  seo: MagnifyingGlass,
  videresendelser: Signpost,
  udseende: PaintBrushBroad,
  blokvalg: ToggleRight,
  apps: PuzzlePiece,
  appstore: Storefront,
  morpheme: Sparkle,
  avanceret: Wrench,
  licenser: Certificate,
  // The screens under "Udseende" (Library.tsx Theme).
  temaer: Swatches,
  farver: Palette,
  logo: Sticker,
  ikonpakker: Smiley,
  bevaegelse: WaveSine,
  sidekolonne: SidebarSimple,
  dele: Shapes,
};

// The parts of the site on the start screen, in groups: the content the owner writes and uploads (the
// pages, the blog, its tags, the pop-ups and the files), what is on every page (the
// header with the menus, the footer and "Virksomheden": name, contact and booking), the blocks (their
// shared texts, "Lister", the testimonials and prices they show, which the standard blocks and the apps bring, and
// "Blokindstillinger", which of them can be put in); the settings of the whole site are on a page of their own (settings).
// Each is a collection (collections.ts), except "maaling", "promovering" and "privatliv" (partScreens) and the editor's own "virksomheden" (companyParts), "blokke"
// (blockParts), "filer" (the pictures, PDFs, videos and zip files), "header", "lister", "udseende" (the theme, the colours, the logo
// and icon, the standard pages (appearance) and the editor's parts: Colors.tsx, BrandForm.tsx and Parts.tsx), "blokvalg" (which blocks can be put in, BlockSettings.tsx), "apps"
// (the apps that come with the site, src/apps/, AppList.tsx) and "seo" (the redirects, Redirects.tsx, and seoParts). The editor shows
// each group's parts A–Å by their names in its language (partsIn in Library.tsx), whatever the order here.
export const groups: { title: string; ids: string[] }[] = [
  { title: 'Indhold', ids: ['pages', 'blog', 'kategorier', 'popups', 'filer'] },
  { title: 'På alle sider', ids: ['header', 'footer', 'virksomheden'] },
  { title: 'Blokke', ids: ['blokke', 'lister', 'blokvalg'] },
];

/** The settings of the whole site, not on the start screen but on "Indstillinger" (#indstillinger, Library.tsx
 * Settings), which the gear in the top bar opens (Screen.tsx SettingsLink); A–Å as a group's. */
export const settings: string[] = [
  'udseende',
  'apps',
  'appstore',
  'morpheme',
  'maaling',
  'promovering',
  'privatliv',
  'seo',
  'avanceret',
  'licenser',
];

/** The site's own short lists, on a screen of their own under "Lister" (#lister), with those the standard blocks
 * bring ("Udtalelser") and the apps (their lists.ts). */
export const lists: string[] = [];

/** What is in the header on every page, on a screen of its own under "Header" (#header). */
export const header = ['menu', 'mobilmenu'];

/** The site's own parts under "Udseende" (#udseende), after the logo and icon, each a screen of its own at #udseende/<id>:
 * "Standardsider", which pages are the front page, the blog page, the 404 page and the contact page, as a list
 * (standardPageFieldsOf in collections.ts; the privacy policy and the cookie policy are under "Privatliv", privacy.ts). */
export const appearance: Part[] = [
  {
    id: 'standardsider',
    label: 'Standardsider',
    icon: House,
    file: config.standardPages,
    fields: standardPageFieldsOf('front', 'blog', 'notFound', 'contact'),
    rows: true,
  },
];
