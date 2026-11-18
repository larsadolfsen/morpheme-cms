// The sentence for a reason the site can't update itself (cmsBlocked.mjs), in the editor's language; used by the start screen's notice
// (BlockedUpdateNotice.tsx) and the Morpheme page (CmsPage.tsx). Exports Blocked and blockedText.
import { t } from './i18n';
import type { blockedUpdate } from './cmsBlocked.mjs';

export type Blocked = NonNullable<ReturnType<typeof blockedUpdate>>;

/** The sentence for a reason. */
export function blockedText(b: Blocked): string {
  if (b.kind === 'no-token') return t.cms.blockedNoToken;
  if (b.kind === 'no-kv') return t.cms.blockedNoKv;
  if (b.kind === 'cannot-write') return t.cms.cannotWrite;
  if (b.kind === 'needs-npm') return t.cms.blockedNeedsNpm(b.version);
  if (b.item === 'theme') return (b.sure ? t.cms.blockedTheme : t.cms.blockedThemeUnsure)(b.version, b.id);
  return (b.sure ? t.cms.blockedApp : t.cms.blockedAppUnsure)(b.version, b.id);
}
