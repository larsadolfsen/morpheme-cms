// What a text field (TextField.tsx) does as it is written in and its buttons are pressed, on the site
// (textField.script.ts) and in the editor (the part's own events): its character counter follows what is written, a
// multi-line field that grows is as tall as its text (where the browser cannot do it itself, field-sizing), the clear
// button empties it, and the password button shows or hides the password.

/** The field's input or textarea. */
const inputOf = (root: HTMLElement) => root.querySelector<HTMLInputElement | HTMLTextAreaElement>('.mo-text-field__input');

/** A field's counter: what is written, and how much may be (12/50). */
export const counterText = (length: number, max?: number) => (max ? `${length}/${max}` : String(length));

/** Puts a text field (its .mo-text-field element) right for what is written in it: its counter and its height. */
export function updateTextField(root: HTMLElement) {
  const input = inputOf(root);
  if (!input) return;
  const counter = root.querySelector<HTMLElement>('[data-text-field-counter]');
  if (counter) {
    const limit = Number(counter.dataset.limit) || undefined;
    counter.textContent = counterText(input.value.length, input.maxLength > 0 ? input.maxLength : limit);
    counter.classList.toggle('mo-text-field__counter-over', !!limit && input.value.length > limit);
  }
  if (input instanceof HTMLTextAreaElement && input.hasAttribute('data-text-field-grow') && !CSS.supports('field-sizing', 'content')) {
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }
}

/** Does what a button in a text field does (`button`, its clear or password button): empties the field, or shows or
 * hides the password, and gives the field the focus. */
export function pressTextField(root: HTMLElement, button: HTMLElement) {
  const input = inputOf(root);
  if (!input) return;
  if (button.hasAttribute('data-text-field-clear')) {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    updateTextField(root);
  } else if (button.hasAttribute('data-text-field-visibility') && input instanceof HTMLInputElement) {
    const shown = input.type === 'password';
    input.type = shown ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(shown));
  }
  input.focus();
}

/** Keeps what a screen reader gets in step with what is seen (the CSS `:user-invalid`, as `.mo-text-field.mo-is-error` is drawn): while
 * the browser finds the field invalid after the person has worked in it, its aria-invalid is true and the line saying what is
 * wrong (the id in the input's data-error) is in its aria-describedby; otherwise neither. A field marked by its caller
 * (data-marked: `error`) keeps the caller's aria-invalid. */
export function syncInvalid(root: HTMLElement) {
  const input = inputOf(root);
  const errorId = input?.dataset.error;
  if (!input || !errorId) return;
  const invalid = input.matches(':user-invalid');
  if (!input.hasAttribute('data-marked')) input.setAttribute('aria-invalid', String(invalid));
  const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id && id !== errorId);
  if (invalid) ids.push(errorId);
  if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
  else input.removeAttribute('aria-describedby');
}
