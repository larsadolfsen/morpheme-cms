// The theme's easing (--ease, styles/base.css) as the cubic Bézier Motion takes, for the animations it draws in the
// browser (MobileMenu.tsx, scripts/motion.ts), so they move as the theme's CSS. Without a browser, or when --ease is
// not a cubic-bezier(), the standard theme's.
type Bezier = [number, number, number, number];
const STANDARD: Bezier = [0.16, 1, 0.3, 1];

export function themeEase(): Bezier {
  if (typeof document === 'undefined') return STANDARD;
  const values = getComputedStyle(document.documentElement)
    .getPropertyValue('--ease')
    .match(/cubic-bezier\(([^)]*)\)/)?.[1]
    .split(',')
    .map(Number);
  return values?.length === 4 && values.every(Number.isFinite) ? (values as Bezier) : STANDARD;
}
