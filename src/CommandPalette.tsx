// The command palette (docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md): one search over the editor's actions, the places in
// the main menu and the pages and posts by title. Ctrl+K (⌘K on a Mac), also with the cursor in text, and the search button in the top bar (Screen.tsx
// SearchButton) open it. It is the theme's search view (theme/ui/Search.tsx SearchView): a modal <dialog>, full screen on a phone and docked from
// medium. Before typing it shows what was run last (Recent) and what is suggested; with a query, the results in groups, the current context's first.
// Look and behaviour follow M3's search (m3.material.io/components/search): before typing it shows the searches typed before (history icon, a button
// that removes each; kept in this browser only, paletteRecent.ts) over what was run last and what is suggested; with a query, filter chips (Actions,
// Pages, Posts, Images, Files) narrow the groups, the first results are shown with a last row that shows all of them, and each row leads with an icon
// or the picture of an image. This component registers the places of the menu, the Settings screens, the lists' "New" actions and the pages and posts provider while it is mounted
// (src/actions.ts); the editor and the screens register their own actions (the text and block actions, step 6). What was run is kept in this
// browser only (paletteRecent.ts). Exposes CommandPalette.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { collectionsFor, companyParts, groups, icons, settings } from './site';
import { menuTree } from '../lib/menu.mjs';
import { emptyQuerySections, paletteState, pushRecent, recentShown, type RecentState } from '../lib/actionRules.mjs';
import {
  actions,
  ctxGroups,
  filesProvider,
  goActions,
  pagesProvider,
  type ActionGroup,
  type Ctx,
  type EditorAction,
  type PaletteItem,
} from './actions';
import { blockBar } from './blockBar';
import { blockCtx } from './blockActionList';
import { watchBlockActions } from './blockActions';
import { editorCtx, useEditorCtx } from './editorCtx';
import { childrenOf } from './menuChildren';
import { partOf } from './Library';
import { filesOf, mediaOf } from './Media';
import { kindOf } from './FileView';
import { publicPath, shownAt } from './images';
import { pushSearch, removeSearch, searchesShown } from '../lib/recentSearches.mjs';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { openNotifications } from './notificationsOpen';
import type { IconRef } from './icon';
import { closePalette, togglePalette, usePaletteOpen } from './paletteOpen';
import { forgetRecent, loadRecent, loadSearches, saveRecent, saveSearches } from './paletteRecent';
import { ShortcutsSheet, showShortcuts } from './ShortcutsSheet';
import { ariaShortcut, pressed, shortcutText } from './shortcuts';
import { SiteSearchView, type SearchViewItem } from './themeUi';
import { t } from './i18n';
import type { RepoFile } from './github';

/** The Ctrl+K key (⌘K on a Mac): Mod is the Command key there. */
const KEY = 'Mod+K';

/** The pages and posts of the site: the files of the lists whose entries are texts, each by its title. */
function pagesOf(files: RepoFile[]) {
  const out: { path: string; title: string; href: string; list: string; icon: string; collection: string }[] = [];
  for (const c of collectionsFor(files)) {
    if (c.kind !== 'markdown') continue;
    for (const f of files) {
      if (!f.path.startsWith(`${c.folder}/`) || !f.path.endsWith('.md')) continue;
      const title = String(readFields(splitFrontmatter(f.text).yaml).title ?? '').trim();
      out.push({
        path: f.path,
        title: title || f.path,
        href: `#${f.path}`,
        list: c.label,
        icon: c.id === 'pages' ? 'description' : 'newspaper',
        collection: c.id,
      });
    }
  }
  return out;
}

/** A "Go to" action moves to its screen and the focus goes to that screen's heading (spec section 4.2): once the address has changed and the screen is
 * drawn, the heading that is shown (a screen has one in the top bar and one under it, and only one is shown) takes the focus. */
function focusHeadingOfNextScreen() {
  const focus = () => {
    const heading = [...document.querySelectorAll<HTMLElement>('h1')].find((h) => h.getClientRects().length > 0);
    if (!heading) return;
    heading.tabIndex = -1;
    // The title is not a control: it takes the focus for screen readers without a ring.
    heading.style.outline = 'none';
    heading.focus({ preventScroll: true });
  };
  window.addEventListener('hashchange', () => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(focus, 0))), {
    once: true,
  });
}

