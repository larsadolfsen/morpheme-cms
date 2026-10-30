// A radio button (m3.material.io/components/radio-button, .radio-button in ../styles/ui.css): one of a few choices,
// of which only one can be chosen. As the checkbox (Checkbox.tsx): the round button, its name (`label`) beside it and
// a line under the name (`supporting`), all of it one <label>, so a click anywhere chooses it. The buttons of one
// choice have the same `name` (on the <input>, with its `value`) and stand in a RadioGroup, the choice's name
// (`label`) over them: native radio buttons, so the arrow keys move between them and Tab moves past the group.
// `checked`: chosen from the start; `disabled`: it cannot be chosen. The browser draws the button in the accent; a
// theme that draws it itself (appearance: none) draws its dot too. Other attributes (`name`, `value`, data-…) go on
// the <input>, and `className` on the label. An Astro component gives an element the same classes with
// radioButtonClass and radioGroupClass.
import type { ReactNode } from 'react';

/** A radio button's classes, and a group's. */
export const radioButtonClass = () => 'radio-button';
export const radioGroupClass = () => 'radio-group';

export default function RadioButton({
  label,
  supporting,
  checked,
  className,
  ...rest
}: { label: string; supporting?: string; checked?: boolean; className?: string } & Record<string, unknown>) {
  return (
    <label className={[radioButtonClass(), className].filter(Boolean).join(' ')}>
      <span className="radio-button-box">
        <input type="radio" className="radio-button-input" defaultChecked={checked} {...rest} />
      </span>
      <span className="radio-button-text">
        <span className="radio-button-label">{label}</span>
        {supporting && <span className="radio-button-supporting">{supporting}</span>}
      </span>
    </label>
  );
}

/** The radio buttons of one choice under its name (`label`): a <fieldset> with its <legend>. Other attributes go on
 * the <fieldset>, and `className` after its own class. */
export function RadioGroup({
  label,
  className,
  children,
  ...rest
}: { label: string; className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <fieldset className={[radioGroupClass(), className].filter(Boolean).join(' ')} {...rest}>
      <legend className="radio-group-label">{label}</legend>
      {children}
    </fieldset>
  );
}
