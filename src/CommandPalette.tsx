// The command palette (docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md): one search over the editor's actions, the places in
// the main menu and the pages and posts by title. Ctrl+K (⌘K on a Mac), also with the cursor in text, and the search button in the top bar (Screen.tsx
// SearchButton) open it. It is the theme's search view (theme/ui/Search.tsx SearchView): a modal <dialog>, full screen on a phone and docked from
// medium. Before typing it shows what was run last (Recent) and what is suggested; with a query, the results in groups, the current context's first.
// This component registers the places of the menu, the Settings screens, the lists' "New" actions and the pages and posts provider while it is mounted
// (src/actions.ts); the editor and the screens register their own actions (the text and block actions, step 6). What was run is kept in this
// browser only (paletteRecent.ts). Exposes CommandPalette.
import { useEffect, useMemo, useRef, useState } from 'react';
import { collectionsFor, companyParts, groups, icons, settings } from './site';
import { menuTree } from '../lib/menu.mjs';
import { emptyQuerySections, pushRecent, recentShown, type RecentState } from '../lib/actionRules.mjs';
import { actions, ctxGroups, goActions, pagesProvider, type ActionGroup, type Ctx, type EditorAction, type PaletteItem } from './actions';
import { childrenOf } from './menuChildren';
import { partOf } from './Library';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { openNotifications } from './notificationsOpen';
import type { IconRef } from './icon';
import { closePalette, togglePalette, usePaletteOpen } from './paletteOpen';
import { loadRecent, saveRecent } from './paletteRecent';
import { ariaShortcut, pressed, shortcutText } from './shortcuts';
import { SiteSearchView } from './themeUi';
import { t } from './i18n';
import type { RepoFile } from './github';

/** The Ctrl+K key (⌘K on a Mac): Mod is the Command key there. */
const KEY = 'Mod+K';

/** The pages and posts of the site: the files of the lists whose entries are texts, each by its title. */
function pagesOf(files: RepoFile[]) {
  const out: { path: string; title: string; href: string; list: string }[] = [];
  for (const c of collectionsFor(files)) {
    if (c.kind !== 'markdown') continue;
    for (const f of files) {
      if (!f.path.startsWith(`${c.folder}/`) || !f.path.endsWith('.md')) continue;
      const title = String(readFields(splitFrontmatter(f.text).yaml).title ?? '').trim();
      out.push({ path: f.path, title: title || f.path, href: `#${f.path}`, list: c.label });
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
    heading.focus({ preventScroll: true });
  };
  window.addEventListener('hashchange', () => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(focus, 0))), {
    once: true,
  });
}

/** The first actions of the menu, for the palette's *Suggested* where nothing is active (the text's and the block's come with the editor). */
const SUGGESTED_GO = 6;

export function CommandPalette({ route, files }: { route: string; files: RepoFile[] | null }) {
  const open = usePaletteOpen();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string | undefined>();
  const [recent, setRecent] = useState<RecentState>({ ids: [], counts: {} });
  const [version, setVersion] = useState(0);
  const all = files ?? [];
  const pages = useMemo(() => pagesOf(all), [files]);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const ctx: Ctx = { route };

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
      { id: 'go.notifications', label: t.library.notifications, icon: 'bell', group: 'go', where: {}, run: openNotifications },
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
    return () => {
      disposeActions();
      disposeProvider();
    };
  }, [files]);

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

  // Each time it opens: an empty field, and what this browser kept.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setRecent(loadRecent());
  }, [open]);
  // The registry changes while it is open (an editor registers its actions): the results follow.
  useEffect(() => actions.subscribe(() => setVersion((v) => v + 1)), []);

  /** An action by its id: a registered one, or a page the provider knows (a recent page that is gone is not found). */
  const resolve = (id: string): EditorAction | undefined => {
    const found = actions.get(id);
    if (found) return found;
    if (!id.startsWith('go.page:')) return undefined;
    const page = pages.find((p) => `go.page:${p.path}` === id);
    return (
      page && {
        id,
        label: page.title,
        path: page.list,
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
    icon: iconOf(item.action),
    shortcut: item.action.shortcut ? shortcutText(item.action.shortcut.key) : undefined,
    keyShortcuts: item.action.shortcut ? ariaShortcut(item.action.shortcut.key) : undefined,
    disabled: item.disabled,
    pressed: item.pressed,
  });
  const asEntry = (action: EditorAction) => asItem({ action, disabled: false, score: 0 });

  const results = useMemo(() => {
    void version;
    if (!open) return [];
    if (query.trim()) {
      return actions
        .search(query, ctx, { recent: recent.ids, counts: recent.counts, groupLabels: labels })
        .map((g) => ({ id: g.group, label: labels[g.group], items: g.items.map(asItem) }));
    }
    // Before typing: what was run last, and what is suggested (the active block's, the text's, else the first places of the menu).
    const lastRun = recentShown(recent, (id) => !!resolve(id))
      .map((id) => resolve(id)!)
      .map(asEntry);
    const inContext = ctxGroups(ctx);
    const suggested = actions
      .all()
      .filter((a) => a.where.palette !== false && (inContext.length ? inContext.includes(a.group) : a.group === 'go'))
      .map(asEntry)
      .filter((i) => !lastRun.some((r) => r.id === i.id));
    return emptyQuerySections({
      blockActive: !!ctx.block,
      suggested: inContext.length ? suggested : suggested.slice(0, SUGGESTED_GO),
      recent: lastRun,
    }).map((s) => ({ id: s.section, label: t.palette[s.section], items: s.items }));
  }, [open, query, recent, version, pages]);

  const flat = results.flatMap((g) => g.items);
  const count = flat.length;
  // The first option is the one the arrow keys are on, after each change of what is written or shown.
  const first = flat[0]?.id;
  useEffect(() => setActive(first), [first, open]);

  const activate = (id: string) => {
    const action = resolve(id);
    if (!action) return;
    const next = pushRecent(loadRecent(), id);
    saveRecent(next);
    setRecent(next);
    closePalette();
    // The view closes and gives the focus back first; then the action runs (a screen change, an editor command).
    requestAnimationFrame(() => {
      const before = location.hash;
      action.run(ctx);
      if (location.hash !== before) focusHeadingOfNextScreen();
    });
  };

  return (
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
    />
  );
}