/** The images, PDFs, videos and zip files of the site, by name: an image leads its row with its picture, a file with the icon of its type. */
function filesInfo(files: RepoFile[]) {
  return [...mediaOf(files), ...filesOf(files)].flatMap((f) => {
    const src = publicPath(f.path);
    const kind = kindOf(src);
    if (kind === 'image' && !/\.(png|jpe?g|webp|avif|gif|svg)$/i.test(f.path)) return [];
    const word = t.media.kinds[kind].word;
    return [
      {
        path: f.path,
        name: f.path.split('/').pop() ?? f.path,
        src: shownAt(src),
        kind: kind === 'image' ? ('image' as const) : ('file' as const),
        icon: { image: 'image', pdf: 'picture_as_pdf', video: 'video_file', zip: 'folder_zip' }[kind],
        what: word.charAt(0).toUpperCase() + word.slice(1),
      },
    ];
  });
}

/** The icon of a row whose action names none: its group's, so every row leads with an icon (M3 lists: "Leading icons related to suggestions"). */
const GROUP_ICONS: Record<ActionGroup, string> = {
  go: 'arrow_forward',
  pages: 'description',
  files: 'image',
  page: 'description',
  text: 'text_fields',
  section: 'table_rows',
  insert: 'add',
  block: 'cube',
  table: 'table',
  image: 'image',
  list: 'list',
  setting: 'settings',
  app: 'extension',
};

/** The ids of the rows that are not an action: a search typed before (`search:<query>`), and the last row. */
const SEARCH = 'search:';
const ALL = 'all-results';
type ItemOf = SearchViewItem;

/** The first results a query shows; the last row shows the rest (M3: "Show search results in a compact, organized list"). */
const QUICK = 8;

/** The filter chips, in order, and what each lets through. A page is told from a post by the list it is in (the list of pages is `pages`). */
const FILTERS = ['actions', 'pages', 'posts', 'images', 'files'] as const;
type Filter = (typeof FILTERS)[number];
const FILTER_ICONS: Record<Filter, string> = {
  actions: 'bolt',
  pages: 'description',
  posts: 'newspaper',
  images: 'image',
  files: 'picture_as_pdf',
};

/** The first actions of the menu, for the palette's *Suggested* where nothing is active (the text's and the block's come with the editor). */
const SUGGESTED_GO = 6;

