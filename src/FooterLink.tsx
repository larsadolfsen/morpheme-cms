// One link in the editor's footer: a plain text link (body-medium, the on-surface colour, underlined on hover and focus) with
// a target exactly 36px high on every screen (the owner's exception to Material 3's 48dp: docs/material-deviations.md; padding on the link, 12px each side, which is also the space round the dividers). It opens in the same tab (a
// screen of the editor) or, for a link out of the editor, in a new one. Exposes FooterLink. Uses isExternal from lib/footerLinks.mjs.
import type { ReactNode } from 'react';
import { isExternal } from '../lib/footerLinks.mjs';

/** `children`: its label, and what follows it (the status dot). */
export default function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-9 items-center justify-center gap-1 px-3 type-body-medium text-on-surface hover:underline focus-visible:underline"
      {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}
