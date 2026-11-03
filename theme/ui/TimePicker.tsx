// A time picker (m3.material.io/components/time-pickers, .time-picker in ../styles/ui.css): a text field to type a time
// of day in (as the site's language writes it, 14.30 in Danish; `timeFormat`: 24h, the default, or 12h, 2.30 PM, with
// AM and PM in the picker), with a clock button that opens the picker (TimePickerContainer.tsx: the dial, and the
// input mode) in a dialog in the middle of the screen, and what a form sends, the time as hh:mm (14:30), in a hidden
// input named `name`. The picker's `orientation`: the dial under the boxes (vertical) or beside them (horizontal);
// without one, beside them on a screen wider than it is high and low (a phone turned on its side), as Material's.
// `value`: the time it starts with; `label`, `supporting`, `error`: the field's name, the line under it (else the
// time's format) and what is wrong with it (the field marked); `required`, `id` and the rest go on the field's input,
// and `className` on the field. On the site
// timePicker.script.ts opens it, draws the picker in its <dialog>, writes the time picked into the inputs and closes
// it; in the editor's previews it is only drawn, and with `onChange` (the editor's own fields) it works the same way,
// here, and says the time picked (or '' for none). Its fixed texts (timePickerTexts) are the site's own, in
// @site/texts, unless `texts` gives them (the editor's, in its language).
import { useEffect, useRef, type ReactNode } from 'react';
import { siteText, locale } from '@morpheme/cms/src/i18n';
import { timePickerField } from '@theme/ui/timePicker.script';
import IconButton from '@theme/ui/IconButton';
import TextField from '@theme/ui/TextField';
import { dayPeriods, timeOf, timeTyped } from '@theme/ui/dates';
import type { TimePickerFormat, TimePickerOrientation, TimePickerTexts } from '@theme/ui/TimePickerContainer';

/** A time picker's fixed texts, in the language its times are written in (AM and PM the language's own). */
export const timePickerTexts = (): TimePickerTexts => ({
  locale,
  select: siteText('Vælg tidspunkt'),
  enter: siteText('Skriv tidspunkt'),
  hour: siteText('Time'),
  minute: siteText('Minut'),
  format: siteText('tt.mm'),
  wrong: siteText('Skriv et tidspunkt mellem 00.00 og 23.59.'),
  format12: siteText('t.mm AM/PM'),
  wrong12: siteText('Skriv et tidspunkt mellem 1.00 og 12.59.'),
  period: siteText('Før eller efter middag'),
  am: dayPeriods(locale)[0],
  pm: dayPeriods(locale)[1],
  toInput: siteText('Skift til at skrive'),
  toDial: siteText('Skift til urskiven'),
  cancel: siteText('Annuller'),
  ok: siteText('OK'),
});

export default function TimePicker({
  label,
  name,
  value = '',
  supporting,
  error,
  timeFormat = '24h',
  orientation,
  texts: given,
  onChange,
  className,
  ...rest
}: {
  label: string;
  name: string;
  value?: string;
  supporting?: ReactNode;
  error?: string | boolean;
  timeFormat?: TimePickerFormat;
  orientation?: TimePickerOrientation;
  texts?: TimePickerTexts;
  onChange?: (value: string) => void;
  className?: string;
} & Record<string, unknown>) {
  const texts = given ?? timePickerTexts();
  const known = !!timeOf(value);
  const twelve = timeFormat === '12h';
  const format = twelve ? texts.format12 : texts.format;
  const typed = known ? timeTyped(value, texts.locale, twelve) : '';
  const box = useWorking(onChange, known ? value : '', typed);
  return (
    <div
      ref={box}
      className={['time-picker-field', className].filter(Boolean).join(' ')}
      data-time-picker={JSON.stringify({ texts, timeFormat, orientation })}
    >
      <TextField
        label={label}
        supporting={supporting ?? format}
        error={error}
        placeholder={format}
        defaultValue={typed}
        inputMode="numeric"
        autoComplete="off"
        data-time-picker-text=""
        {...rest}
      />
      <IconButton
        icon="clock"
        label={texts.select}
        className="time-picker-field-button"
        aria-haspopup="dialog"
        aria-expanded="false"
        data-time-picker-open=""
      />
      <input type="hidden" name={name} defaultValue={known ? value : ''} data-time-picker-value="" />
      <dialog className="dialog-modal time-picker-dialog" aria-label={texts.select} data-time-picker-dialog=""></dialog>
    </div>
  );
}

// A picker the editor changes (`onChange`): made to work here as on the site, telling the editor what is picked, and
// showing what the editor's value is when it changes from outside (a version restored).
function useWorking(onChange: ((value: string) => void) | undefined, value: string, typed: string) {
  const box = useRef<HTMLDivElement>(null);
  const told = useRef(onChange);
  told.current = onChange;
  const working = onChange !== undefined;
  useEffect(() => {
    const field = box.current;
    if (!working || !field) return;
    timePickerField(field);
    const input = field.querySelector<HTMLInputElement>('[data-time-picker-value]');
    const changed = () => told.current?.(input?.value ?? '');
    input?.addEventListener('change', changed);
    return () => input?.removeEventListener('change', changed);
  }, [working]);
  useEffect(() => {
    const field = box.current;
    const input = field?.querySelector<HTMLInputElement>('[data-time-picker-value]');
    if (!working || !field || !input || input.value === value) return;
    input.value = value;
    const text = field.querySelector<HTMLInputElement>('[data-time-picker-text]');
    if (text) text.value = typed;
  }, [working, value]);
  return box;
}
