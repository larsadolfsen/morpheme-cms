// The kinds of things the editor edits, which a site describes its content with (packages/editor/defaults/collections.ts):
// collections of files and their fields, the blocks of a fixed page and the rules of a text (Template),
// and the small helpers for them that do not depend on a site.
//   markdown: a folder of .md files (front matter + text): blog posts and pages.
//   folder:   a folder of .json files, one entry per file: categories, prices, testimonials.
//   files:    single .json files: the pages built in code (fixed pages) and the menu.
import type { Icon } from '@phosphor-icons/react';
import type { ComponentType, ReactNode } from 'react';
import type { BlockData } from './blocks';
import type { AppCategory } from './store';
import type { AppPageProps } from './apps';
import type { SiteData } from '@site/editor';
import { locale } from './i18n';

/** What a relation field picks from: one of the lists the site makes of its files (relationsOf in
 * packages/editor/defaults/editor.ts), e.g. 'pages', 'blog', 'categories', 'files' (the PDFs). 'fixed': the fixed pages, only offered
 * together with the pages (a field with `fixed`). */
export type Relation = string;

export type Field = {
  name: string;
  label: string;
  type:
    | 'string'
    | 'text'
    | 'number'
    | 'date'
    | 'datetime'
    | 'boolean'
    | 'image'
    | 'readonly'
    | 'select'
    | 'relation'
    | 'object'
    | 'list'
    | 'blocks'
    | 'markdown';
  hint?: string;
  /** An address on the site (string), written as one when it is typed (addressOf in addresses.ts):
   * a page's may have more parts, a post's only one. */
  address?: 'page' | 'post';
  /** What is used when it is empty, shown greyed in it (string, text). */
  placeholder?: (site: SiteData) => string;
  /** Edited elsewhere: a link there under the label. */
  edit?: Edit;
  required?: boolean;
  /** Most characters (string, text). */
  max?: number;
  /** A regular expression the text must match, and the message when it does not. */
  pattern?: [string, string];
  /** A number written with its digits in pairs, as "30 64 16 12": typed any way, it is written so
   * (inPairs in check.ts); a number of digits: it must have that many. */
  digitsInPairs?: number | true;
  /** A phone number, with its country code picked before it in a sheet (PhoneField): the site's own
   * country code ("+45"). A number with it is saved without it ("30 64 16 12"), one with another with
   * that before it ("+46 70 123 45 67"); only the site's own is written in pairs and has its digits
   * counted (digitsInPairs). */
  phone?: string;
  /** string: words typed as chips (ChipField), saved separated by commas: 'one', one word, the field gone while it has
   * it (a primary keyword); 'many', any number of them. */
  chips?: 'one' | 'many';
  /** select */
  /** `icon`: shown before its name (only with `segments`; with `cards` over it). `hint`: shown under the label while it is
   * chosen, in place of the field's own (the status of a page: what each one means). `onPage`: offered only while
   * that relation has a choice on the page being edited (a button that opens a promotion); chosen, it is still shown.
   * `disabled`: shown, greyed, but not to choose (with `cards`: a side-panel template while no block is chosen for the side column). */
  options?: { label: string; value: string; icon?: Icon; hint?: string; onPage?: Relation; disabled?: boolean }[];
  /** select: the options come from the theme in use. 'templates': a page's templates, the theme's "templates" (lib/page-template.mjs); the
   * field shows those of its options the theme offers (templateFieldOf in templateField.ts), its default is the theme's first, which
   * is written as no key, and while only one is left it is shown as the page's, not changed (`locked`). */
  offered?: 'templates';
  /** select: the options are icons (their names, `icons`), shown as the icons to tap (fields.tsx). */
  icons?: boolean;
  /** select: the options side by side in a bar, the chosen one raised (SegmentedButton in ui.tsx), for two or
   * three short ones. */
  segments?: boolean;
  /** select: the options as cards side by side, each with its icon over its name, the chosen one marked (ChoiceCards in
   * ui.tsx): a page's template. */
  cards?: boolean;
  /** select: its menu field (Select), narrow, at the start of its line: the status of a page or post, over its title. */
  narrow?: boolean;
  /** select: shown as what is chosen, with its hint, and not changed here (the kind of an entry,
   * picked when it is made). */
  locked?: boolean;
  /** select: the choices on a page of their own under the form, at its address with the field's name after it
   * (#apps/content-colors/settings/variant), in place of the sheet, drawn by this with what each gives (a picture of
   * it); the field links there. Only a field of a part's own form (CompanyForm.tsx: an app's settings), not one in a
   * group or a list; elsewhere the choices are in the sheet. */
  page?: ComponentType<FieldPageProps>;
  /** relation: what is picked. Pages are stored by their path, the others by their file name. */
  to?: Relation;
  multiple?: boolean;
  /** relation, multiple: the text of the pill that opens the sheet to pick one ("Add tag"). */
  add?: string;
  /** relation to pages: the fixed pages can be picked too (the menu). */
  fixed?: boolean;
  /** relation: only the choices shown on the page being edited (Option.on, FieldContext.page); where no page is
   * edited (the shared buttons), only those shown on every page. */
  onPage?: boolean;
  /** relation with `multiple`, and list: at most this many. */
  maxItems?: number;
  /** object, and list of objects */
  fields?: Field[];
  /** list of single values */
  field?: Field;
  /** A heading over the field and those after it, with what is under it (social media's share buttons): in the form,
   * not in the file. */
  heading?: { label: string; hint?: string };
  /** list of objects with an address (`url`): its items as the rows of a list, each with its network's name and icon
   * (networkOf in site/social.mjs; the address's host for one not known), opening a sheet where it is changed or
   * removed; the FAB adds one (LinkList.tsx). Social media's profiles. */
  links?: boolean;
  /** list: the field shown as the title of each item; of several, the first filled in (a button's text or a text). */
  summary?: string | string[];
  singular?: string;
  /** The value in a new entry. */
  default?: unknown;
  /** The value of a saved entry that has none (saved before the field was there, or with its empty choice, which is
   * not written), when it is not `default`: a banner from before it could go across the whole width is as wide as
   * the text. */
  missing?: unknown;
  /** Shown, checked and saved only while another field next to it (a select) has one of these values,
   * and that field is itself in use. */
  only?: { field: string; is: string[] };
  /** boolean: shown as a switch, with what it says when on and when off. */
  toggle?: [string, string];
  /** Its value changes how the page is laid out (its template): "Preview" shows a page whose value
   * is changed in another page saved with the same value (EntryForm.tsx). */
  layout?: boolean;
  /** blocks: a list where each item has a `type`, one of these, which gives its fields. */
  blocks?: Block[];
  /** blocks: also every block a page can have (the standard ones and the apps', not HTML), after its own; one of
   * its own by the same type wins (withPageBlocks in registry.tsx). */
  pageBlocks?: boolean;
  /** blocks: the page's field (its introduction) written as the text at the top, above the sections. */
  intro?: string;
  /** blocks: the lead of a block a page can have, by its type, on this page (a fixed page's sections: the front page's
   * headings and texts, written in the text above their cards, sections.mjs); its own blocks have theirs (Block.lead). */
  leads?: Record<string, Lead>;
  /** blocks: what the page may have of them (Template). markdown: the blocks that can be put in its text with "+", and
   * how many (Template `blocks` and `max`; 'image' a picture); without it, none. */
  template?: Template;
};

