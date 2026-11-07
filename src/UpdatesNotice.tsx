// At the top of the start screen: what was updated since the last visit in this browser, as a card with Close, which
// marks it seen, and Read more. For the CMS: the photo of its edition (release-notes/editions/, named after the place the
// photo is from), 3:2 with rounded corners: above the text in the compact window class, and from the medium class up
// to the left of it, as high as the card; "Morpheme <edition> <version>" (the headline), the place in full (the
// subhead), how many new things it brings (the supporting text, bundledNotes.ts) and Read more to the Morpheme page with
// all of them; for each app installed from the store: a row with its icon and new version, to its Information tab.
// Exposes UpdatesNotice. The logic is startView.mjs's (changesSince) and releaseNotes.mjs's (notesSince, editionOf), the
// storage startStorage.ts's, the card, rows and buttons the theme's (themeUi.ts, ui.tsx).
import { useEffect, useState } from 'react';
import { version } from '../package.json';
import { locale, t } from './i18n';
import { installedApps } from './apps';
import { apps } from './site';
import { changesSince, versioned, type Versions } from './startView.mjs';
import { keepStored, SEEN, storedSeen } from './startStorage';
import type { RepoFile } from './github';
import { SiteCard } from './themeUi';
import { Button, LinkButton, ListItem, plainListClass } from './ui';
import { CMS_ROUTE } from './CmsPage';
import { appHref } from './AppList';
import { runningEdition, runningNotes } from './bundledNotes';
import { notesSince } from '../lib/releaseNotes.mjs';
import { INFO_KEY } from '../lib/appRoute.mjs';

/** The CMS's version and those of the apps installed from the store, as the editor is built with them now. */
function versionsNow(files: RepoFile[]): Versions {
  const installed = installedApps(files);
  return {
    cms: version,
    apps: Object.fromEntries(apps.filter((a) => a.store && installed.includes(a.id)).map((a) => [a.id, a.store!.version])),
  };
}

/** The first visit, and a visit with nothing new, only notes the versions. */
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
  const edition = cms && runningEdition;
  const place = edition && (edition.place[locale] ?? edition.place['en-US']);
  const title = cms
    ? edition
      ? t.library.cmsEdition(edition.name, cms.version)
      : t.library.cmsVersion(cms.version)
    : t.library.appsUpdated(updatedApps.length);
  return (
    <SiteCard
      kind="outlined"
      as="section"
      role="status"
      aria-labelledby="updates-title"
      className="mb-8 overflow-hidden [--card-padding:0]"
    >
      <div className="grid medium:grid-cols-[auto_1fr]">
        {edition && (
          <div className="relative aspect-[3/2] w-full medium:h-full medium:w-auto">
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
          {place && <p className="mt-1 text-sm">{place}</p>}
          {news.length > 0 && <p className="mt-2 text-sm text-muted">{t.library.newThings(news.length)}</p>}
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
        <ul className={`${plainListClass} border-t border-line`}>
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
