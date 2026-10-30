// What a time picker shows when it is open (m3.material.io/components/time-pickers, .time-picker in ../styles/ui.css),
// drawn for the time and what is shown (`view`, `selecting`, `hour`, `minute`): one drawing for the site, where
// timePicker.script.ts draws it in the time picker's <dialog> (TimePicker.tsx) each time something changes and does
// what it is told by the data-time-picker-… attributes, and for the editor, which only draws it. Built on the theme's
// Dialog (the surface), IconButton, Button and TextField; how it looks is the theme's (--time-picker-*).
//   `view`: the dial (the hours and the minutes, each a box, the one `selecting` on the dial under them: the hours
//   00–11 on the outer ring and 12–23 on the inner one, the minutes in fives, the hand pointing at the time; a slider
//   for screen readers and the arrow keys) or the input mode (the hours and the minutes, each the theme's TextField).
//   `typed`, `error`: what is written in the input mode's fields, and what is wrong with it (on which one).
//   `timeFormat`: 24h, the default, as Danish writes the time, or 12h (the hours 1–12 on one ring, with the period
//   selector, AM and PM, beside the boxes). `orientation`: vertical, the default, the dial under the boxes, or
//   horizontal, the dial beside them (Material's on a phone turned on its side).
// No texts of its own (`texts`, TimePicker.tsx's timePickerTexts) and no React state, so the site's script can draw it
// without the editor's dictionaries.
import type { CSSProperties } from 'react';
import Dialog from '@theme/ui/Dialog';
import IconButton from '@theme/ui/IconButton';
import Button from '@theme/ui/Button';
import TextField from '@theme/ui/TextField';
import { timeSeparator, twoDigits } from '@theme/ui/dates';

export type TimePickerView = 'dial' | 'input';
/** A time picker's time formats and orientations, as Material 3 names them. */
export type TimePickerFormat = '24h' | '12h';
export type TimePickerOrientation = 'vertical' | 'horizontal';

/** A time picker's fixed texts, in the language its times are written in (`locale`). */
export type TimePickerTexts = {
  locale: string;
  select: string;
  enter: string;
  hour: string;
  minute: string;
  format: string;
  wrong: string;
  /** The 12-hour clock's: its format, what is wrong, the name of the period selector and its AM and PM. */
  format12: string;
  wrong12: string;
  period: string;
  am: string;
  pm: string;
  toInput: string;
  toDial: string;
  cancel: string;
  ok: string;
};

/** What a time picker shows: what changes while it is open. */
export type TimePickerState = {
  view: TimePickerView;
  selecting: 'hour' | 'minute';
  hour: number;
  minute: number;
  typed?: string[];
  error?: { field: number; message: string };
};

export type TimePickerContainerProps = TimePickerState & {
  texts: TimePickerTexts;
  timeFormat?: TimePickerFormat;
  orientation?: TimePickerOrientation;
  headlineId?: string;
  className?: string;
};

/** The numbers on the dial: the hours, 00–11 outside and 12–23 inside (on a 12-hour clock 12, 1–11 on one ring), or
 * the minutes in fives. */
const hours = Array.from({ length: 24 }, (_, h) => h);
const twelveHours = Array.from({ length: 12 }, (_, h) => h);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

/** Where a number stands on the dial, and the hand when it points at it: its angle from the top, and its ring (a
 * 12-hour clock has one). */
export const handOf = (selecting: 'hour' | 'minute', value: number, twelve = false) =>
  selecting === 'hour' ? { angle: (value % 12) * 30, inner: !twelve && value >= 12 } : { angle: value * 6, inner: false };

const at = (angle: number) => ({ '--time-picker-angle': `${angle}deg` }) as CSSProperties;

