// The editor's footer: at the bottom of every screen (Screen.tsx), under the content, or at the bottom of the window when
// the content is short (the start screen): a divider, the links (FooterLinks.tsx: support, system status, legal, "Licenses")
// and the copyright line. Exposes EditorFooter. Fetches the services' status once (statusReport.ts) for the dot; the safe
// area at the bottom is Screen's main.
import { useEffect, useState } from 'react';
import { SupportingText } from './ui';
import { SiteDivider } from './themeUi';
import FooterLinks from './FooterLinks';
import { serviceStatus } from './statusReport';
import { COPYRIGHT } from '../lib/footerLinks.mjs';
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
    <footer className="mt-auto pt-12">
      <SiteDivider />
      <div className="pt-4">
        <FooterLinks state={state} />
        <SupportingText className="pt-2 text-center">{COPYRIGHT}</SupportingText>
      </div>
    </footer>
  );
}
