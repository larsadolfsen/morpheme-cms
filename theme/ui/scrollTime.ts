// The value maths of the scroll time picker (m3.material.io/components/time-pickers, Behavior: "Swipe the scroll fields to select a
// time value. Values snap into place when released. Tap the inactive value above or below to navigate to it."). Two scroll fields,
// the hours and the minutes, each a list of the values one after the other, the one in the middle the selected one. No React and
// no DOM, so a test can read it and timePicker.script.ts and TimePickerContainer.tsx share it. Material prints no wrap-around, so
// a list has its ends: a value past them stays on the end.

/** The two scroll fields. */
export type ScrollField = 'hour' | 'minute';

/** The values a field lists, in order: the hours 0–23 (a 12-hour clock 1–12) and the minutes 0–59. */
export const scrollValues = (field: ScrollField, twelve = false): number[] => {
  const [first, count] = field === 'minute' ? [0, 60] : twelve ? [1, 12] : [0, 24];
  return Array.from({ length: count }, (_, i) => first + i);
};

/** The place of a value in its field's list (the nearest one when it is past an end). */
export function indexOfValue(field: ScrollField, value: number, twelve = false): number {
  const values = scrollValues(field, twelve);
  return Math.min(values.length - 1, Math.max(0, Math.round(value) - values[0]));
}

/** The value at a place in the list (the nearest place when it is past an end). */
export function valueAtIndex(field: ScrollField, index: number, twelve = false): number {
  const values = scrollValues(field, twelve);
  return values[Math.min(values.length - 1, Math.max(0, Math.round(index)))];
}

/** The place a scrolled field is at: the item in its middle, where each item takes `pitch` px (its height and the gap). */
export const indexAtScroll = (scrollTop: number, pitch: number, count: number): number =>
  pitch > 0 ? Math.min(count - 1, Math.max(0, Math.round(scrollTop / pitch))) : 0;

/** How far a field is scrolled when the item at a place is in its middle. */
export const scrollOfIndex = (index: number, pitch: number): number => index * pitch;

/** The hour as a clock shows it (2 for 14 on a 12-hour clock, 12 for 0). */
export const shownHour = (hour: number, twelve = false): number => (twelve ? hour % 12 || 12 : hour);

/** The hour of the day (0–23) for the hour a clock shows; a 12-hour clock keeps the half of the day (`pm`). */
export const hourOfShown = (shown: number, twelve: boolean, pm: boolean): number => (twelve ? (shown % 12) + (pm ? 12 : 0) : shown);

/** How far PageUp and PageDown move a field: six hours, five minutes (as the dial's). */
export const pageOf = (field: ScrollField): number => (field === 'hour' ? 6 : 5);

/** The value a key moves a field to, or undefined for a key it does not use. Material's keys: up and down move to the previous
 * and the next value; the others are the usual for a list (Page Up and Down a page, Home and End the ends). `value` is the value
 * the field shows (the hour as the clock shows it). */
export function valueAfterKey(field: ScrollField, key: string, value: number, twelve = false): number | undefined {
  const values = scrollValues(field, twelve);
  const move: Record<string, number> = {
    ArrowUp: value - 1,
    ArrowDown: value + 1,
    PageUp: value - pageOf(field),
    PageDown: value + pageOf(field),
    Home: values[0],
    End: values[values.length - 1],
  };
  return key in move ? valueAtIndex(field, indexOfValue(field, move[key], twelve), twelve) : undefined;
}

/** The field a left or right arrow moves to from a field: Material's arrow keys move between the hours and the minutes. */
export const fieldAfterArrow = (field: ScrollField, key: string): ScrollField | undefined =>
  key === 'ArrowRight' && field === 'hour' ? 'minute' : key === 'ArrowLeft' && field === 'minute' ? 'hour' : undefined;