export default function TimePickerContainer({
  view,
  selecting,
  hour,
  minute,
  typed = [],
  error,
  texts,
  timeFormat = '24h',
  orientation = 'vertical',
  headlineId,
  className,
}: TimePickerContainerProps) {
  const separator = timeSeparator(texts.locale);
  const twelve = timeFormat === '12h';
  const pm = hour >= 12;
  // The hour as the clock shows it (2 for 14 on a 12-hour clock).
  const shown = twelve ? hour % 12 || 12 : hour;
  const value = selecting === 'hour' ? hour : minute;
  const hand = handOf(selecting, value, twelve);
  const fields = [
    { key: 'hour' as const, label: texts.hour, value: twoDigits(shown) },
    { key: 'minute' as const, label: texts.minute, value: twoDigits(minute) },
  ];
  // AM and PM, beside the boxes (under them, horizontal).
  const period = twelve && (
    <span className="time-picker-period" role="group" aria-label={texts.period}>
      {(['am', 'pm'] as const).map((p) => (
        <button key={p} type="button" className="time-picker-period-button" aria-pressed={(p === 'pm') === pm} data-time-picker-action={p}>
          {texts[p]}
        </button>
      ))}
    </span>
  );
  return (
    <Dialog
      className={['time-picker', orientation === 'horizontal' && 'time-picker-horizontal', twelve && 'time-picker-12h', className]
        .filter(Boolean)
        .join(' ')}
      data-view={view}
    >
      <h2 id={headlineId} className="time-picker-headline">
        {view === 'input' ? texts.enter : texts.select}
      </h2>

      {view === 'dial' ? (
        <>
          <div className="time-picker-selector">
            {fields.map((f, i) => (
              <span key={f.key} className="time-picker-selector-part">
                {i === 1 && (
                  <span className="time-picker-separator" aria-hidden="true">
                    {separator}
                  </span>
                )}
                <button
                  type="button"
                  className="time-picker-box"
                  aria-label={`${f.label}: ${f.value}`}
                  aria-pressed={selecting === f.key}
                  data-time-picker-action={f.key}
                >
                  {f.value}
                </button>
              </span>
            ))}
            {period}
          </div>
          <div
            className="time-picker-dial"
            role="slider"
            tabIndex={0}
            aria-label={selecting === 'hour' ? texts.hour : texts.minute}
            aria-valuemin={selecting === 'hour' && twelve ? 1 : 0}
            aria-valuemax={selecting === 'hour' ? (twelve ? 12 : 23) : 59}
            aria-valuenow={selecting === 'hour' ? shown : minute}
            aria-valuetext={selecting === 'hour' && twelve ? `${shown} ${pm ? texts.pm : texts.am}` : twoDigits(value)}
            data-time-picker-dial={selecting}
          >
            <span
              className="time-picker-dial-hand"
              data-inner={hand.inner || undefined}
              data-between={(selecting === 'minute' && value % 5 !== 0) || undefined}
              style={at(hand.angle)}
              aria-hidden="true"
            >
              <span className="time-picker-dial-knob" />
            </span>
            {(selecting === 'minute' ? minutes : twelve ? twelveHours : hours).map((n) => {
              const spot = handOf(selecting, n, twelve);
              const picked = selecting === 'hour' && twelve ? n === hour % 12 : n === value;
              return (
                <span
                  key={n}
                  className="time-picker-dial-number"
                  data-inner={spot.inner || undefined}
                  data-selected={picked || undefined}
                  style={at(spot.angle)}
                  aria-hidden="true"
                >
                  {selecting === 'minute' ? twoDigits(n) : twelve ? n || 12 : n === 0 ? twoDigits(n) : n}
                </span>
              );
            })}
          </div>
        </>
      ) : (
        <div className="time-picker-input">
          {fields.map((f, i) => (
            <span key={f.key} className="time-picker-selector-part">
              {i === 1 && (
                <span className="time-picker-separator" aria-hidden="true">
                  {separator}
                </span>
              )}
              <TextField
                label={f.label}
                hideLabel
                supporting={f.label}
                error={error?.field === i ? f.label : undefined}
                defaultValue={typed[i] ?? f.value}
                inputMode="numeric"
                maxLength={2}
                autoComplete="off"
                className="time-picker-text-field"
                data-time-picker-input={i}
              />
            </span>
          ))}
          {period}
        </div>
      )}
      {error && (
        <p className="time-picker-error" role="alert">
          {error.message}
        </p>
      )}

      <div className="time-picker-actions">
        <IconButton
          icon={view === 'dial' ? 'keyboard' : 'clock'}
          label={view === 'dial' ? texts.toInput : texts.toDial}
          data-time-picker-action="mode"
        />
        <span className="time-picker-actions-end">
          <Button kind="text" size="small" data-time-picker-action="cancel">
            {texts.cancel}
          </Button>
          <Button kind="text" size="small" data-time-picker-action="ok">
            {texts.ok}
          </Button>
        </span>
      </div>
    </Dialog>
  );
}
