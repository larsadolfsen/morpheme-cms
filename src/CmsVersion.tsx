// The CMS's version as plain text on the start screen's status line; a pre-release's short form swaps to the full version on a click.
// Exposes CmsVersion. Depends on cmsVersionView.mjs (shortVersion), SwapText and package.json's version.
import { version } from '../package.json';
import { shortVersion } from './cmsVersionView.mjs';
import { SwapText } from './SwapText';
import { t } from './i18n';

// A release shows its version as it is: plain text. A pre-release shows it short; clicking swaps it to the full version, with
// the build stamp, in place. `title` shows the full version on mouse hover. No tooltip: the phone's status line clips overflow.
export function CmsVersion() {
  const short = shortVersion(version) as string;
  if (short === version) return <>{t.library.cmsVersion(version)}</>;
  return <SwapText text={t.library.cmsVersion(short)} swapped={t.library.cmsVersion(version)} title={version} />;
}
