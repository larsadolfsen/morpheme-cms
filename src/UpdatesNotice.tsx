// At the top of the start screen: what was updated since the last visit in this browser, as a card with a close button
// that marks it seen, in the accent (the editor's blue). For the CMS: its new version large, how many new things it brings and the first of them from the
// notes the package carries (bundledNotes.ts: the first with a screenshot large, then the titles and texts of the next),
// and a button to the Morpheme page with all of them; for each app installed from the store: a row with its icon and new
// version, to its Information tab. Exposes UpdatesNotice. The logic is startView.mjs's (changesSince) and
// releaseNotes.mjs's (notesSince), the storage startStorage.ts's, the card, rows and buttons the theme's (themeUi.ts, ui.tsx).
import { useEffect, useState } from 'react';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { version } from '../package.json';
import { locale, t } from './i18n';
import { installedApps } from './apps';
import { apps } from './site';
import { changesSince, versioned, type Versions } from './startView.mjs';
import { keepStored, SEEN, storedSeen } from './startStorage';
import type { RepoFile } from './github';
import { SiteCard } from './themeUi';
import { CloseButton, LinkButton, ListItem, plainListClass } from './ui';
import { CMS_ROUTE } from './CmsPage';
import { appHref } from './AppList';
import { runningNotes } from './bundledNotes';
import { notesSince, type ReleaseNote } from '../lib/releaseNotes.mjs';
import { INFO_KEY } from '../lib/appRoute.mjs';

/** How many of the new things the card shows; the Morpheme page has them all. */
const SHOWN = 3;

/** The CMS's version and those of the apps installed from the store, as the editor is built with them now. */
function versionsNow(files: RepoFile[]): Versions {
  const installed = installedApps(files);
  return {
    cms: version,
    apps: Object.fromEntries(apps.filter((a) => a.store && installed.includes(a.id)).map((a) => [a.id, a.store!.version])),
  };
}

/** The first new thing with a screenshot, large: the screenshot fills the top (its top part), its title under it. */
function Lead({ note }: { note: Extract<ReleaseNote, { kind: 'card' }> }) {
  return (
    <div className="overflow-hidden rounded-xl bg-accent-container text-on-accent-container">
      <img src={note.image} alt="" className="block h-44 w-full object-cover object-top" />
      <p className="px-4 py-3 font-medium">{note.title}</p>
    </div>
  );
}

/** One more new thing: a sparkle and its title (a card) or its text (a line). */
function Highlight({ note }: { note: ReleaseNote }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-accent-container p-3 text-on-accent-container">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
        <Sparkle size={20} weight="fill" aria-hidden />
      </span>
      <span className={note.kind === 'card' ? 'font-medium' : 'text-sm'}>{note.kind === 'card' ? note.title : note.text}</span>
    </li>
  );
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
  const lead = news.find((note): note is Extract<ReleaseNote, { kind: 'card' }> => note.kind === 'card' && !!note.image);
  const rest = news.filter((note) => note !== lead);
  return (
    <SiteCard
      kind="filled"
      as="section"
      role="status"
      aria-labelledby="updates-title"
      className="relative mb-8 text-on-accent [--card-filled-surface:var(--accent)] [--card-padding:0] [--icon-button-standard-text:var(--on-accent)]"
    >
      <CloseButton onClick={close} />
      <div className="flex items-center gap-4 p-4 pe-14">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-on-accent text-accent">
          <Sparkle size={26} weight="fill" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="updates-title" className="text-sm font-medium">
            {t.library.updatesTitle}
          </h2>
          <p className="text-2xl leading-tight">{cms ? t.library.cmsVersion(cms.version) : t.library.appsUpdated(updatedApps.length)}</p>
          {news.length > 0 && <p className="text-sm opacity-85">{t.library.newThings(news.length)}</p>}
        </div>
      </div>
      {news.length > 0 && (
        <div className="space-y-2 px-4">
          {lead && <Lead note={lead} />}
          <ul className="space-y-2">
            {rest.slice(0, lead ? SHOWN - 1 : SHOWN).map((note) => (
              <Highlight key={note.id} note={note} />
            ))}
          </ul>
        </div>
      )}
      {cms && (
        <div className="px-4 pt-4 pb-4">
          <LinkButton kind="tonal" href={`#${CMS_ROUTE}`} icon={ArrowRight}>
            {t.library.seeWhatsNew}
          </LinkButton>
        </div>
      )}
      {updatedApps.length > 0 && (
        <ul className={`${plainListClass} mx-4 mb-4 overflow-hidden rounded-xl bg-accent-container text-on-accent-container`}>
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
