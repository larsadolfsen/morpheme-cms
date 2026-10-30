// What a text field (TextField.tsx) does as it is written in and its buttons are pressed, on the site
// (textField.script.ts) and in the editor (the part's own events): its character counter follows what is written, a
// multi-line field that grows is as tall as its text (where the browser cannot do it itself, field-sizing), the clear
// button empties it, and the password button shows or hides the password.

/** The field's input or textarea. */
const inputOf = (root: HTMLElement) => root.querySelector<HTMLInputElement | HTMLTextAreaElement>('.text-field-input');

/** A field's counter: what is written, and how much may be (12/50). */
export const counterText = (length: number, max?: number) => (max ? `${length}/${max}` : String(length));

/** Puts a text field (its .text-field element) right for what is written in it: its counter and its height. */
export function updateTextField(root: HTMLElement) {
  const input = inputOf(root);
  if (!input) return;
  const counter = root.querySelector<HTMLElement>('[data-text-field-counter]');
  if (counter) {
    const limit = Number(counter.dataset.limit) || undefined;
    counter.textContent = counterText(input.value.length, input.maxLength > 0 ? input.maxLength : limit);
    counter.classList.toggle('text-field-counter-over', !!limit && input.value.length > limit);
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
