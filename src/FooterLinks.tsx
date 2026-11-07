// The row of links in the editor's footer: support, system status (with a dot for how the services are), the legal links and
// "Licenses", centred and wrapping. Exposes FooterLinks. Uses FooterLink, the theme's Badge and FOOTER_LINKS from lib/footerLinks.mjs.
import { t } from './i18n';
import FooterLink from './FooterLink';
import { SiteBadge } from './themeUi';
import { FOOTER_LINKS, visibleLinks } from '../lib/footerLinks.mjs';
import type { ServiceState } from '../lib/serviceStatus.mjs';

/** `state`: how the services are, as the dot after "System status" shows it. */
export default function FooterLinks({ state }: { state: ServiceState }) {
  return (
    <nav className="flex flex-wrap justify-center gap-x-2 gap-y-0">
      {visibleLinks(FOOTER_LINKS).map(({ id, href }) => (
        <FooterLink key={id} href={href}>
          {id === 'licenses' ? t.common.parts.licenses : t.footer[id]}
          {id === 'status' && <SiteBadge tone={state} label={t.footer.state[state]} />}
        </FooterLink>
      ))}
    </nav>
  );
}