/** What a field's page of its own (Field.page) is given: the field, what is chosen, the form's other values as they are
 * now (not saved yet) and the choice, which goes back to the form with it. */
export type FieldPageProps = {
  field: Field;
  value: string;
  values: Record<string, unknown>;
  onChange: (value: string) => void;
};

/** What a text may have of blocks: the developer's rules for a page's blocks (MarkdownCollection) or a
 * fixed page's sections (a `blocks` field), by type. The editor keeps to them (what can be put in,
 * hidden, moved and removed), checks them before it saves, and so does the site before it is built
 * (templateProblems in check.ts). */
export type Template = {
  /** The blocks that can be put in; all of them when left out. */
  blocks?: string[];
  /** At most this many of a type, hidden ones too. */
  max?: Record<string, number>;
  /** On the page, shown: the last one cannot be hidden or removed. */
  required?: string[];
  /** Stays where it is, shown: it can be edited, but not moved, hidden or removed, and nothing moves
   * past it (the front page's top). */
  locked?: string[];
  /** The blocks a new page starts with, in order, with no fields filled in (a page collection). */
  start?: string[];
};

/** What a button can open of an entry of a list shown on the pages (a promotion), offered by its kind: `label`, what
 * opens, in the site's language ("Pop-up", "Booking sheet"), the choice named after it with the entry's name in
 * parentheses; `as`, a target of the buttons (`buttonTargets`) it stands for, which the button then does (the booking
 * bar opens the booking sheet, as "Book an appointment" does), else the entry itself opens. */
