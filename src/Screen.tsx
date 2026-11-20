// A screen of the editor: a top bar like in an app, beside the navigation rail and the drawer (it is drawn into
// topBarSlot.tsx's place, at the top of the content), above the content. Below medium, where there is no rail, the panel
// button at its start opens and closes the main drawer (MainMenu.tsx, menuOpen.ts; from medium it is the rail's; not on a screen with a back arrow); at expanded and wider the logo and the site's name after it (one link to the start screen,
// through `back.guard`), below expanded the back arrow, the title and the status as in an app (the logo only on the start
// screen); at the end the page actions (below expanded), the actions and the notifications, on every screen, and on the start screen (`home`) the link to the
// website. At expanded and wider the way here as breadcrumbs (the screen above, when that is not the start
// screen), the title and the status stand in a row under the bar, at the top of the content, and the page actions
// (`pageActions`) at the end of that row. The bar stays at the top while
// scrolling and keeps clear of a phone's notch. A screen's tabs (`tabs`) are the bottom of the bar, under the title, as wide
// as the content, and stay with it. The back arrow goes to the screen above, back in the history when that is the screen
// before (nav.ts up). The content is as wide as the site's text column, or wider for
// a form with its fields beside the text (`panel`). The column (editor.css .mo-editor-column) stands centred on the window,
// off-centre only as far as the panels beside it require.
// Under the content of every screen is the editor's footer (EditorFooter.tsx), at the bottom of the window when the content
// is short (the screen fills the column under the bar, TopBarLayout). While the screen has a floating action button
// (fabPresence.tsx), the content leaves room for it above the footer (data-clearance, --mo-comp-fab-room) and the FAB stands above the
// footer whenever the footer is in the window (useFabLift: --mo-comp-editor-fab-lift, editor.css), so it never covers the footer.
import { useContext, useId, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bell, CaretRight, ArrowSquareOut } from '@phosphor-icons/react';
import { t } from './i18n';
import {
  IconButton,
  IconLink,
  MenuButton,
  SearchBarButton,
  TabPanel,
  TabRow,
  TopAppBar,
  useAtLeast,
  useMenuLayout,
  type TabChoice,
} from './ui';
import { up } from './nav';
import EditorFooter from './EditorFooter';
import { FabPresenceContext, useCountFabs, useFabLift } from './fabPresence';
import { useMenuOpen } from './menuOpen';
import { unseen, useNotifications } from './notificationData';
import { openNotifications, useNotificationsOpen } from './notificationsOpen';
import { openPalette, usePaletteOpen } from './paletteOpen';
import { ariaShortcut, shortcutText } from './shortcuts';
import { SiteLogoLink } from './SiteLogoLink';
import { ScreenHidden } from './screenHidden';
import { useTopBarSlot } from './topBarSlot';
import { safeHref } from '../lib/safe-url.mjs';

// `label` is the screen back goes to, named by the back arrow and the breadcrumbs. `guard` takes every
// way out of the screen (back, the breadcrumbs and the logo) and goes it, after warning about changes
// that are not saved (FormFrame.tsx leaveTo).
export type Back = { href: string; label: string; guard?: (go: () => void) => void };

// `status`: more about the screen, e.g. when it was last saved: under the title, on a computer after it.
// `wide`: a list or the files (the column is as wide as any other: the site's text column); `panel`: a form with its other fields
// beside the text on a wide computer screen (FormColumns in ui.tsx). `drawer`: a button at the end of the
// bar, after the notifications. `home`: the start screen,
// with the link to the website. `tabs`: the screen's tabs, in the bar, with the open one's content.
type Props<T extends string> = {
  title: string;
  back?: Back;
  status?: ReactNode;
  actions?: ReactNode;
  /** While rows are selected: the selection's own actions (a SelectionBar). They are the only thing at the end of the bar:
   * the actions, page actions, notifications, website link and drawer button are not drawn (M3: the contextual bar swaps
   * the bar's actions for the selection's). */
  selection?: ReactNode;
  /** The screen's own actions (a form's Preview and View on site): from expanded at the end of the row under the bar,
   * below expanded in the top bar, before `actions`. */
  pageActions?: ReactNode;
  drawer?: ReactNode;
  tabs?: TabChoice<T>;
  home?: boolean;
  wide?: boolean;
  panel?: boolean;
  /** A page that fills the window under the bar (the Preview): the back arrow and the title are in the bar on every width, and
   * the content has no margins, no title row and no footer; it is as high as the window under the bar. */
  full?: boolean;
  children: ReactNode;
};

/** The website (the site's home page, "/") in a new window, as large as the screen: in the top bar of the start screen,
 * after the bell. A click with a modifier key or the middle button, or a browser that blocks the window, gets the link's
 * own new tab instead. The new window does not know the editor (opener null, as rel="noopener"). */
