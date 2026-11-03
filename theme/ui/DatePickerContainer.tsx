// What a date picker shows when it is open (m3.material.io/components/date-pickers, .date-picker in ../styles/ui.css),
// drawn for what is picked and shown (`view`, `month`, `start`, `end`, `focus`): one drawing for the site, where
// datePicker.script.ts draws it in the date picker's <dialog> (DatePicker.tsx) each time something changes and does
// what it is told by the data-date-picker-… attributes, and for the editor, which only draws it. Built on the theme's
// Dialog (the surface), IconButton, Button and TextField; how it looks is the theme's (--date-picker-*).
//   `kind`: docked (under its field, with a month and a year to step through or pick from a list) or modal (a dialog
//   in the middle of the screen, with a headline, the month and year as a menu button and the years in a grid, and a
//   keyboard input mode with the theme's TextField). `range`: two days, a start and an end (only modal).
//   `view`: the days of `month` (a grid under the weekdays, today circled, the picked day filled, a range's days
//   between in a band), the months (docked) or the years, or the input mode (modal). `focus`: the day that has the
//   focus in the grid (the only one Tab reaches; the arrow keys move it). `min`, `max`: the first and last day that can
//   be picked. `typed`, `error`: what is written in the input mode's fields, and what is wrong with it (on which one).
// No texts of its own (`texts`, DatePicker.tsx's datePickerTexts) and no state (only a list scrolled to the shown
// year), so the site's script can draw it without the editor's dictionaries.
import { useLayoutEffect, useRef } from 'react';
import Dialog from '@theme/ui/Dialog';
import IconButton from '@theme/ui/IconButton';
import Button from '@theme/ui/Button';
import TextField from '@theme/ui/TextField';
import { Svg } from '@morpheme/cms/src/icon';
import { dayHeadline, dayName, monthName, monthOfDay, weekdaysOf, weeksOf } from '@theme/ui/dates';

export type DatePickerKind = 'docked' | 'modal';
export type DatePickerView = 'days' | 'months' | 'years' | 'input';

/** A date picker's fixed texts, in the language its dates are written in (`locale`). */
export type DatePickerTexts = {
  locale: string;
  select: string;
  selectRange: string;
  enter: string;
  enterRange: string;
  date: string;
  start: string;
  end: string;
  format: string;
  wrongFormat: string;
  notAllowed: string;
  endBeforeStart: string;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  chooseMonth: string;
  chooseYear: string;
  toInput: string;
  toCalendar: string;
  cancel: string;
  ok: string;
};

/** What a date picker shows: what changes while it is open. */
export type DatePickerState = {
  view: DatePickerView;
  month: string;
  start: string;
  end: string;
  focus: string;
  typed?: string[];
  error?: { field: number; message: string };
};

export type DatePickerContainerProps = DatePickerState & {
  kind?: DatePickerKind;
  range?: boolean;
  today: string;
  min?: string;
  max?: string;
  texts: DatePickerTexts;
  headlineId?: string;
  className?: string;
};