export type Opens = { label: string; as?: string };

/** A place in the editor (a route, e.g. 'company/contact') and the text of the link to it. */
export type Edit = { to: string; text: string };

// A kind of item in a list of blocks (a fixed page's sections; in the editor cards in its text, SectionsField.tsx).
export type Block = {
  type: string;
  label: string;
  /** What the block is, where one is picked. */
  hint?: string;
  /** Edited elsewhere: "Edit" goes there (without fields), or a link there over its fields. */
  edit?: Edit;
  fields: Field[];
  /** Its own text and picture are written in the page's text, above its card (sections.mjs): */
  lead?: Lead;
};

/** heading: the field of the heading (a "Heading", H2); body: the field of the text under it, one
 * text (paragraphs) or, with `list`, one item per paragraph; image: a picture (`image`, `imageAlt`, `imageDecorative`)
 * above the heading, in place of the design's own; upTo: only the body's text before its first block of this type is
 * written above the card (the front page's "Banner": its "Buttons" block), the block and the text after it stay in the
 * field, which the card has too. */
export type Lead = { heading?: string; body?: string; list?: boolean; image?: boolean; upTo?: string };

type Base = {
  id: string;
  label: string;
  singular: string;
  /** The button for a new entry ("New blog post"); without it, no new entries are made here. */
  create?: string;
};

export type MarkdownCollection = Base & {
  kind: 'markdown';
  folder: string;
  fields: Field[];
  deletable?: boolean;
  /** The site's blocks can be put in the text (src/apps/<app>/blocks/). */
  blocks?: boolean;
  /** What a text may have of them. */
  template?: Template;
};

