// What a scroll field shows (m3.material.io/components/scroll-fields, .mo-scroll-field in ../styles/ui/scroll-field.css): its items one under the other, the one
// in the middle the selected one, or, in the input mode, the theme's TextField. No React state and no texts of its own, so scrollFieldControl.ts does what it
// is told by the data-scroll-field-… attributes in the page (the site) and in the editor, and the time picker draws its hours and minutes with it each time
// something changes (TimePickerContainer.tsx).
//   `items` (numbers or texts, or both: { value, label }), `value`: the selected one. `size`: small (1–2 digits), medium (3) or large (4), the minimum width
//   of the field (Material: "Scroll fields hug the contents by default, down to a minimum width and height per size"). `looping`: an infinite list, drawn
//   `loopCopies` times with the middle one resting; else a list with ends. `mode`: scroll, or input (the swipe field swapped for a text field: "Choosing text
//   input swaps the focused scroll field to a text field"), `label`: the field's name (every field of a row that tracks another value is labelled).
//   `valueText` names the selected value for a screen reader when its label is not enough (the time picker's 2 PM). `listProps`: more attributes on the list.
import type { HTMLAttributes } from 'react';
import TextField from '@theme/ui/TextField';
import { placeScrollField } from '@theme/ui/scrollFieldControl';
import {
  isNumeric,
  loopCopies,
  scrollFieldItems,
  sizeOfItems,
  type ScrollFieldItemInput,
  type ScrollFieldSize,
} from '@theme/ui/scrollFieldValues';

export type ScrollFieldMode = 'scroll' | 'input';

export type ScrollFieldContainerProps = {
  items: readonly ScrollFieldItemInput[];
  value: string | number;
  label: string;
  size?: ScrollFieldSize;
  looping?: boolean;
  mode?: ScrollFieldMode;
  disabled?: boolean;
  valueText?: string;
  /** What is wrong with what is typed in the input mode, shown under the field (Material: "Any errors should appear below the scroll fields"). */
  error?: string;
  className?: string;
  listProps?: Record<string, string | number | undefined>;
};

export default function ScrollFieldContainer({
  items: given,
  value,
  label,
  size,
  looping = false,
  mode = 'scroll',
  disabled = false,
  valueText,
  error,
  className,
  listProps,
}: ScrollFieldContainerProps) {
  const items = scrollFieldItems(given);
  const current = String(value);
  const index = Math.max(
    0,
    items.findIndex((i) => i.value === current),
  );
  const selected = items[index];
  const numeric = isNumeric(items);
  const copies = looping ? loopCopies : 1;
  const classes = [
    'mo-scroll-field',
    `mo-is-${size ?? sizeOfItems(items)}`,
    mode === 'input' && 'mo-is-input',
    disabled && 'mo-is-disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  // The field's own attributes, for scrollFieldControl.ts: how many items one list has, whether it loops, and the value it is at.
  const data = {
    'data-scroll-field': '',
    'data-scroll-field-count': items.length,
    'data-scroll-field-value': current,
    'data-scroll-field-looping': looping ? '' : undefined,
  } as HTMLAttributes<HTMLElement>;
  if (mode === 'input')
    return (
      <div className={classes} data-scroll-field-input-mode="">
        <TextField
          label={label}
          hideLabel
          supporting={label}
          error={error}
          defaultValue={selected?.label ?? ''}
          inputMode={numeric ? 'numeric' : 'text'}
          autoComplete="off"
          disabled={disabled}
          className="mo-scroll-field__text-field"
          data-scroll-field-text=""
          {...listProps}
        />
        {error && (
          <p className="mo-scroll-field__error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  return (
    <div className={classes}>
      <div
        className="mo-scroll-field__list"
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled || undefined}
        aria-valuemin={numeric ? Number(items[0]?.value) : 1}
        aria-valuemax={numeric ? Number(items[items.length - 1]?.value) : items.length}
        aria-valuenow={numeric ? Number(selected?.value) : index + 1}
        aria-valuetext={valueText ?? selected?.label}
        // A field drawn without a script to scroll it (a sample) is put at its value when it first has a size; with the script, it does that itself.
        ref={placeScrollField}
        {...data}
        {...listProps}
      >
        {Array.from({ length: copies }, (_, copy) =>
          items.map((item, i) => {
            // The place in the whole drawing (a looping list is drawn more than once; the one in the middle copy is the one it rests on).
            const place = copy * items.length + i;
            const resting = (looping ? 1 : 0) === copy && i === index;
            return (
              <span
                key={`${copy}-${item.value}`}
                className="mo-scroll-field__item"
                data-selected={resting || undefined}
                data-scroll-field-item={item.value}
                data-scroll-field-place={place}
                aria-hidden="true"
              >
                {item.label}
              </span>
            );
          }),
        )}
      </div>
    </div>
  );
}
