// What the editor knows about a block in the text: its name, what it is, its fields (asked in
// BlockDialog.tsx), what its card in the text says about it to a screen reader (describe) and how it
// looks (draw). The blocks are each a folder, the standard ones in packages/editor/src/standard/ and the site's
// own in src/apps/<app>/blocks/ (registry.tsx finds them); the sections of a fixed page are blocks in its text too
// (sectionBlocks, sections.mjs), drawn by the theme's editor/previews.tsx.
import type { ComponentType, ReactNode } from 'react';
import type { InlineViewProps } from './inlineViews';
import type { Block, Edit, Field, Lead, Relation } from './schema';
import type { ListRows, Option, TestimonialRow } from './fields';
import type { SiteData } from '@site/editor';
import type { StandardSiteData } from './standard/site';
import { CalendarCheck, Code, Newspaper, SquaresFour, TextAlignLeft, type Icon } from '@phosphor-icons/react';
import { HTML } from './markdown.mjs';
import { withoutColors } from '../lib/text-colors.mjs';
import { t } from './i18n';

export type BlockProps = Record<string, unknown>;

/** A block by its type, drawn as in the editor (its `draw`), for a theme's section that shows one
 * (preview() in registry.tsx); null when no block has the type. */
export type DrawBlock = (type: string, props: BlockProps) => ReactNode;

/** The heading of a standard block in `Insert` (BlockDialog.tsx), by what it does. Every standard block has one
 * (src/standard/groups.test.mjs checks it). */
export type BlockGroup = 'cards' | 'lists' | 'banners' | 'buttons' | 'media' | 'content' | 'developer';
export const blockGroups: BlockGroup[] = ['cards', 'lists', 'banners', 'buttons', 'media', 'content', 'developer'];

export type SiteBlock = {
  type: string;
  label: string;
  /** What it is, where one is picked (only where the name is not enough). */
  hint?: string;
  /** Its heading among the standard blocks in `Insert`; required for a standard block, an app's block has its app's name. */
  group?: BlockGroup;
  /** Edited elsewhere (Block.edit). */
  edit?: Edit;
  fields: Field[];
  /** What the card in the text says about it, in lines, when not its fields (describe). */
  detail?: (props: BlockProps, data: BlockData) => string[];
  /** Its name in the editor for these fields, when it is not `label` ("Dynamic list": a list block that reads a list). */
  nameOf?: (props: BlockProps) => string;
  /** Not offered among the blocks to put in: a fixed page's own text, which is written in the text. */
  written?: boolean;
  /** Has become something else (the Banner is a section now, lib/remark-banner-section.mjs): still read, drawn and edited where a text
   * has one, but not offered among the blocks to put in. */
  former?: boolean;
  /** Its heading and text are written in the text above it (sections.mjs); a new one gets a heading. */
  lead?: Lead;
  /** Typed in place in the text (InlineItems.tsx, MarkdownEditor.tsx): its card is the block drawn with its text as fields, not an image
   * of it; a new one goes in at once, without a sheet. Only the List so far (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md). */
  inline?: InlineSpec;
  /** Cannot be hidden on the site (its line in the file has no props to say so: HTML). */
  shown?: boolean;
  /** Drawn in its sheet above the fields, as it is with them now (BlockDialog.tsx): the buttons,
   * which are the shared ones until it has its own. */
  preview?: boolean;
  /** Its fields filled in as an example, for its preview under "Block settings" when it is on no
   * page (BlockSettings.tsx). Without it, exampleOf fills them in from their names. */
  example?: BlockProps;
  /** Before its name where it is picked (BlockDialog.tsx). */
  icon: Icon;
  /** How it looks on the site, with what is in it now (the card in the text, its sheet): its View.tsx given the view
   * its view.ts (an app's: viewOf.ts) makes (registry.tsx). Without it, the card has the lines of describe. */
  draw?: (props: Record<string, any>, data: BlockData) => ReactNode;
  /** What draws the block typed in place (its `inline`, InlineSpec): a standard block's is in inlineViews.tsx, an app's is the `Inline.tsx` in
   * its block's folder (appInlines, registry.tsx). Without it the block keeps its sheet, whatever `inline` says (typedInPlace.mjs). */
  inlineView?: ComponentType<InlineViewProps>;
  /** Gone from the site by itself (a notice whose time is over): its card is greyed, like a hidden one. */
  over?: (props: BlockProps) => boolean;
  /** One of the editor's standard blocks (packages/editor/src/standard/), not the site's own (src/apps/<app>/blocks/). */
  standard?: boolean;
  /** Added by an app (src/apps/<app>/blocks/, apps.ts): its id. Offered once the app is installed. */
  app?: string;
};

