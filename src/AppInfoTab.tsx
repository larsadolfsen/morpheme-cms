// What every app's page says about it (AppList.tsx: AppContent and StoreAppPage): its pictures, what it does, what
// is new, what it needs of the site, its notifications, its cookies, its licences and who made it. Exposes AppInfoTab
// (default). Depends on ./ui, ./i18n, ./AppNotificationSwitches and AppList.tsx's DeveloperRow.
import type { ReactNode } from 'react';
import {
  Bell,
  CheckCircle,
  Code,
  Cookie,
  Globe,
  Hammer,
  HardDrives,
  Palette,
  PaperPlaneTilt,
  ShieldCheck,
  type Icon,
} from '@phosphor-icons/react';
import { GroupTitle, Group, ImageCarousel, ListItem } from './ui';
import { t } from './i18n';
import { categoryOf } from '../lib/cookieCategories.mjs';
import type { AppCookie, AppNeeds } from './store';
import AppNotificationSwitches from './AppNotificationSwitches';
import { DeveloperRow } from './AppList';

/** What every app's page says about it, from its folder or the store's catalog: its pictures (each opening it whole),
 * what it does more fully, what it needs of the site (needsOf), the cookies it sets (`consent`: the cookie banner asks
 * first), and who made it, with a row to their page. `children`: what stands between its description and what it
 * needs (its settings and what it adds). */
export default function AppInfoTab({
  pictures,
  description,
  news = [],
  needs,
  notifies = [],
  cookies,
  consent,
  publisher,
  licenses,
  children,
}: {
  pictures: { src: string; label: string }[];
  description?: string;
  news?: { version: string; text: string }[];
  needs?: AppNeeds;
  /** The kinds of notifications it sends (AppNotifications), under "Notifikationer": their names, and installed their
   * types, each with its switch, the same as under "Konto" › "Notifikationer". */
  notifies?: { label: string; type?: string }[];
  cookies: AppCookie[];
  consent: boolean;
  publisher: string;
  /** Its licences, under "Licenser" (OwnerLicenses, or StoreLicenseRows from the catalog). */
  licenses?: ReactNode;
  children?: ReactNode;
}) {
  const row = (glyph: Icon, text: string, more?: string) => <ListItem key={text} icon={glyph} headline={text} supporting={more} />;
  const needed = needs
    ? [
        needs.pages && row(Code, t.apps.needsPages),
        needs.loads.length > 0 && row(Globe, t.apps.needsLoads, needs.loads.join(', ')),
        needs.sends.length > 0 && row(PaperPlaneTilt, t.apps.needsSends, needs.sends.join(', ')),
        needs.server && row(HardDrives, t.apps.needsServer),
        needs.build && row(Hammer, t.apps.needsBuild),
        ...(needs.changes ?? []).map((hook) => row(Palette, t.apps.changes[hook])),
      ].filter((x) => !!x)
    : [];
  const lasts = (c: AppCookie) => c.lasts && t.apps.cookieLasts(c.lasts);
  // A named cookie's category (lib/cookieCategories.mjs), first under its name.
  const category = (c: AppCookie) => t.blocks.cookies.entries.categories[categoryOf(c)];
  return (
    <>
      {pictures.length > 0 && (
        <section className="mb-8">
          <GroupTitle>{t.apps.screenshots}</GroupTitle>
          <ImageCarousel label={t.apps.screenshots} images={pictures} />
        </section>
      )}
      {description && (
        <section className="mb-8">
          <GroupTitle>{t.apps.about}</GroupTitle>
          {description.split(/\n\s*\n/).map((p) => (
            <p key={p} className="mb-3 px-4 last:mb-0">
              {p}
            </p>
          ))}
        </section>
      )}
      {news.length > 0 && (
        <section className="mb-8">
          <GroupTitle>{t.apps.news}</GroupTitle>
          {news.map((n) => (
            <div key={n.version} className="mb-3 px-4 last:mb-0">
              <h3 className="font-medium">{t.apps.version(n.version)}</h3>
              {n.text.split(/\n\s*\n/).map((p) => (
                <p key={p} className="text-muted">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </section>
      )}
      {children}
      {needs && <Group title={t.apps.needs}>{needed.length ? needed : row(CheckCircle, t.apps.needsNothing)}</Group>}
      {notifies.some((n) => n.type) ? (
        <AppNotificationSwitches notifies={notifies} />
      ) : (
        <Group title={t.apps.notifications}>
          {notifies.length ? notifies.map((n) => row(Bell, n.label)) : row(Bell, t.apps.notifiesNone)}
        </Group>
      )}
      <Group title={t.apps.cookies}>
        {consent && row(ShieldCheck, t.apps.cookiesAsk)}
        {cookies.map((c) =>
          c.name
            ? row(Cookie, c.name, [category(c), c.purpose, lasts(c)].filter(Boolean).join(' · '))
            : row(Cookie, c.purpose, lasts(c) || undefined),
        )}
        {!consent && !cookies.length && row(Cookie, t.apps.noCookies)}
      </Group>
      {licenses}
      <DeveloperRow name={publisher} />
    </>
  );
}
