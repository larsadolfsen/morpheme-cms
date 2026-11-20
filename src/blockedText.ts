// The sentence for a reason the site can't update itself (cmsBlocked.mjs), in the editor's language; used by the start screen's notice
// (BlockedUpdateNotice.tsx) and the Morpheme page (CmsPage.tsx). Exports Blocked and blockedText.
import { t } from './i18n';

export type Blocked =
  | { kind: 'no-token' | 'no-kv' }
  | { kind: 'cannot-write' | 'needs-npm'; version: string }
  | { kind: 'contract'; version: string; item: 'theme' | 'app'; id: string; sure: boolean };

/** The sentence for a reason. */
export function blockedText(b: Blocked): string {
  if (b.kind === 'contract') {
    if (b.item === 'theme') return (b.sure ? t.cms.blockedTheme : t.cms.blockedThemeUnsure)(b.version, b.id);
    return (b.sure ? t.cms.blockedApp : t.cms.blockedAppUnsure)(b.version, b.id);
  }
  if (b.kind === 'no-token') return t.cms.blockedNoToken;
  if (b.kind === 'no-kv') return t.cms.blockedNoKv;
  if (b.kind === 'cannot-write') return t.cms.cannotWrite;
  return t.cms.blockedNeedsNpm('version' in b ? b.version : '');
}
