// The value maths of a scroll field (m3.material.io/components/scroll-fields, Guidelines, Behavior: "To scroll between values in a field, swipe the
// field, or tap the inactive value above or below to navigate to it." and "Scrolled items snap to always be vertically centered."; Overview: "Can be
// finite or an infinitely looping list"). A field is a list of items one under the other, the one in the middle the selected one. No React and no
// DOM, so a test can read it and ScrollFieldContainer.tsx, scrollFieldControl.ts and the time picker share it. A finite list has its ends (a place past
// them stays on the end); a looping one has none (a place past an end comes round to the other).

/** One item of a scroll field: what it is (`value`, what a form sends) and what is drawn (`label`). */
export type ScrollFieldItem = { value: string; label: string };

/** What a caller gives for an item: a number or a text (drawn as it is), or both. */
export type ScrollFieldItemInput = string | number | { value: string | number; label?: string };

/** The items of a field, each with its value and its label. */
export const scrollFieldItems = (given: readonly ScrollFieldItemInput[]): ScrollFieldItem[] =>
  given.map((item) =>
    typeof item === 'object'
      ? { value: String(item.value), label: item.label ?? String(item.value) }
      : { value: String(item), label: String(item) },
  );

/** Scroll fields come in three sizes: small (1–2 digits), medium (3 digits) and large (4 digits). */
export type ScrollFieldSize = 'small' | 'medium' | 'large';

/** The size a list of labels needs: by the digits of its longest label (a label with letters counts its characters). */
export const sizeOfItems = (items: readonly ScrollFieldItem[]): ScrollFieldSize => {
  const longest = Math.max(1, ...items.map((item) => item.label.length));
  return longest <= 2 ? 'small' : longest === 3 ? 'medium' : 'large';
};

/** How many times a looping field draws its list: the middle one is the one it rests on, so a scroll in either direction has a whole list to go. */
export const loopCopies = 3;

/** A place in a list, kept in the list: past an end it stays on the end (finite) or comes round (looping). */
export const placeIn = (index: number, count: number, looping = false): number =>
  count <= 0 ? 0 : looping ? ((Math.round(index) % count) + count) % count : Math.min(count - 1, Math.max(0, Math.round(index)));

/** The place of a value in the list (the first item when the list has none). */
export const indexOfItem = (items: readonly ScrollFieldItem[], value: string): number =>
  Math.max(
    0,
    items.findIndex((i) => i.value === value),
  );

/** The place a scrolled field is at: the item in its middle, where each item takes `pitch` px (its height and the gap), of `count` items drawn. */
export const indexAtScroll = (scrollTop: number, pitch: number, count: number): number =>
  pitch > 0 ? Math.min(count - 1, Math.max(0, Math.round(scrollTop / pitch))) : 0;

/** How far a field is scrolled when the item at a place is in its middle. */
export const scrollOfIndex = (index: number, pitch: number): number => index * pitch;

/** The place a looping field rests on when it is drawn `loopCopies` times: the same place in the middle copy. */
export const restingIndex = (index: number, count: number): number => (placeIn(index, count, true) + count) % (count * loopCopies);

/** The place a key moves a field to (`index` is where it is, in one list), or undefined for a key it does not use. Material's keys: up and down select
 * the item above and below; the others are the usual for a list (Page Up and Down move a page, Home and End go to the ends). */
export function indexAfterKey(key: string, index: number, count: number, looping = false, page = 5): number | undefined {
  const move: Record<string, number> = {
    ArrowUp: index - 1,
    ArrowDown: index + 1,
    PageUp: index - page,
    PageDown: index + page,
    Home: 0,
    End: count - 1,
  };
  return key in move ? placeIn(move[key], count, looping && key !== 'Home' && key !== 'End') : undefined;
}

/** What a person typed in the input mode, as the item it names: a label as it is (without regard to case), a number as the number it is
 * (7 for 07). For a text list, `complete` finds the first item that begins with what is typed ("the selection should auto-complete based on the
 * initial character entered"). Undefined when no item is named. */
export function itemOfTyped(items: readonly ScrollFieldItem[], typed: string, complete = false): ScrollFieldItem | undefined {
  const text = typed.trim().toLocaleLowerCase();
  if (!text) return undefined;
  const exact = items.find((i) => i.label.toLocaleLowerCase() === text);
  if (exact) return exact;
  if (/^\d+$/.test(text)) {
    const number = Number(text);
    const same = items.find((i) => /^\d+$/.test(i.label) && Number(i.label) === number);
    if (same) return same;
  }
  return complete ? items.find((i) => i.label.toLocaleLowerCase().startsWith(text)) : undefined;
}

/** Whether every label of a list is a whole number: such a list is a spinbutton with a value range for screen readers. */
export const isNumeric = (items: readonly ScrollFieldItem[]): boolean => items.length > 0 && items.every((i) => /^-?\d+$/.test(i.value));
