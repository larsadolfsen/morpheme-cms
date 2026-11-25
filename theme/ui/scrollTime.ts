// The value maths of the scroll time picker (m3.material.io/components/time-pickers, Behavior: "Swipe the scroll fields to select a
// time value. Values snap into place when released. Tap the inactive value above or below to navigate to it."). Two scroll fields,
// the hours and the minutes, each a list of the values one after the other, the one in the middle the selected one. No React and
// no DOM, so a test can read it and timePicker.script.ts and TimePickerContainer.tsx share it. The fields are the generic scroll field's
// (scrollFieldValues.ts): the places, the scroll and the keys are its. Material prints no wrap-around for a time, so a list has its ends: a value past them
// stays on the end.
import { indexAfterKey, placeIn } from './scrollFieldValues.ts';

export { indexAtScroll, scrollOfIndex } from './scrollFieldValues.ts';

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
  return placeIn(Math.round(value) - values[0], values.length);
}

/** The value at a place in the list (the nearest place when it is past an end). */
export function valueAtIndex(field: ScrollField, index: number, twelve = false): number {
  const values = scrollValues(field, twelve);
  return values[placeIn(index, values.length)];
}

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
  const index = indexAfterKey(key, indexOfValue(field, value, twelve), values.length, false, pageOf(field));
  return index === undefined ? undefined : values[index];
}

/** The field a left or right arrow moves to from a field: Material's arrow keys move between the hours and the minutes. */
export const fieldAfterArrow = (field: ScrollField, key: string): ScrollField | undefined =>
  key === 'ArrowRight' && field === 'hour' ? 'minute' : key === 'ArrowLeft' && field === 'minute' ? 'hour' : undefined;
