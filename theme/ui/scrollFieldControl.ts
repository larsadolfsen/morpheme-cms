// What a scroll field does (ScrollFieldContainer.tsx draws it, m3.material.io/components/scroll-fields, Guidelines, Behavior and Accessibility), one
// implementation for the standalone ScrollField (scrollField.script.ts) and the scroll time picker's hours and minutes (timePicker.script.ts): "swipe the field,
// or tap the inactive value above or below to navigate to it" and "Scrolled items snap to always be vertically centered." The browser scrolls it by touch and
// the wheel and CSS snaps it; a mouse drags it (the snapping is off while it is dragged); a tap on an item goes to it; and the field is a spinbutton: Material's
// keys, up and down, select the item above and below, and Page Up and Down, Home and End are the usual for a list. A looping field is drawn three times and,
// when it has come to rest outside the middle copy, put back on the same item in it, in one step, so it has no end.
// The listeners are on the element that holds the fields (delegated), so a field drawn again by React keeps working. Only a scroll that changed the value
// says it (`onChange`): the scrolling the control does itself, to put a field at its value, says nothing.
import { indexAfterKey, indexAtScroll, loopCopies, placeIn, restingIndex } from '@theme/ui/scrollFieldValues';

export type ScrollFieldControlOptions = {
  /** A field is at another item: the selection of the item in its middle while it scrolls, a key, a tap. `settled` is false while a scroll is still going. */
  onChange?: (list: HTMLElement, value: string, settled: boolean) => void;
  /** Enter on a field. */
  onEnter?: (list: HTMLElement, event: KeyboardEvent) => void;
  /** What a screen reader says for the selected value (the label of the item when this gives none). */
  valueText?: (list: HTMLElement, value: string, label: string) => string | undefined;
  /** How far Page Up and Page Down move a field (five items). */
  page?: (list: HTMLElement) => number;
};

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const itemsOf = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>('[data-scroll-field-item]')];
const countOf = (list: HTMLElement) => Number(list.dataset.scrollFieldCount) || 0;
const loops = (list: HTMLElement) => list.dataset.scrollFieldLooping !== undefined;
const copiesOf = (list: HTMLElement) => (loops(list) ? loopCopies : 1);

/** The step from one item to the next: an item's height and the gap, read from the items themselves. */
export const pitchOf = (list: HTMLElement): number => {
  const items = itemsOf(list);
  return items.length > 1 ? items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().top : 0;
};

/** The place (in one list) of the value a field is at. */
const indexOfValue = (list: HTMLElement) => {
  const items = itemsOf(list).slice(0, countOf(list));
  return Math.max(
    0,
    items.findIndex((i) => i.dataset.scrollFieldItem === list.dataset.scrollFieldValue),
  );
};

/** The place in the whole drawing a field rests on for its value (the middle copy of a looping field). */
const restingOf = (list: HTMLElement) => (loops(list) ? restingIndex(indexOfValue(list), countOf(list)) : indexOfValue(list));

/** A field put at its value, with that item in the middle (in one step when `instant`, else smoothly unless the person asked for less motion). */
export function scrollFieldTo(list: HTMLElement, instant = false) {
  const pitch = pitchOf(list);
  if (!pitch) return;
  const top = restingOf(list) * pitch;
  if (Math.abs(list.scrollTop - top) > 1) list.scrollTo({ top, behavior: instant || reduced() ? 'instant' : 'smooth' });
}

/** Every field in `host` put at its value. */
export const scrollFieldsTo = (host: ParentNode, instant = false) =>
  host.querySelectorAll<HTMLElement>('[data-scroll-field-count]').forEach((list) => scrollFieldTo(list, instant));

/** A field drawn without a script to scroll it (a sample, or the first drawing of a dialog that has no size yet) is put at its value as soon as it has a size. */
export function placeScrollField(list: HTMLElement | null) {
  if (!list || list.dataset.scrollFieldPlaced !== undefined) return;
  const pitch = pitchOf(list);
  if (!pitch) return;
  list.dataset.scrollFieldPlaced = '';
  list.scrollTop = restingOf(list) * pitch;
}

/** A field set to a value: the item drawn as the selected one and the attributes a screen reader reads. The value is not scrolled to here. */
function show(list: HTMLElement, value: string, options: ScrollFieldControlOptions, rest?: number) {
  const items = itemsOf(list);
  const count = countOf(list);
  list.dataset.scrollFieldValue = value;
  // One selected item only: the one a looping field rests on (the one in the middle copy), else the item itself.
  const selected = items.filter((i) => i.dataset.scrollFieldItem === value);
  items.forEach((item) => delete item.dataset.selected);
  const chosen = loops(list) ? (items[rest ?? restingOf(list)] ?? selected[0]) : selected[0];
  if (chosen) chosen.dataset.selected = '';
  const label = chosen?.textContent ?? value;
  const index = items.slice(0, count).findIndex((i) => i.dataset.scrollFieldItem === value);
  if (list.getAttribute('aria-valuemin') === '1' && list.getAttribute('aria-valuemax') === String(count))
    list.setAttribute('aria-valuenow', String(index + 1));
  else list.setAttribute('aria-valuenow', value);
  list.setAttribute('aria-valuetext', options.valueText?.(list, value, label) ?? label);
}