export function WebsiteLink() {
  const openWindow = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const site = window.open(e.currentTarget.href, '_blank', `popup,width=${screen.availWidth},height=${screen.availHeight}`);
    if (!site) return;
    site.opener = null;
    e.preventDefault();
  };
  return <IconLink href="/" target="_blank" rel="noopener" onClick={openWindow} icon={ArrowSquareOut} label={t.library.openWebsite} />;
}

/** The bell in the top bar, before the link to the website: opens the notifications in a side sheet from 600 dp, below it goes to the
 * notifications' page (Notifications.tsx, notificationsOpen.ts), with a dot while some are not seen yet. */
export function NotificationsButton({ className = '' }: { className?: string }) {
  const count = unseen(useNotifications());
  const open = useNotificationsOpen();
  const phone = !useAtLeast('medium');
  return (
    <IconButton
      icon={Bell}
      label={count ? t.library.notificationsNew(count) : t.library.notifications}
      aria-haspopup={phone ? undefined : 'dialog'}
      aria-expanded={phone ? undefined : open}
      badge={count > 0}
      className={className}
      onClick={() => (phone ? (location.hash = 'notifications') : openNotifications())}
    />
  );
}

/** The search in the top bar, the first of its trailing actions on every screen (not while rows are selected): it opens the command palette
 * (CommandPalette.tsx), as Ctrl+K does. A plain search icon button (M3: "Search icon button: Use when search is a secondary action or not the main
 * focus"); in 0.20 it becomes the search app bar. */
export function SearchButton({ className = '' }: { className?: string }) {
  const open = usePaletteOpen();
  return (
    <IconButton
      icon="search"
      label={t.palette.open}
      shortcut={shortcutText('Mod+K')}
      aria-keyshortcuts={ariaShortcut('Mod+K')}
      aria-haspopup="dialog"
      aria-expanded={open}
      className={className}
      // Pressing it keeps the focus and the selection in the text, and the active block: the palette lists their actions first.
      data-keeps-block=""
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        // The press did not focus the button (see above): it takes the focus now, so closing the palette gives it back here.
        e.currentTarget.focus({ preventScroll: true });
        openPalette();
      }}
    />
  );
}

/** The search bar of the start screen (M3's contained search bar, 56dp, in the top bar in place of the search icon: "Search app bars have a search field
 * instead of heading text"): the theme's bar (ui.tsx SearchBarButton) that opens the command palette, as Ctrl+K and the icon do. Its hint is its name. */
export function PaletteBar({ className = '' }: { className?: string }) {
  const open = usePaletteOpen();
  return (
    <SearchBarButton
      label={t.palette.label}
      open={open}
      keys={ariaShortcut('Mod+K')}
      className={`mo-editor-palette-bar ${className}`}
      onOpen={(button) => {
        button.focus({ preventScroll: true });
        openPalette();
      }}
    />
  );
}

