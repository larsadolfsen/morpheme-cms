// A toolbar (m3.material.io/components/toolbars, M3 Expressive; .mo-toolbar in ../styles/ui/toolbar.css): a row of actions (icon
// buttons, buttons), docked (`kind`: docked, the default: the whole width at the bottom of the screen, as the site's bar
// on a phone, components/ActionBar.astro) or floating (a pill over the page), in its colour
// (`color`: standard, the surface, the default, or vibrant, the accent), across or, floating, `vertical`. A floating one
// can be paired with a FAB (`fab`, the theme's Fab from @theme/ui/Fab: beside it, under a vertical one), and then
// collapse into it (`expanded` false: only the FAB is shown, as while the page scrolls). Its kind and colour are
// Material's names; how it looks is the theme's. Where it stands (fixed at the bottom of the screen, hidden while the
// page scrolls) is the component's own. It is a role="toolbar" with its name (`label`): on the site
// ui/toolbar.script.ts moves between its actions with the arrow keys (one stop for Tab). Other attributes (data-…) go
// on it, and `className` after its own classes (with a FAB on the box round both). An Astro component gives an element
// the same classes with toolbarClass (and role="toolbar" and its aria-label itself), and the box round it and its FAB
// with toolbarWithFabClass. A docked one holds the primary action itself instead of a FAB (`primary`: M3 toolbars, Overview, "Docked with embedded
// primary action instead of FAB"; the theme's IconButton `kind="filled"` `shape="square"`: Specs, Color, "Filled button (Primary, On primary)" and
// Guidelines "Square buttons can be used in the docked toolbar"): it stands in the middle slot (the children are split at ceil(n/2), the first half before it and the rest after it, so n actions give a bar with n+1 slots, the action in the middle when n is even), among the actions, which are then spaced evenly
// (`mo-is-with-primary`; Guidelines: "In compact breakpoints, elements in the toolbar should be evenly spaced" and "highlight a primary action in the middle").
import { Children, Fragment, type ReactNode } from 'react';

export type ToolbarKind = 'docked' | 'floating';
export type ToolbarColor = 'standard' | 'vibrant';

/** A toolbar's classes; `expanded` false: collapsed into its FAB. */
export const toolbarClass = (
  kind: ToolbarKind = 'docked',
  color: ToolbarColor = 'standard',
  vertical = false,
  expanded = true,
  primary = false,
) =>
  `mo-toolbar mo-is-${kind} mo-is-${color}${vertical && kind === 'floating' ? ' mo-is-vertical' : ''}${expanded ? '' : ' mo-is-collapsed'}${primary && kind === 'docked' ? ` ${toolbarPrimaryClass}` : ''}`;

/** The class a docked toolbar with its primary action embedded has besides its own (toolbarClass takes it with `primary`). */
export const toolbarPrimaryClass = 'mo-is-with-primary';

/** The classes of the box round a floating toolbar and its FAB. */
export const toolbarWithFabClass = (vertical = false) => `mo-is-with-fab${vertical ? ' mo-is-with-fab-vertical' : ''}`;

export default function Toolbar({
  label,
  kind,
  color,
  vertical,
  fab,
  primary,
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
  /** Docked only: the primary action, in the middle among the actions (instead of a FAB). */
  primary?: ReactNode;
  expanded?: boolean;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  const floating = kind === 'floating';
  const across = !(vertical && floating);
  const paired = floating && fab;
  const embedded = !floating && primary;
  const actions = Children.toArray(children);
  const middle = Math.ceil(actions.length / 2);
  const bar = (
    <div
      role="toolbar"
      aria-label={label}
      aria-orientation={across ? undefined : 'vertical'}
      className={[toolbarClass(kind, color, vertical, !paired || expanded, !!embedded), !paired && className].filter(Boolean).join(' ')}
      inert={paired && !expanded ? true : undefined}
      {...rest}
    >
      {embedded ? [...actions.slice(0, middle), <Fragment key="primary">{primary}</Fragment>, ...actions.slice(middle)] : children}
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
