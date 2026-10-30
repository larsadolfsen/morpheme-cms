// What a date picker (DatePicker.tsx) does on the site: its calendar button opens the picker in its <dialog> (docked:
// under the field; modal: in the middle of the screen over the scrim), drawn by DatePickerContainer.tsx with React each
// time something changes, so the site and the editor have one drawing. In the grid the arrow keys move a day or a week
// (also into the month before or after), Home and End to the week's first and last day, Page Up and Page Down a month
// (with Shift a year), Enter and Space pick the day; the month and the year can be stepped through or picked from
// their lists, and a modal picker has a keyboard input mode. OK writes the day(s) into the hidden inputs a form sends
// (2026-11-02) and into the field (02.11.2026), and fires their input and change events; Annuller, Escape and a tap
// outside close it without. A date typed in the field is read when the field is left, and the field is marked when it
// is not a date. React and the drawing are loaded the first time a picker is about to open (pointed at, focused).
// Run on every page by the theme's Base.astro (blockScripts, src/site/scripts.ts); without a date picker it does nothing.
import type { DatePickerSettings } from '@theme/ui/DatePicker';
import type { DatePickerState } from '@theme/ui/DatePickerContainer';
import {
  addDays,
  addMonths,
  addMonthsToDay,
  clampDay,
  dateOf,
  dayFromTyped,
  daysFromTyped,
  dayTyped,
  monthOfDay,
  today as todayOf,
  weekStart,
} from '@theme/ui/dates';

const load = () => Promise.all([import('react'), import('react-dom'), import('react-dom/client'), import('@theme/ui/DatePickerContainer')]);
let loading: ReturnType<typeof load> | undefined;
const drawing = () => (loading ??= load());

let opened = 0;

export default function datePicker() {
  document.querySelectorAll<HTMLElement>('[data-date-picker]').forEach(datePickerField);
}

/** One date picker (its [data-date-picker] element) made to work: on the site by datePicker(), in the editor by the
 * DatePicker itself (with `onChange`). */