/** A block, in its folder in packages/editor/src/standard/ or src/apps/<app>/blocks/ (index.tsx): all but its type, which
 * is the folder's name, whether it is a standard block, and how it looks (its View.tsx, registry.tsx). */
/** How a block is typed in place: which of its lists holds the items, which fields of an item are typed (in the order the cursor goes),
 * which are picked in a slot (an icon or an image, a link: their field names), and what the floating toolbar and the item say (its texts,
 * in the editor's language). Its drawing is the block's own: inlineViews.tsx. */
export type InlineSpec = {
  /** The name of the list field of the items. */
  item: string;
  /** A block with no list (Notice, Video): the block's own props are its one item, typed where they stand (InlineSingle.tsx); `item` is
   * not used and the block has no row actions. */
  single?: boolean;
  /** The typed fields of an item, in order. */
  fields: string[];
  /** The field picked in the icon slot (its icon picker). */
  icon?: string;
  /** The field picked in the link slot (the item's settings). */
  link?: string;
  /** Instead of `icon`: the fields the media slot opens (a card's media: its kind, icon, image and video), in the item's sheet. */
  media?: string[];
  /** The block's own fields that the first item's media sheet has too, above the item's (a card's one media choice for every card). */
  blockMedia?: string[];
  /** Instead of `link`: the fields the link slot opens (a card's page and buttons). */
  settings?: string[];
  /** `false`: the toolbar has no Link action; the block's own view opens the item's settings (Segmented: at the bottom of the row). */
  barLink?: boolean;
  /** The most items it can have (a price list has four): no Add above, Add below or Add item past it. */
  max?: number;
  /** The block has settings of its own besides its items (a card's type and colour): its menu keeps Edit. A function says it by the
   * props (Steps: only while its old heading or subheading is filled). Without `link`, `settings` and `icon` the block has no item sheet. */
  blockSettings?: boolean | ((props: BlockProps) => boolean);
  /** The block is a grid of cells (the Table): `item` is its list of rows, each a list of texts; the cursor is in a cell (row and column), and
   * the toolbar has these actions of its own (a row is added with `addAbove` and `addBelow`). */
  grid?: {
    addColumnBefore: string;
    addColumnAfter: string;
    deleteRow: string;
    deleteColumn: string;
    /** The column of the active cell: left, centre, right, or automatic (by its cells); saved in the block's `columns`, one entry per column. */
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
    alignAuto: string;
  };
  texts: {
    addAbove: string;
    addBelow: string;
    /** The Link action and the title of the item's settings: only for a block with a link or settings. */
    link?: string;
    /** The button for the item's other actions on a phone ("Row"). */
    row: string;
    settings?: string;
    icon?: string;
  };
};

export type BlockDefinition = Omit<SiteBlock, 'type' | 'standard' | 'app' | 'draw'>;
export const defineBlock = (block: BlockDefinition) => block;