export default function Screen<T extends string>({
  title,
  back,
  status,
  actions,
  selection,
  pageActions,
  drawer,
  tabs,
  home = false,
  panel = false,
  full = false,
  children,
}: Props<T>) {
  const id = useId();
  const menu = useMenuOpen();
  const { menuButtonInTopBar } = useMenuLayout();
  // The column's widest width (--mo-sys-column-width, editor.css) is the site's text column (theme `max-w-3xl`, as PostLayout.astro), on a
  // computer too; only `panel` (a form with its other fields beside the text) is wider, 72rem from large. editor.css (.mo-editor-column) keeps it
  // centred on the window.
  const width = panel ? 'mo-editor-column mo-editor-screen-panel' : 'mo-editor-column';
  // A link out of the screen, through `guard`: the back arrow goes up (nav.ts), the other links as links.
  const leave = (go?: () => void) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!go && !back?.guard) return;
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href')!;
    const way = go ?? (() => (location.hash = href));
    if (back?.guard) back.guard(way);
    else way();
  };
  const slot = useTopBarSlot();
  // The form under its Preview (screenHidden.ts): kept, but not drawn.
  const hidden = useContext(ScreenHidden);
  const fabs = useCountFabs();
  useFabLift(fabs.count > 0);
  // The way here, without the start screen: the logo in the bar is the way there.
  const crumbs = back && back.href !== '#' ? [back] : [];
  // The start screen shows the search bar in its top bar, in place of the title and the search icon.
  const searchBar = home && !selection;
  const bar = (
    <TopAppBar>
      <div className={`mo-editor-screen-bar ${home ? 'mo-editor-screen-bar-home' : 'mo-editor-screen-bar-sub'}`}>
        {menuButtonInTopBar && !back && (
          <MenuButton
            label={menu.open ? t.library.closeMenu : t.library.openMenu}
            open={menu.open}
            onClick={menu.toggle}
            className="mo-keep"
          />
        )}
        {/* The start screen's logo stands beside the site's name, which says the same: on a phone the name gets its width (the bar has four actions there). */}
        {/* Not on the start screen's bar from medium: the search bar gets the room (owner, 15 Nov: "The logo in the header is not a necessity. Usability is most important."). */}
        {!full && !searchBar && (
          <SiteLogoLink onClick={leave()} className={home ? 'mo-editor-screen-show-medium' : 'mo-editor-screen-show-expanded'} />
        )}
        {back && (
          <a
            href={safeHref(back.href)}
            onClick={leave(() => up(back.href))}
            title={t.common.backTo(back.label)}
            aria-label={t.common.backTo(back.label)}
            className={`mo-editor-screen-back ${full ? '' : 'mo-editor-screen-narrow-only'}`}
          >
            <ArrowLeft size={24} />
          </a>
        )}
        {/* The start screen: from medium the top bar is the search bar and the title and status stand under it; on a phone the title stays in the bar and the search bar is the first thing in the page. */}
        <div
          className={`mo-editor-screen-title ${searchBar ? 'mo-editor-screen-title-search' : `${home ? 'mo-editor-screen-title-home' : 'mo-editor-screen-title-sub'} ${full ? '' : 'mo-editor-screen-narrow-only'}`}`}
        >
          <h1 className="mo-truncate mo-type-title-large">{title}</h1>
          {status && (
            <p data-subtitle className="mo-truncate mo-editor-screen-status">
              {status}
            </p>
          )}
        </div>
        {searchBar ? (
          <PaletteBar className="mo-editor-palette-bar-wide" />
        ) : (
          <>
            {!full && <div className="mo-editor-screen-bar-gap" />}
            {!selection && <SearchButton />}
          </>
        )}
        <div className="mo-row mo-row-end mo-keep mo-editor-screen-bar-actions">
          {selection ?? (
            <>
              {pageActions && <div className="mo-row mo-editor-screen-bar-page-actions">{pageActions}</div>}
              {actions}
            </>
          )}
        </div>
        {!selection && <NotificationsButton />}
        {!selection && home && <WebsiteLink />}
        {!selection && drawer}
      </div>
      {tabs && (
        <div className="mo-editor-bar-tabs">
          <div className={`mo-editor-screen-tabs ${width}`}>
            <TabRow id={id} {...tabs} />
          </div>
        </div>
      )}
    </TopAppBar>
  );
  if (hidden) return <div hidden>{children}</div>;
  if (full)
    return (
      <div data-full-page className="mo-editor-screen-full-page">
        {slot ? createPortal(bar, slot) : bar}
        <main id="main-content" className="mo-editor-screen-full mo-editor-screen-full-main">
          {children}
        </main>
      </div>
    );
  return (
    <div className={`mo-editor-screen-frame ${slot ? 'mo-editor-screen-frame-slot' : 'mo-editor-screen-frame-page'}`}>
      {slot ? createPortal(bar, slot) : bar}
      {/* A row, so the column keeps its margins (editor.css .mo-editor-column) and is as high as the rest of the window. */}
      <div className="mo-editor-screen-row">
        <main id="main-content" data-clearance={fabs.count > 0} className={`mo-editor-screen mo-editor-screen-main ${width}`}>
          {/* At expanded and wider: the way here, the title and the status, under the bar. */}
          {searchBar && (
            // M3 specs, Measurements: the unfocused search bar is 24dp from the screen's edges (the page has 16dp).
            <div className="mo-editor-screen-search-bar">
              <PaletteBar className="mo-editor-palette-bar-fill" />
            </div>
          )}
          <div className={`mo-editor-screen-heading ${searchBar ? 'mo-editor-screen-show-medium' : 'mo-editor-screen-show-expanded'}`}>
            {crumbs.length > 0 && (
              <nav aria-label={t.library.breadcrumbs} className="mo-row mo-keep mo-editor-screen-breadcrumbs">
                {crumbs.map((c) => (
                  <span key={c.href} className="mo-row">
                    <a href={safeHref(c.href)} onClick={leave()} className="mo-truncate mo-editor-screen-crumb">
                      {c.label}
                    </a>
                    <CaretRight size={14} className="mo-keep" />
                  </span>
                ))}
              </nav>
            )}
            <h1 className={searchBar ? 'mo-truncate mo-type-title-large' : 'mo-truncate mo-editor-screen-title-plain'}>{title}</h1>
            {status && (
              <p data-subtitle={searchBar ? '' : undefined} className="mo-keep mo-editor-screen-status-line">
                {status}
              </p>
            )}
            {/* The icons are taller than the text: the negative margin keeps the row's height. */}
            {pageActions && <div className="mo-row mo-keep mo-editor-screen-title-actions">{pageActions}</div>}
          </div>
          {/* The content flows as blocks; the footer goes to the bottom of a short screen. */}
          <FabPresenceContext.Provider value={fabs.report}>
            <div className="mo-editor-screen-content" data-clearance={fabs.count > 0}>
              {tabs ? (
                <TabPanel id={id} value={tabs.value}>
                  {children}
                </TabPanel>
              ) : (
                children
              )}
            </div>
          </FabPresenceContext.Provider>
          <EditorFooter />
        </main>
      </div>
    </div>
  );
}
