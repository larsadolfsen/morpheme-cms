// A checkbox (m3.material.io/components/checkbox, .checkbox in ../styles/ui.css): the box, its name (`label`) beside
// it and a line under the name (`supporting`), all of it one <label>, so a click anywhere ticks it. `checked`: ticked
// from the start; `indeterminate`: neither ticked nor not (a choice over others, some of which are ticked; the browser
// has it as a property, not an attribute, so on the site checkbox.script.ts sets it from data-indeterminate, and in the
// editor it is set here, until it is clicked); `disabled`: it cannot be changed (a choice that is always on); `error`:
// it is wrong (not ticked where it must be), marked, and with a text the line under it says what is wrong. The tick and
// the dash are the theme's icons (`check`, `minus`), shown by a theme that draws the box itself; else the browser draws
// the box in the accent. With `onChange` (the editor) `checked` is whether it is ticked now, else ticked from the start.
// Other attributes (`name`, `value`, `required`, data-…) go on the <input>, and `className` on
// the label.
import { useEffect, useRef, type ReactNode } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';

/** A checkbox's classes, and the error's when it is wrong. */
export const checkboxClass = (error = false) => (error ? 'checkbox checkbox-error' : 'checkbox');

export default function Checkbox({
  label,
  supporting,
  checked,
  indeterminate,
  error,
  className,
  ...rest
}: {
  label: string;
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
  const line = typeof error === 'string' && error ? error : supporting;
  return (
    <label className={[checkboxClass(Boolean(error)), className].filter(Boolean).join(' ')}>
      <span className="checkbox-box">
        <input
          ref={input}
          type="checkbox"
          className="checkbox-input"
          {...(rest.onChange ? { checked: Boolean(checked) } : { defaultChecked: checked })}
          aria-invalid={error ? true : undefined}
          data-indeterminate={indeterminate ? '' : undefined}
          {...rest}
        />
        <Svg name="check" size={14} className="checkbox-icon" />
        {indeterminate && <Svg name="minus" size={14} className="checkbox-indeterminate-icon" />}
      </span>
      <span className="checkbox-text">
        <span className="checkbox-label">{label}</span>
        {line && <span className="checkbox-supporting">{line}</span>}
      </span>
    </label>
  );
}
