// The editor's footer row: support, system status (with a dot for how the services are), the legal links and "Licenses", then
// the copyright line, centred and wrapping, with no dividers between them (owner, 27 Nov 2026: "Remove the vertical dividers in the
// footer"): the links' own side padding is the space. Exposes FooterLinks. Uses FooterLink, FooterCopyright, the theme's Badge and
// FOOTER_LINKS from lib/footerLinks.mjs.
import { t } from './i18n';
import FooterLink from './FooterLink';
import FooterCopyright from './FooterCopyright';
import { SiteBadge } from './themeUi';
import { FOOTER_LINKS, visibleLinks } from '../lib/footerLinks.mjs';
import type { ServiceState } from '../lib/serviceStatus.mjs';

/** `state`: how the services are, as the dot after "System status" shows it. */
export default function FooterLinks({ state }: { state: ServiceState }) {
  return (
    <nav aria-label={t.footer.label} className="mo-editor-footer-links">
      {visibleLinks(FOOTER_LINKS).map(({ id, href }) => (
        <FooterLink key={id} href={href}>
          {id === 'licenses' ? t.common.parts.licenses : t.footer[id]}
          {id === 'status' && <SiteBadge tone={state} label={t.footer.state[state]} />}
        </FooterLink>
      ))}
      <FooterCopyright />
    </nav>
  );
}
