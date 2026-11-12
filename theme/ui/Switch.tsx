// A switch (m3.material.io/components/switch, .switch in ../styles/ui.css): a SettingRow (SettingRow.tsx) with its name
// (`label`) and a line under it (`supporting`), and after them the track with its handle, all of it one <label>, so a
// click anywhere switches it; the switch is a native <input type="checkbox" role="switch">, so Space switches it and screen readers say
// "on"/"off". `icons`: the theme's icons in the handle, 'both' (a check when it is on, a cross when it is off) or
// 'selected' (only the check); none without it. `checked`: on from the start, or, with `onChange` (the editor), whether
// it is on now; `disabled`: it cannot be changed. `hideLabel`: only screen readers say its name (a switch at
// the end of a row that names it). Other attributes (`name`, `value`, data-…) go on the <input>, and `className` on the
// label. An Astro component gives an element the same classes with switchClass.
import type { ReactNode } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';
import SettingRow from './SettingRow';

export type SwitchIcons = 'both' | 'selected';

/** A switch's classes: with icons in its handle, `switch-icons`. */
export const switchClass = (icons?: SwitchIcons) => (icons ? 'switch switch-icons' : 'switch');

export default function Switch({
  label,
  hideLabel,
  supporting,
  checked,
  icons,
  className,
  ...rest
}: {
  label: string;
  hideLabel?: boolean;
  supporting?: ReactNode;
  checked?: boolean;
  icons?: SwitchIcons;
  className?: string;
} & Record<string, unknown>) {
  // Changed by the editor (onChange): on as it says; else on from the start, then by the visitor.
  const on = rest.onChange ? { checked: Boolean(checked) } : { defaultChecked: checked };
  return (
    <SettingRow
      as="label"
      className={[switchClass(icons), className].filter(Boolean).join(' ')}
      label={hideLabel ? null : label}
      supporting={hideLabel ? null : supporting}
    >
      <span className="switch-track">
        <input type="checkbox" role="switch" className="switch-input" aria-label={hideLabel ? label : undefined} {...on} {...rest} />
        <span className="switch-handle">
          {icons && <Svg name="check" size={16} className="switch-icon switch-icon-on" />}
          {icons === 'both' && <Svg name="x" size={16} className="switch-icon switch-icon-off" />}
        </span>
      </span>
    </SettingRow>
  );
}
