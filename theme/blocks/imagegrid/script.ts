// What "Image grid" does in a browser on the site (View.tsx draws it; the rules are pure functions in filter.mjs): the tag filter (chips drawn
// hidden, shown here: a tap adds a tag or takes it off, the grid shows the images with all the chosen tags, a tag that would leave nothing is
// disabled, `Clear tags` takes them all off, the count is announced, the chosen tags are kept in the address as #tags=sea,food with
// replaceState, so a reload or a shared link keeps them), and the lightbox (a tap on a card opens the images shown, at that one). Run on every
// page by the theme's Base.astro (blockScripts); without an image grid it does nothing. Without JavaScript every image shows and a card is a
// link to its image.
import { chosenFrom, disabledTags, fragmentOf, matching, toggled } from '@morphemecms/cms/src/standard/imagegrid/filter.mjs';
import { lightbox, type LightboxImage } from '@theme/ui/lightboxControl';

// The chip set scrolls sideways on one line when its chips need more than two lines.
const MAX_LINES = 2;

function grid(root: HTMLElement) {
  const list = root.querySelector<HTMLElement>('.block-imagegrid-grid');
  if (!list) return;
  const items = [...list.querySelectorAll<HTMLElement>(':scope > li')];
  const images = items.map((li) => ({
    li,
    src: li.querySelector('a[data-image]')?.getAttribute('href') ?? li.dataset.index ?? '',
    tags: (li.dataset.tags ?? '').split(',').filter(Boolean),
  }));
  const box = root.querySelector<HTMLElement>('[data-imagegrid-filter]');
  const chips = box ? [...box.querySelectorAll<HTMLButtonElement>('[data-tag]')] : [];
  const known = chips.map((chip) => chip.dataset.tag ?? '');
  const clear = root.querySelector<HTMLButtonElement>('[data-imagegrid-clear]');
  const count = root.querySelector<HTMLElement>('[data-imagegrid-count]');
  const empty = root.querySelector<HTMLElement>('[data-imagegrid-empty]');
  const set = box?.querySelector<HTMLElement>('.chip-set');
  const start = (root.dataset.start ?? '').split(',').filter(Boolean);
  let chosen: string[] = [];

  // What the chosen tags show: the images with all of them, the chips that would leave nothing disabled, the count, the clear button.
  function apply(announce: boolean) {
    const shown = new Set(matching(images, chosen));
    images.forEach((image) => (image.li.hidden = !shown.has(image)));
    const off = new Set(disabledTags(images, chosen, known));
    chips.forEach((chip) => {
      const tag = chip.dataset.tag ?? '';
      chip.setAttribute('aria-pressed', String(chosen.includes(tag)));
      chip.disabled = off.has(tag);
    });
    if (clear) clear.hidden = !chosen.length;
    if (empty) empty.hidden = shown.size > 0;
    if (count) {
      // The count (a live region that is always there) is only said after a choice, never when the page opens.
      count.textContent = announce ? (count.dataset.template ?? '').replace('{count}', String(shown.size)) : '';
    }
  }

  function remember() {
    const fragment = fragmentOf(chosen);
    // Only the fragment changes, and no history entry: Back leaves the page, as a filter is not a page.
    history.replaceState(history.state, '', `${location.pathname}${location.search}${fragment ? `#${fragment}` : ''}`);
  }

  function choose(next: string[]) {
    chosen = next;
    apply(true);
    remember();
  }

  if (box) {
    box.hidden = false;
    chosen = location.hash ? chosenFrom(location.hash, known) : start;
    // Two lines of chips at most: more scroll on one line.
    if (set && set.getBoundingClientRect().height > MAX_LINES * (chips[0]?.getBoundingClientRect().height ?? 32) + 16) {
      set.classList.replace('chip-set-wrap', 'chip-set-scroll');
    }
    chips.forEach((chip) => chip.addEventListener('click', () => choose(toggled(chosen, chip.dataset.tag ?? ''))));
    clear?.addEventListener('click', () => {
      choose([]);
      chips[0]?.focus();
    });
    window.addEventListener('hashchange', () => {
      chosen = chosenFrom(location.hash, known);
      apply(true);
    });
    apply(false);
  }

  // The lightbox: the images that show, in the grid's order.
  const el = root.querySelector<HTMLDialogElement>('dialog[data-lightbox]');
  if (!el || !root.hasAttribute('data-open')) return;
  const viewer = lightbox(el, { count: el.dataset.position ?? '{index} of {total}' });
  list.addEventListener('click', (e) => {
    const mouse = e as MouseEvent;
    // A new tab, window or download (a modified click) keeps the link's own work.
    if (mouse.defaultPrevented || mouse.button !== 0 || mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey) return;
    const card = (e.target as Element | null)?.closest<HTMLElement>('a[data-image]');
    const li = card?.closest<HTMLElement>('li');
    if (!card || !li) return;
    const visible = items.filter((item) => !item.hidden);
    const at = visible.indexOf(li);
    if (at < 0) return;
    const shown: LightboxImage[] = visible.map((item) => {
      const img = item.querySelector<HTMLImageElement>('img')!;
      // The large copy: the srcset with the window's whole width (never the small one the card uses).
      return {
        src: item.querySelector<HTMLAnchorElement>('a[data-image]')?.getAttribute('href') ?? img.currentSrc,
        srcset: img.getAttribute('srcset') ?? undefined,
        sizes: img.getAttribute('srcset') ? '100vw' : undefined,
        width: Number(img.getAttribute('width')) || undefined,
        height: Number(img.getAttribute('height')) || undefined,
        alt: img.alt,
        // The caption of the record, also when the card does not show it.
        caption: item.dataset.caption || undefined,
      };
    });
    e.preventDefault();
    viewer.open(shown, at, card);
  });
}

export default function imagegrid() {
  document.querySelectorAll<HTMLElement>('[data-imagegrid]').forEach(grid);
}
