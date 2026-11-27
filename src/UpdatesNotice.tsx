// At the top of the start screen: what was updated since the last visit in this browser (at the first visit in a browser,
// the CMS's version), as a card with Close, which
// marks it seen, and Read more. For the CMS: the photo of its edition (release-notes/editions/, named after the place the
// photo is from), 3:2 with rounded corners, above the text in the compact window class and from the medium class up to
// the left of it in a column 10-14rem wide, as high as the card (cropped with object-cover, never taller than the card, so a
// tall photo stays inside it); "Morpheme <edition> <version>" (the headline), the place in full (the subhead,
// with an info button after it that credits the photographer, PhotoCredit), how many features and improvements it brings (the supporting
// text, bundledNotes.ts) and Read more to the Morpheme page with all of them; for each app installed from the store: a
// row with its icon and new version, to its Information tab. Exposes UpdatesNotice. The logic is startView.mjs's
// (changesSince) and releaseNotes.mjs's (notesOfVersion, editionOf), the storage startStorage.ts's, the card, rows, buttons
// and tooltip the theme's (themeUi.ts, ui.tsx).
import { useEffect, useRef, useState } from 'react';
import { version } from '../package.json';
import { locale, t } from './i18n';
import { installedApps } from './apps';
import { apps } from './site';
import { changesSince, versioned, type Versions } from './startView.mjs';
import { keepStored, SEEN, storedSeen } from './startStorage';
import type { RepoFile } from './github';
import { SiteCard, SiteDivider, SiteIconButton, SiteTooltip } from './themeUi';
import { Button, LinkButton, ListItem, plainListClass } from './ui';
import { materialIcon } from './icon';
import { CMS_ROUTE } from './CmsPage';
import { LICENSES_ROUTE } from './Licenses';
import { appHref } from './AppList';
import { runningEdition, runningNotes } from './bundledNotes';
import { markCounts, notesOfVersion } from '../lib/releaseNotes.mjs';
import { INFO_KEY } from '../lib/appRoute.mjs';

/** The CMS's version and those of the apps installed from the store, as the editor is built with them now. */
function versionsNow(files: RepoFile[]): Versions {
  const installed = installedApps(files);
  return {
    cms: version,
    apps: Object.fromEntries(apps.filter((a) => a.store && installed.includes(a.id)).map((a) => [a.id, a.store!.version])),
  };
}

const InfoIcon = materialIcon('info');

/** The info button right after the place's name (the theme's info icon, which every icon pack has), with a rich
 * tooltip: who took the photo, on Unsplash, and a link to its licence under "Licenses". It opens while the mouse is over
 * the button or the tooltip, and while focus is in them; it goes 1.5 s after the pointer and the focus have left, and is never
 * pinned open by a click; Escape closes it. */
function PhotoCredit({ by, line }: { by: string | null; line: string }) {
  const [open, setOpen] = useState(false);
  const leave = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = () => {
    clearTimeout(leave.current);
    setOpen(true);
  };
  // Material 3, Tooltips, Guidelines: "Both plain and rich tooltips disappear 1.5 seconds after navigating away from the target region".
  const hide = () => {
    clearTimeout(leave.current);
    leave.current = setTimeout(() => setOpen(false), 1500);
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
      className="mo-editor-photo-credit"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && hide()}
    >
      <SiteTooltip
        open={open}
        // Only `open` shows it: not the theme's fallback on hover and focus, which Escape could not close.
        className="mo-editor-photo-credit-tooltip"
        supportingText={by ? t.library.photoBy(by) : t.library.photoFromUnsplash}
        action={{ label: t.library.photoLicense, href: `#${LICENSES_ROUTE}/${encodeURIComponent(`editions/${line}`)}` }}
      >
        <SiteIconButton icon={<InfoIcon />} label={t.library.photoInfo} aria-expanded={open} />
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
  const news = cms ? notesOfVersion(runningNotes, cms.version, locale) : [];
  const { features, improvements } = markCounts(news);
  const edition = cms && runningEdition;
  const place = edition && (edition.place[locale] ?? edition.place['en-US']);
  const title = cms
    ? edition?.name
      ? t.library.cmsEdition(edition.name, cms.version)
      : t.library.cmsVersion(cms.version)
    : t.library.appsUpdated(updatedApps.length);
  return (
    <SiteCard kind="outlined" as="section" role="status" aria-labelledby="updates-title" className="mo-editor-updates-notice">
      <div className="mo-editor-updates-notice-body">
        {edition && (
          <div className="mo-editor-updates-notice-photo">
            <img src={edition.image} alt="" className="mo-editor-updates-notice-image" />
          </div>
        )}
        <div className="mo-editor-updates-notice-text">
          <h2 id="updates-title" className="mo-type-headline-small mo-editor-updates-notice-title">
            {title}
          </h2>
          {place && (
            <p className="mo-type-body-medium mo-editor-updates-notice-place">
              {place}
              <PhotoCredit by={edition.by} line={edition.line} />
            </p>
          )}
          {news.length > 0 && (
            <p className="mo-type-body-medium mo-editor-updates-notice-counts">{t.library.noteCounts(features, improvements)}</p>
          )}
          <div className="mo-editor-updates-notice-actions">
            <Button kind="outlined" onClick={close}>
              {t.common.close}
            </Button>
            {cms && (
              <LinkButton kind="filled" href={`#${CMS_ROUTE}`} aria-label={t.library.readMoreOn(title)}>
                {t.library.readMore}
              </LinkButton>
            )}
          </div>
        </div>
      </div>
      {updatedApps.length > 0 && (
        <>
          <SiteDivider />
          <ul className={`${plainListClass} mo-editor-updates-notice-apps`}>
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
        </>
      )}
    </SiteCard>
  );
}
