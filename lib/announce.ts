// The editor's one announcer for screen readers (WCAG 2.2 AA, 4.1.3 Status Messages; plan
// `docs/superpowers/plans/2026-11-21-0-19-4-screen-readers.md`, *Live regions*). Two visually hidden regions, polite (`role="status"`) and assertive
// (`role="alert"`), are made once, in the page's body outside the editor's root, so no sheet, dialog or screen that unmounts takes them away. Most
// readers do not read a region that comes into the page with its text, so a message is only ever set in a region that was there before.
//
// The rule: a message is said by the announcer or by an element's own `role`, never both. The editor's snackbar (lib/snackbar.ts) draws its
// text without a `role` and sends it here.
//
// `announce(text, { urgent })` clears the region and sets the text in the next frame, so the same text twice is read twice (a region whose text
// does not change is silent), and takes the text away after a few seconds so the region is empty for the next message.

/** How long a message stays in its region before the region is emptied. */
export const CLEAR_MS = 4000;

type Region = { el: HTMLElement; timer: ReturnType<typeof setTimeout> | undefined; frame: number | undefined };

let host: HTMLElement | undefined;
const regions: { polite?: Region; assertive?: Region } = {};

function make(role: 'status' | 'alert'): Region {
  const el = document.createElement('div');
  el.setAttribute('role', role);
  el.setAttribute('aria-live', role === 'alert' ? 'assertive' : 'polite');
  el.setAttribute('aria-atomic', 'true');
  return { el, timer: undefined, frame: undefined };
}

/** Makes the two regions when they are not in the page yet (the editor calls it at start; `announce` calls it too). Gives the host element. */
export function ensureAnnouncer(): HTMLElement {
  if (host?.isConnected) return host;
  host = document.createElement('div');
  host.className = 'mo-visually-hidden';
  host.dataset.announcer = '';
  regions.polite = make('status');
  regions.assertive = make('alert');
  host.append(regions.polite.el, regions.assertive.el);
  document.body.append(host);
  return host;
}

/** Says `text` to a screen reader: politely, or at once with `urgent` (an error, a failed save). An empty text says nothing. */
export function announce(text: string, { urgent = false }: { urgent?: boolean } = {}) {
  const said = text.replace(/\s+/g, ' ').trim();
  if (!said) return;
  ensureAnnouncer();
  const region = urgent ? regions.assertive! : regions.polite!;
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

/** Takes the regions out of the page (for tests, and for a page that is left). */
export function resetAnnouncer() {
  for (const region of [regions.polite, regions.assertive]) {
    if (!region) continue;
    clearTimeout(region.timer);
    if (region.frame !== undefined) cancelAnimationFrame(region.frame);
  }
  host?.remove();
  host = undefined;
  regions.polite = regions.assertive = undefined;
}