export type FolderCollection = Base & {
  kind: 'folder';
  folder: string;
  fields: Field[];
  deletable?: boolean;
  /** Entries have an `order` (first in the file), changed with the arrows in the list. */
  orderable?: boolean;
  /** The field the file name is made from when the entry is created; of several, the first filled in
   * (a pop-up's heading, or the name of a kind without one). */
  slugFrom: string | string[];
  /** The entries are of kinds: the name of the select field that says which (`locked`), which the apps
   * add kinds to (apps.ts withKinds). With more than one, "+" opens a sheet to pick the kind. */
  kinds?: string;
  /** What the list shows for an entry. */
  summary: (data: Record<string, unknown>) => string;
  /** What the list shows under it, smaller (a cookie's name under who sets it), and is searched with it. */
  detail?: (data: Record<string, unknown>) => string;
  /** The fields the list can be filtered by (the funnel, Library.tsx List), each among the values its entries have:
   * a select by its options' names, another by the value itself (a cookie's provider); `all`: the choice that shows
   * them all ("All providers"). */
  filters?: { field: string; all: string }[];
  /** The entries are shown on pages of the site: the field with their addresses, the field with the tags
   * whose posts they are on, and the field and value that say an entry is on every page. The list can
   * then be filtered by a page or a tag (Library.tsx List). */
  shownOn?: { pages: string; tags?: string; everywhere?: { field: string; is: string } };
  /** What a button can open of an entry of one of the list's own kinds, by the kind, as AppKind.opens for an app's
   * kinds: a pop-up opens itself; a kind left out offers nothing (the action bar). */
  opens?: Record<string, Opens>;
  /** The boolean field that turns an entry on and off (a promotion's "Turned on"/"Turned off"): the list
   * can then be filtered by it, the choices its `toggle` (Library.tsx List). */
  onOff?: string;
  /** The list's own fields one of its own kinds does not have, by the kind (a bar has no picture or
   * heading), as AppKind.omit for an app's kinds (apps.ts withKinds). */
  omit?: Record<string, string[]>;
  /** How an entry of one of the list's own kinds looks on the site, by the kind, drawn beside its form
   * with the fields as they are now (a pop-up); an app's kinds have their own (AppKind.draw). */
  draws?: Record<string, (values: Record<string, any>, data: BlockData) => ReactNode>;
  /** How an entry of an app's kind with a part (AppKind.part) looks on the site: the list's own drawing (a pop-up's box)
   * with the app's part in it, the same as on the site (kindDraw in apps.ts). */
  drawPart?: (values: Record<string, any>, data: BlockData, part: KindPart) => ReactNode;
  /** Entries something else added (the app "Cookie scanner" a cookie it found), not yet looked through: the field in the
   * file that says so (`true`, not one of `fields`), the heading they are under at the top of the list (Library.tsx
   * List), what each says in the accent colour in it and at the top of its form (`label`, by its data: "New", "No
   * purpose"), what the form says of it (`notice`) and its button that takes the field away (`approve`). Saving the entry
   * takes it away too (DataForm.tsx). */
  fresh?: { field: string; heading: string; label: (data: Record<string, unknown>) => string; notice: string; approve: string };
  /** An entry as saved before the list changed (of a kind that is gone: a contact bar, now an action bar), as the list
   * has it now, from its data and the site's files: read so in the list, the form (and saved so) and the check of the
   * site (entryData: Library.tsx, DataForm.tsx, checkSite.ts). */
  upgrade?: (data: Record<string, unknown>, files: { path: string; text: string }[]) => Record<string, unknown>;
};

/** An entry's data from its file's text, as the list has it now (FolderCollection.upgrade). */
export const entryData = (collection: FolderCollection, text: string, files: { path: string; text: string }[]) => {
  const data = JSON.parse(text) as Record<string, unknown>;
  return collection.upgrade ? collection.upgrade(data, files) : data;
};

/** An entry's name on its own screen and among those deleted: what its list shows, with the line under it after it
 * ("Google Analytics · _ga"). */
export const entryName = (collection: FolderCollection, data: Record<string, unknown>) =>
  [collection.summary(data), collection.detail?.(data)].filter(Boolean).join(' · ');

/** An app's part of an entry of its kind, drawn in the list's own drawing (a Mailchimp signup in a pop-up's box), on the
 * site and in the editor alike: its drawing (`View`, given its view and the entry's own button to show where it wants)
 * and what makes its view in the editor (`viewOf`, in its viewOf.ts, as an app's block). */
export type KindPart = {
  View: ComponentType<{ view: any; button: ReactNode }>;
  viewOf: (values: Record<string, any>, data: BlockData) => unknown;
};

/** A list a standard block or an app brings ("Testimonials", "Prices"), as the site's own, with its icon under "Lists". */
export type OwnedList = FolderCollection & {
  icon: Icon;
  /** Made-up rows, as the files have them, for the parts under "Parts" and an app's pictures for the store (examples.ts). */
  examples?: Record<string, unknown>[];
};

