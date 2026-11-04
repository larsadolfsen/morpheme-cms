// The CMS's version as plain text on the start screen's status line; a pre-release's short form swaps to the full version on a click.
// Exposes CmsVersion. Depends on cmsVersionView.mjs (shortVersion) and package.json's version.
import { useState } from 'react';
import { version } from '../package.json';
import { shortVersion } from './cmsVersionView.mjs';
import { t } from './i18n';

// A release shows its version as it is: plain text. A pre-release shows it short; a focusable span (no link or button look: it
// inherits the status text) swaps to the full version, with the build stamp, in place on a click or Enter/Space, and back.
// `title` shows the full version on mouse hover. No tooltip: the phone's status line clips overflow.
export function CmsVersion() {
  const [full, setFull] = useState(false);
  const short = shortVersion(version) as string;
  if (short === version) return <>{t.library.cmsVersion(version)}</>;
  return (
    <span
      tabIndex={0}
      title={version}
      onClick={() => setFull((on) => !on)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setFull((on) => !on);
        }
      }}
    >
      {t.library.cmsVersion(full ? version : short)}
    </span>
  );
}
