// At the top of the start screen: what was updated since the last visit in this browser (at the first visit in a browser,
// the CMS's version), as a card with Close, which
// marks it seen, and Read more. For the CMS: the photo of its edition (release-notes/editions/, named after the place the
// photo is from), 3:2 with rounded corners, above the text in the compact window class and from the medium class up to
// the left of it in a column 10-14rem wide, as high as the card (cropped with object-cover, never taller than the card, so a
// tall photo stays inside it); "Morpheme <edition> <version>" (the headline), the place in full (the subhead,
// with an info button after it that credits the photographer, PhotoCredit), how many features and improvements it brings (the supporting
// text, bundledNotes.ts) and Read more to the Morpheme page with all of them; for each app installed from the store: a
// row with its icon and new version, to its Information tab. Exposes UpdatesNotice. The logic is startView.mjs's
// (changesSince) and releaseNotes.mjs's (notesSince, editionOf), the storage startStorage.ts's, the card, rows, buttons
// and tooltip the theme's (themeUi.ts, ui.tsx).
import { useEffect, useRef, useState } from 'react';
import { version } from '../package.json';
import { locale, t } from './i18n';
import { installedApps } from './apps';
import { apps } from './site';
import { changesSince, versioned, type Versions } from './startView.mjs';
import { keepStored, SEEN, storedSeen } from './startStorage';
import type { RepoFile } from './github';
import { SiteCard, SiteTooltip } from './themeUi';
import { Svg } from './icon';
import { Button, LinkButton, ListItem, plainListClass } from './ui';
import { CMS_ROUTE } from './CmsPage';
import { LICENSES_ROUTE } from './Licenses';
import { appHref } from './AppList';
import { runningEdition, runningNotes } from './bundledNotes';
import { markCounts, notesSince } from '../lib/releaseNotes.mjs';
import { INFO_KEY } from '../lib/appRoute.mjs';

/** The CMS's version and those of the apps installed from the store, as the editor is built with them now. */
function versionsNow(files: RepoFile[]): Versions {
  const installed = installedApps(files);
  return {
    cms: version,
    apps: Object.fromEntries(apps.filter((a) => a.store && installed.includes(a.id)).map((a) => [a.id, a.store!.version])),
  };
}

/** The info button right after the place's name (the theme's info icon, which every icon pack has), with a rich
 * tooltip: who took the photo, on Unsplash, and a link to its licence under "Licenses". It opens while the mouse is over
 * the button or the tooltip, while focus is in them, and on a tap (a second tap closes it); Escape closes it. Under the
 * button, from its end, at most 15rem wide, so it stays on a phone's screen. */
function PhotoCredit({ by, line }: { by: string | null; line: string }) {
  const [open, setOpen] = useState(false);
  const leave = useRef<ReturnType<typeof setTimeout>>(undefined);
  // When it opened: a tap focuses the button (which opens it) just before its click, which must not close it again.
  const openedAt = useRef(0);
  const show = () => {
    clearTimeout(leave.current);
    if (!open) openedAt.current = Date.now();
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(leave.current);
    leave.current = setTimeout(() => setOpen(false), 150);
  };
  // Escape closes it wherever the pointer and the focus are (WCAG 1.4.13).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => () => clearTimeout(leave.current), []);
  return (
    <div
      className="-my-3 -ms-2.5 inline-flex align-middle"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && hide()}
    >
      <SiteTooltip
        open={open}
        // Only `open` shows it: not the theme's fallback on hover and focus, which Escape could not close.
        className="[&:not([data-tooltip-open])>.tooltip]:invisible [&:not([data-tooltip-open])>.tooltip]:opacity-0 [&>.tooltip]:start-auto [&>.tooltip]:end-0 [&>.tooltip]:top-[calc(100%-0.5rem)] [&>.tooltip]:bottom-auto [&>.tooltip]:max-w-60"
        supportingText={by ? t.library.photoBy(by) : t.library.photoFromUnsplash}
        action={{ label: t.library.photoLicense, href: `#${LICENSES_ROUTE}/${encodeURIComponent(`editions/${line}`)}` }}
      >
        <button
          type="button"
          aria-label={t.library.photoInfo}
          aria-expanded={open}
          onClick={() => (open && Date.now() - openedAt.current < 400 ? undefined : open ? setOpen(false) : show())}
          className="grid size-12 place-items-center rounded-full text-on-surface-variant focus-visible:outline-2 focus-visible:outline-offset-[-8px]"
        >
          <Svg name="info" size={20} />
        </button>
      </SiteTooltip>
    </div>
  );
}

