// What a time picker (TimePicker.tsx) does on the site: its clock button opens the picker in its <dialog>, in the
// middle of the screen over the scrim, drawn by TimePickerContainer.tsx with React each time something changes, so the
// site and the editor have one drawing. On the dial a tap or a drag picks the hour (the inner ring 12–23), and then the
// minutes; the dial is a slider, so the arrow keys move it one, Page Up and Page Down five minutes or six hours, Home
// and End to its ends, and Enter goes on from the hours to the minutes; the boxes over it switch between them. The
// keyboard button switches to the input mode, with a field for the hours and one for the minutes. OK writes the time
// into the hidden input a form sends (14:30) and into the field (14.30), and fires its input and change events;
// Annuller, Escape and a tap outside close it without. On a 12-hour clock the dial has the hours 1–12 on one ring and
// AM and PM beside the boxes switch between the two halves of the day. The dial stands beside the boxes (horizontal)
// as the picker's `orientation` says, else on a screen wider than it is high and low (a phone turned on its side), as
// Material's. A time typed in the field is read when the field is left, and
// the field is marked when it is not a time. React and the drawing are loaded the first time a picker is about to
// open (pointed at, focused). The scroll time picker (`kind` scroll, Material's: "Swipe the scroll fields to select a time value. Values snap into
// place when released. Tap the inactive value above or below to navigate to it."): the hours and the minutes each in a scroll field, the value
// in the middle the selected one; it scrolls by touch, wheel and drag (CSS snaps it), a tap on a value above or below goes to it, and the
// field is a spinbutton: up and down move to the previous and the next value, Page Up and Down five minutes or six hours, Home and End to the
// ends, left and right between the hours and the minutes, Enter confirms; no wrap-around (Material prints none). The keyboard button
// switches to the input mode and the swipe button back (the dial's button switches back to the dial). Placed inline (`inline`) it has no
// dialog: it is drawn in the page and writes each time it changes, as Material's inline scroll picker. Run on every page by the theme's Base.astro (blockScripts, packages/editor/site/blockScripts.ts); without
// a time picker it does nothing.
import type {
  TimePickerFormat,
  TimePickerKind,
  TimePickerOrientation,
  TimePickerState,
  TimePickerTexts,
} from '@theme/ui/TimePickerContainer';
import { timeFromTyped, timeOf, timeString, timeTyped, twoDigits } from '@theme/ui/dates';
import { fieldAfterArrow, hourOfShown, pageOf, shownHour, type ScrollField } from '@theme/ui/scrollTime';
import { scrollFieldControl, scrollFieldsTo } from '@theme/ui/scrollFieldControl';

const load = () => Promise.all([import('react'), import('react-dom'), import('react-dom/client'), import('@theme/ui/TimePickerContainer')]);
let loading: ReturnType<typeof load> | undefined;
const drawing = () => (loading ??= load());

let opened = 0;

export default function timePicker() {
  document.querySelectorAll<HTMLElement>('[data-time-picker]').forEach(timePickerField);
}

/** One time picker (its [data-time-picker] element) made to work: on the site by timePicker(), in the editor by the
 * TimePicker itself (with `onChange`). */
