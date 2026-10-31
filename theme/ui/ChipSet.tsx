// A chip set (Material's chips side by side, as Material's own web components group them, md-chip-set; .chip-set in
// ../styles/ui.css): the theme's chips (`children`: Chip) in a group with its name (`label`, read by screen readers).
// Its layout (`layout`): wrap (the default: on as many lines as they need) or scroll (on one line that scrolls sideways
// when they are wider than it, as Material's chips do on a phone, without a scrollbar). Other attributes (data-…) go on
// the group, and `className` after its own classes. An Astro component gives an element the same classes with
// chipSetClass.
import type { ReactNode } from 'react';

export const chipSetLayouts = ['wrap', 'scroll'] as const;
export type ChipSetLayout = (typeof chipSetLayouts)[number];

/** A chip set's classes: its layout's. */
export const chipSetClass = (layout: ChipSetLayout = 'wrap') => `chip-set chip-set-${layout}`;

export default function ChipSet({
  layout,
  label,
  className,
  children,
  ...rest
}: { layout?: ChipSetLayout; label: string; className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <div role="group" aria-label={label} className={[chipSetClass(layout), className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}
