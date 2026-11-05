// A screen of the editor: a top bar like in an app, beside the navigation rail and the drawer (it is drawn into
// topBarSlot.tsx's place, at the top of the content), above the content. Below medium, where there is no rail, the panel
// button at its start opens and closes the main drawer (MainMenu.tsx, menuOpen.ts; from medium it is the rail's); at expanded and wider the logo and the site's name after it (one link to the start screen,
// through `back.guard`), below expanded the back arrow, the title and the status as in an app (the logo only on the start
// screen); at the end the actions, the notifications and the account, on every screen (on a phone the account only on the
// start screen, `home`). At expanded and wider the way here as breadcrumbs (the screen above, when that is not the start
// screen), the title and the status stand in a row under the bar, at the top of the content. The bar stays at the top while
// scrolling and keeps clear of a phone's notch. A screen's tabs (`tabs`) are the bottom of the bar, under the title, as wide
// as the content, and stay with it. The back arrow goes to the screen above, back in the history when that is the screen
// before (nav.ts up). The content is as wide as a form reads well, or wider for lists and the grid of files (`wide`) and for
// a form with its fields beside the text (`panel`). The column (editor.css .editor-column) stands centred on the window,
// off-centre only as far as the panels beside it require.
// Under the content of every screen is the editor's footer (EditorFooter.tsx).
import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bell, CaretRight, UserCircle } from '@phosphor-icons/react';
import { t } from './i18n';
import { IconLink, MenuButton, TabPanel, TabRow, TopAppBar, useMenuLayout, type TabChoice } from './ui';
import { up } from './nav';
import EditorFooter from './EditorFooter';
import { useMenuOpen } from './menuOpen';
import { unseen, useNotifications } from './notificationData';
import { SiteLogoLink } from './SiteLogoLink';
import { useTopBarSlot } from './topBarSlot';

// `label` is the screen back goes to, named by the back arrow and the breadcrumbs. `guard` takes every
// way out of the screen (back, the breadcrumbs and the logo) and goes it, after warning about changes
// that are not saved (FormFrame.tsx leaveTo).
export type Back = { href: string; label: string; guard?: (go: () => void) => void };

// `status`: more about the screen, e.g. when it was last saved: under the title, on a computer after it.
// `wide`: the content is wider on a computer (lists, the files); `panel`: a form with its other fields
// beside the text on a wide computer screen (FormColumns in ui.tsx). `drawer`: a button at the end of the
// bar, after the account. `home`: the start screen,
// with the account on a phone too. `tabs`: the screen's tabs, in the bar, with the open one's content.
type Props<T extends string> = {
  title: string;
  back?: Back;
  status?: ReactNode;
  actions?: ReactNode;
  drawer?: ReactNode;
  tabs?: TabChoice<T>;
  home?: boolean;
  wide?: boolean;
  panel?: boolean;
  children: ReactNode;
};

/** The account (#konto) in a top bar: the avatar icon, at the right of the gear. */
export function AccountLink({ className = '' }: { className?: string }) {
  const current = location.hash === '#konto';
  return (
    <IconLink
      href="#konto"
      icon={UserCircle}
      label={t.common.parts.account}
      aria-current={current ? 'page' : undefined}
      selected={current}
      className={className}
    />
  );
}

/** The bell in the top bar, before the account: the notifications (#notifikationer, Notifications.tsx), with a dot
 * while some are not seen yet. */
export function NotificationsLink({ className = '' }: { className?: string }) {
  const count = unseen(useNotifications());
  const current = location.hash === '#notifikationer';
  return (
    <IconLink
      href="#notifikationer"
      icon={Bell}
      label={count ? t.library.notificationsNew(count) : t.library.notifications}
      aria-current={current ? 'page' : undefined}
      selected={current}
      badge={count > 0}
      className={className}
    />
  );
}

export default function Screen<T extends string>({
  title,
  back,
  status,
  actions,
  drawer,
  tabs,
  home = false,
  wide = false,
  panel = false,
  children,
}: Props<T>) {
  const id = useId();
  const menu = useMenuOpen();
  const { menuButtonInTopBar } = useMenuLayout();
  // The column's widest width (--column-width: 48rem; 64rem from medium for `wide`, 72rem from large for `panel`); editor.css
  // (.editor-column) keeps it centred on the window.
  const width = wide
    ? 'editor-column [--column-width:48rem] medium:[--column-width:64rem]'
    : panel
      ? 'editor-column [--column-width:48rem] large:[--column-width:72rem]'
      : 'editor-column [--column-width:48rem]';
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
  // The way here, without the start screen: the logo in the bar is the way there.
  const crumbs = back && back.href !== '#' ? [back] : [];
  const bar = (
    <TopAppBar>
      <div className="flex h-16 items-center gap-1 px-2 medium:gap-3 medium:px-6">
        {menuButtonInTopBar && (
          <MenuButton
            label={menu.open ? t.library.closeMenu : t.library.openMenu}
            open={menu.open}
            onClick={menu.toggle}
            className="shrink-0"
          />
        )}
        <SiteLogoLink onClick={leave()} className={home ? '' : 'hidden expanded:flex'} />
        {back && (
          <a
            href={back.href}
            onClick={leave(() => up(back.href))}
            title={t.common.backTo(back.label)}
            aria-label={t.common.backTo(back.label)}
            className="flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-tint expanded:hidden"
          >
            <ArrowLeft size={24} />
          </a>
        )}
        <div className="flex min-w-0 flex-1 flex-col pl-1 expanded:hidden">
          <h1 className="truncate text-xl leading-tight">{title}</h1>
          {status && (
            <p data-subtitle className="truncate text-xs text-muted">
              {status}
            </p>
          )}
        </div>
        <div className="hidden min-w-0 flex-1 expanded:block" />
        <div className="flex shrink-0 items-center justify-end gap-1">{actions}</div>
        <NotificationsLink />
        <AccountLink className={home ? '' : 'hidden medium:inline-grid'} />
        {drawer}
      </div>
      {tabs && (
        <div className="editor-bar-tabs">
          <div className={`medium:px-6 ${width}`}>
            <TabRow id={id} {...tabs} />
          </div>
        </div>
      )}
    </TopAppBar>
  );
  return (
    <div className="min-h-dvh">
      {slot ? createPortal(bar, slot) : bar}
      <main className={`editor-screen px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] medium:px-6 medium:pt-8 ${width}`}>
        {/* At expanded and wider: the way here, the title and the status, under the bar. */}
        <div className="mb-6 hidden min-w-0 items-center gap-x-2 expanded:flex">
          {crumbs.length > 0 && (
            <nav aria-label={t.library.breadcrumbs} className="flex shrink-0 items-center gap-2 text-muted">
              {crumbs.map((c) => (
                <span key={c.href} className="flex items-center gap-2">
                  <a href={c.href} onClick={leave()} className="max-w-48 truncate hover:text-accent hover:underline">
                    {c.label}
                  </a>
                  <CaretRight size={14} className="shrink-0" />
                </span>
              ))}
            </nav>
          )}
          <h1 className="truncate font-medium">{title}</h1>
          {status && <p className="shrink-0 text-sm text-muted">{status}</p>}
        </div>
        {tabs ? (
          <TabPanel id={id} value={tabs.value}>
            {children}
          </TabPanel>
        ) : (
          children
        )}
        <EditorFooter />
      </main>
    </div>
  );
}
