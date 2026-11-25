// What the scroll fields drawn in a page do on the site (ScrollField.tsx and ScrollFieldContainer.tsx draw them; scrollFieldControl.ts is the behaviour, one for all
// of them and for the scroll time picker). A field whose value a form sends has a hidden input named for it ([data-scroll-field-name]): the value picked is written in it.
import { placeScrollField, scrollFieldControl } from '@theme/ui/scrollFieldControl';

export default function scrollFields() {
  if (!document.querySelector('[data-scroll-field]')) return;
  scrollFieldControl(document.body, {
    onChange: (list, value, settled) => {
      if (!settled) return;
      const input = list.closest('.mo-scroll-field')?.parentElement?.querySelector<HTMLInputElement>('input[type="hidden"]');
      if (input && input.value !== value) {
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    },
  });
  document.querySelectorAll<HTMLElement>('[data-scroll-field-count]').forEach(placeScrollField);
}