export function timePickerField(field: HTMLElement) {
  // Once for each picker, however often it is asked (React's effects may run twice).
  if (field.dataset.timePickerReady !== undefined) return;
  field.dataset.timePickerReady = '';
  const {
    texts,
    timeFormat,
    orientation,
    kind = 'dial',
    inline = false,
  } = JSON.parse(field.dataset.timePicker!) as {
    texts: TimePickerTexts;
    timeFormat?: TimePickerFormat;
    orientation?: TimePickerOrientation;
    kind?: TimePickerKind;
    inline?: boolean;
  };
  // The selector the picker starts with, and the input mode toggles back to.
  const home = kind === 'scroll' ? 'scroll' : 'dial';
  const { locale } = texts;
  const twelve = timeFormat === '12h';
  // Beside the boxes on a screen wider than it is high and low, unless the picker says.
  const turned = matchMedia('(orientation: landscape) and (max-height: 30rem)');
  const shape = () => ({ timeFormat, kind, inline, orientation: orientation ?? (turned.matches ? 'horizontal' : 'vertical') }) as const;
  // Inline there is no text field and no button: the picker is drawn in the page.
  const text = field.querySelector<HTMLInputElement>('[data-time-picker-text]');
  const textField = text?.closest<HTMLElement>('.mo-text-field');
  const opener = field.querySelector<HTMLButtonElement>('[data-time-picker-open]');
  const input = field.querySelector<HTMLInputElement>('[data-time-picker-value]')!;
  const dialog = field.querySelector<HTMLDialogElement>('[data-time-picker-dialog]')!;
  const headlineId = `time-picker-headline-${++opened}`;

  let state: TimePickerState;
  let root: import('react-dom/client').Root | undefined;

  field.addEventListener('pointerover', () => drawing(), { once: true });
  field.addEventListener('focusin', () => drawing(), { once: true });

  async function render(focus?: 'dial' | 'input' | 'scroll', instant = false) {
    const [react, reactDom, client, container] = await drawing();
    root ??= client.createRoot(dialog);
    reactDom.flushSync(() => root!.render(react.createElement(container.default, { ...state, ...shape(), texts, headlineId })));
    if (focus === 'dial') dialog.querySelector<HTMLElement>('[data-time-picker-dial]')?.focus();
    if (focus === 'scroll') dialog.querySelector<HTMLElement>('[data-time-picker-scroll]')?.focus({ preventScroll: true });
    if (focus === 'input') dialog.querySelector<HTMLInputElement>('[data-time-picker-input]')?.select();
    scrollTo(instant);
  }

  // The scroll fields: each scrolled so that the value of the time is in the middle (in one step when `instant`, else smoothly unless the
  // person has asked for less motion); the generic scroll field's (scrollFieldControl.ts).
  const valueOf = (name: ScrollField) => (name === 'hour' ? shownHour(state.hour, twelve) : state.minute);
  function scrollTo(instant = false) {
    if (state.view === 'scroll') scrollFieldsTo(dialog, instant);
  }

  const start = (): TimePickerState => {
    const now = new Date();
    const { hour, minute } = timeOf(input.value) ?? { hour: now.getHours(), minute: 0 };
    return { view: home, selecting: 'hour', hour, minute };
  };

  async function open() {
    if (dialog.open) return;
    state = start();
    await render(undefined, true);
    // The headline is in the dialog now: it names the dialog until it closes (the label names it before).
    dialog.setAttribute('aria-labelledby', headlineId);
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    opener?.setAttribute('aria-expanded', 'true');
    // The scroll fields are in place now that the dialog is shown (they have no size before): scrolled to the time, then focused.
    scrollTo(true);
    dialog.querySelector<HTMLElement>('[data-time-picker-dial], [data-time-picker-scroll]')?.focus({ preventScroll: true });
  }

  function close() {
    if (!dialog.open) return;
    dialog.close();
    dialog.removeAttribute('aria-labelledby');
    document.documentElement.style.overflow = '';
    opener?.setAttribute('aria-expanded', 'false');
    opener?.focus();
  }

  function write(time: string) {
    if (input.value !== time) {
      input.value = time;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (text) text.value = time ? timeTyped(time, locale, twelve) : '';
    mark(false);
  }

  // Inline there is no OK: the time is written each time it changes.
  const commit = () => inline && write(timeString(state.hour, state.minute));

  function mark(wrong: boolean) {
    textField?.classList.toggle('mo-is-error', wrong);
    if (wrong) text?.setAttribute('aria-invalid', 'true');
    else text?.removeAttribute('aria-invalid');
  }

  // The hour or the minute the dial is set to (on a 12-hour clock the hour in the half of the day shown).
  function set(value: number, focus?: 'dial') {
    const half = state.hour >= 12 ? 12 : 0;
    const hour = twelve ? half + (((value % 12) + 12) % 12) : (value + 24) % 24;
    state = state.selecting === 'hour' ? { ...state, hour } : { ...state, minute: (value + 60) % 60 };
    void render(focus);
  }

  // What is typed in the input mode, as a time (hh:mm); else what is wrong said, and null.
  function typedTime(): string | null {
    const typed = [...dialog.querySelectorAll<HTMLInputElement>('[data-time-picker-input]')].map((i) => i.value.trim());
    const [h, m] = typed.map((t) => (/^\d{1,2}$/.test(t) ? Number(t) : NaN));
    const wrong = !(twelve ? h >= 1 && h <= 12 : h <= 23) ? 0 : !(m <= 59) ? 1 : -1;
    if (wrong >= 0) {
      state = { ...state, typed, error: { field: wrong, message: twelve ? texts.wrong12 : texts.wrong } };
      void render();
      return null;
    }
    return timeString(twelve ? (h % 12) + (state.hour >= 12 ? 12 : 0) : h, m);
  }

  // OK: the time (or what is typed, in the input mode) written, and closed; else what is wrong said.
  function done() {
    if (state.view === 'input') {
      const time = typedTime();
      if (time === null) return;
      write(time);
      return close();
    }
    write(timeString(state.hour, state.minute));
    close();
  }

  opener?.addEventListener('click', () => void open());

  // A time typed in the field, read when it is left.
  text?.addEventListener('change', () => {
    const typed = text.value.trim();
    if (!typed) return write('');
    const time = timeFromTyped(typed, twelve ? [texts.am, texts.pm] : undefined);
    if (time) write(time);
    else mark(true);
  });

  dialog.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === dialog) return close();
    const action = target.closest<HTMLElement>('[data-time-picker-action]')?.dataset.timePickerAction;
    if (action === 'hour' || action === 'minute') {
      state = { ...state, selecting: action };
      return void render();
    }
    // AM or PM: the same hour in the other half of the day (what is typed in the input mode kept).
    if (action === 'am' || action === 'pm') {
      const typed =
        state.view === 'input' ? [...dialog.querySelectorAll<HTMLInputElement>('[data-time-picker-input]')].map((i) => i.value) : undefined;
      state = { ...state, hour: (state.hour % 12) + (action === 'pm' ? 12 : 0), typed: typed ?? state.typed };
      commit();
      return void render();
    }
    // The keyboard button: the input mode; from it back to the selector the picker started with (the clock or the swipe button).
    if (action === 'mode') {
      state =
        state.view !== 'input'
          ? {
              ...state,
              view: 'input',
              error: undefined,
              typed: [twoDigits(twelve ? state.hour % 12 || 12 : state.hour), twoDigits(state.minute)],
            }
          : { ...state, view: home, selecting: 'hour', error: undefined };
      return void render(state.view === 'input' ? 'input' : home === 'scroll' ? 'scroll' : 'dial', true);
    }
    if (action === 'cancel') return close();
    if (action === 'ok') return done();
  });

  // The scroll fields: swiping, dragging, tapping a value and the up and down keys are the generic scroll field's (scrollFieldControl.ts); a value picked is the
  // time's hour or minute. While a field still scrolls the new value is only kept (drawn by the control); the picker writes and draws when it has come to rest.
  scrollFieldControl(dialog, {
    onChange: (list, value, settled) => {
      const name = list.dataset.timePickerScroll as ScrollField | undefined;
      if (!name || state.view !== 'scroll') return;
      const n = Number(value);
      state = name === 'hour' ? { ...state, hour: hourOfShown(n, twelve, state.hour >= 12) } : { ...state, minute: n };
      if (!settled) return;
      commit();
      void render();
    },
    valueText: (list, value) => {
      const name = list.dataset.timePickerScroll as ScrollField | undefined;
      return name === 'hour' && twelve ? `${value} ${state.hour >= 12 ? texts.pm : texts.am}` : twoDigits(Number(value));
    },
    page: (list) => pageOf(list.dataset.timePickerScroll as ScrollField),
    // Enter on a field: the time is picked (inline there is no OK).
    onEnter: (_list, e) => {
      e.preventDefault();
      if (!inline) done();
    },
  });

  // The dial: the number under the pointer, by its angle from the top and, for the hours, its ring.
  function valueAt(dial: HTMLElement, e: PointerEvent): number {
    const box = dial.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const angle = (Math.atan2(x, -y) * 180) / Math.PI + 360;
    if (state.selecting === 'minute') return Math.round(angle / 6) % 60;
    const number = dial.querySelector<HTMLElement>('.mo-time-picker__dial-number');
    const knob = number?.offsetWidth ?? 48;
    const inner = !twelve && Math.hypot(x, y) < box.width / 2 - knob * 0.875;
    return (Math.round(angle / 30) % 12) + (inner ? 12 : 0);
  }

  let dragging = false;
  dialog.addEventListener('pointerdown', (e) => {
    const dial = (e.target as HTMLElement).closest<HTMLElement>('[data-time-picker-dial]');
    if (!dial) return;
    e.preventDefault();
    dragging = true;
    dial.setPointerCapture(e.pointerId);
    set(valueAt(dial, e), 'dial');
  });
  dialog.addEventListener('pointermove', (e) => {
    const dial = (e.target as HTMLElement).closest<HTMLElement>('[data-time-picker-dial]');
    if (dragging && dial) set(valueAt(dial, e));
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    // From the hours on to the minutes, as M3's dial.
    if (state.selecting === 'hour') {
      state = { ...state, selecting: 'minute' };
      void render('dial');
    }
  };
  dialog.addEventListener('pointerup', endDrag);
  dialog.addEventListener('pointercancel', () => (dragging = false));

  dialog.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (target.matches('[data-time-picker-dial]')) {
      const value = state.selecting === 'hour' ? state.hour : state.minute;
      const big = state.selecting === 'hour' ? 6 : 5;
      const top = state.selecting === 'hour' ? 23 : 59;
      const to: Record<string, number> = {
        ArrowUp: value + 1,
        ArrowRight: value + 1,
        ArrowDown: value - 1,
        ArrowLeft: value - 1,
        PageUp: value + big,
        PageDown: value - big,
        Home: 0,
        End: top,
      };
      if (e.key in to) {
        e.preventDefault();
        set(to[e.key], 'dial');
      } else if (e.key === 'Enter' && state.selecting === 'hour') {
        e.preventDefault();
        state = { ...state, selecting: 'minute' };
        void render('dial');
      }
      return;
    }
    // A scroll field: left and right move between the hours and the minutes (up and down, and the other keys, are scrollFieldControl's).
    const scroller = target.closest<HTMLElement>('[data-time-picker-scroll]');
    if (scroller && state.view === 'scroll') {
      const sideways = fieldAfterArrow(scroller.dataset.timePickerScroll as ScrollField, e.key);
      if (sideways) {
        e.preventDefault();
        dialog.querySelector<HTMLElement>(`[data-time-picker-scroll="${sideways}"]`)?.focus({ preventScroll: true });
      }
    }
  });

  // The input mode: only digits, and on to the minutes when the hours have two.
  dialog.addEventListener('input', (e) => {
    const field = e.target as HTMLInputElement;
    if (!field.matches('[data-time-picker-input]')) return;
    field.value = field.value.replace(/\D/g, '').slice(0, 2);
    if (field.dataset.timePickerInput === '0' && field.value.length === 2)
      dialog.querySelector<HTMLInputElement>('[data-time-picker-input="1"]')?.select();
  });

  // Escape.
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  // Inline the picker is drawn at once, in the page, from the time of the form field (else now as the starting position: the form field stays
  // empty until the person changes the time, so a form never posts a time nobody chose).
  if (inline) {
    state = start();
    void drawing().then(() => render(undefined, true));
  }
}
