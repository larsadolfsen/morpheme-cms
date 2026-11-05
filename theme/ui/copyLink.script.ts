// What a copy-link button (ShareRow.astro, [data-copy-link]) does on the site: it writes its address to the clipboard and
// says so in a snackbar (its text in data-copied). Run on every page by Base.astro (blockScripts, by `ui/copyLink`);
// without such a button on the page it does nothing.
import { snackbar } from '@morphemecms/cms/lib/snackbar';

export default function copyLinks() {
  document.querySelectorAll<HTMLButtonElement>('button[data-copy-link]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copyLink ?? '');
      } catch {
        return;
      }
      snackbar({ text: button.dataset.copied ?? '' });
    });
  });
}
