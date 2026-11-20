// The editor's one list of actions (docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md, section 3): every action defined
// once, with its name, icon, shortcut, places (the bar, its ⋮, the block action row, the palette), when it can run and what it does. A screen or
// editor registers its actions while it is mounted and disposes them when it goes; a provider gives actions for a query (the pages and posts by
// title), so they are not thousands of registered entries. No UI: the palette (CommandPalette.tsx) and, later, the bar read it.
// The rules are pure and tested in lib/actionRules.mjs; this file keeps the list and turns the menu, the blocks and the site's files into actions.
// Exposes EditorAction, ActionGroup, Ctx, ActionState, ActionProvider, PaletteItem, createRegistry, actions (the editor's one registry),
// ctxGroups, goActions, insertActions, changeToActions, pagesProvider.
import {
  contextGroupsOf,
  iconProblems,
  matchAction,
  orderGroups,
  paletteState,
  placeProblems,
  rankActions,
  shortcutConflicts,
} from '../lib/actionRules.mjs';

/** The palette's groups; `pages` holds the pages and posts a provider gives, `files` the images and files. */
export type ActionGroup =
  'go' | 'pages' | 'files' | 'page' | 'text' | 'section' | 'insert' | 'block' | 'image' | 'table' | 'list' | 'setting' | 'app';

/** Where the user is now. The same Ctx drives the bar, its ⋮ and the palette, so an action is disabled in all of them at once. */
export type Ctx = {
  route: string;
  /** The cursor or a selection is in text. */
  text?: boolean;
  /** The text is in a section (Section settings apply). */
  section?: boolean;
  /** A block is active or selected: its type. */
  block?: string | null;
  image?: boolean;
  table?: boolean;
  /** A row of a repeating block (List, Cards, Steps …) is active. */
  list?: boolean;
  /** Rows of a list screen, or blocks, are selected. */
  selection?: boolean;
  /** Some text is selected (not only a cursor). */
  hasSelection?: boolean;
  /** What applies where the cursor is in a text (activeOf: strong, emphasis, link, h2, bullet, alignable …). */
  active?: string[];
  /** The heading levels the text may have (1, 2, 3). */
  levels?: number[];
  canUndo?: boolean;
  canRedo?: boolean;
};

export type ActionState = 'enabled' | 'disabled' | 'hidden';

/** A place of the bar or its ⋮: when it shows (`Context`) and its order there. */
type BarPlace = { context: 'text' | 'block' | 'image' | 'table' | 'list' | 'section' | 'fixed'; order: number };

export type EditorAction = {
  /** Stable, stored in recent: 'text.bold', 'block.move-up', 'go.files'. */
  id: string;
  /** The same text on every surface (t.actions.* once step 5 brings the texts). */
  label: string;
  /** A Material Symbols name, drawn through Icon (src/icon.tsx); one icon per meaning (section 3.1). */
  icon?: string;
  /** What the icon means, for the one-icon-per-meaning test: 'settings-here', 'settings-editor', 'settings-app', 'edit-elsewhere' … */
  meaning?: string;
  group: ActionGroup;
  /** Other names to search, in English and the editor's languages. */
  words?: string[];
  /** Where it is, under the name in the palette ("Settings › Caching and builds"). */
  path?: string;
  /** 'Mod+K': Mod is ⌘ on a Mac, Ctrl elsewhere. */
  shortcut?: { key: string };
  /** Who listens to the key: 'text' is the text engine's keymap, which keeps it; the registry only shows it. */
  handledBy?: 'registry' | 'text';
  /** Which places show it, and in what order. At most one of bar, more and row. */
  where: {
    bar?: BarPlace;
    more?: BarPlace;
    row?: { order: number };
    /** Default true. */
    palette?: boolean | { rank?: number };
  };
  /** Default 'enabled'. */
  state?: (ctx: Ctx) => ActionState;
  /** Why it is disabled now ("Nothing to redo"). */
  reason?: (ctx: Ctx) => string | undefined;
  /** A toggle (Bold) or the current choice (Align centre). */
  pressed?: (ctx: Ctx) => boolean;
  run: (ctx: Ctx) => void;
  /** A page, post, image or file a provider gave (ranked under actions on a tie). */
  kind?: 'action' | 'page' | 'image' | 'file';
  /** A picture of an image a provider gave, drawn leading its row in the palette (M3 lists: a leading image). */
  thumb?: string;
};

/** Actions for a query, given on demand. */
export type ActionProvider = (query: string, ctx: Ctx) => EditorAction[];

/** One result of the palette. */
export type PaletteItem = { action: EditorAction; disabled: boolean; reason?: string; pressed?: boolean; score: number };

