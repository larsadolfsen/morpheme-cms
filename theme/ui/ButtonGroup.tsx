// A button group (m3.material.io/components/button-groups, .button-group in ../styles/ui.css): buttons or icon buttons
// that belong together side by side (`children`: the theme's Button and IconButton), in a group with its name (`label`,
// read by screen readers). Its kind (`kind`) is Material's name; how it looks is the theme's: standard (the default,
// with a gap between them; the one pressed a little wider and its neighbours a little narrower) or connected (joined,
// the corners between them small, larger with the size, the outer ones the buttons'). The buttons in it have one size
// and one shape (`size`, `shape` on each: Button's and IconButton's), and the group follows them. A toggle button in it
// is a Button or an IconButton with `selected` (aria-pressed): the theme gives it its look on and off (the Button's and
// the IconButton's), in a standard group with the group's corners while it is on, in a connected one fully round. What
// turns it on and off is the script of the block that shows it. Other attributes (data-…) go on the group, and `className` after its own classes. An Astro component gives
// an element the same classes with buttonGroupClass.
import type { ReactNode } from 'react';

export const buttonGroupKinds = ['standard', 'connected'] as const;
export type ButtonGroupKind = (typeof buttonGroupKinds)[number];

/** A button group's classes: its kind's. */
export const buttonGroupClass = (kind: ButtonGroupKind = 'standard') => `button-group button-group-${kind}`;

export default function ButtonGroup({
  kind,
  label,
  className,
  children,
  ...rest
}: { kind?: ButtonGroupKind; label: string; className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <div role="group" aria-label={label} className={[buttonGroupClass(kind), className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}
