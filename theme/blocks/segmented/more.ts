// `Max rows` of "Segmented list" in a browser (MoreRows.tsx): all rows are in the HTML, and without script all show and the
// button is hidden. Here the rows after the first `Max rows` are hidden (data-cut on the list's wrapper, the rows' own data-extra
// in CSS, ../../styles/blocks.css) and the button shows; a tap on it shows the rest in place, moves the focus to the first of
// them and the button goes. Used by script.ts on the site and by MoreRows.tsx in the editor's preview.
import { motionTiming } from '@morphemecms/cms/lib/motion';

const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Cuts the list after its first rows again (the button shows, aria-expanded false). */
export function cutMoreRows(root: HTMLElement) {
  const button = root.querySelector<HTMLElement>('.block-more-button button, .block-more-button [aria-controls]');
  root.setAttribute('data-cut', '');
  button?.setAttribute('aria-expanded', 'false');
}

/** Shows the rest of the rows. */
export function showMoreRows(root: HTMLElement) {
  if (!root.hasAttribute('data-cut')) return;
  root.removeAttribute('data-cut');
  const extra = [...root.querySelectorAll<HTMLElement>('[data-extra]')];
  root.querySelector<HTMLElement>('.block-more-button [aria-controls]')?.setAttribute('aria-expanded', 'true');
  const first = extra[0];
  first?.querySelector<HTMLElement>('summary, a, button')?.focus({ preventScroll: false });
  if (!calm())
    extra.forEach((row) =>
      row.animate(
        [
          { opacity: 0, transform: 'translateY(0.5rem)' },
          { opacity: 1, transform: 'none' },
        ],
        motionTiming('spatial'),
      ),
    );
}
