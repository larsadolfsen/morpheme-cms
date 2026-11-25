// What a time picker shows when it is open (m3.material.io/components/time-pickers, .mo-time-picker in ../styles/ui/pickers.css),
// drawn for the time and what is shown (`view`, `selecting`, `hour`, `minute`): one drawing for the site, where
// timePicker.script.ts draws it in the time picker's <dialog> (TimePicker.tsx) each time something changes and does
// what it is told by the data-time-picker-… attributes, and for the editor, which only draws it. Built on the theme's
// Dialog (the surface), IconButton, Button and TextField; how it looks is the theme's (--time-picker-*).
//   `kind` (dial, the default, or scroll): the selector the picker starts with and the input mode toggles back to (Material: "Toggle back to
//   dial picker with a clock icon. Toggle back to scroll picker with a swipe icon."). `view`: the scroll fields (the hours and the minutes, each a
//   list of its values in a spinbutton, the one in the middle the selected one; timePicker.script.ts scrolls, snaps and moves them; `inline`
//   draws it in the page, as Material places the scroll picker, without the dialog's surface, headline and actions) or the dial (the hours and the minutes, each a box, the one `selecting` on the dial under them: the hours
//   00–11 on the outer ring and 12–23 on the inner one, the minutes in fives, the hand pointing at the time; a slider
//   for screen readers and the arrow keys) or the input mode (the hours and the minutes, each the theme's TextField).
//   `typed`, `error`: what is written in the input mode's fields, and what is wrong with it (on which one).
//   `timeFormat`: 24h, the default, as Danish writes the time, or 12h (the hours 1–12 on one ring, with the period
//   selector, AM and PM, beside the boxes). `orientation`: vertical, the default, the dial under the boxes, or
//   horizontal, the dial beside them (Material's on a phone turned on its side).
// No texts of its own (`texts`, TimePicker.tsx's timePickerTexts) and no React state, so the site's script can draw it
// without the editor's dictionaries.
import type { CSSProperties, ElementType } from 'react';
import Dialog from '@theme/ui/Dialog';
import IconButton from '@theme/ui/IconButton';
import Button from '@theme/ui/Button';
import TextField from '@theme/ui/TextField';
import { timeSeparator, twoDigits } from '@theme/ui/dates';
import { scrollValues } from '@theme/ui/scrollTime';

export type TimePickerView = 'scroll' | 'dial' | 'input';
/** The selector a time picker starts with (the input mode toggles back to it): Material's scroll or dial time picker. */
export type TimePickerKind = 'dial' | 'scroll';
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
  toScroll: string;
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
  kind?: TimePickerKind;
  /** In the page, with no dialog around it: no headline, no Cancel and OK (the time is written as it changes). */
  inline?: boolean;
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