// What the cards need besides the blocks: the lists' rows (an app's block shows its own list's) and the testimonials as they are now, the names of
// the pages, posts … (for the fields that pick one), the rest of the site (for the previews,
// previews.tsx), and the address of the page being edited (for "About this page"); on a fixed
// page its file and its form's values as they are now.
export type BlockData = {
  lists: ListRows;
  testimonials: TestimonialRow[];
  relations: Record<Relation, Option[]>;
  /** The site's data, with what the standard blocks take from it (StandardSiteData). */
  site: SiteData & StandardSiteData;
  path?: string;
  page?: { file: string; values: Record<string, unknown> };
};

// Fields filled in as an example from what they are: a text with its name ("Heading"), a choice
// with its default or first option, a page or post with the first ones there are, a list with three
// items; a date or an image stays empty.
function exampleFields(fields: Field[], data: BlockData): BlockProps {
  return Object.fromEntries(
    fields.map((f): [string, unknown] => {
      if (f.default !== undefined && f.default !== '') return [f.name, f.default];
      switch (f.type) {
        case 'string':
        case 'text':
        case 'markdown':
          return [f.name, f.label];
        case 'number':
          return [f.name, 1];
        case 'select':
          return [f.name, f.options?.[0]?.value ?? ''];
        case 'relation': {
          const values = (data.relations[f.to!] ?? []).map((o) => o.value);
          return [f.name, f.multiple ? values.slice(0, 3) : (values[0] ?? '')];
        }
        case 'object':
          return [f.name, exampleFields(f.fields!, data)];
        case 'list':
          return [f.name, Array.from({ length: Math.min(3, f.maxItems ?? 3) }, () => exampleFields(f.fields!, data))];
        case 'boolean':
          return [f.name, false];
        case 'blocks':
          return [f.name, []];
        default:
          return [f.name, ''];
      }
    }),
  );
}

/** A block's fields as an example, for its preview when it is on no page: its own (example), or
 * filled in from what they are. */
export const exampleOf = (block: SiteBlock, data: BlockData): BlockProps => block.example ?? exampleFields(block.fields, data);

