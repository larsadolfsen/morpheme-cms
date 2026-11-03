// What a snackbar (Snackbar.tsx) does on the site: one drawn in a <template data-snackbar> on the page (a new version
// of a page, layouts/PageLayout.astro) is shown at the bottom when the page opens, with the editor's snackbar()
// (@morpheme/cms/lib/snackbar.ts: where it stands, how long it stays, `data-ms` on the template when longer, and how it
// is swiped or tapped away). Its close button and Escape close it. Run on every page by the theme's Base.astro
// (blockScripts, packages/editor/site/blockScripts.ts); without one on the page it does nothing.
import { snackbar } from '@morpheme/cms/lib/snackbar';

export default function snackbars() {
  document.querySelectorAll<HTMLTemplateElement>('template[data-snackbar]').forEach((template) => {
    const element = template.content.firstElementChild?.cloneNode(true);
    if (!(element instanceof HTMLElement)) return;
    const text = element.querySelector('.snackbar-supporting-text')?.textContent?.trim() ?? '';
    const ms = Number(template.dataset.ms) || undefined;
    snackbar({ text, element, ms, error: element.getAttribute('role') === 'alert' });
  });
}
