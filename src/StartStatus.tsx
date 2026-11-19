// The start screen's status line: from expanded up the CMS version, a separator and the update time ("Updated 11:42 PM"); from medium to expanded the
// update time with its word, which a tap swaps for the short version; below medium (a phone) only the time ("11:42 PM", "Nov 14"), with the word as its
// tooltip: the top bar there has four actions (the search button too, command palette spec 4.8) and leaves the line 63 to 78 px. Exposes StartStatus.
// Depends on CmsVersion, SwapText, when and i18n.
import { CmsVersion } from './CmsVersion';
import { SwapText } from './SwapText';
import { shortVersion } from './cmsVersionView.mjs';
import { version } from '../package.json';
import { t } from './i18n';
import { when } from './when';

// Screen.tsx draws the status twice, but only one place shows at a width; the forms are here, switched with the M3 breakpoint
// classes (`medium:`, `expanded:`), never a width of their own.
export function StartStatus({ builtAt }: { builtAt: Date | null }) {
  const cms = t.library.cmsVersion(shortVersion(version) as string);
  const time = builtAt ? when(builtAt, { short: true }) : null;
  const updated = time ? t.library.siteUpdated(time) : null;
  return (
    <>
      <span className="mo-editor-status-wide">
        <CmsVersion />
        {updated && `${t.library.statusSeparator}${updated}`}
      </span>
      <span className="mo-editor-status-medium">{updated ? <SwapText text={updated} swapped={cms} /> : cms}</span>
      <span className="mo-editor-status-phone">{time ? <SwapText text={time} swapped={cms} title={updated ?? undefined} /> : cms}</span>
    </>
  );
}