const at = (angle: number) => ({ '--mo-comp-time-picker-angle': `${angle}deg` }) as CSSProperties;

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
  kind = 'dial',
  inline = false,
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
    <span className="mo-time-picker__period" role="group" aria-label={texts.period}>
      {(['am', 'pm'] as const).map((p) => (
        <button
          key={p}
          type="button"
          className="mo-time-picker__period-button"
          aria-pressed={(p === 'pm') === pm}
          data-time-picker-action={p}
        >
          {texts[p]}
        </button>
      ))}
    </span>
  );
  // A scroll field: the values one under the other, the selected one in the middle (a spinbutton for screen readers: its items are only drawn).
  // A field drawn without the picker's script (a sample) is scrolled to its value when it first has a size; with the script, it does it itself.
  const place = (el: HTMLElement | null, index: number) => {
    if (!el || el.dataset.placed !== undefined) return;
    const items = el.querySelectorAll<HTMLElement>('[data-time-picker-item]');
    const pitch = items.length > 1 ? items[1].offsetTop - items[0].offsetTop : 0;
    if (!pitch) return;
    el.dataset.placed = '';
    el.scrollTop = index * pitch;
  };
  const scrollField = (f: (typeof fields)[number], i: number) => {
    const field = f.key;
    const values = scrollValues(field, twelve);
    const current = field === 'hour' ? shown : minute;
    return (
      <span key={field} className="mo-time-picker__selector-part">
        {i === 1 && (
          <span className="mo-time-picker__separator" aria-hidden="true">
            {separator}
          </span>
        )}
        <div
          className="mo-time-picker__scroll-field"
          role="spinbutton"
          tabIndex={0}
          aria-label={f.label}
          aria-valuemin={values[0]}
          aria-valuemax={values[values.length - 1]}
          aria-valuenow={current}
          aria-valuetext={field === 'hour' && twelve ? `${shown} ${pm ? texts.pm : texts.am}` : twoDigits(current)}
          data-time-picker-scroll={field}
          ref={(el) => place(el, values.indexOf(current))}
        >
          {values.map((n) => (
            <span
              key={n}
              className="mo-time-picker__scroll-item"
              data-selected={n === current || undefined}
              data-time-picker-item={n}
              aria-hidden="true"
            >
              {twoDigits(n)}
            </span>
          ))}
        </div>
      </span>
    );
  };
  const Surface: ElementType = inline ? 'div' : Dialog;
  return (
    <Surface
      className={[
        'mo-time-picker',
        orientation === 'horizontal' && 'mo-is-horizontal',
        twelve && 'mo-time-picker__12h',
        kind === 'scroll' && 'mo-is-scroll',
        inline && 'mo-is-inline',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-view={view}
    >
      {!inline && (
        <h2 id={headlineId} className="mo-time-picker__headline">
          {view === 'input' ? texts.enter : texts.select}
        </h2>
      )}

      {view === 'scroll' ? (
        <div className="mo-time-picker__scroll">
          {fields.map(scrollField)}
          {period}
        </div>
      ) : view === 'dial' ? (
        <>
          <div className="mo-time-picker__selector">
            {fields.map((f, i) => (
              <span key={f.key} className="mo-time-picker__selector-part">
                {i === 1 && (
                  <span className="mo-time-picker__separator" aria-hidden="true">
                    {separator}
                  </span>
                )}
                <button
                  type="button"
                  className="mo-time-picker__box"
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
            className="mo-time-picker__dial"
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
              className="mo-time-picker__dial-hand"
              data-inner={hand.inner || undefined}
              data-between={(selecting === 'minute' && value % 5 !== 0) || undefined}
              style={at(hand.angle)}
              aria-hidden="true"
            >
              <span className="mo-time-picker__dial-knob" />
            </span>
            {(selecting === 'minute' ? minutes : twelve ? twelveHours : hours).map((n) => {
              const spot = handOf(selecting, n, twelve);
              const picked = selecting === 'hour' && twelve ? n === hour % 12 : n === value;
              // A number the hand's circle overlaps (a minute between the fives, next to its two neighbours) is drawn in two tones: the
              // circle's text colour inside the circle, the normal one outside, so it keeps 4.5:1 (WCAG 1.4.3). The circle is 3rem, the numbers 54 px apart: 15°.
              const turn = Math.abs(spot.angle - hand.angle) % 360;
              const covered = !picked && spot.inner === hand.inner && Math.min(turn, 360 - turn) < 15;
              return (
                <span
                  key={n}
                  className="mo-time-picker__dial-number"
                  data-inner={spot.inner || undefined}
                  data-selected={picked || undefined}
                  data-covered={covered || undefined}
                  style={
                    covered
                      ? ({ ...at(spot.angle), '--mo-comp-time-picker-hand-angle': `${hand.angle}deg` } as CSSProperties)
                      : at(spot.angle)
                  }
                  aria-hidden="true"
                >
                  {selecting === 'minute' ? twoDigits(n) : twelve ? n || 12 : n === 0 ? twoDigits(n) : n}
                </span>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mo-time-picker__input">
          {fields.map((f, i) => (
            <span key={f.key} className="mo-time-picker__selector-part">
              {i === 1 && (
                <span className="mo-time-picker__separator" aria-hidden="true">
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
                className="mo-time-picker__text-field"
                data-time-picker-input={i}
              />
            </span>
          ))}
          {period}
        </div>
      )}
      {error && (
        <p className="mo-time-picker__error" role="alert">
          {error.message}
        </p>
      )}

      <div className="mo-time-picker__actions">
        <IconButton
          icon={view !== 'input' ? 'keyboard' : kind === 'scroll' ? 'swipe_vertical' : 'schedule'}
          label={view !== 'input' ? texts.toInput : kind === 'scroll' ? texts.toScroll : texts.toDial}
          data-time-picker-action="mode"
        />
        {!inline && (
          <span className="mo-time-picker__actions-end">
            <Button kind="text" data-time-picker-action="cancel">
              {texts.cancel}
            </Button>
            <Button kind="text" data-time-picker-action="ok">
              {texts.ok}
            </Button>
          </span>
        )}
      </div>
    </Surface>
  );
}
