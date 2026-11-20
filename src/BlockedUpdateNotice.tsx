// At the top of the start screen: why the site can't update itself, when it can't (a version waits for a theme or an app, npm has to
// install it, the GitHub token can't save, or the token or KV is missing), as the theme's filled notice with a link to the Morpheme page.
// Exports BlockedUpdateNotice. The reasons are cmsBlocked.mjs's; the notice, its button and the texts are ui.tsx's and the
// editor's (t.cms). Nothing shows while the status can't be read (no sign-in, a preview), so the start screen never has an error of its own.
import { useEffect, useState } from 'react';
import { t } from './i18n';
import { blockedUpdate } from './cmsBlocked.mjs';
import { blockedText, type Blocked } from './blockedText';
import { CMS_ROUTE } from './CmsPage';
import { LinkButton, Notice } from './ui';

export function BlockedUpdateNotice() {
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  useEffect(() => {
    let live = true;
    fetch('/api/cms', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((status) => live && setBlocked(blockedUpdate(status) as Blocked | null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!blocked) return null;
  return (
    <div className="mo-editor-blocked-notice">
      <Notice
        title={t.cms.blockedTitle}
        action={
          <LinkButton kind="text" size="small" href={`#${CMS_ROUTE}`}>
            {t.library.readMore}
          </LinkButton>
        }
      >
        {blockedText(blocked)}
      </Notice>
    </div>
  );
}
