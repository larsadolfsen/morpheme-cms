// Tabs (m3.material.io/components/tabs, .tabs and .tab in ../styles/ui.css): a row of tabs (Tabs), the open one
// `selected`. Their kind (`kind`) is Material's: `primary` (the main views under the top app bar: each tab's icon over
// its label, or beside it with `inline`, and the indicator under the label) or `secondary` (views within a part of the
// page: the label, evt. with its icon beside it, and the indicator under the whole tab), each with the divider under the
// row; without a kind only the label, the open one's in its own colour (components/MobileNav.astro, the bar of
// "Mobile menu"). The row is scrollable (the default: swiped sideways when the tabs do not fit) or fixed (`scrollable`
// false: the tabs share the width). A tab (Tab) has its label (`children`), evt. its icon (`icon`, its name in the
// theme's icons, or in the editor an icon already made: the tabs of a screen) and a badge (`badge`: true for a dot, else the number it shows; the theme's Badge). With `href` it is a
// link to a page (Link: on the site; in the editor only drawn; the open one aria-current); without it, it is a tab of a
// tab list (`label` on Tabs, its name: a role="tablist"), a <button role="tab"> that shows its panel (`controls`, the
// panel's id; the open one aria-selected), which tabs.script.ts does on the site. How it looks is the theme's. An Astro
// component gives its elements the classes with tabsClass, tabsClasses and tabClass.
import type { ReactNode } from 'react';
import { Glyph, type IconRef } from '@morphemecms/cms/src/icon';
import { Link } from '@morphemecms/cms/src/standard/view';
import Badge from '@theme/ui/Badge';

export type TabsKind = 'primary' | 'secondary';

/** The kinds, in Material's order. */
export const tabsKinds: TabsKind[] = ['primary', 'secondary'];

/** The row's class, and a tab's. */
export const tabsClass = 'tabs';
export const tabClass = 'tab';

/** The row's classes with its kind, fixed or scrollable, and with the primary tabs' icons beside their labels
 * (`inline`). */
export const tabsClasses = (kind?: TabsKind, scrollable = true, inline = false) =>
  [tabsClass, kind && `tabs-${kind}`, !scrollable && 'tabs-fixed', inline && 'tabs-inline'].filter(Boolean).join(' ');

export function Tabs({
  kind,
  scrollable = true,
  inline,
  label,
  className,
  children,
  ...rest
}: {
  kind?: TabsKind;
  scrollable?: boolean;
  inline?: boolean;
  label?: string;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  return (
    <ul
      className={[tabsClasses(kind, scrollable, inline), className].filter(Boolean).join(' ')}
      role={label ? 'tablist' : undefined}
      aria-label={label}
      {...rest}
    >
      {children}
    </ul>
  );
}

/** A tab: a link to a page (`href`) or a tab of a tab list (`controls`), `selected` when it is the open one, with its
 * label, evt. its icon and a badge. */
export function Tab({
  href,
  controls,
  selected,
  icon,
  badge,
  children,
  ...rest
}: {
  href?: string;
  controls?: string;
  selected?: boolean;
  icon?: IconRef;
  badge?: true | number;
  children: ReactNode;
} & Record<string, unknown>) {
  const mark = badge !== undefined && <Badge count={badge === true ? undefined : badge} className="tab-badge" />;
  const content = (
    <span className="tab-content">
      {icon && (
        <span className="tab-icon">
          <Glyph icon={icon} size={24} />
          {mark}
        </span>
      )}
      <span className="tab-label">
        {children}
        {!icon && mark}
      </span>
    </span>
  );
  return href === undefined ? (
    <li role="presentation">
      <button
        type="button"
        role="tab"
        className={tabClass}
        aria-selected={!!selected}
        aria-controls={controls}
        tabIndex={selected ? 0 : -1}
        {...rest}
      >
        {content}
      </button>
    </li>
  ) : (
    <li>
      <Link href={href} className={tabClass} aria-current={selected ? 'page' : undefined} {...rest}>
        {content}
      </Link>
    </li>
  );
}