/** The palette's context groups for where the user is. */
export function ctxGroups(ctx: Ctx): ActionGroup[] {
  return contextGroupsOf({
    text: ctx.text,
    section: ctx.section,
    block: !!ctx.block,
    image: ctx.image,
    table: ctx.table,
    list: ctx.list,
  }) as ActionGroup[];
}

const stateOf = (action: EditorAction, ctx: Ctx): ActionState => action.state?.(ctx) ?? 'enabled';
const inPalette = (action: EditorAction) => action.where.palette !== false;

/** A registry: register and dispose actions and providers, read the actions of a place, and search them. */
export function createRegistry() {
  const actions = new Map<string, EditorAction>();
  const providers = new Set<ActionProvider>();
  const listeners = new Set<() => void>();
  const changed = () => listeners.forEach((fn) => fn());

  /** Adds actions; returns the function that removes them again. An entry in two of bar, more and row, or an id already in, throws. */
  function register(list: EditorAction | EditorAction[]): () => void {
    const entries = Array.isArray(list) ? list : [list];
    for (const a of entries) {
      const problem = placeProblems(a);
      if (problem) throw new Error(problem);
      if (actions.has(a.id)) throw new Error(`${a.id} is registered already`);
    }
    for (const a of entries) actions.set(a.id, a);
    changed();
    return () => {
      for (const a of entries) if (actions.get(a.id) === a) actions.delete(a.id);
      changed();
    };
  }

  /** Adds a provider; returns the function that removes it. */
  function provide(provider: ActionProvider): () => void {
    providers.add(provider);
    changed();
    return () => {
      providers.delete(provider);
      changed();
    };
  }

  /** Every registered action, in the order registered. */
  const all = () => [...actions.values()];

  /** The problems of the registered actions: shared keys, keys the browser keeps, and one icon per meaning. */
  const problems = () => {
    const list = all();
    return [...shortcutConflicts(list), ...iconProblems(list)];
  };

  /** The actions of one place for where the user is, in their order there; hidden ones left out. */
  function inPlace(place: 'bar' | 'more' | 'row', ctx: Ctx, context?: BarPlace['context']) {
    return all()
      .filter((a) => {
        const p = a.where[place];
        if (!p) return false;
        if (context && 'context' in p && p.context !== context) return false;
        return stateOf(a, ctx) !== 'hidden';
      })
      .sort((a, b) => (a.where[place]?.order ?? 0) - (b.where[place]?.order ?? 0));
  }

  /** The palette's results for a query, in their groups (section 4.1): the current context's actions first, disabled ones only there. */
  function search(
    query: string,
    ctx: Ctx,
    opts: {
      recent?: string[];
      counts?: Record<string, number>;
      groupLabels?: Partial<Record<ActionGroup, string>>;
      /** More or fewer results than the default cap (the filter chips count all of them). */
      cap?: number;
      /** Only these (a filter chip), chosen before the cap, so it never loses its results to the others'. */
      only?: (action: EditorAction) => boolean;
    } = {},
  ) {
    const context = ctxGroups(ctx);
    const given = [...providers].flatMap((p) => p(query, ctx));
    const shown = new Map<string, PaletteItem>();
    for (const action of [...all(), ...given]) {
      if (!inPalette(action) || shown.has(action.id) || (opts.only && !opts.only(action))) continue;
      const how = paletteState(stateOf(action, ctx), action.group, context);
      if (how === 'left-out') continue;
      const disabled = how === 'disabled';
      shown.set(action.id, {
        action,
        disabled,
        reason: disabled ? action.reason?.(ctx) : undefined,
        pressed: action.pressed?.(ctx),
        score: 0,
      });
    }
    const entries = [...shown.values()].map((item) => ({ ...item.action, item }));
    const ranked = rankActions(entries, query, {
      context,
      recent: opts.recent,
      counts: opts.counts,
      groupLabels: opts.groupLabels,
      cap: opts.cap,
    }).map(({ entry, score }) => ({
      entry,
      item: { ...(entry as (typeof entries)[number]).item, score },
    }));
    return orderGroups(ranked, context).map(({ group, items }) => ({ group, items: items.map((r) => r.item) }));
  }

  /** Calls `fn` when actions or providers change; returns the function that stops it. */
  function subscribe(fn: () => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  }

  return { register, provide, all, problems, inPlace, search, subscribe, get: (id: string) => actions.get(id) };
}

export type Registry = ReturnType<typeof createRegistry>;

/** The editor's one registry. */
export const actions: Registry = createRegistry();

// What the editor turns into actions -------------------------------------------------------------------------------

/** The main menu as menuTree gives it (lib/menu.mjs). */
type MenuSection = {
  id: string;
  label: string;
  href?: string;
  items: { id: string; label: string; href: string; children?: { id: string; label: string; href: string }[] }[];
};

