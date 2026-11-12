// A top app bar (m3.material.io/components/app-bars, which Material now calls the app bar; .top-app-bar in
// ../styles/ui.css): the bar at the top of a page. Without a `kind` it is only the container, and what is in it is the
// header's own (components/Header.astro, and a theme's own header: the logo, the menu and its button). With a kind it
// has Material's elements, each in its place: the leading button (`leading`, an icon button: the menu, back), the
// headline (`headline`, a heading with `headingLevel`, else a <p>) with its subtitle (`subtitle`), and the trailing
// elements (`trailing`: icon buttons, an avatar or another image, a filled button). The kinds are M3 Expressive's:
// `search` (a search bar instead of the headline, `search`: the theme's Search, with its own icons inside it and the
// leading and trailing ones outside it), `small` (the headline in the bar), and `medium-flexible` and `large-flexible`
// (a larger headline under the bar, wrapping when it is long, which a component collapses into a small bar with
// `collapsed`, data-collapsed: the headline in the bar). `align` puts the headline (or the search bar's text) at the
// start, the default, or in the middle. Another surface, line and shadow once the page scrolls under it (data-stuck, set
// by layouts/Base.astro on [data-header]). Where it stands (sticky at the top) is the component's own. An Astro header
// gives its element the class with topAppBarClass, and the kind's with topAppBarClasses.
import type { ReactNode } from 'react';

export type TopAppBarKind = 'search' | 'small' | 'medium-flexible' | 'large-flexible';
export type TopAppBarAlign = 'start' | 'center';

/** The kinds, in Material's order. */
export const topAppBarKinds: TopAppBarKind[] = ['search', 'small', 'medium-flexible', 'large-flexible'];

/** A top app bar's class: the container's. */
export const topAppBarClass = 'top-app-bar';

/** A top app bar's classes with its kind and its alignment (without a kind only the container's). */
export const topAppBarClasses = (kind?: TopAppBarKind, align: TopAppBarAlign = 'start') =>
  [topAppBarClass, kind && `top-app-bar-${kind}`, kind && align === 'center' && 'top-app-bar-center'].filter(Boolean).join(' ');

export default function TopAppBar({
  kind,
  align,
  leading,
  headline,
  subtitle,
  headingLevel,
  trailing,
  search,
  collapsed,
  className,
  children,
  ...rest
}: {
  kind?: TopAppBarKind;
  align?: TopAppBarAlign;
  leading?: ReactNode;
  headline?: ReactNode;
  subtitle?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  trailing?: ReactNode;
  search?: ReactNode;
  collapsed?: boolean;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const Heading = headingLevel ? (`h${headingLevel}` as const) : 'p';
  const flexible = kind === 'medium-flexible' || kind === 'large-flexible';
  return (
    <header
      className={[topAppBarClasses(kind, align), className].filter(Boolean).join(' ')}
      data-collapsed={(flexible && collapsed) || undefined}
      {...rest}
    >
      {kind && leading && <div className="top-app-bar-leading">{leading}</div>}
      {kind === 'search'
        ? search && <div className="top-app-bar-search-bar">{search}</div>
        : kind &&
          headline !== undefined && (
            <div className="top-app-bar-headline-group">
              <Heading className="top-app-bar-headline">{headline}</Heading>
              {subtitle && <p className="top-app-bar-subtitle">{subtitle}</p>}
            </div>
          )}
      {kind && trailing && <div className="top-app-bar-trailing">{trailing}</div>}
      {children}
    </header>
  );
}
