// At the top of the start screen: what was updated since the last visit in this browser, as a small card (the photo
// to the left of the text from the expanded width) with Close, which marks it seen, and Read more. For the CMS: the photo of its edition (16:9, release-notes/editions/, named after the place
// the photo is from), "Morpheme <edition> <version>" and how many new things it brings (bundledNotes.ts), and Read more to the
// Morpheme page with all of them; for each app installed from the store: a row with its icon and new version, to its
// Information tab. Exposes UpdatesNotice. The logic is startView.mjs's (changesSince) and releaseNotes.mjs's (notesSince,
// editionOf), the storage startStorage.ts's, the card, rows and buttons the theme's (themeUi.ts, ui.tsx).
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
      className="mb-8 max-w-xl overflow-hidden [--card-padding:0] expanded:max-w-3xl"
    >
      <div className="expanded:flex">
        {edition && <img src={edition.image} alt="" className="block aspect-video w-full object-cover expanded:w-80 expanded:shrink-0" />}
        <div className="flex min-w-0 grow flex-col p-4">
          <h2 id="updates-title" className="text-xs font-medium text-muted">
            {t.library.updatesTitle}
          </h2>
          <p className="text-xl leading-tight [overflow-wrap:anywhere]">{title}</p>
          {news.length > 0 && <p className="mt-0.5 text-sm text-muted">{t.library.newThings(news.length)}</p>}
          <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4">
            <Button kind="text" size="small" onClick={close}>
              {t.common.close}
            </Button>
            {cms && (
              <LinkButton kind="tonal" size="small" href={`#${CMS_ROUTE}`}>
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
