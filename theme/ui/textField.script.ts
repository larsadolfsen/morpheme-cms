// What a text field (TextField.tsx) does on the site: its counter follows what is written, a multi-line field that
// grows is as tall as its text, the clear button empties it and the password button shows or hides the password
// (updateTextField and pressTextField in textFieldUpdate.ts). Run on every page by the theme's Base.astro
// (blockScripts, src/site/scripts.ts); without such a field on the page it does nothing.
import { pressTextField, updateTextField } from './textFieldUpdate';

export default function textField() {
  document.querySelectorAll<HTMLElement>('[data-text-field]').forEach((root) => {
    root.addEventListener('input', () => updateTextField(root));
    root.addEventListener('click', (e) => {
      const button = (e.target as HTMLElement).closest<HTMLElement>('[data-text-field-clear], [data-text-field-visibility]');
      if (button && root.contains(button)) pressTextField(root, button);
    });
    // What the browser may have put back (going back to the page).
    updateTextField(root);
  });
}
