// A chip set (Material's chips side by side, as Material's own web components group them, md-chip-set; .mo-chip__set in
// ../styles/ui/chips.css): the theme's chips (`children`: Chip) in a group with its name (`label`, read by screen readers).
// Its layout (`layout`): wrap (the default: on as many lines as they need) or scroll (on one line that scrolls sideways
// when they are wider than it, as Material's chips do on a phone, without a scrollbar). Other attributes (data-…) go on
// the group, and `className` after its own classes. An Astro component gives an element the same classes with
// chipSetClass.
import type { FocusEvent, ReactNode } from 'react';

export const chipSetLayouts = ['wrap', 'scroll'] as const;
export type ChipSetLayout = (typeof chipSetLayouts)[number];

/** A chip set's classes: its layout's. */
export const chipSetClass = (layout: ChipSetLayout = 'wrap') => `mo-chip__set mo-chip__set-${layout}`;

/** A row that scrolls sideways brings the chip that gets the focus fully into view, with the room of the row's scroll-padding (not less than its focus ring), also where the browser's own scroll leaves a chip that is partly seen where it is (Chrome does). */
function showFocused(event: FocusEvent<HTMLElement>) {
  const row = event.currentTarget;
  if (row.scrollWidth <= row.clientWidth) return;
  const chip = (event.target as HTMLElement).getBoundingClientRect();
  const box = row.getBoundingClientRect();
  const style = getComputedStyle(row);
  const before = parseFloat(style.scrollPaddingLeft) || 0;
  const after = parseFloat(style.scrollPaddingRight) || 0;
  const move =
    chip.left < box.left + before ? chip.left - (box.left + before) : chip.right > box.right - after ? chip.right - (box.right - after) : 0;
  if (move) row.scrollBy({ left: move, behavior: 'instant' });
}

export default function ChipSet({
  layout,
  label,
  className,
  children,
  ...rest
}: { layout?: ChipSetLayout; label: string; className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={[chipSetClass(layout), className].filter(Boolean).join(' ')}
      onFocus={showFocused}
      {...rest}
    >
      {children}
    </div>
  );
}
