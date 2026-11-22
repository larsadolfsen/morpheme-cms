// The editor's one announcer for screen readers (WCAG 2.2 AA, 4.1.3 Status Messages; plan
// `docs/superpowers/plans/2026-11-21-0-19-4-screen-readers.md`, *Live regions*). Two visually hidden regions, polite (`role="status"`) and assertive
// (`role="alert"`), are made once, in the page's body outside the editor's root, so no sheet, dialog or screen that unmounts takes them away. Most
// readers do not read a region that comes into the page with its text, so a message is only ever set in a region that was there before.
//
// A modal <dialog> (a dialog, a bottom sheet, a side panel: all `showModal()`) makes everything outside it inert, and a reader does not read an inert
// live region, so a message sent while one is open (a saved message, a failed save) would be lost. The browser's top layer does not help: a popover
// outside the dialog is inert too. So every open modal gets its own pair of regions inside it, made when it opens (so they were there before the
// message), and a message goes to the pair of the topmost open modal, else to the page's. Chosen over a single pair that moves into the modal: a
// region that is moved is a new node and often not read (Modern Web Guidance, *Dialog* and *ARIA live regions*: the live region must exist before its text changes).
//
// The rule: a message is said by the announcer or by an element's own `role`, never both. The editor's snackbar (lib/snackbar.ts) draws its
// text without a `role` and sends it here.
//
// `announce(text, { urgent })` clears the region and sets the text in the next frame, so the same text twice is read twice (a region whose text
// does not change is silent), and takes the text away after a few seconds so the region is empty for the next message.

/** How long a message stays in its region before the region is emptied. */
export const CLEAR_MS = 4000;

type Region = { el: HTMLElement; timer: ReturnType<typeof setTimeout> | undefined; frame: number | undefined };

type Pair = { host: HTMLElement; polite: Region; assertive: Region };

let page: Pair | undefined;
let watch: MutationObserver | undefined;
let listening = false;
// The pair inside each modal dialog that has been open; it goes with the dialog.
const inModals = new WeakMap<Element, Pair>();

function make(role: 'status' | 'alert'): Region {
  const el = document.createElement('div');
  el.setAttribute('role', role);
  el.setAttribute('aria-live', role === 'alert' ? 'assertive' : 'polite');
  el.setAttribute('aria-atomic', 'true');
  return { el, timer: undefined, frame: undefined };
}

function makePair(): Pair {
  const host = document.createElement('div');
  host.className = 'mo-visually-hidden';
  host.dataset.announcer = '';
  const polite = make('status');
  const assertive = make('alert');
  host.append(polite.el, assertive.el);
  return { host, polite, assertive };
}

const isModal = (el: Element) => {
  try {
    return el.tagName === 'DIALOG' && el.matches(':modal');
  } catch {
    return false;
  }
};

/** Gives an open modal dialog its pair of regions (once). */
function giveModal(dialog: Element) {
  if (inModals.has(dialog) || !isModal(dialog)) return;
  const pair = makePair();
  inModals.set(dialog, pair);
  dialog.append(pair.host);
}

/** The modal dialogs that are open now, the topmost last. */
function openModals(): Element[] {
  return typeof document.querySelectorAll === 'function' ? [...document.querySelectorAll('dialog[open]')].filter(isModal) : [];
}

/** Makes the page's two regions when they are not in the page yet, and starts giving each modal that opens its own (the editor calls it at start; `announce` calls it too). Gives the page's host element. */
export function ensureAnnouncer(): HTMLElement {
  if (page?.host.isConnected) return page.host;
  page = makePair();
  document.body.append(page.host);
  if (!watch && typeof MutationObserver !== 'undefined') {
    watch = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes') giveModal(record.target as Element);
        else
          for (const added of record.addedNodes)
            if (added instanceof Element) {
              giveModal(added);
              for (const inner of added.querySelectorAll('dialog[open]')) giveModal(inner);
            }
      }
    });
    watch.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
    for (const dialog of openModals()) giveModal(dialog);
    // The check of the flows (scripts/announce-flows.mjs, flow L) sends a message through this event while a dialog is open, as the editor's own code would.
    if (!listening) {
      listening = true;
      addEventListener('morpheme:announce', (e) => {
        const { text, urgent } = (e as CustomEvent<{ text?: string; urgent?: boolean }>).detail ?? {};
        if (typeof text === 'string') announce(text, { urgent: urgent === true });
      });
    }
  }
  return page.host;
}

/** The pair a message goes to: the topmost open modal's, or the page's. */
function pairNow(): Pair {
  ensureAnnouncer();
  const modal = openModals().at(-1);
  if (modal) {
    giveModal(modal);
    const own = inModals.get(modal);
    if (own) return own;
  }
  return page!;
}

/** Says `text` to a screen reader: politely, or at once with `urgent` (an error, a failed save). An empty text says nothing. */
export function announce(text: string, { urgent = false }: { urgent?: boolean } = {}) {
  const said = text.replace(/\s+/g, ' ').trim();
  if (!said) return;
  const pair = pairNow();
  const region = urgent ? pair.assertive : pair.polite;
  clearTimeout(region.timer);
  if (region.frame !== undefined) cancelAnimationFrame(region.frame);
  region.el.textContent = '';
  region.frame = requestAnimationFrame(() => {
    region.frame = undefined;
    region.el.textContent = said;
    region.timer = setTimeout(() => {
      region.el.textContent = '';
    }, CLEAR_MS);
  });
}

/** The last 25 % step a progress value (0 to 1) has passed: 0, 25, 50, 75 or 100. The announcer says a progress at these, not at every percent. */
export function progressStep(value: number): number {
  const v = Math.min(1, Math.max(0, value));
  return Math.floor(Math.round(v * 100) / 25) * 25;
}

/** Takes the regions out of the page (for tests, and for a page that is left). */
export function resetAnnouncer() {
  watch?.disconnect();
  watch = undefined;
  for (const region of [page?.polite, page?.assertive]) {
    if (!region) continue;
    clearTimeout(region.timer);
    if (region.frame !== undefined) cancelAnimationFrame(region.frame);
  }
  page?.host.remove();
  page = undefined;
}