/** A visit with nothing new only notes the versions. */
export function UpdatesNotice({ files }: { files: RepoFile[] }) {
  const now = versionsNow(files);
  const [changes, setChanges] = useState(() => changesSince(storedSeen(), now));
  // Nothing to tell: these are the versions seen (also an app installed since, which is no update).
  useEffect(() => {
    if (!changes.length) keepStored(SEEN, versioned(now));
  }, [changes.length, JSON.stringify(now)]);
  if (!changes.length) return null;
  const close = () => {
    keepStored(SEEN, versioned(now));
    setChanges([]);
  };
  const cms = changes.find((c) => c.id === 'cms');
  const updatedApps = changes.flatMap((c) => {
    const app = c.id === 'cms' ? null : apps.find((a) => a.id === c.id);
    return app ? [{ app, version: c.version }] : [];
  });
  const news = cms ? notesSince(runningNotes, cms.from, locale) : [];
  const { features, improvements } = markCounts(news);
  const edition = cms && runningEdition;
  const place = edition && (edition.place[locale] ?? edition.place['en-US']);
  const title = cms
    ? edition?.name
      ? t.library.cmsEdition(edition.name, cms.version)
      : t.library.cmsVersion(cms.version)
    : t.library.appsUpdated(updatedApps.length);
  return (
    <SiteCard
      kind="elevated"
      as="section"
      role="status"
      aria-labelledby="updates-title"
      className="mb-8 [--card-elevated-shadow:var(--mo-elevation-1-shadow)] [--card-padding:0]"
    >
      <div className="grid overflow-hidden rounded-[inherit] medium:grid-cols-[minmax(10rem,14rem)_1fr]">
        {edition && (
          <div className="relative aspect-[3/2] w-full overflow-hidden medium:aspect-auto medium:min-h-36">
            <img src={edition.image} alt="" className="absolute inset-0 size-full rounded-xl object-cover" />
          </div>
        )}
        <div className="flex min-w-0 flex-col p-4">
          <h2
            id="updates-title"
            className="text-[length:var(--type-headline-small-size)] leading-[var(--type-headline-small-line-height)] [overflow-wrap:anywhere]"
          >
            {title}
          </h2>
          {place && (
            <p className="mt-1 text-sm">
              {place}
              <PhotoCredit by={edition.by} line={edition.line} />
            </p>
          )}
          {news.length > 0 && <p className="mt-2 text-sm text-on-surface-variant">{t.library.noteCounts(features, improvements)}</p>}
          <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4">
            <Button kind="text" size="small" onClick={close}>
              {t.common.close}
            </Button>
            {cms && (
              <LinkButton kind="filled" size="small" href={`#${CMS_ROUTE}`}>
                {t.library.readMore}
              </LinkButton>
            )}
          </div>
        </div>
      </div>
      {updatedApps.length > 0 && (
        <ul className={`${plainListClass} border-t border-outline-variant`}>
          {updatedApps.map(({ app, version }) => (
            <ListItem
              key={app.id}
              href={`${appHref(app)}/${INFO_KEY}`}
              icon={app.icon}
              headline={app.label}
              supporting={t.library.appUpdatedTo(version)}
              arrow
            />
          ))}
        </ul>
      )}
    </SiteCard>
  );
}
