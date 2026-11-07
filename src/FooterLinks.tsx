// The editor's footer row: support, system status (with a dot for how the services are), the legal links and "Licenses", then
// the copyright line, with a thin divider between each, centred and wrapping (a divider can start a wrapped line: CSS has no
// simple way to hide it). Exposes FooterLinks. Uses FooterLink, FooterDivider, FooterCopyright, the theme's Badge and
// FOOTER_LINKS from lib/footerLinks.mjs.
import { Fragment } from 'react';
import { t } from './i18n';
import FooterLink from './FooterLink';
import FooterDivider from './FooterDivider';
import FooterCopyright from './FooterCopyright';
import { SiteBadge } from './themeUi';
import { FOOTER_LINKS, visibleLinks } from '../lib/footerLinks.mjs';
import type { ServiceState } from '../lib/serviceStatus.mjs';

/** `state`: how the services are, as the dot after "System status" shows it. */
export default function FooterLinks({ state }: { state: ServiceState }) {
  return (
    <nav className="flex flex-wrap items-center justify-center">
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
