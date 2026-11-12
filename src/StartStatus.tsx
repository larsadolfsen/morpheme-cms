// The start screen's status line: from expanded up the CMS version, a separator and the update time; below it (a phone) only the
// update time, which a tap swaps for the short version. Exposes StartStatus. Depends on CmsVersion, SwapText, when and i18n.
import { CmsVersion } from './CmsVersion';
import { SwapText } from './SwapText';
import { shortVersion } from './cmsVersionView.mjs';
import { version } from '../package.json';
import { t } from './i18n';
import { when } from './when';

// Screen.tsx draws the status twice, but only one place shows at a width; both forms are here, switched with the M3 breakpoint
// classes (`expanded:`), never a width of their own.
export function StartStatus({ builtAt }: { builtAt: Date | null }) {
  const cms = t.library.cmsVersion(shortVersion(version) as string);
  const updated = builtAt ? t.library.siteUpdated(when(builtAt, { short: true })) : null;
  return (
    <>
      <span className="hidden expanded:inline">
        <CmsVersion />
        {updated && `${t.library.statusSeparator}${updated}`}
      </span>
      <span className="expanded:hidden">{updated ? <SwapText text={updated} swapped={cms} /> : cms}</span>
    </>
  );
}
