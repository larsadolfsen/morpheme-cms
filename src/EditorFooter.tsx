// The editor's footer: at the bottom of every screen (Screen.tsx), under the content, or at the bottom of the window when
// the content is short (the start screen): a divider and one row with the links and the copyright line (FooterLinks.tsx).
// Exposes EditorFooter. Fetches the services' status (statusReport.ts, kept for a minute) for the dot.
import { useEffect, useState } from 'react';
import { SiteDivider } from './themeUi';
import FooterLinks from './FooterLinks';
import { serviceStatus } from './statusReport';
import type { ServiceState } from '../lib/serviceStatus.mjs';

export default function EditorFooter() {
  // Unknown while the report loads and when it can't be fetched.
  const [state, setState] = useState<ServiceState>('unknown');
  useEffect(() => {
    let on = true;
    serviceStatus().then((report) => on && setState(report?.state ?? 'unknown'));
    return () => {
      on = false;
    };
  }, []);

  return (
    <footer className="mt-auto pt-6">
      <SiteDivider />
      <div className="pt-1">
        <FooterLinks state={state} />
      </div>
    </footer>
  );
}
