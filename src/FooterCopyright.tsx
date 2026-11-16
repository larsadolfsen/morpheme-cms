// The copyright line at the end of the editor's footer row: body-medium in the on-surface-variant colour, as tall as a link (36px)
// so the row stays level. Exposes FooterCopyright. Uses copyright from lib/footerLinks.mjs, with the current year.
import { copyright } from '../lib/footerLinks.mjs';

export default function FooterCopyright() {
  return (
    <span className="type-body-medium inline-flex min-h-9 items-center px-3 text-on-surface-variant">
      {copyright(new Date().getFullYear())}
    </span>
  );
}
