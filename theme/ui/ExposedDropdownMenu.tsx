// An exposed dropdown menu (m3.material.io/components/menus, .exposed-dropdown-menu in ../styles/ui.css): a field that
// shows the chosen one of a few choices (`options`, each its `value` and `label`, evt. `disabled`) and opens a menu of
// them, with its name (`label`), a line under it (`supporting`) or what is wrong with it (`error`). As Material's, it
// is the theme's text field (TextField.tsx: its kind, `kind`, outlined by default or filled, its classes and its look)
// with an arrow at its end. The field is the browser's own <select>, so it works without JavaScript, sends its value
// with a form (`name`) and is a combobox to screen readers, with the keyboard they know; where the browser can style
// its menu (appearance: base-select), the menu is drawn as the theme's menu (its --menu-* variables), else it is the
// browser's own. Without `value` nothing is chosen from the start, and the name stands in the field like an empty text
// field's. Other attributes (`name`, `required`, `disabled`, `onChange`, data-…) go on the <select>, and `className` on
// the field around it.
import { useId } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';
import { textFieldClass, type TextFieldKind } from '@theme/ui/TextField';

export type ExposedDropdownMenuOption = { value: string; label: string; disabled?: boolean };

/** An exposed dropdown menu's classes: the text field's of its kind (and its error's), and its own. */
export const exposedDropdownMenuClass = (kind: TextFieldKind = 'outlined', error = false) =>
  `${textFieldClass(kind, error)} exposed-dropdown-menu`;

export default function ExposedDropdownMenu({
  label,
  options,
  value,
  supporting,
  error,
  kind,
  id,
  className,
  ...rest
}: {
  label: string;
  options: ExposedDropdownMenuOption[];
  value?: string;
  supporting?: string;
  error?: string;
  kind?: TextFieldKind;
  id?: string;
  className?: string;
} & Record<string, unknown>) {
  const own = useId();
  const field = id ?? own;
  const line = error || supporting;
  return (
    <div className={[exposedDropdownMenuClass(kind, !!error), className].filter(Boolean).join(' ')}>
      <div className="text-field-container">
        <select
          id={field}
          className="text-field-input exposed-dropdown-menu-select"
          defaultValue={value ?? ''}
          aria-invalid={error ? true : undefined}
          aria-describedby={line ? `${field}-supporting` : undefined}
          {...rest}
        >
          {/* Nothing chosen yet: an empty choice that is not in the menu. */}
          {value === undefined && <option value="" hidden className="exposed-dropdown-menu-empty" />}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled} className="exposed-dropdown-menu-option">
              {o.label}
            </option>
          ))}
        </select>
        <label htmlFor={field} className="text-field-label">
          {label}
        </label>
        <Svg name="caret-down" size={20} className="exposed-dropdown-menu-icon" />
      </div>
      {line && (
        <div className="text-field-supporting-row">
          <p id={`${field}-supporting`} className="text-field-supporting">
            {line}
          </p>
        </div>
      )}
    </div>
  );
}
