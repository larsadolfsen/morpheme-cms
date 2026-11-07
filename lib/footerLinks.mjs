// The links in the editor's footer, in the order they are shown, and its copyright line (EditorFooter.tsx).
// Exposes FOOTER_LINKS, COPYRIGHT, visibleLinks and isExternal. No imports.

/** @typedef {{ id: 'support' | 'status' | 'terms' | 'security' | 'privacy' | 'licenses', href: string | null }} FooterLink */

/** @type {FooterLink[]} A link with `href: null` is not shown yet. */
export const FOOTER_LINKS = [
  { id: 'support', href: 'https://github.com/larsadolfsen/morpheme-cms/issues' },
  { id: 'status', href: '#status' },
  { id: 'terms', href: null },
  { id: 'security', href: 'https://github.com/larsadolfsen/morpheme-cms/security' },
  { id: 'privacy', href: 'https://getmorpheme.com/privacy-policy/' },
  { id: 'licenses', href: '#licenses' },
];

export const COPYRIGHT = '© 2026 Lars Adolfsen';

/**
 * @param {FooterLink[]} links
 * @returns {(FooterLink & { href: string })[]}
 */
export const visibleLinks = (links) => /** @type {(FooterLink & { href: string })[]} */ (links.filter((link) => link.href !== null));

/** Whether a link leaves the editor (opens in a new tab). @param {string} href */
export const isExternal = (href) => href.startsWith('https://');