// What a card says: a line for each field that is filled in (a text shortened, a list as its items,
// a picked page or testimonial by its name), or what the block lists from elsewhere (prices,
// testimonials). Without anything to show, only its name.
export const plain = (s: unknown) =>
  withoutColors(String(s))
    // Without the blocks and images in it (a "Banner"'s text).
    .replace(/<div data-block="[a-z]+"[^>]*><\/div>/g, ' ')
    .replace(/!\[(?:\\.|[^\]])*\]\([^)]*\)/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/[*_`#>[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
export const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export function valueText(f: Field, v: unknown, data: BlockData, n = 140): string {
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
  switch (f.type) {
    case 'string':
    case 'text':
    case 'markdown':
      return cut(plain(v), n);
    case 'number':
      return `${f.label}: ${v}`;
    case 'select':
      return f.options?.find((o) => o.value === v)?.label ?? String(v);
    case 'relation': {
      const options = [...(data.relations[f.to!] ?? []), ...(f.fixed ? data.relations.fixed : [])];
      const name = (x: unknown) => options.find((o) => o.value === x)?.label ?? String(x);
      return Array.isArray(v) ? v.map(name).join(', ') : name(v);
    }
    case 'object':
      return f.fields!.map((g) => valueText(g, (v as BlockProps)[g.name], data, n)).find(Boolean) ?? '';
    case 'list': {
      const one = (item: unknown) =>
        f.field
          ? valueText(f.field, item, data, 60)
          : (f
              .fields!.filter((g) => !f.summary || [f.summary].flat().includes(g.name))
              .map((g) => valueText(g, (item as BlockProps)[g.name], data, 60))
              .find(Boolean) ?? '');
      return `${f.label}: ${(v as unknown[]).map(one).filter(Boolean).join(' · ')}`;
    }
    default:
      return '';
  }
}

// The testimonials with any of the tags (all without tags), as the block on the site picks them
// (standard/testimonials/load.ts).
export const withTags = (rows: TestimonialRow[], tags: unknown) => {
  const wanted = (tags ?? []) as string[];
  return rows.filter((row) => !wanted.length || (row.categories ?? []).some((c) => wanted.includes(c)));
};
export const names = (rows: TestimonialRow[]) => (rows.length ? rows.map((row) => row.name).join(', ') : t.blocks.noTestimonials);

/** The lines on the card of a block in the text. */
export function describe(block: SiteBlock, props: BlockProps, data: BlockData): string[] {
  const lines = block.detail
    ? block.detail(props, data)
    : block.fields.map((f) => valueText(f, props[f.name], data)).filter((line) => line && line !== block.label);
  return lines.filter(Boolean).slice(0, 8);
}

// The blocks in the text of a fixed page in the editor, which are its sections (collections.ts). A
// section of text is written as text and is a card only while hidden.
export const sectionBlocks = (blocks: Block[], leads: Record<string, Lead> = {}): SiteBlock[] =>
  blocks.map((b) => {
    // A block a page can have (`pageBlocks`, withPageBlocks in registry.tsx) is a section as it is; with a lead on this
    // page (the field's `leads`), without the fields written in the text above its card.
    if ('draw' in b) {
      const lead = leads[b.type];
      return lead ? { ...(b as SiteBlock), lead, fields: b.fields.filter((f) => !inLead(f.name, lead)) } : (b as SiteBlock);
    }
    return sectionBlock(
      b,
      b.fields.filter((f) => !inLead(f.name, b.lead)),
    );
  });

// Whether a field is written in the text above the card (a section's or a block's lead); one written there only up to
// a block (`upTo`) is on the card too.
const inLead = (name: string, lead?: Lead) =>
  !!lead &&
  (name === lead.heading ||
    (name === lead.body && !lead.upTo) ||
    (!!lead.image && ['image', 'imageAlt', 'imageDecorative'].includes(name)));

// A section as a card: only the fields that are not written in the text above it (its lead).
// The icon of each type of section (a fixed page's own: text, booking, posts); others the icon of
// the blocks.
const sectionIcons: Record<string, Icon> = {
  text: TextAlignLeft,
  booking: CalendarCheck,
  posts: Newspaper,
};

const sectionBlock = (b: Block, fields: Field[]): SiteBlock => ({
  type: b.type,
  label: b.label,
  icon: sectionIcons[b.type] ?? SquaresFour,
  hint: b.hint,
  edit: b.edit,
  fields,
  lead: b.lead,
  written: b.type === 'text',
});

// What a piece of HTML is, for its card: a video from YouTube or Vimeo with its title, Calendly's calendar,
// a table; and the start of the code.
function htmlLines(code: string): string[] {
  const src = /<iframe[^>]*\ssrc="([^"]*)"/i.exec(code)?.[1] ?? '';
  const title = /\stitle="([^"]*)"/i.exec(code)?.[1];
  const what = /youtube\.com|youtu\.be/.test(src)
    ? t.blocks.html.youtube
    : /vimeo\.com/.test(src)
      ? t.blocks.html.vimeo
      : code.includes('calendly')
        ? t.blocks.html.calendly
        : /^<table/i.test(code.trim())
          ? t.blocks.html.table
          : '';
  const start = code.trim().replace(/\s+/g, ' ');
  return [what && title ? `${what}: ${title}` : what, start.length > 120 ? `${start.slice(0, 120)}…` : start];
}

/** HTML on a line of its own in the text, kept as it is (markdown.mjs). Put in on the pages; a card
 * wherever it is, also on the blog posts. */
export const htmlBlock: SiteBlock = {
  type: HTML,
  group: 'developer',
  label: t.blocks.html.label,
  icon: Code,
  hint: t.blocks.html.hint,
  fields: [{ name: 'code', label: t.blocks.html.code, type: 'text', required: true }],
  detail: (p) => htmlLines(String(p.code ?? '')),
  shown: true,
  standard: true,
};