/**
 * A "Go to" action for every place of the main menu: each section with an address, each row and each row's children. The rows under Apps
 * are `app` actions (an installed app's pages are in the menu, so they appear with no work); `settings` are the Settings screens (the cog).
 */
export function goActions(
  tree: MenuSection[],
  navigate: (href: string) => void,
  settings: { id: string; label: string; href: string }[] = [],
  settingsLabel = '',
): EditorAction[] {
  const out = new Map<string, EditorAction>();
  const add = (id: string, label: string, href: string, group: ActionGroup, path?: string) => {
    const key = `go.${id}`;
    if (out.has(key)) return;
    out.set(key, { id: key, label, group, path, where: {}, run: () => navigate(href) });
  };
  for (const section of tree) {
    const group: ActionGroup = section.id === 'apps' ? 'app' : 'go';
    if (section.href !== undefined) add(section.id, section.label, section.href, group);
    for (const item of section.items) {
      add(item.id, item.label, item.href, group, section.label);
      for (const child of item.children ?? []) add(child.id, child.label, child.href, group, `${section.label} › ${item.label}`);
    }
  }
  for (const s of settings) add(s.id, s.label, s.href, 'setting', settingsLabel || undefined);
  return [...out.values()];
}

/** The blocks as the editor knows them (SiteBlock, src/blocks.ts): only what an action needs. */
type BlockInfo = { type: string; label: string; group?: string; written?: boolean; former?: boolean };

/** One *Insert <block>* action per block that can be put in (not a page's own written text, not a former block), in the blocks' order. */
export function insertActions(
  blocks: BlockInfo[],
  insert: (type: string) => void,
  labelOf: (block: BlockInfo) => string,
  groupLabel: (group: string | undefined) => string | undefined = () => undefined,
): EditorAction[] {
  return blocks
    .filter((b) => !b.written && !b.former)
    .map((b) => ({
      id: `insert.${b.type}`,
      label: labelOf(b),
      words: [b.label],
      group: 'insert' as const,
      path: groupLabel(b.group),
      where: {},
      run: () => insert(b.type),
    }));
}

/**
 * One *Change to <block>* action per block the active block can become (lib/changeTo.mjs `targets`, the same limits as its ⋮ menu), in the menu's order:
 * the ids are `block.change-to-<type>`, group Block, so typing "change" or the block's name finds it; no key. The editor registers them while a block is active.
 */
export function changeToActions(
  to: { type: string; label: string }[],
  change: (type: string, label: string) => void,
  labelOf: (name: string) => string,
  words: string[] = [],
): EditorAction[] {
  return to.map((b) => ({
    id: `block.change-to-${b.type}`,
    label: labelOf(b.label),
    icon: 'swap_horiz',
    meaning: 'change-to',
    words: [...words, b.label],
    group: 'block' as const,
    where: {},
    run: () => change(b.type, b.label),
  }));
}

/** A page or post of the site: its title, its address in the editor, and the list it is in. */
type PageInfo = { path: string; title: string; href: string; list?: string; icon?: string };

/**
 * The pages and posts by title (and address), for a query: a provider, so a site with thousands of pages registers none. Nothing before typing.
 * The ids are `go.page:<path>`, which recent stores and drops when the page is gone.
 */
export function pagesProvider(pages: () => PageInfo[], open: (href: string) => void): ActionProvider {
  return (query) => {
    if (!query.trim()) return [];
    return pages()
      .map((p): EditorAction => ({
        id: `go.page:${p.path}`,
        label: p.title,
        words: [p.path],
        path: p.list,
        icon: p.icon,
        group: 'pages',
        kind: 'page',
        where: {},
        run: () => open(p.href),
      }))
      .filter((a) => matchAction(a, query));
  };
}

/** An image or a file (a PDF, a video, a zip file) of the site: its name, its address on the site (an image is drawn as its picture), and what it is. */
type FileInfo = { path: string; name: string; src: string; kind: 'image' | 'file'; icon: string; what: string };

/**
 * The images and files by name, for a query (a provider, like the pages): they run to the Files screen. Nothing before typing.
 * The ids are `go.file:<path>`, which recent stores and drops when the file is gone.
 */
export function filesProvider(files: () => FileInfo[], open: () => void): ActionProvider {
  return (query) => {
    if (!query.trim()) return [];
    return files()
      .map((f): EditorAction => ({
        id: `go.file:${f.path}`,
        label: f.name,
        words: [f.path],
        path: f.what,
        icon: f.icon,
        thumb: f.kind === 'image' ? f.src : undefined,
        group: 'files',
        kind: f.kind,
        where: {},
        run: open,
      }))
      .filter((a) => matchAction(a, query));
  };
}
