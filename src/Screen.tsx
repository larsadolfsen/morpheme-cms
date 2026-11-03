// A screen of the editor: a top bar like in an app (a back arrow, the screen's title, actions on the
// right) above the content. The back arrow goes to the screen above, back in the history when that is
// the screen before (nav.ts up), so it goes the same way as the phone's back gesture. Without a back
// arrow (the start screen), the logo is there instead. On a computer the top bar goes across the whole
// window beside the sidebar (which has the logo and the site's name, App.tsx): at the left the way there
// as breadcrumbs (the start screen and the screen above, when that is not the start screen), the title
// and the status after it; at the right the actions, the notifications, the settings and the account, on every screen.
// On a phone the notifications are on every screen too, the settings and the account only on the start screen (`home`). The bar stays at
// the top while scrolling and keeps clear of a phone's notch. A screen's tabs (`tabs`) are the bottom of the bar, under the title,
// as wide as the content, and stay with it. The content is as wide as a form reads
// well, or wider for lists and the grid of files (`wide`) and for a form with its fields beside the text
// (`panel`).
import { useId, type ReactNode } from 'react';
import { ArrowLeft, Bell, CaretRight, Gear, UserCircle } from '@phosphor-icons/react';
import { settings, siteName } from '@site/editor';
import { t } from './i18n';
import { IconButton, IconLink, TabPanel, TabRow, TopAppBar, type TabChoice } from './ui';
import { up } from './nav';
import { unseen, useNotifications } from './notificationData';

// `label` is the screen back goes to, named by the back arrow and the breadcrumbs. `guard` takes every
// way out of the screen (back, the breadcrumbs and the logo) and goes it, after warning about changes
// that are not saved (FormFrame.tsx leaveTo).
export type Back = { href: string; label: string; guard?: (go: () => void) => void };

// `status`: more about the screen, e.g. when it was last saved: under the title, on a computer after it.
// `wide`: the content is wider on a computer (lists, the files); `panel`: a form with its other fields
// beside the text on a wide computer screen (FormColumns in ui.tsx). `drawer`: the icon of the screen's navigation
// drawer (NavigationDrawerButton, ModalNavigationDrawer), the last in the bar, after the account. `home`: the start screen,
// with the settings and the account on a phone too. `tabs`: the screen's tabs, in the bar, with the open one's content.
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

/** The bell in the top bar, at the left of the gear: the notifications (#notifikationer, Notifications.tsx), with a dot
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

/** The gear in the top bar, at the left of the account: "Indstillinger" (#indstillinger, Library.tsx Settings), marked
 * there and on the settings it opens ("Udseende", "Apps", "Analytics" … and their screens). Only when the site has any. */
export function SettingsLink({ className = '' }: { className?: string }) {
  if (!settings.length) return null;
  const route = location.hash.slice(1);
  const current = route === 'indstillinger' || settings.some((id) => route === id || route.startsWith(`${id}/`));
  return (
    <IconLink
      href="#indstillinger"
      icon={Gear}
      label={t.common.parts.settings}
      aria-current={current ? 'page' : undefined}
      selected={current}
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
  const width = wide ? 'max-w-3xl md:max-w-5xl' : panel ? 'max-w-3xl xl:max-w-6xl' : 'max-w-3xl';
  // A link out of the screen, through `guard`: the back arrow goes up (nav.ts), the other links as links.
  const leave = (go?: () => void) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!go && !back?.guard) return;
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href')!;
    const way = go ?? (() => (location.hash = href));
    if (back?.guard) back.guard(way);
    else way();
  };
  return (
    <div className="min-h-dvh">
      <TopAppBar>
        <div className="flex h-16 items-center gap-1 px-2 md:gap-3 md:px-6">
          {back ? (
            <a
              href={back.href}
              onClick={leave(() => up(back.href))}
              title={t.common.backTo(back.label)}
              aria-label={t.common.backTo(back.label)}
              className="flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-tint md:hidden"
            >
              <ArrowLeft size={24} />
            </a>
          ) : (
            // The start screen: the logo before the name.
            <img src="/editor/icon-192.png" alt="" className="mx-2 size-9 shrink-0 rounded-xl md:hidden" />
          )}
          <div className="flex min-w-0 flex-1 flex-col pl-1 md:hidden">
            <h1 className="truncate text-xl leading-tight">{title}</h1>
            {status && (
              <p data-subtitle className="truncate text-xs text-muted">
                {status}
              </p>
            )}
          </div>
          {/* On a computer: the way here, the title and the status. */}
          <div className="hidden min-w-0 flex-1 items-center gap-x-2 md:flex">
            {back && (
              <nav aria-label={t.library.breadcrumbs} className="flex shrink-0 items-center gap-2 text-muted">
                {(back.href === '#' ? [back] : [{ href: '#', label: siteName }, back]).map((c) => (
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
          <div className="flex shrink-0 items-center justify-end gap-1">{actions}</div>
          <NotificationsLink />
          <SettingsLink className={home ? '' : 'hidden md:inline-grid'} />
          <AccountLink className={home ? '' : 'hidden md:inline-grid'} />
          {drawer}
        </div>
        {tabs && (
          <div className={`mx-auto md:px-6 ${width}`}>
            <TabRow id={id} {...tabs} />
          </div>
        )}
      </TopAppBar>
      <main className={`editor-screen mx-auto px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 md:pt-8 ${width}`}>
        {tabs ? (
          <TabPanel id={id} value={tabs.value}>
            {children}
          </TabPanel>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