/** Makes every scroll field in `host` (now and when React draws them again) work. Returns a function that takes the listeners off. */
export function scrollFieldControl(host: HTMLElement, options: ScrollFieldControlOptions = {}): () => void {
  const listOf = (target: EventTarget | null) =>
    (target as HTMLElement | null)?.closest?.<HTMLElement>('[data-scroll-field-count]') ?? null;
  const own = (list: HTMLElement | null): list is HTMLElement => !!list && host.contains(list);

  // A field goes to the item at a place in one list: drawn selected, scrolled to, and said.
  const choose = (list: HTMLElement, index: number) => {
    const items = itemsOf(list);
    const value = items[placeIn(index, countOf(list), loops(list))]?.dataset.scrollFieldItem;
    if (value === undefined) return;
    const changed = value !== list.dataset.scrollFieldValue;
    show(list, value, options);
    scrollFieldTo(list);
    if (changed) options.onChange?.(list, value, true);
  };

  // A scroll (touch, wheel, a drag, a key) moves the selection with the item in the middle: drawn at once, and said when the scrolling has come to rest,
  // where the snapping has put it. A looping field that has come to rest outside its middle copy is put back in it.
  const settling = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
  const moved = new WeakSet<HTMLElement>();
  const onScroll = (e: Event) => {
    const list = listOf(e.target);
    if (!own(list) || list !== e.target) return;
    const pitch = pitchOf(list);
    const count = countOf(list);
    const place = indexAtScroll(list.scrollTop, pitch, count * copiesOf(list));
    const index = placeIn(place, count, loops(list));
    const value = itemsOf(list)[index]?.dataset.scrollFieldItem;
    if (value !== undefined && value !== list.dataset.scrollFieldValue) {
      moved.add(list);
      show(list, value, options, place);
      options.onChange?.(list, value, false);
    }
    clearTimeout(settling.get(list));
    settling.set(
      list,
      setTimeout(() => {
        if (loops(list) && pitch && (place < count || place >= count * 2)) {
          // Back to the same item in the middle copy, in one step (the snapping off for it).
          list.style.scrollSnapType = 'none';
          list.scrollTop = restingOf(list) * pitch;
          requestAnimationFrame(() => (list.style.scrollSnapType = ''));
        }
        if (moved.delete(list)) options.onChange?.(list, list.dataset.scrollFieldValue ?? '', true);
      }, 150),
    );
  };
  host.addEventListener('scroll', onScroll, true);

  // A mouse drags a field (touch and the wheel scroll it by themselves): the snapping is off while it is dragged and the field goes to the nearest item
  // when it is let go. The click that ends a drag is not a tap on an item.
  let dragged = false;
  let grab: { list: HTMLElement; y: number; top: number } | undefined;
  const onDown = (e: PointerEvent) => {
    const list = listOf(e.target);
    if (!own(list) || e.pointerType !== 'mouse' || e.button !== 0) return;
    grab = { list, y: e.clientY, top: list.scrollTop };
    dragged = false;
  };
  const onMove = (e: PointerEvent) => {
    if (!grab) return;
    const dy = e.clientY - grab.y;
    if (!dragged && Math.abs(dy) < 4) return;
    if (!dragged) {
      dragged = true;
      grab.list.style.scrollSnapType = 'none';
      grab.list.setPointerCapture(e.pointerId);
    }
    grab.list.scrollTop = grab.top - dy;
  };
  const release = () => {
    if (!grab) return;
    const { list } = grab;
    grab = undefined;
    list.style.scrollSnapType = '';
    if (dragged) {
      scrollFieldTo(list);
      setTimeout(() => (dragged = false), 0);
    }
  };
  host.addEventListener('pointerdown', onDown);
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);

  // A tap on an item above or below the selected one goes to it.
  const onClick = (e: MouseEvent) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('[data-scroll-field-item]');
    const list = listOf(item);
    if (!item || !own(list) || dragged) return;
    list.focus({ preventScroll: true });
    choose(list, Number(item.dataset.scrollFieldPlace));
  };
  host.addEventListener('click', onClick);

  // Material's keys: up and down select the item above and below; Page Up and Down, Home and End are the usual for a list. A looping field has no ends.
  const onKey = (e: KeyboardEvent) => {
    const list = listOf(e.target);
    if (!own(list) || list !== e.target) return;
    if (e.key === 'Enter') return e.isComposing ? undefined : options.onEnter?.(list, e);
    const index = indexAfterKey(e.key, indexOfValue(list), countOf(list), loops(list), options.page?.(list) ?? 5);
    if (index === undefined) return;
    e.preventDefault();
    choose(list, index);
  };
  host.addEventListener('keydown', onKey);

  return () => {
    host.removeEventListener('scroll', onScroll, true);
    host.removeEventListener('pointerdown', onDown);
    host.removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerup', release);
    host.removeEventListener('pointercancel', release);
    host.removeEventListener('click', onClick);
    host.removeEventListener('keydown', onKey);
  };
}