export type DataFile = {
  file: string;
  label: string;
  /** Where it is seen on the site. */
  view: string;
  fields: Field[];
  /** The file is a list (the menus): this field holds it in the form. With `fields` ("Activated"), the file holds
   * them and the list under this field's name, and the form shows them above the list. */
  root?: Field;
  /** A fixed page called by its label, not its H1 (the front page). */
  byLabel?: boolean;
  /** The site may have no such file: its screen opens on an empty one, and the first save makes the file (the header). */
  optional?: boolean;
};

/** A fixed page's name in the editor: its H1 (`heading`), as the page has it now; the front page
 * (byLabel) and the about page, whose file has none, by their label. `data`: the file's content, or its text. */
export function fixedName(file: DataFile, data?: string | Record<string, unknown>): string {
  if (file.byLabel) return file.label;
  try {
    const heading = (typeof data === 'string' ? JSON.parse(data) : data)?.heading;
    return typeof heading === 'string' && heading.trim() ? heading.trim() : file.label;
  } catch {
    return file.label;
  }
}

export type FilesCollection = Base & {
  kind: 'files';
  files: DataFile[];
  /** Its files are pages of the site (the fixed pages): each form says when it was last saved, as a page's. */
  pages?: boolean;
};

export type Collection = MarkdownCollection | FolderCollection | FilesCollection;

// The collection a file belongs to, and for single files its entry.
export function collectionOf(collections: Collection[], path: string): { collection: Collection; dataFile?: DataFile } | null {
  for (const collection of collections) {
    if (collection.kind === 'files') {
      const dataFile = collection.files.find((f) => f.file === path);
      if (dataFile) return { collection, dataFile };
    } else if (path.startsWith(`${collection.folder}/`)) {
      return { collection };
    }
  }
  return null;
}

// A file's name in its folder, without .md or .json (and /index): a post's address, an entry's slug.
export const slugOf = (path: string, folder: string) => path.slice(folder.length + 1).replace(/(\/index)?\.(md|json)$/, '');

// Titles in alphabetical order, in the editor's language (Danish: its three extra letters last), without the quotation marks and other signs
// some begin with: “Living with and after bipolar disorder” under L.
const sortable = (title: string) => title.replace(/^[^\p{L}\p{N}]+/u, '');
export const byText = (a: string, b: string) => sortable(a).localeCompare(sortable(b), locale);

// Addresses and file names from a title, spelled like the existing ones: the Danish letters for ae, oe and aa are written out as such.
export const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/\u00e6/g, 'ae')
    .replace(/\u00f8/g, 'oe')
    .replace(/\u00e5/g, 'aa')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A screen of the site's own with parts (PartScreen), "Business" or "Blocks" (CompanyForm.tsx): a
 * part of one data file. */
