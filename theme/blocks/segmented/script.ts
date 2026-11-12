// What "Segmented list" does on the site (MoreRows.tsx): with `Max rows`, the rows after the first ones are hidden and a button
// shows them (more.ts). Without script all rows show. Run on every page by the theme's Base.astro (blockScripts).
import { cutMoreRows, showMoreRows } from './more';

export default function segmented() {
  document.querySelectorAll<HTMLElement>('.block-more[data-max]').forEach(cutMoreRows);
  document.addEventListener('click', (e) => {
    const button = (e.target as Element | null)?.closest<HTMLElement>('.block-more-button [aria-controls]');
    const root = button?.closest<HTMLElement>('.block-more');
    if (root) showMoreRows(root);
  });
}
