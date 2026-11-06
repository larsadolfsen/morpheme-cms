// One line of the start screen's updates notice: a link to what is new in the CMS or in an app (its Information tab).
// Exposes UpdateLink. Depends on appHref (AppList.tsx), CMS_ROUTE and INFO_KEY.
import { t } from './i18n';
import { CMS_ROUTE } from './CmsPage';
import { appHref } from './AppList';
import { apps } from './site';
import { INFO_KEY } from '../lib/appRoute.mjs';

/** `change.id` is "cms" or an app's id; `change.version` the version it is updated to. */
export function UpdateLink({ change }: { change: { id: string; version: string } }) {
  const app = change.id === 'cms' ? null : apps.find((a) => a.id === change.id);
  const name = app ? app.label : t.library.cmsName;
  const href = app ? `${appHref(app)}/${INFO_KEY}` : `#${CMS_ROUTE}`;
  return (
    <li>
      <a href={href} className="underline underline-offset-2 hover:text-accent">
        {t.library.updatedTo(name, change.version)}
      </a>
    </li>
  );
}
