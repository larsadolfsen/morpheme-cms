// A checkbox (m3.material.io/components/checkbox, .mo-checkbox in ../styles/ui/checkbox.css): the box, its name (`label`) beside
// it and a line under the name (`supporting`), all of it one <label>, so a click anywhere ticks it. `checked`: ticked
// from the start; `indeterminate`: neither ticked nor not (a choice over others, some of which are ticked; the browser
// has it as a property, not an attribute, so on the site checkbox.script.ts sets it from data-indeterminate, and in the
// editor it is set here, until it is clicked); `disabled`: it cannot be changed (a choice that is always on); `error`:
// it is wrong (not ticked where it must be), marked, and with a text the line under it says what is wrong. The tick and
// the dash are the theme's icons (`check`, `minus`), shown by a theme that draws the box itself; else the browser draws
// the box in the accent. With `onChange` (the editor) `checked` is whether it is ticked now, else ticked from the start.
// `hideLabel`: only screen readers say its name (aria-label), as on the Switch (a box in a bar that names it). Other attributes (`name`, `value`, `required`, data-…) go on the <input>, and `className` on
// the label.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';

/** A checkbox's classes, and the error's when it is wrong. */
export const checkboxClass = (error = false) => (error ? 'mo-checkbox mo-is-error' : 'mo-checkbox');

export default function Checkbox({
  label,
  hideLabel,
  supporting,
  checked,
  indeterminate,
  error,
  className,
  ...rest
}: {
  label: string;
  hideLabel?: boolean;
  supporting?: ReactNode;
  checked?: boolean;
  indeterminate?: boolean;
  error?: string | boolean;
  className?: string;
} & Record<string, unknown>) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (input.current) input.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  // The line under the name says what is wrong (or helps): the box points to it, so a reader says it with the box.
  const lineId = useId();
  const line = hideLabel ? null : typeof error === 'string' && error ? error : supporting;
  return (
    <label className={[checkboxClass(Boolean(error)), hideLabel && 'mo-is-label-hidden', className].filter(Boolean).join(' ')}>
      <span className="mo-checkbox__box">
        <input
          ref={input}
          type="checkbox"
          className="mo-checkbox__input"
          {...(rest.onChange ? { checked: Boolean(checked) } : { defaultChecked: checked })}
          aria-label={hideLabel ? label : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={line ? lineId : undefined}
          data-indeterminate={indeterminate ? '' : undefined}
          {...rest}
        />
        <Svg name="check" size={14} className="mo-checkbox__icon" />
        {indeterminate && <Svg name="remove" size={14} className="mo-checkbox__indeterminate-icon" />}
      </span>
      {!hideLabel && (
        <span className="mo-checkbox__text">
          <span className="mo-checkbox__label">{label}</span>
          {line && (
            <span id={lineId} className="mo-checkbox__supporting">
              {line}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