/** The years a date picker offers: from `min`'s (else a hundred years ago) to `max`'s (else fifty years on). */
export function yearsOf(today: string, min = '', max = ''): number[] {
  const now = Number(today.slice(0, 4));
  const from = min ? Number(min.slice(0, 4)) : now - 100;
  const to = max ? Number(max.slice(0, 4)) : now + 50;
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

/** A day's place in a range: its start, its end, a day between them, or none. */
function rangeOf(day: string, start: string, end: string): 'start' | 'end' | 'middle' | undefined {
  if (!start || !end || start === end) return undefined;
  if (day === start) return 'start';
  if (day === end) return 'end';
  return day > start && day < end ? 'middle' : undefined;
}

export default function DatePickerContainer({
  kind = 'docked',
  range = false,
  view,
  month,
  start,
  end,
  focus,
  typed = [],
  error,
  today,
  min = '',
  max = '',
  texts,
  headlineId,
  className,
}: DatePickerContainerProps) {
  const modal = kind === 'modal' || range;
  const { locale } = texts;
  const [year, monthNumber] = month.split('-');
  const shownYear = Number(year);
  const out = (day: string) => (!!min && day < min) || (!!max && day > max);
  const headline = range
    ? `${start ? dayHeadline(start, locale) : texts.start} – ${end ? dayHeadline(end, locale) : texts.end}`
    : start
      ? dayHeadline(start, locale)
      : texts.date;
  const years = yearsOf(today, min, max);
  const thisYear = Number(today.slice(0, 4));
  const pickedMonth = start ? monthOfDay(start) : '';

  // A list of years or months starts with the shown one in its middle (on the site and in the editor alike).
  const list = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const shown = list.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list.current && shown) list.current.scrollTop = shown.offsetTop - (list.current.clientHeight - shown.offsetHeight) / 2;
  }, [view, month]);

  // The days of the month, under the weekdays.
  const days = (
    <table className="date-picker-grid" role="grid" aria-label={monthName(month, locale)} data-date-picker-grid="">
      <thead>
        <tr>
          {weekdaysOf(locale).map((d) => (
            <th key={d.long} scope="col" abbr={d.long} className="date-picker-weekday">
              {d.short}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeksOf(month, locale).map((week, w) => (
          <tr key={w}>
            {week.map((day, i) => {
              if (!day) return <td key={i} />;
              const picked = day === start || day === end;
              return (
                <td key={day} aria-selected={picked} data-range={rangeOf(day, start, end)} className="date-picker-cell">
                  <button
                    type="button"
                    className="date-picker-day"
                    data-day={day}
                    tabIndex={day === focus ? 0 : -1}
                    aria-label={dayName(day, locale)}
                    aria-current={day === today ? 'date' : undefined}
                    disabled={out(day)}
                  >
                    {Number(day.slice(8))}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  // The years, a grid in a modal picker and a list in a docked one; the shown one picked, this year marked.
  const yearList = (
    <div
      className={modal ? 'date-picker-years' : 'date-picker-menu'}
      role="listbox"
      aria-label={texts.chooseYear}
      ref={list}
      data-date-picker-list="years"
    >
      {years.map((y) => (
        <button
          key={y}
          type="button"
          role="option"
          className={modal ? 'date-picker-year' : 'date-picker-menu-item'}
          data-year={y}
          tabIndex={y === shownYear ? 0 : -1}
          aria-selected={y === shownYear}
          aria-current={y === thisYear ? 'date' : undefined}
        >
          {!modal && <Svg name="check" size={20} className="date-picker-menu-check" />}
          {y}
        </button>
      ))}
    </div>
  );

  // A docked picker's months, a list.
  const monthList = (
    <div ref={list} className="date-picker-menu" role="listbox" aria-label={texts.chooseMonth} data-date-picker-list="months">
      {Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`).map((m) => (
        <button
          key={m}
          type="button"
          role="option"
          className="date-picker-menu-item"
          data-month={m}
          tabIndex={m === month ? 0 : -1}
          aria-selected={m === month}
          aria-current={m === pickedMonth ? 'date' : undefined}
        >
          <Svg name="check" size={20} className="date-picker-menu-check" />
          {monthName(m, locale, 'long')}
        </button>
      ))}
    </div>
  );

  // A button that opens a list (the month, the year), with its arrow.
  const menuButton = (label: string, list: 'months' | 'years', name: string) => (
    <button
      type="button"
      className="date-picker-menu-button"
      aria-label={`${name}: ${label}`}
      aria-expanded={view === list}
      data-date-picker-action={list}
      disabled={view !== 'days' && view !== list}
    >
      {label}
      <Svg name="caret-down" size={18} className="date-picker-menu-button-icon" />
    </button>
  );

  const step = (action: string, icon: string, label: string) => (
    <IconButton icon={icon} label={label} data-date-picker-action={action} disabled={view !== 'days'} />
  );

  return (
    <Dialog
      className={['date-picker', `date-picker-${modal ? 'modal' : 'docked'}`, className].filter(Boolean).join(' ')}
      data-view={view}
      data-range={range || undefined}
    >
      {modal && (
        <div className="date-picker-header">
          <p className="date-picker-supporting-text">
            {view === 'input' ? (range ? texts.enterRange : texts.enter) : range ? texts.selectRange : texts.select}
          </p>
          <div className="date-picker-headline-row">
            <h2 id={headlineId} className="date-picker-headline" aria-live="polite">
              {headline}
            </h2>
            <IconButton
              icon={view === 'input' ? 'calendar-blank' : 'pencil-simple'}
              label={view === 'input' ? texts.toCalendar : texts.toInput}
              data-date-picker-action="mode"
            />
          </div>
        </div>
      )}

      {view !== 'input' &&
        (modal ? (
          <div className="date-picker-controls">
            {menuButton(monthName(month, locale), 'years', texts.chooseYear)}
            <span className="date-picker-steps">
              {step('previous-month', 'caret-left', texts.previousMonth)}
              {step('next-month', 'caret-right', texts.nextMonth)}
            </span>
          </div>
        ) : (
          <div className="date-picker-controls">
            <span className="date-picker-steps">
              {step('previous-month', 'caret-left', texts.previousMonth)}
              {menuButton(monthName(`${year}-${monthNumber}`, locale, 'short'), 'months', texts.chooseMonth)}
              {step('next-month', 'caret-right', texts.nextMonth)}
            </span>
            <span className="date-picker-steps">
              {step('previous-year', 'caret-left', texts.previousYear)}
              {menuButton(year, 'years', texts.chooseYear)}
              {step('next-year', 'caret-right', texts.nextYear)}
            </span>
          </div>
        ))}

      <div className="date-picker-content">
        {view === 'days' && days}
        {view === 'years' && yearList}
        {view === 'months' && monthList}
        {view === 'input' && (
          <div className="date-picker-input">
            {(range ? [texts.start, texts.end] : [texts.date]).map((label, i) => (
              <TextField
                key={label}
                label={label}
                placeholder={texts.format}
                supporting={error?.field === i ? undefined : texts.format}
                error={error?.field === i ? error.message : undefined}
                defaultValue={typed[i] ?? ''}
                inputMode="numeric"
                autoComplete="off"
                data-date-picker-input={i}
              />
            ))}
          </div>
        )}
      </div>

      <div className="date-picker-actions">
        <Button kind="text" size="small" data-date-picker-action="cancel">
          {texts.cancel}
        </Button>
        <Button kind="text" size="small" data-date-picker-action="ok">
          {texts.ok}
        </Button>
      </div>
    </Dialog>
  );
}
