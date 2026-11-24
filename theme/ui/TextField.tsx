// A text field (m3.material.io/components/text-fields, .mo-text-field in ../styles/ui/text-field.css): a field to write in, with
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
// past it, .mo-text-field__counter-over). `rows`: several lines (a <textarea>) of that many rows; `multiline`: several lines that grow
// with the text. `disabled`: it cannot be used; `readOnly`: it can be read and copied, not changed. Other attributes
// (`type`, `name`, `required`, `placeholder`, `id`, `autoComplete` …) go on the <input>, and `className` on the field
// around it (its width, its place). The counter, the growing and the buttons work on the site with
// textField.script.ts and in the editor here (both with textFieldUpdate.ts). An Astro component gives an element the
// same classes with textFieldClass, textFieldContainerClass and textFieldInputClass, and so does something that looks
// like a field but is a button (the editor's choice from a list).
// `invalidText`: what to say under the field once the browser's own check finds it invalid after the person has
// worked in it (the CSS `:user-invalid`: changed and left, or the form tried to send); a field without it is not marked by
// the browser's check, as a mark with no words under it says nothing. It takes the place of the line
// (`supporting`) then, with the error's icon, and until then nothing is wrong. `invalid`: the caller's own check says it
// is wrong (setCustomValidity(invalidText)), as the editor's does from its own rules, so the browser's check and the
// caller's are one.
import { useEffect, useId, useRef, type FocusEvent, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { Glyph, Svg, type IconRef } from '@morphemecms/cms/src/icon';
import IconButton, { iconButtonClass } from '@theme/ui/IconButton';
import { counterText, pressTextField, syncInvalid, updateTextField } from './textFieldUpdate';

/** The kinds of a text field, as Material 3 names them. */
export type TextFieldKind = 'outlined' | 'filled';

/** A text field's classes: its kind's, the error's when it has one, and a multi-line field's. */
export const textFieldClass = (kind: TextFieldKind = 'outlined', error = false, multiline = false) =>
  ['mo-text-field', `mo-is-${kind}`, error && 'mo-is-error', multiline && 'mo-is-multiline'].filter(Boolean).join(' ');

/** The class of the box in the field, and of what is written in it (or tapped: a choice from a list). */
export const textFieldContainerClass = 'mo-text-field__container';
export const textFieldInputClass = 'mo-text-field__input';

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
  invalidText,
  invalid,
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
  invalidText?: string;
  invalid?: boolean;
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
  const root = useRef<HTMLDivElement>(null);
  const own = useId();
  const field = id ?? own;
  const line = (typeof error === 'string' && error) || supporting;
  const drawn = label !== undefined && !hideLabel;
  const lines = multiline || rows !== undefined;
  // Only a field that does something as it is written in, or has buttons, is the script's.
  const working = counter || multiline || clearLabel || passwordLabel;
  // What is said when the browser finds it invalid: not while the field is marked with a line of its own (`error`).
  const saying = typeof error === 'string' && error ? undefined : invalidText;
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
    'data-error': saying ? `${field}-invalid` : undefined,
    'data-marked': error ? '' : undefined,
    ...rest,
  };
  // The caller's own check is the browser's (setCustomValidity), and aria-invalid and the description follow `:user-invalid`.
  useEffect(() => {
    const input = root.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>('.mo-text-field__input');
    if (!input) return;
    input.setCustomValidity(invalid && invalidText ? invalidText : '');
    syncInvalid(root.current!);
  });
  return (
    <div
      ref={root}
      className={[textFieldClass(kind, !!error, lines), leadingIcon && 'mo-has-leading-icon', !drawn && 'mo-is-without-label', className]
        .filter(Boolean)
        .join(' ')}
      data-text-field={working ? '' : undefined}
      onInput={working ? (e: FormEvent<HTMLDivElement>) => updateTextField(e.currentTarget) : undefined}
      onBlurCapture={saying ? (e: FocusEvent<HTMLDivElement>) => syncInvalid(e.currentTarget) : undefined}
      onChangeCapture={saying ? (e: FormEvent<HTMLDivElement>) => syncInvalid(e.currentTarget) : undefined}
      onInvalidCapture={saying ? (e: FormEvent<HTMLDivElement>) => syncInvalid(e.currentTarget) : undefined}
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
        {leadingIcon && <Svg name={leadingIcon} size={20} className="mo-text-field__leading-icon" />}
        {prefix && (
          <span className="mo-text-field__prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        {lines ? (
          <textarea {...input} rows={rows ?? 1} data-text-field-grow={multiline && rows === undefined ? '' : undefined} />
        ) : (
          <input {...input} />
        )}
        {drawn && (
          <label htmlFor={field} className="mo-text-field__label">
            {label}
          </label>
        )}
        {suffix && (
          <span className="mo-text-field__suffix" aria-hidden="true">
            {suffix}
          </span>
        )}
        {trailingIcon && <Svg name={trailingIcon} size={20} className="mo-text-field__trailing-icon" />}
        {clearLabel && (
          <IconButton
            icon="close"
            label={clearLabel}
            className="mo-text-field__trailing-action mo-text-field__clear"
            disabled={off}
            data-text-field-clear=""
          />
        )}
        {passwordLabel && (
          <button
            type="button"
            className={`${iconButtonClass()} mo-text-field__trailing-action mo-text-field__visibility`}
            aria-label={passwordLabel}
            aria-pressed="false"
            disabled={off}
            data-text-field-visibility=""
          >
            <Svg name="visibility" size={22} className="mo-text-field__visibility-show" />
            <Svg name="visibility_off" size={22} className="mo-text-field__visibility-hide" />
          </button>
        )}
        {trailing && <span className="mo-text-field__trailing-action">{trailing}</span>}
        {(errorIcon || saying) && <Svg name="error" size={20} className="mo-text-field__trailing-icon mo-text-field__error-icon" />}
      </div>
      {(line || counter || saying) && (
        <div className="mo-text-field__supporting-row">
          {saying && (
            <p id={`${field}-invalid`} className="mo-text-field__supporting mo-text-field__invalid-text">
              {saying}
            </p>
          )}
          {line && (
            <p id={`${field}-supporting`} className="mo-text-field__supporting">
              {line}
            </p>
          )}
          {counter && (
            <span
              id={`${field}-counter`}
              className={
                limit !== undefined && written.length > limit
                  ? 'mo-text-field__counter mo-text-field__counter-over'
                  : 'mo-text-field__counter'
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

/** A field that is tapped to choose (the editor's choice from a list, which opens its own sheet or a menu under it, or
 * with `href` a page with the choices): the text field (its kind and its look) with a button, or a link, in its container
 * showing what is chosen (`children`), its name on its edge (`label`; without it, it is named by `aria-label`), an icon at
 * its end (`trailingIcon`: caret-down, the default, or the arrow to a page), and the line under it (`supporting`) or what
 * is wrong (`error`). `size="small"`: a small box, as wide as what is chosen, for a row's choice (a setting's, the
 * editor's MenuRow). While its menu is open (aria-expanded on the button) its edge and name are in the accent and the
 * arrow points up. Other attributes (onClick, aria-…) go on the button, and `className` on the field around it. */
export function TextFieldButton({
  label,
  supporting,
  error,
  kind,
  size,
  href,
  trailingIcon = 'keyboard_arrow_down',
  id,
  className,
  children,
  ...rest
}: {
  label?: string;
  supporting?: ReactNode;
  error?: string | boolean;
  kind?: TextFieldKind;
  size?: 'small';
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
  // A field without its name on the edge is named by `aria-label`. The button shows what is chosen, so its name starts with that and then
  // says what the field is (WCAG 2.5.3): `aria-labelledby` takes the button's own text and then the hidden name.
  const { 'aria-label': named, ...others } = rest as { 'aria-label'?: string };
  const aside = label === undefined && href === undefined && typeof named === 'string' ? `${field}-name` : undefined;
  return (
    <div
      className={[textFieldClass(kind, !!error), label === undefined && 'mo-is-without-label', size === 'small' && 'mo-is-small', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={textFieldContainerClass}>
        {href === undefined ? (
          <button
            type="button"
            id={field}
            className={textFieldInputClass}
            aria-invalid={error ? true : undefined}
            aria-describedby={described}
            aria-labelledby={aside ? `${field} ${aside}` : undefined}
            aria-label={aside ? undefined : named}
            {...others}
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
        {aside && (
          <span id={aside} hidden>
            {named}
          </span>
        )}
        {label !== undefined &&
          (href === undefined ? (
            <label htmlFor={field} className="mo-text-field__label">
              {label}
            </label>
          ) : (
            <span id={`${field}-label`} className="mo-text-field__label">
              {label}
            </span>
          ))}
        <Glyph icon={trailingIcon} size={20} className="mo-text-field__trailing-icon" />
      </div>
      {line && (
        <div className="mo-text-field__supporting-row">
          <p id={described} className="mo-text-field__supporting">
            {line}
          </p>
        </div>
      )}
    </div>
  );
}
