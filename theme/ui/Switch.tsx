// A switch (m3.material.io/components/switch, .switch in ../styles/ui.css): its name (`label`) and a line under the
// name (`supporting`), and after them the track with its handle, all of it one <label>, so a click anywhere switches
// it; the switch is a native <input type="checkbox" role="switch">, so Space switches it and screen readers say
// "on"/"off". `icons`: the theme's icons in the handle, 'both' (a check when it is on, a cross when it is off) or
// 'selected' (only the check); none without it. `checked`: on from the start, or, with `onChange` (the editor), whether
// it is on now; `disabled`: it cannot be changed. `states`: what it is on and off ("Til", "Fra"), shown before the
// track (.switch-state; the theme's addition to M3's switch). `hideLabel`: only screen readers say its name (a switch at
// the end of a row that names it). Other attributes (`name`, `value`, data-…) go on the <input>, and `className` on the
// label. An Astro component gives an element the same classes with switchClass.
import type { ReactNode } from 'react';
import { Svg } from '@morpheme/cms/src/icon';

export type SwitchIcons = 'both' | 'selected';

/** A switch's classes: with icons in its handle, `switch-icons`. */
export const switchClass = (icons?: SwitchIcons) => (icons ? 'switch switch-icons' : 'switch');

export default function Switch({
  label,
  hideLabel,
  supporting,
  checked,
  states,
  icons,
  className,
  ...rest
}: {
  label: string;
  hideLabel?: boolean;
  supporting?: ReactNode;
  checked?: boolean;
  states?: [string, string];
  icons?: SwitchIcons;
  className?: string;
} & Record<string, unknown>) {
  // Changed by the editor (onChange): on as it says; else on from the start, then by the visitor.
  const on = rest.onChange ? { checked: Boolean(checked) } : { defaultChecked: checked };
  return (
    <label className={[switchClass(icons), className].filter(Boolean).join(' ')}>
      {!hideLabel && (
        <span className="switch-text">
          <span className="switch-label">{label}</span>
          {supporting && <span className="switch-supporting">{supporting}</span>}
        </span>
      )}
      {states && (
        <span className="switch-state" aria-hidden="true">
          {states[checked ? 0 : 1]}
        </span>
      )}
      <span className="switch-track">
        <input type="checkbox" role="switch" className="switch-input" aria-label={hideLabel ? label : undefined} {...on} {...rest} />
        <span className="switch-handle">
          {icons && <Svg name="check" size={16} className="switch-icon switch-icon-on" />}
          {icons === 'both' && <Svg name="x" size={16} className="switch-icon switch-icon-off" />}
        </span>
      </span>
    </label>
  );
}
