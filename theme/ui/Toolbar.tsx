// A toolbar (m3.material.io/components/toolbars, M3 Expressive; .toolbar in ../styles/ui.css): a row of actions (icon
// buttons, buttons), docked (`kind`: docked, the default: the whole width at the bottom of the screen, as the site's bar
// on a phone, components/ContactBar.astro and BookingBar.astro) or floating (a pill over the page), in its colour
// (`color`: standard, the surface, the default, or vibrant, the accent), across or, floating, `vertical`. A floating one
// can be paired with a FAB (`fab`, the theme's Fab from @theme/ui/Fab: beside it, under a vertical one), and then
// collapse into it (`expanded` false: only the FAB is shown, as while the page scrolls). Its kind and colour are
// Material's names; how it looks is the theme's. Where it stands (fixed at the bottom of the screen, hidden while the
// page scrolls) is the component's own. It is a role="toolbar" with its name (`label`): on the site
// ui/toolbar.script.ts moves between its actions with the arrow keys (one stop for Tab). Other attributes (data-…) go
// on it, and `className` after its own classes (with a FAB on the box round both). An Astro component gives an element
// the same classes with toolbarClass (and role="toolbar" and its aria-label itself), and the box round it and its FAB
// with toolbarWithFabClass.
import type { ReactNode } from 'react';

export type ToolbarKind = 'docked' | 'floating';
export type ToolbarColor = 'standard' | 'vibrant';

/** A toolbar's classes; `expanded` false: collapsed into its FAB. */
export const toolbarClass = (kind: ToolbarKind = 'docked', color: ToolbarColor = 'standard', vertical = false, expanded = true) =>
  `toolbar toolbar-${kind} toolbar-${color}${vertical && kind === 'floating' ? ' toolbar-vertical' : ''}${expanded ? '' : ' toolbar-collapsed'}`;

/** The classes of the box round a floating toolbar and its FAB. */
export const toolbarWithFabClass = (vertical = false) => `toolbar-with-fab${vertical ? ' toolbar-with-fab-vertical' : ''}`;

export default function Toolbar({
  label,
  kind,
  color,
  vertical,
  fab,
  expanded = true,
  className,
  children,
  ...rest
}: {
  label: string;
  kind?: ToolbarKind;
  color?: ToolbarColor;
  vertical?: boolean;
  fab?: ReactNode;
  expanded?: boolean;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  const floating = kind === 'floating';
  const across = !(vertical && floating);
  const paired = floating && fab;
  const bar = (
    <div
      role="toolbar"
      aria-label={label}
      aria-orientation={across ? undefined : 'vertical'}
      className={[toolbarClass(kind, color, vertical, !paired || expanded), !paired && className].filter(Boolean).join(' ')}
      inert={paired && !expanded ? true : undefined}
      {...rest}
    >
      {children}
    </div>
  );
  if (!paired) return bar;
  return (
    <div className={[toolbarWithFabClass(!across), className].filter(Boolean).join(' ')}>
      {bar}
      {fab}
    </div>
  );
}
