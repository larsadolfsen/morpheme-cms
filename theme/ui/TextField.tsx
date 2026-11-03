// A text field (m3.material.io/components/text-fields, .text-field in ../styles/ui.css): a field to write in, with
// its name (`label`), drawn in the field and moving above what is written, or only read by screen readers
// (`hideLabel`, a field whose placeholder says what it is), or without one (no `label`: a form that names its fields
// itself, the editor's, with a <label> for its `id`), and a line under it (`supporting`), or what is wrong with
// it (`error`: the field marked, and the line saying so; true: only marked, what is wrong said elsewhere). Its kind (`kind`: outlined, the default, or filled) is
// Material's name; how each looks is the theme's. In the field before what is written an icon (`leadingIcon`, the
// theme's icon by its name) and a text (`prefix`, kr.), after it a text (`suffix`) and an icon (`trailingIcon`), a
// button of the field's own (`clearLabel`: one that empties it, shown when something is written; `passwordLabel`: one
// that shows the password, with type="password"), one of the caller's (`trailing`, an IconButton) and the error's icon
// (`errorIcon`, in place of the others while the field is wrong). `counter`: how much is written under it at the end
// (12/50 with `maxLength`); `limit`: how much it should have at most, without stopping more (12/60, the counter marked
// past it, .text-field-counter-over). `rows`: several lines (a <textarea>) of that many rows; `multiline`: several lines that grow
// with the text. `disabled`: it cannot be used; `readOnly`: it can be read and copied, not changed. Other attributes
// (`type`, `name`, `required`, `placeholder`, `id`, `autoComplete` …) go on the <input>, and `className` on the field
// around it (its width, its place). The counter, the growing and the buttons work on the site with
// textField.script.ts and in the editor here (both with textFieldUpdate.ts). An Astro component gives an element the
// same classes with textFieldClass, textFieldContainerClass and textFieldInputClass, and so does something that looks
// like a field but is a button (the editor's choice from a list).
import { useId, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { Glyph, Svg, type IconRef } from '@morphemecms/cms/src/icon';
import IconButton, { iconButtonClass } from '@theme/ui/IconButton';
import { counterText, pressTextField, updateTextField } from './textFieldUpdate';

/** The kinds of a text field, as Material 3 names them. */
export type TextFieldKind = 'outlined' | 'filled';

/** A text field's classes: its kind's, the error's when it has one, and a multi-line field's. */
export const textFieldClass = (kind: TextFieldKind = 'outlined', error = false, multiline = false) =>
  ['text-field', `text-field-${kind}`, error && 'text-field-error', multiline && 'text-field-multiline'].filter(Boolean).join(' ');

/** The class of the box in the field, and of what is written in it (or tapped: a choice from a list). */
export const textFieldContainerClass = 'text-field-container';
export const textFieldInputClass = 'text-field-input';

export default function TextField({
  label,
  hideLabel,
  supporting,
  error,
  kind,
  leadingIcon,
  trailingIcon,
  trailing,
  errorIcon,
  clearLabel,
  passwordLabel,
  prefix,
  suffix,
  counter: counted,
  maxLength,
  limit,
  rows,
  multiline,
  id,
  placeholder,
  className,
  ...rest
}: {
  label?: string;
  hideLabel?: boolean;
  supporting?: ReactNode;
  error?: string | boolean;
  kind?: TextFieldKind;
  leadingIcon?: string;
  trailingIcon?: string;
  trailing?: ReactNode;
  errorIcon?: boolean;
  clearLabel?: string;
  passwordLabel?: string;
  prefix?: string;
  suffix?: string;
  counter?: boolean;
  maxLength?: number;
  limit?: number;
  rows?: number;
  multiline?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
} & Record<string, unknown>) {
  const counter = counted || limit !== undefined;
  const own = useId();
  const field = id ?? own;
  const line = (typeof error === 'string' && error) || supporting;
  const drawn = label !== undefined && !hideLabel;
  const lines = multiline || rows !== undefined;
  // Only a field that does something as it is written in, or has buttons, is the script's.
  const working = counter || multiline || clearLabel || passwordLabel;
  const described = [line && `${field}-supporting`, counter && `${field}-counter`].filter(Boolean).join(' ');
  const written = String(rest.defaultValue ?? rest.value ?? '');
  const off = Boolean(rest.disabled);
  const input = {
    id: field,
    className: textFieldInputClass,
    // A label drawn in the field moves above it once something is written (:placeholder-shown).
    placeholder: placeholder ?? (!drawn && !clearLabel ? undefined : ' '),
    maxLength,
    'aria-label': hideLabel ? label : undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': described || undefined,
    ...rest,
  };
  return (
    <div
      className={[
        textFieldClass(kind, !!error, lines),
        leadingIcon && 'text-field-with-leading-icon',
        !drawn && 'text-field-without-label',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-text-field={working ? '' : undefined}
      onInput={working ? (e: FormEvent<HTMLDivElement>) => updateTextField(e.currentTarget) : undefined}
      onClick={
        clearLabel || passwordLabel
          ? (e: MouseEvent<HTMLDivElement>) => {
              const button = (e.target as HTMLElement).closest<HTMLElement>('[data-text-field-clear], [data-text-field-visibility]');
              if (button) pressTextField(e.currentTarget, button);
            }
          : undefined
      }
    >
      <div className={textFieldContainerClass}>
        {leadingIcon && <Svg name={leadingIcon} size={20} className="text-field-leading-icon" />}
        {prefix && (
          <span className="text-field-prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        {lines ? (
          <textarea {...input} rows={rows ?? 1} data-text-field-grow={multiline && rows === undefined ? '' : undefined} />
        ) : (
          <input {...input} />
        )}
        {drawn && (
          <label htmlFor={field} className="text-field-label">
            {label}
          </label>
        )}
        {suffix && (
          <span className="text-field-suffix" aria-hidden="true">
            {suffix}
          </span>
        )}
        {trailingIcon && <Svg name={trailingIcon} size={20} className="text-field-trailing-icon" />}
        {clearLabel && (
          <IconButton
            icon="x"
            label={clearLabel}
            className="text-field-trailing-action text-field-clear"
            disabled={off}
            data-text-field-clear=""
          />
        )}
        {passwordLabel && (
          <button
            type="button"
            className={`${iconButtonClass()} text-field-trailing-action text-field-visibility`}
            aria-label={passwordLabel}
            aria-pressed="false"
            disabled={off}
            data-text-field-visibility=""
          >
            <Svg name="eye" size={22} className="text-field-visibility-show" />
            <Svg name="eye-slash" size={22} className="text-field-visibility-hide" />
          </button>
        )}
        {trailing && <span className="text-field-trailing-action">{trailing}</span>}
        {errorIcon && <Svg name="warning-circle" size={20} className="text-field-trailing-icon text-field-error-icon" />}
      </div>
      {(line || counter) && (
        <div className="text-field-supporting-row">
          {line && (
            <p id={`${field}-supporting`} className="text-field-supporting">
              {line}
            </p>
          )}
          {counter && (
            <span
              id={`${field}-counter`}
              className={
                limit !== undefined && written.length > limit ? 'text-field-counter text-field-counter-over' : 'text-field-counter'
              }
              data-text-field-counter=""
              data-limit={limit}
            >
              {counterText(written.length, maxLength ?? limit)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** A field that is tapped to choose (the editor's choice from a list, which opens its own sheet, or with `href` a page
 * with the choices): the text field (its kind and its look) with a button, or a link, in its container showing what is
 * chosen (`children`), its name on its edge (`label`; without it, it is named by `aria-label`), an icon at its end
 * (`trailingIcon`: caret-down, the default, or the arrow to a page), and the line under it (`supporting`) or what is
 * wrong (`error`). Other attributes (onClick, aria-…) go on the button, and `className` on the field around it. */
export function TextFieldButton({
  label,
  supporting,
  error,
  kind,
  href,
  trailingIcon = 'caret-down',
  id,
  className,
  children,
  ...rest
}: {
  label?: string;
  supporting?: ReactNode;
  error?: string | boolean;
  kind?: TextFieldKind;
  href?: string;
  trailingIcon?: IconRef;
  id?: string;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  const own = useId();
  const field = id ?? own;
  const line = (typeof error === 'string' && error) || supporting;
  const described = line ? `${field}-supporting` : undefined;
  return (
    <div
      className={[textFieldClass(kind, !!error), label === undefined && 'text-field-without-label', className].filter(Boolean).join(' ')}
    >
      <div className={textFieldContainerClass}>
        {href === undefined ? (
          <button
            type="button"
            id={field}
            className={textFieldInputClass}
            aria-invalid={error ? true : undefined}
            aria-describedby={described}
            {...rest}
          >
            {children}
          </button>
        ) : (
          <a
            id={field}
            href={href}
            className={textFieldInputClass}
            aria-labelledby={label ? `${field}-label ${field}` : undefined}
            {...rest}
          >
            {children}
          </a>
        )}
        {label !== undefined &&
          (href === undefined ? (
            <label htmlFor={field} className="text-field-label">
              {label}
            </label>
          ) : (
            <span id={`${field}-label`} className="text-field-label">
              {label}
            </span>
          ))}
        <Glyph icon={trailingIcon} size={20} className="text-field-trailing-icon" />
      </div>
      {line && (
        <div className="text-field-supporting-row">
          <p id={described} className="text-field-supporting">
            {line}
          </p>
        </div>
      )}
    </div>
  );
}
