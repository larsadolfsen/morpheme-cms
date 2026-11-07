// One link in the editor's footer: a plain text link (body-medium, the on-surface colour, underlined on hover and focus) with
// a target 24px high (WCAG 2.5.8). It opens in the same tab (a screen of the editor) or, for a link out of the editor, in a
// new one. Exposes FooterLink. Uses isExternal from lib/footerLinks.mjs.
import type { ReactNode } from 'react';
import { isExternal } from '../lib/footerLinks.mjs';

/** `children`: its label, and what follows it (the status dot). */
export default function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-6 items-center gap-1 type-body-medium text-ink hover:underline focus-visible:underline"
      {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}