export function datePickerField(field: HTMLElement) {
  // Once for each picker, however often it is asked (React's effects may run twice).
  if (field.dataset.datePickerReady !== undefined) return;
  field.dataset.datePickerReady = '';
  const settings = JSON.parse(field.dataset.datePicker!) as DatePickerSettings;
  const { texts, kind, range, min, max } = settings;
  const { locale } = texts;
  const modal = kind === 'modal';
  const text = field.querySelector<HTMLInputElement>('[data-date-picker-text]')!;
  const textField = text.closest<HTMLElement>('.text-field');
  const opener = field.querySelector<HTMLButtonElement>('[data-date-picker-open]')!;
  const values = [...field.querySelectorAll<HTMLInputElement>('[data-date-picker-value]')];
  const dialog = field.querySelector<HTMLDialogElement>('[data-date-picker-dialog]')!;
  const headlineId = `date-picker-headline-${++opened}`;
  if (modal) dialog.setAttribute('aria-labelledby', headlineId);

  let state: DatePickerState;
  let today = todayOf();
  let root: import('react-dom/client').Root | undefined;
  let draw: (() => void) | undefined;

  // Load the drawing before it is needed.
  field.addEventListener('pointerover', () => drawing(), { once: true });
  field.addEventListener('focusin', () => drawing(), { once: true });

  async function render(focusDay = false) {
    const [react, reactDom, client, container] = await drawing();
    root ??= client.createRoot(dialog);
    reactDom.flushSync(() =>
      root!.render(react.createElement(container.default, { ...state, kind, range, today, min, max, texts, headlineId })),
    );
    if (focusDay) focusShown();
  }
  draw = () => void render(true);

  // The focus where it belongs in what is shown: the focused day, the shown year or month, the first field.
  function focusShown() {
    const target =
      state.view === 'days'
        ? dialog.querySelector<HTMLElement>(`[data-day="${state.focus}"]`)
        : state.view === 'input'
          ? dialog.querySelector<HTMLElement>('[data-date-picker-input]')
          : dialog.querySelector<HTMLElement>('[data-date-picker-list] [tabindex="0"]');
    target?.focus();
  }

  const picked = () => values.map((v) => (dateOf(v.value) ? v.value : ''));

  async function open() {
    if (dialog.open) return close();

    today = todayOf();
    const [start, end = ''] = picked();
    const focus = clampDay(start || today, min, max);
    state = { view: 'days', month: monthOfDay(focus), start, end, focus };
    await render();
    if (modal) {
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    } else {
      dialog.show();
      document.addEventListener('pointerdown', outside);
    }
    opener.setAttribute('aria-expanded', 'true');
    focusShown();
  }

  // Closed, and the focus back on the calendar button (not when it moved on elsewhere: `stay`).
  function close(stay = false) {
    if (!dialog.open) return;
    dialog.close();
    document.documentElement.style.overflow = '';
    document.removeEventListener('pointerdown', outside);
    opener.setAttribute('aria-expanded', 'false');
    if (!stay) opener.focus();
  }

  // A docked picker closes when the focus leaves the field and the picker (Tab past it).
  field.addEventListener('focusout', (e) => {
    const to = e.relatedTarget as Node | null;
    if (!modal && to && !field.contains(to)) close(true);
  });

  function outside(e: PointerEvent) {
    if (!field.contains(e.target as Node)) close(true);
  }

  // What is picked, written into the inputs a form sends and into the field.
  function write(days: string[]) {
    values.forEach((input, i) => {
      if (input.value === (days[i] ?? '')) return;
      input.value = days[i] ?? '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    text.value = days
      .filter(Boolean)
      .map((d) => dayTyped(d, locale))
      .join(' – ');
    mark(false);
  }

  function mark(wrong: boolean) {
    textField?.classList.toggle('text-field-error', wrong);
    if (wrong) text.setAttribute('aria-invalid', 'true');
    else text.removeAttribute('aria-invalid');
  }

  const allowed = (day: string) => (!min || day >= min) && (!max || day <= max);

  // A day picked in the grid: the day, or in a range the start, then the end (a day before the start starts again).
  function pick(day: string) {
    if (!allowed(day)) return;
    if (!range) state = { ...state, start: day, focus: day };
    else if (!state.start || state.end || day < state.start) state = { ...state, start: day, end: '', focus: day };
    else state = { ...state, end: day, focus: day };
    draw!();
  }

  // The focus moved to another day, in the shown month or another one.
  function move(day: string) {
    const focus = clampDay(day, min, max);
    state = { ...state, focus, month: monthOfDay(focus) };
    draw!();
  }

  // OK: what is picked (or typed, in the input mode) written, and closed; else what is wrong said at its field.
  function done() {
    if (state.view === 'input') {
      const typed = [...dialog.querySelectorAll<HTMLInputElement>('[data-date-picker-input]')].map((i) => i.value.trim());
      const days = typed.map((t) => (t ? dayFromTyped(t, locale) : ''));
      const error = days
        .map((d, i) =>
          d === null
            ? texts.wrongFormat
            : d && !allowed(d)
              ? texts.notAllowed
              : i === 1 && d && !days[0]
                ? undefined
                : i === 1 && d && d < days[0]!
                  ? texts.endBeforeStart
                  : undefined,
        )
        .map((message, field) => message && { field, message })
        .find(Boolean);
      // An end without a start: the start is missing.
      const startMissing = range && !days[0] && !!days[1];
      if (error || startMissing) {
        state = { ...state, typed, error: error || { field: 0, message: texts.wrongFormat } };
        return draw!();
      }
      write(days.map((d) => d || ''));
      return close();
    }
    write(range ? [state.start, state.end] : [state.start]);
    close();
  }

  opener.addEventListener('click', () => void open());

  // A date typed in the field, read when it is left.
  text.addEventListener('change', () => {
    const typed = text.value.trim();
    if (!typed) return write([]);
    const days = range ? daysFromTyped(typed, locale) : [dayFromTyped(typed, locale)];
    const right = days.length === (range ? 2 : 1) && days.every((d) => d && allowed(d)) && (!range || days[0]! <= days[1]!);
    if (right) write(days as string[]);
    else mark(true);
  });

  dialog.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    // A tap on the scrim, outside a modal picker.
    if (target === dialog) return close();
    const day = target.closest<HTMLElement>('[data-day]')?.dataset.day;
    if (day) return pick(day);
    const year = target.closest<HTMLElement>('[data-year]')?.dataset.year;
    if (year) return toView(`${year}-${state.month.slice(5)}`);
    const month = target.closest<HTMLElement>('[data-month]')?.dataset.month;
    if (month) return toView(month);
    const action = target.closest<HTMLElement>('[data-date-picker-action]')?.dataset.datePickerAction;
    if (!action) return;
    const steps: Record<string, number> = { 'previous-month': -1, 'next-month': 1, 'previous-year': -12, 'next-year': 12 };
    if (action in steps) {
      const shown = addMonths(state.month, steps[action]);
      state = { ...state, month: shown, focus: clampDay(addMonthsToDay(state.focus, steps[action]), min, max) };
      return void render();
    }
    if (action === 'months' || action === 'years') {
      state = { ...state, view: state.view === action ? 'days' : action };
      return draw!();
    }
    if (action === 'mode') {
      state =
        state.view === 'input'
          ? { ...state, view: 'days', error: undefined }
          : { ...state, view: 'input', error: undefined, typed: [state.start, state.end].map((d) => (d ? dayTyped(d, locale) : '')) };
      return draw!();
    }
    if (action === 'cancel') return close();
    if (action === 'ok') return done();
  });

  // The month (and year) picked in a list: its days shown, the focus on the same day in it.
  function toView(month: string): void {
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    const day = `${month}-${String(Math.min(Number(state.focus.slice(8)), last)).padStart(2, '0')}`;
    const focus = clampDay(day, min, max);
    state = { ...state, view: 'days', month: monthOfDay(focus), focus };
    draw!();
  }

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // A modal dialog closes itself (cancel, below); a docked one is closed here.
      if (!modal) {
        e.preventDefault();
        close();
      }
      return;
    }
    const target = e.target as HTMLElement;
    const day = target.dataset.day;
    if (day && state.view === 'days') {
      const first = (dateOf(day)!.getDay() - (weekStart(locale) % 7) + 7) % 7;
      const to: Record<string, () => string> = {
        ArrowLeft: () => addDays(day, -1),
        ArrowRight: () => addDays(day, 1),
        ArrowUp: () => addDays(day, -7),
        ArrowDown: () => addDays(day, 7),
        Home: () => addDays(day, -first),
        End: () => addDays(day, 6 - first),
        PageUp: () => addMonthsToDay(day, e.shiftKey ? -12 : -1),
        PageDown: () => addMonthsToDay(day, e.shiftKey ? 12 : 1),
      };
      if (to[e.key]) {
        e.preventDefault();
        move(to[e.key]());
      }
      return;
    }
    // The lists of years and months: the arrow keys move between them (in a modal grid of years, up and down a row).
    const list = target.closest<HTMLElement>('[data-date-picker-list]');
    if (list && target.matches('[role="option"]')) {
      const options = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
      const columns = list.classList.contains('date-picker-years') ? 3 : 1;
      const at = options.indexOf(target);
      const by: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : e.key in by ? at + by[e.key] : -1;
      if (next < 0 || next >= options.length) return;
      e.preventDefault();
      target.tabIndex = -1;
      options[next].tabIndex = 0;
      options[next].focus();
    }
  });

  // Escape on a modal picker.
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
}
