// One link in the editor's footer: a plain text link (body-medium, the on-surface colour, underlined on hover and focus) with
// a target 44px high for a pointer and 48px on a touch screen (Material 3 touch targets). It opens in the same tab (a
// screen of the editor) or, for a link out of the editor, in a new one. Exposes FooterLink. Uses isExternal from lib/footerLinks.mjs.
import type { ReactNode } from 'react';
import { isExternal } from '../lib/footerLinks.mjs';

/** `children`: its label, and what follows it (the status dot). */
export default function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 min-w-12 items-center justify-center gap-1 type-body-medium text-on-surface hover:underline focus-visible:underline pointer-coarse:min-h-12"
      {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}