export function CommandPalette({ route, files }: { route: string; files: RepoFile[] | null }) {
  const open = usePaletteOpen();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string | undefined>();
  const [recent, setRecent] = useState<RecentState>({ ids: [], counts: {} });
  const [version, setVersion] = useState(0);
  // The searches typed before (this browser only), the chosen filter chip, and whether all the results of the query are shown.
  const [searches, setSearches] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter | null>(null);
  const [showAll, setShowAll] = useState(false);
  // Where the dropdown (from medium) stands: on the search bar of the top bar when the screen has one, else under the search button, at its end.
  const [dock, setDock] = useState<{ top: number; left: number; width: number } | undefined>();
  const all = files ?? [];
  const pages = useMemo(() => pagesOf(all), [files]);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const media = useMemo(() => filesInfo(all), [files]);
  const mediaRef = useRef(media);
  mediaRef.current = media;
  // Where the user is: the screen, the text (editorCtx.ts) and the active block (blockBar.ts).
  const editor = useEditorCtx();
  const barState = useSyncExternalStore(blockBar.subscribe, blockBar.get, () => null);
  const inBlock = blockCtx(barState);
  const ctx: Ctx = {
    route,
    text: editor.text,
    section: editor.section,
    active: editor.active,
    levels: editor.levels,
    block: inBlock.block,
    table: inBlock.table,
    image: inBlock.image,
  };

  // The places of the menu, the Settings screens, "New page" and "New post", and the bell, as actions while the editor is open.
  useEffect(() => {
    const navigate = (href: string) => void (location.hash = href);
    const tree = menuTree(
      groups,
      (id: string) => partOf(id, all),
      (id: string) => childrenOf(id, all),
    );
    const rows = settings.map((id) => ({ id, ...partOf(id, all) }));
    const list: EditorAction[] = [
      ...goActions(tree, navigate, rows, t.common.parts.settings),
      {
        id: 'go.settings',
        label: t.common.parts.settings,
        icon: 'settings',
        meaning: 'settings-editor',
        group: 'setting',
        where: {},
        run: () => navigate('#settings'),
      },
      {
        id: 'help.shortcuts',
        label: t.palette.shortcuts,
        icon: 'keyboard',
        group: 'setting',
        where: {},
        words: ['keys', 'hotkeys'],
        run: showShortcuts,
      },
      {
        id: 'palette.clear-recent',
        label: t.palette.clearRecent,
        icon: 'delete',
        group: 'setting',
        where: {},
        run: () => {
          forgetRecent();
          setRecent(loadRecent());
        },
      },
      { id: 'go.notifications', label: t.library.notifications, icon: 'notifications', group: 'go', where: {}, run: openNotifications },
      ...collectionsFor(all).flatMap((c): EditorAction[] =>
        c.kind === 'markdown' && c.create
          ? [{ id: `go.new-${c.id}`, label: c.create, icon: 'add', group: 'pages', where: {}, run: () => navigate(`#new/${c.id}`) }]
          : [],
      ),
    ];
    // One action per id, and none that something else registered already.
    const unique = list.filter((a, i) => list.findIndex((b) => b.id === a.id) === i && !actions.get(a.id));
    const disposeActions = actions.register(unique);
    const disposeProvider = actions.provide(
      pagesProvider(
        () => pagesRef.current,
        (href) => void (location.hash = href),
      ),
    );
    const disposeFiles = actions.provide(
      filesProvider(
        () => mediaRef.current,
        () => void (location.hash = '#files'),
      ),
    );
    return () => {
      disposeActions();
      disposeProvider();
      disposeFiles();
    };
  }, [files]);

  // The active block's actions are registered while it is active (blockActions.ts).
  useEffect(() => watchBlockActions(), []);

  // Ctrl+K (⌘K) from anywhere, also in text: it is taken before the text engine sees it, and the browser's own search for the key stays away.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!pressed(e, KEY)) return;
      e.preventDefault();
      e.stopPropagation();
      togglePalette();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // The field is emptied when it closes, so the next time it opens it never shows the last search for a moment; and what this browser kept is read when it opens.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setFilter(null);
      return;
    }
    setRecent(loadRecent());
    setSearches(loadSearches());
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const shown = (el: Element) => el.getClientRects().length > 0;
    const bar = [...document.querySelectorAll<HTMLElement>('header .mo-search-bar')].find(shown);
    const button = [...document.querySelectorAll<HTMLElement>('header button[aria-label="Search"]')].find(shown);
    const box = (bar ?? button)?.getBoundingClientRect();
    if (!box) return setDock(undefined);
    // M3 specs: a docked container is 360dp to 720dp wide; under the button it is 576 and ends where the button ends.
    const width = bar ? Math.min(720, Math.max(360, box.width)) : Math.min(576, innerWidth - 16);
    setDock({ top: box.top, left: bar ? box.left : Math.max(8, box.right - width), width });
  }, [open]);
  // Another query starts again from the first results.
  useEffect(() => setShowAll(false), [query, filter]);
  // The registry changes while it is open (an editor registers its actions): the results follow.
  useEffect(() => actions.subscribe(() => setVersion((v) => v + 1)), []);

  /** An action by its id: a registered one, or a page the provider knows (a recent page that is gone is not found). */
  const resolve = (id: string): EditorAction | undefined => {
    const found = actions.get(id);
    if (found) return found;
    if (id.startsWith('go.file:')) {
      const file = media.find((f) => `go.file:${f.path}` === id);
      return (
        file && {
          id,
          label: file.name,
          path: file.what,
          icon: file.icon,
          thumb: file.kind === 'image' ? file.src : undefined,
          group: 'files',
          kind: file.kind,
          where: {},
          run: () => void (location.hash = '#files'),
        }
      );
    }
    if (!id.startsWith('go.page:')) return undefined;
    const page = pages.find((p) => `go.page:${p.path}` === id);
    return (
      page && {
        id,
        label: page.title,
        path: page.list,
        icon: page.icon,
        group: 'pages',
        kind: 'page',
        where: {},
        run: () => void (location.hash = page.href),
      }
    );
  };

  const labels = t.palette.groups as Record<ActionGroup, string>;
  // A place of the menu has the icon the menu draws for it (a component: the pack in use redraws it); other actions name theirs.
  const iconOf = (action: EditorAction): IconRef | undefined => {
    if (action.icon) return action.icon;
    const id = action.id.startsWith('go.') ? action.id.slice('go.'.length) : '';
    const Glyph = (id && (companyParts.find((p) => p.id === id)?.icon ?? icons[id])) || undefined;
    return Glyph ? <Glyph /> : undefined;
  };
  const asItem = (item: PaletteItem) => ({
    id: item.action.id,
    headline: item.action.label,
    supporting: item.disabled && item.reason ? item.reason : item.action.path,
    icon: iconOf(item.action) ?? GROUP_ICONS[item.action.group],
    thumb: item.action.thumb,
    shortcut: item.action.shortcut ? shortcutText(item.action.shortcut.key) : undefined,
    keyShortcuts: item.action.shortcut ? ariaShortcut(item.action.shortcut.key) : undefined,
    disabled: item.disabled,
    pressed: item.pressed,
  });
  // An action as an entry before typing: its state now (a disabled one of the current context is shown with its reason), and nothing for a hidden one.
  const asEntry = (action: EditorAction, inContext: ActionGroup[] = ctxGroups(ctx)) => {
    const state = action.state?.(ctx) ?? 'enabled';
    if (paletteState(state, action.group, inContext) === 'left-out') return null;
    const disabled = state === 'disabled';
    return asItem({ action, disabled, reason: disabled ? action.reason?.(ctx) : undefined, pressed: action.pressed?.(ctx), score: 0 });
  };

  /** Whether a result passes the chosen filter chip. */
  const passes = (action: EditorAction | undefined, chip: Filter | null) => {
    if (!chip || !action) return true;
    if (chip === 'images') return action.kind === 'image';
    if (chip === 'files') return action.kind === 'file';
    const page = action.id.startsWith('go.page:') ? pages.find((p) => `go.page:${p.path}` === action.id) : undefined;
    if (chip === 'pages') return page?.collection === 'pages';
    if (chip === 'posts') return !!page && page.collection !== 'pages';
    return !action.kind || action.kind === 'action';
  };

  const results = useMemo(() => {
    void version;
    if (!open) return [];
    const typed = query.trim();
    if (typed) {
      const found = actions
        .search(typed, ctx, { recent: recent.ids, counts: recent.counts, groupLabels: labels, only: (a) => passes(a, filter) })
        .filter((g) => g.items.length > 0);
      const total = found.reduce((n, g) => n + g.items.length, 0);
      // The first results, in their groups; the last row shows the rest.
      let room = showAll ? Infinity : QUICK;
      const shown = found.flatMap((g): { id: string; label: string; items: ItemOf[] }[] => {
        const items = g.items.slice(0, Math.max(0, room));
        room -= items.length;
        return items.length ? [{ id: g.group, label: labels[g.group], items: items.map(asItem) }] : [];
      });
      if (total > QUICK && !showAll)
        shown.push({
          id: 'all',
          label: '',
          items: [
            {
              id: ALL,
              headline: t.palette.allResults(typed),
              supporting: t.palette.allResultsCount(total),
              icon: 'search',
            } as ItemOf,
          ],
        });
      return shown;
    }
    // Before typing: the searches typed before, what was run last, and what is suggested (the active block's, the text's, else the first places of the menu).
    const lastRun = recentShown(recent, (id) => !!resolve(id))
      .map((id) => resolve(id)!)
      .flatMap((a) => asEntry(a) ?? []);
    const inContext = ctxGroups(ctx);
    const suggested = actions
      .all()
      .filter((a) => a.where.palette !== false && (inContext.length ? inContext.includes(a.group) : a.group === 'go'))
      .flatMap((a) => asEntry(a, inContext) ?? [])
      .filter((i) => !lastRun.some((r) => r.id === i.id));
    const typedBefore = searchesShown(searches).map((q): ItemOf => ({
      id: `${SEARCH}${q}`,
      headline: q,
      icon: 'history',
      onRemove: () => forget(q),
      removeLabel: t.palette.removeSearch(q),
    }));
    return [
      ...(typedBefore.length ? [{ id: 'searches', label: t.palette.recentSearches, items: typedBefore }] : []),
      ...emptyQuerySections({
        blockActive: !!ctx.block,
        suggested: inContext.length ? suggested : suggested.slice(0, SUGGESTED_GO),
        recent: lastRun,
      }).map((s) => ({ id: s.section, label: t.palette[s.section], items: s.items })),
    ];
  }, [open, query, recent, searches, filter, showAll, version, pages, media, editor, barState]);

  /** Takes a search out of the ones kept. */
  const forget = (q: string) => {
    const next = removeSearch(loadSearches(), q);
    saveSearches(next);
    setSearches(next);
  };

  // The filter chips, once something is typed: a chip with nothing behind it cannot be pressed.
  const typed = query.trim();
  const counts = useMemo(() => {
    if (!typed) return null;
    // Every hit, not only the first 30: a chip's count is what it would show.
    const found = actions
      .search(typed, ctx, { recent: recent.ids, counts: recent.counts, groupLabels: labels, cap: Infinity })
      .flatMap((g) => g.items);
    return Object.fromEntries(FILTERS.map((f) => [f, found.filter((i) => passes(i.action, f)).length])) as Record<Filter, number>;
  }, [typed, version, pages, media, recent]);
  const filters = typed
    ? FILTERS.map((id) => ({ id, label: t.palette.filters[id], icon: FILTER_ICONS[id], disabled: !counts?.[id] && filter !== id }))
    : undefined;

  const flat = results.flatMap((g) => g.items);
  const count = flat.length;
  // Nothing is highlighted when it opens or the results change: the arrow keys (or the pointer) move there, and Enter with a query runs the first result.
  const first = flat[0]?.id;
  useEffect(() => setActive(undefined), [first, open]);

  /** Keeps what is typed as a search, once a result or the last row is chosen with something written. */
  const keepSearch = () => {
    if (!query.trim()) return;
    const next = pushSearch(loadSearches(), query);
    saveSearches(next);
    setSearches(next);
  };

  const activate = (id: string) => {
    // A search typed before runs again: it goes into the field, and the results follow.
    if (id.startsWith(SEARCH)) return setQuery(id.slice(SEARCH.length));
    // The last row shows all the results of the query, and keeps it among the searches.
    if (id === ALL) {
      keepSearch();
      return setShowAll(true);
    }
    const action = resolve(id);
    if (!action) return;
    keepSearch();
    const next = pushRecent(loadRecent(), id);
    saveRecent(next);
    setRecent(next);
    closePalette();
    // The view closes and gives the focus back first; then the action runs (a screen change, an editor command).
    requestAnimationFrame(() => {
      const before = location.hash;
      // A text action takes the focus back to the text first: the selection is the one it had when the palette opened.
      if (action.group === 'text' || action.group === 'section' || action.group === 'insert') editorCtx.focus();
      action.run(ctx);
      if (location.hash !== before) focusHeadingOfNextScreen();
    });
  };

  return (
    <>
      <SiteSearchView
        open={open}
        onClose={closePalette}
        label={t.palette.label}
        backLabel={t.palette.back}
        clearLabel={t.palette.clear}
        emptyText={t.palette.empty(query.trim())}
        liveText={open ? (count ? t.palette.count(count) : query.trim() ? t.palette.none : '') : ''}
        query={query}
        onQueryChange={setQuery}
        groups={results}
        activeId={active}
        onActiveChange={setActive}
        onActivate={activate}
        dock={dock}
        filters={filters}
        filtersLabel={t.palette.filtersLabel}
        filter={filter}
        onFilterChange={(id) => setFilter(id as Filter | null)}
      />
      <ShortcutsSheet />
    </>
  );
}
