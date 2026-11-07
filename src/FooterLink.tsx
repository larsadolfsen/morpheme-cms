// One link in the editor's footer: a small text button that opens in the same tab (a screen of the editor) or, for a
// link out of the editor, in a new one. Exposes FooterLink. Uses LinkButton from ui.tsx and isExternal from lib/footerLinks.mjs.
import type { ReactNode } from 'react';
import { LinkButton } from './ui';
import { isExternal } from '../lib/footerLinks.mjs';

/** `children`: its label, and what follows it (the status dot). */
export default function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <LinkButton href={href} kind="text" size="small" {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </LinkButton>
  );
}
