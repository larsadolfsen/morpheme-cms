// At the top of the start screen: what was updated since the last visit in this browser (the CMS and the apps installed
// from the store), with a close button that marks it seen. Exposes UpdatesNotice. The logic is startView.mjs's
// (changesSince), the storage startStorage.ts's, the card the theme's (Notice in ui.tsx).
import { useEffect, useState } from 'react';
import { version } from '../package.json';
import { t } from './i18n';
import { installedApps } from './apps';
import { apps } from './site';
import { changesSince, versioned, type Versions } from './startView.mjs';
import { keepStored, SEEN, storedSeen } from './startStorage';
import type { RepoFile } from './github';
import { Notice } from './ui';
import { UpdateLink } from './UpdateLink';

/** The CMS's version and those of the apps installed from the store, as the editor is built with them now. */
function versionsNow(files: RepoFile[]): Versions {
  const installed = installedApps(files);
  return {
    cms: version,
    apps: Object.fromEntries(apps.filter((a) => a.store && installed.includes(a.id)).map((a) => [a.id, a.store!.version])),
  };
}

/** Each change is a link to what is new in it (the CMS's page, an app's Information tab). The first visit, and a visit
 * with nothing new, only notes the versions. */
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
  return (
    <div className="mb-8">
      <Notice title={t.library.updatesTitle} onClose={close}>
        <ul className="space-y-1">
          {changes.map((c) => (
            <UpdateLink key={c.id} change={c} />
          ))}
        </ul>
      </Notice>
    </div>
  );
}
