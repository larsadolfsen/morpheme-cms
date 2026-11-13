// The editor's footer row: support, system status (with a dot for how the services are), the legal links and "Licenses", then
// the copyright line, with a thin divider between each, centred and wrapping (a divider at the start or end of a line is hidden:
// useStrayDividers.ts). Exposes FooterLinks. Uses FooterLink, FooterDivider, FooterCopyright, the theme's Badge and
// FOOTER_LINKS from lib/footerLinks.mjs.
import { Fragment, useRef } from 'react';
import { t } from './i18n';
import FooterLink from './FooterLink';
import FooterDivider from './FooterDivider';
import FooterCopyright from './FooterCopyright';
import useStrayDividers from './useStrayDividers';
import { SiteBadge } from './themeUi';
import { FOOTER_LINKS, visibleLinks } from '../lib/footerLinks.mjs';
import type { ServiceState } from '../lib/serviceStatus.mjs';

/** `state`: how the services are, as the dot after "System status" shows it. */
export default function FooterLinks({ state }: { state: ServiceState }) {
  const row = useRef<HTMLElement>(null);
  useStrayDividers(row);
  return (
    <nav ref={row} className="flex flex-wrap items-center justify-center gap-y-2">
      {visibleLinks(FOOTER_LINKS).map(({ id, href }, i) => (
        <Fragment key={id}>
          {i > 0 && <FooterDivider />}
          <FooterLink href={href}>
            {id === 'licenses' ? t.common.parts.licenses : t.footer[id]}
            {id === 'status' && <SiteBadge tone={state} label={t.footer.state[state]} />}
          </FooterLink>
        </Fragment>
      ))}
      <FooterDivider />
      <FooterCopyright />
    </nav>
  );
}
