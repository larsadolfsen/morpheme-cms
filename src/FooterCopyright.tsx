// The copyright line at the end of the editor's footer row: body-medium in the on-surface-variant colour, as tall as a link (48px)
// so the row stays level. Exposes FooterCopyright. Uses copyright from lib/footerLinks.mjs, with the current year.
import { copyright } from '../lib/footerLinks.mjs';

export default function FooterCopyright() {
  return <span className="mo-type-body-medium mo-editor-footer-copyright">{copyright(new Date().getFullYear())}</span>;
}
