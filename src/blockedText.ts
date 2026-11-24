// The sentence for a reason the site can't update itself (cmsBlocked.mjs), in the editor's language; used by the start screen's notice
// (BlockedUpdateNotice.tsx) and the Morpheme page (CmsPage.tsx). Exports Blocked and blockedText.
import { t } from './i18n';

export type Blocked =
  | { kind: 'no-token' | 'no-kv' }
  | { kind: 'cannot-write' | 'needs-npm'; version: string }
  | { kind: 'unsafe-code'; version: string; lines: string[] }
  | { kind: 'contract'; version: string; item: 'theme' | 'app'; id: string; sure: boolean };

const SHOWN = 5;

/** The places of an `unsafe-code` list, `file:line` each (the reason after the second colon is on the Morpheme page), the first few and how many more. */
export function unsafePlaces(lines: string[]): string {
  const places = lines.map((l) => l.replace(/^(.*?:\d+|[^:]*):.*$/, '$1'));
  const more = places.length - SHOWN;
  return places.slice(0, SHOWN).join(', ') + (more > 0 ? t.cms.andMore(more) : '');
}

/** The sentence for a reason. */
export function blockedText(b: Blocked): string {
  if (b.kind === 'contract') {
    if (b.item === 'theme') return (b.sure ? t.cms.blockedTheme : t.cms.blockedThemeUnsure)(b.version, b.id);
    return (b.sure ? t.cms.blockedApp : t.cms.blockedAppUnsure)(b.version, b.id);
  }
  if (b.kind === 'unsafe-code') return t.cms.blockedUnsafeCode(b.version, unsafePlaces(b.lines));
  if (b.kind === 'no-token') return t.cms.blockedNoToken;
  if (b.kind === 'no-kv') return t.cms.blockedNoKv;
  if (b.kind === 'cannot-write') return t.cms.cannotWrite;
  return t.cms.blockedNeedsNpm('version' in b ? b.version : '');
}
