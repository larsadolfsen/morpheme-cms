// The copyright line at the end of the editor's footer row: body-medium in the on-surface-variant colour, as tall as a link
// so the row stays level. Exposes FooterCopyright. Uses COPYRIGHT from lib/footerLinks.mjs.
import { COPYRIGHT } from '../lib/footerLinks.mjs';

export default function FooterCopyright() {
  return <span className="inline-flex min-h-6 items-center type-body-medium text-muted">{COPYRIGHT}</span>;
}
