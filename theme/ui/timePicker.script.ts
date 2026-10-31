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
// open (pointed at, focused). Run on every page by the theme's Base.astro (blockScripts, packages/editor/site/blockScripts.ts); without
// a time picker it does nothing.
import type { TimePickerFormat, TimePickerOrientation, TimePickerState, TimePickerTexts } from '@theme/ui/TimePickerContainer';
import { timeFromTyped, timeOf, timeString, timeTyped, twoDigits } from '@theme/ui/dates';

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
  const { texts, timeFormat, orientation } = JSON.parse(field.dataset.timePicker!) as {
    texts: TimePickerTexts;
    timeFormat?: TimePickerFormat;
    orientation?: TimePickerOrientation;
  };
  const { locale } = texts;
  const twelve = timeFormat === '12h';
  // Beside the boxes on a screen wider than it is high and low, unless the picker says.
  const turned = matchMedia('(orientation: landscape) and (max-height: 30rem)');
  const shape = () => ({ timeFormat, orientation: orientation ?? (turned.matches ? 'horizontal' : 'vertical') }) as const;
  const text = field.querySelector<HTMLInputElement>('[data-time-picker-text]')!;
  const textField = text.closest<HTMLElement>('.text-field');
  const opener = field.querySelector<HTMLButtonElement>('[data-time-picker-open]')!;
  const input = field.querySelector<HTMLInputElement>('[data-time-picker-value]')!;
  const dialog = field.querySelector<HTMLDialogElement>('[data-time-picker-dialog]')!;
  const headlineId = `time-picker-headline-${++opened}`;
  dialog.setAttribute('aria-labelledby', headlineId);

  let state: TimePickerState;
  let root: import('react-dom/client').Root | undefined;

  field.addEventListener('pointerover', () => drawing(), { once: true });
  field.addEventListener('focusin', () => drawing(), { once: true });

  async function render(focus?: 'dial' | 'input') {
    const [react, reactDom, client, container] = await drawing();
    root ??= client.createRoot(dialog);
    reactDom.flushSync(() => root!.render(react.createElement(container.default, { ...state, ...shape(), texts, headlineId })));
    if (focus === 'dial') dialog.querySelector<HTMLElement>('[data-time-picker-dial]')?.focus();
    if (focus === 'input') dialog.querySelector<HTMLInputElement>('[data-time-picker-input]')?.select();
  }

  async function open() {
    if (dialog.open) return;
    const now = new Date();
    const { hour, minute } = timeOf(input.value) ?? { hour: now.getHours(), minute: 0 };
    state = { view: 'dial', selecting: 'hour', hour, minute };
    await render();
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    opener.setAttribute('aria-expanded', 'true');
    dialog.querySelector<HTMLElement>('[data-time-picker-dial]')?.focus();
  }

  function close() {
    if (!dialog.open) return;
    dialog.close();
    document.documentElement.style.overflow = '';
    opener.setAttribute('aria-expanded', 'false');
    opener.focus();
  }

  function write(time: string) {
    if (input.value !== time) {
      input.value = time;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    text.value = time ? timeTyped(time, locale, twelve) : '';
    mark(false);
  }

  function mark(wrong: boolean) {
    textField?.classList.toggle('text-field-error', wrong);
    if (wrong) text.setAttribute('aria-invalid', 'true');
    else text.removeAttribute('aria-invalid');
  }

  // The hour or the minute the dial is set to (on a 12-hour clock the hour in the half of the day shown).
  function set(value: number, focus?: 'dial') {
    const half = state.hour >= 12 ? 12 : 0;
    const hour = twelve ? half + (((value % 12) + 12) % 12) : (value + 24) % 24;
    state = state.selecting === 'hour' ? { ...state, hour } : { ...state, minute: (value + 60) % 60 };
    void render(focus);
  }

  // OK: the time (or what is typed, in the input mode) written, and closed; else what is wrong said.
  function done() {
    if (state.view === 'input') {
      const typed = [...dialog.querySelectorAll<HTMLInputElement>('[data-time-picker-input]')].map((i) => i.value.trim());
      const [h, m] = typed.map((t) => (/^\d{1,2}$/.test(t) ? Number(t) : NaN));
      const wrong = !(twelve ? h >= 1 && h <= 12 : h <= 23) ? 0 : !(m <= 59) ? 1 : -1;
      if (wrong >= 0) {
        state = { ...state, typed, error: { field: wrong, message: twelve ? texts.wrong12 : texts.wrong } };
        return void render();
      }
      write(timeString(twelve ? (h % 12) + (state.hour >= 12 ? 12 : 0) : h, m));
      return close();
    }
    write(timeString(state.hour, state.minute));
    close();
  }

  opener.addEventListener('click', () => void open());

  // A time typed in the field, read when it is left.
  text.addEventListener('change', () => {
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
      return void render();
    }
    if (action === 'mode') {
      state =
        state.view === 'dial'
          ? {
              ...state,
              view: 'input',
              error: undefined,
              typed: [twoDigits(twelve ? state.hour % 12 || 12 : state.hour), twoDigits(state.minute)],
            }
          : { ...state, view: 'dial', selecting: 'hour', error: undefined };
      return void render(state.view === 'dial' ? 'dial' : 'input');
    }
    if (action === 'cancel') return close();
    if (action === 'ok') return done();
  });

  // The dial: the number under the pointer, by its angle from the top and, for the hours, its ring.
  function valueAt(dial: HTMLElement, e: PointerEvent): number {
    const box = dial.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const angle = (Math.atan2(x, -y) * 180) / Math.PI + 360;
    if (state.selecting === 'minute') return Math.round(angle / 6) % 60;
    const number = dial.querySelector<HTMLElement>('.time-picker-dial-number');
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
}