export type Part = {
  id: string;
  label: string;
  icon: Icon;
  /** The fields and the file they are in, at the top level or under `at`; without them, a part is only a
   * row that opens its own screen (the ones under "Appearance", Library.tsx). */
  file?: string;
  at?: string;
  fields?: Field[];
  /** The values before any are saved (a block's shared.ts). */
  defaults?: Record<string, unknown>;
  /** The file's data as the form has it now, from a file written before the fields changed (social.json with a key
   * for each network, now a list of links: upgradeSocial in site/social.mjs); read so by the form and the check, and
   * saved so. */
  upgrade?: (data: Record<string, unknown>) => Record<string, unknown>;
  /** The part's own values (at `at`) as the form has them now, from a value written before it was renamed (the shared text
   * of "Expandable list" with its old placeholder, now {topic}: upgradeMore in standard/accordion/topic.mjs); the form shows them so and
   * the next save writes them so. */
  upgradeValues?: (values: Record<string, unknown>) => Record<string, unknown>;
  /** A block drawn under the fields with them as they are now (its draw, src/apps/<app>/blocks/): its type, and props
   * for when no page has the block (the first one on a page is drawn). shared: always with `props`,
   * as a copy that has nothing of its own (the shared buttons). variants: drawn once for each, under its
   * name, always with `props` and the variant's over them (the designs of "Cards"). */
  preview?: {
    type: string;
    props?: Record<string, unknown>;
    shared?: boolean;
    variants?: PreviewVariant[];
  };
  /** Where its row opens, when not its own screen under the one it is on (the front page under "Appearance"). */
  href?: string;
  /** At the end of its row, before the arrow: the theme in use, by "Themes" under "Appearance". */
  detail?: string;
  /** At the end of its row, after `detail` and before the arrow: the site's primary, secondary and tertiary colours by
   * "Colors" under "Appearance" (ColorSwatches). */
  trailing?: ReactNode;
  /** Where its screen goes back to: "Business", or "Blocks" (blockTexts.ts, site.ts). */
  back?: { href: string; label: string };
  /** What the commit says was edited, in the site's language, when not its name in lower case (an
   * app's settings, AppList.tsx: "settings for Mailchimp"). */
  commit?: string;
  /** The value a save of its fields sets, said in the notice after it ("CMS-version set to 0.10.0"), asked with the saved
   * values and the app's own addresses in the Worker (`api`); undefined, or a failure, says "CMS-version changed"
   * (partChange.ts). An app's settings copy it from AppSettings.changedTo (AppList.tsx appSettingsPart). */
  changedTo?: (values: Record<string, unknown>, props: AppPageProps) => Promise<string | undefined>;
  /** Parts of its own, instead of fields: a row that opens a screen with them, each at
   * #<screen>/<id>/<part> and going back to it ("Business" › "Payment" with "Bank"). */
  parts?: Part[];
  /** With `parts`: the settings of the apps installed of these categories (AppDefinition.category) come after them,
   * each at #<screen>/<id>/<app> ("Payment" with MobilePay; AppList.tsx appPartsIn). An older id (`payment`) is read as
   * its new one (categoryOf in lib/storeCategories.mjs). */
  apps?: AppCategory[];
  /** One of the editor's own lists, drawn under its fields: "keywords", every keyword of the pages, posts and fixed
   * pages ("Internal links", Keywords.tsx). */
  below?: 'keywords';
  /** One of the editor's own screens, instead of a form: "consents", the visitors' answers in the cookie banner
   * ("Consents" under "Privacy", Consents.tsx). */
  opens?: 'consents';
  /** Its fields, which pick a page (`relation`), as the rows of a list, each opening the sheet with the pages (FieldRows):
   * "Default pages" and "Privacy pages". */
  rows?: boolean;
};

/** A part of the start screen that is a screen with parts, each a screen of its own at #<id>/<part>
 * (Library.tsx PartsScreen, CompanyForm.tsx): "Privacy" with the cookie banner and the privacy pages. With `apps`, the
 * settings of the apps installed of those categories (AppDefinition.category) come after its own parts, each at
 * #<id>/<app> ("Analytics" with Google Analytics; AppList.tsx appPartsIn). An older id in `apps` is read as its new one
 * (categoryOf in lib/storeCategories.mjs). */
export type PartScreen = { id: string; label: string; parts: Part[]; apps?: AppCategory[] };

/** One way a block's screen under "Blocks" draws it (Part.preview): its name and its own props. */
export type PreviewVariant = { label: string; props: Record<string, unknown> };

/** What a block on the site is given by RichText.astro (BlockSite.astro gives it to its load.ts): its props (as written in its line in the
 * text), its place among the parts of the text, the page's address, whether the page is a new
 * version of a page (/ny/), and its shared texts (shared.ts, with those saved over them). */
export type SiteProps<P = Record<string, any>> = {
  props: P;
  index: number;
  path?: string;
  preview?: boolean;
  texts?: Record<string, any>;
  /** The page's text, for a block drawn beside it (`beside` in its load.ts). */
  html?: string;
};
