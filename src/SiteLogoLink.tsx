// The logo and the site's name at the start of the top bar, after the menu button (Screen.tsx): one link to the start screen.
// Exposes SiteLogoLink; the link's click goes through `onClick` (Screen's `leave`, so the unsaved-changes warning shows).
import type { MouseEventHandler } from 'react';
import { siteName } from '@site/editor';

/** The site's logo (/editor/icon-192.png) and the site's name (at expanded and wider; for screen readers below), as a link to `#`. */
export function SiteLogoLink({ onClick, className = '' }: { onClick?: MouseEventHandler<HTMLAnchorElement>; className?: string }) {
  return (
    <a href="#" onClick={onClick} className={`mo-editor-logo-link ${className}`}>
      <img src="/editor/icon-192.png" alt="" className="mo-editor-logo-image" />
      <span className="mo-editor-logo-name">{siteName}</span>
    </a>
  );
}
