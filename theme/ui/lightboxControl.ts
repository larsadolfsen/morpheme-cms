// What a lightbox (Lightbox.tsx in its <dialog>) does in a browser, for the script that opens it (a block's: the image grid's script.ts):
// lightbox(el, { count }) gives it open(images, index, opener), close(), move(delta) and the index it shows. open() fills the track with the images (an <li> with a
// <figure>: the image in its own proportions, its caption under it), opens the dialog (native <dialog>: dialogControl.ts: the focus moves into it and
// is trapped, Escape and the close button close it, the scrim and the page behind it are the dialog's) and puts the image `index` in view at once; the
// track snaps, so a swipe, a trackpad and the arrow keys scroll one image at a time, and the Previous and Next buttons scroll by one image's width (at
// once with reduced motion). Left and Right move (the other way on a right-to-left page), Home and End go to the first and the last; the count
// (the site's text, "3 of 12") is written where the image changes, which is announced politely. close() puts the focus back on what opened it.
// It needs no library, no inline script and no address outside the site.
import { dialog } from '@theme/ui/dialogControl';
import { countText, indexAt, moved } from '@theme/ui/lightboxMath.mjs';

/** An image of the lightbox: its address, the srcset and sizes that make the browser fetch the large copy (never the 160 px one), its own
 * proportions (`width` and `height`), its text and its caption (shown under it). */
export type LightboxImage = {
  src: string;
  srcset?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt: string;
  caption?: string;
};

export type LightboxControls = {
  open: (images: LightboxImage[], index: number, opener?: HTMLElement | null) => void;
  close: () => Promise<void>;
  move: (delta: number) => void;
  index: () => number;
};

export function lightbox(el: HTMLDialogElement, texts: { count: string }): LightboxControls {
  const controls = dialog(el);
  const track = el.querySelector<HTMLElement>('[data-lightbox-track]')!;
  const previous = el.querySelector<HTMLButtonElement>('[data-lightbox-previous]');
  const next = el.querySelector<HTMLButtonElement>('[data-lightbox-next]');
  const count = el.querySelector<HTMLElement>('[data-lightbox-count]');
  let total = 0;
  let current = 0;
  let from: HTMLElement | null = null;
  const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  const rtl = () => getComputedStyle(el).direction === 'rtl';

  // The count, and the buttons at the first and the last image.
  function show(index: number) {
    current = index;
    if (count) count.textContent = countText(texts.count, index, total);
    if (previous) previous.disabled = index <= 0;
    if (next) next.disabled = index >= total - 1;
  }

  // The image `index` in view: by scrolling the track to it.
  function go(index: number, behavior: ScrollBehavior) {
    const at = moved(index, 0, total);
    track.scrollTo({ left: (rtl() ? -1 : 1) * at * track.clientWidth, behavior });
    show(at);
  }

  function move(delta: number) {
    go(moved(current, delta, total), smooth());
  }

  function item(image: LightboxImage, i: number) {
    const li = document.createElement('li');
    li.className = 'lightbox-item';
    const figure = document.createElement('figure');
    figure.className = 'lightbox-figure';
    const img = document.createElement('img');
    img.className = 'lightbox-image';
    img.src = image.src;
    if (image.srcset) img.srcset = image.srcset;
    if (image.sizes) img.sizes = image.sizes;
    if (image.width) img.width = image.width;
    if (image.height) img.height = image.height;
    img.alt = image.alt;
    img.decoding = 'async';
    img.loading = i === current ? 'eager' : 'lazy';
    figure.append(img);
    if (image.caption) {
      const caption = document.createElement('figcaption');
      caption.className = 'lightbox-caption';
      caption.textContent = image.caption;
      figure.append(caption);
    }
    li.append(figure);
    return li;
  }

  function open(images: LightboxImage[], index: number, opener?: HTMLElement | null) {
    if (el.open || !images.length) return;
    from = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    total = images.length;
    current = moved(index, 0, total);
    track.replaceChildren(...images.map(item));
    show(current);
    controls.open();
    go(current, 'auto');
  }

  // However it closes (the close button, Escape, close()): the track is emptied and the focus goes back to what opened it.
  el.addEventListener('close', () => {
    track.replaceChildren();
    from?.focus();
    from = null;
  });

  // The image the track shows as it is swiped or scrolled.
  let frame = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const at = indexAt(track.scrollLeft, track.clientWidth, total);
      if (at !== current) show(at);
    });
  });
  previous?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));
  el.addEventListener('keydown', (e) => {
    const step = rtl() ? -1 : 1;
    if (e.key === 'ArrowLeft') move(-step);
    else if (e.key === 'ArrowRight') move(step);
    else if (e.key === 'Home') go(0, smooth());
    else if (e.key === 'End') go(total - 1, smooth());
    else return;
    e.preventDefault();
  });

  return { open, close: controls.close, move, index: () => current };
}
