// A date picker (m3.material.io/components/date-pickers, .date-picker in ../styles/ui.css): a text field to type a
// date in (in the site's language's order, 02.11.2026), with a calendar button that opens the picker
// (DatePickerContainer.tsx), and what a form sends, the day as ISO (2026-11-02), in a hidden input named `name` (and,
// with `range`, the last day in one named `endName`). `kind`: docked (the picker opens under the field) or modal (in a
// dialog in the middle of the screen, also with a keyboard input mode); a range is always modal. `value`, `endValue`:
// the day(s) it starts with; `min`, `max`: the first and last day that can be picked; `label`, `supporting`, `error`:
// the field's name, the line under it (else the date's format) and what is wrong with it (the field marked);
// `required`, `id` and the rest go on the field's input, and `className` on the field. On the site datePicker.script.ts opens it, draws the picker in its <dialog>, writes the
// day picked into the inputs and closes it; in the editor's previews it is only drawn, and with `onChange` (the editor's
// own fields) it works the same way, here, and says the day(s) picked (or '' for none). Its fixed texts
// (datePickerTexts) are the site's own, in @site/texts, unless `texts` gives them (the editor's, in its language).
import { useEffect, useRef, type ReactNode } from 'react';
import { siteText, locale } from '@morpheme/cms/src/i18n';
import { datePickerField } from '@theme/ui/datePicker.script';
import IconButton from '@theme/ui/IconButton';
import TextField from '@theme/ui/TextField';
import { dateOf, dayTyped } from '@theme/ui/dates';
import type { DatePickerKind, DatePickerTexts } from '@theme/ui/DatePickerContainer';

/** A date picker's fixed texts, in the language its dates are written in. */
export const datePickerTexts = (): DatePickerTexts => ({
  locale,
  select: siteText('Vælg dato'),
  selectRange: siteText('Vælg datoer'),
  enter: siteText('Skriv dato'),
  enterRange: siteText('Skriv datoer'),
  date: siteText('Dato'),
  start: siteText('Startdato'),
  end: siteText('Slutdato'),
  format: siteText('dd.mm.åååå'),
  wrongFormat: siteText('Skriv datoen som dd.mm.åååå.'),
  notAllowed: siteText('Datoen kan ikke vælges.'),
  endBeforeStart: siteText('Slutdatoen er før startdatoen.'),
  previousMonth: siteText('Forrige måned'),
  nextMonth: siteText('Næste måned'),
  previousYear: siteText('Forrige år'),
  nextYear: siteText('Næste år'),
  chooseMonth: siteText('Vælg måned'),
  chooseYear: siteText('Vælg år'),
  toInput: siteText('Skift til at skrive'),
  toCalendar: siteText('Skift til kalenderen'),
  cancel: siteText('Annuller'),
  ok: siteText('OK'),
});

/** What a date picker's script is told by its field: the fixed texts and what can be picked. */
export type DatePickerSettings = { texts: DatePickerTexts; kind: DatePickerKind; range: boolean; min: string; max: string };

export default function DatePicker({
  label,
  name,
  endName,
  value = '',
  endValue = '',
  kind = 'docked',
  range = false,
  min = '',
  max = '',
  supporting,
  error,
  texts: given,
  onChange,
  className,
  ...rest
}: {
  label: string;
  name: string;
  endName?: string;
  value?: string;
  endValue?: string;
  kind?: DatePickerKind;
  range?: boolean;
  min?: string;
  max?: string;
  supporting?: ReactNode;
  error?: string | boolean;
  texts?: DatePickerTexts;
  onChange?: (value: string, endValue: string) => void;
  className?: string;
} & Record<string, unknown>) {
  const texts = given ?? datePickerTexts();
  const modal = kind === 'modal' || range;
  const settings: DatePickerSettings = { texts, kind: modal ? 'modal' : 'docked', range, min, max };
  const typed = [value, range ? endValue : '']
    .filter((d) => dateOf(d))
    .map((d) => dayTyped(d, texts.locale))
    .join(' – ');
  const format = range ? `${texts.format} – ${texts.format}` : texts.format;
  const title = range ? texts.selectRange : texts.select;
  const box = useWorking(onChange, [value, endValue], typed);
  return (
    <div ref={box} className={['date-picker-field', className].filter(Boolean).join(' ')} data-date-picker={JSON.stringify(settings)}>
      <TextField
        label={label}
        supporting={supporting ?? format}
        error={error}
        placeholder={format}
        defaultValue={typed}
        inputMode="numeric"
        autoComplete="off"
        data-date-picker-text=""
        {...rest}
      />
      <IconButton
        icon="calendar-blank"
        label={title}
        className="date-picker-field-button"
        aria-haspopup="dialog"
        aria-expanded="false"
        data-date-picker-open=""
      />
      <input type="hidden" name={name} defaultValue={dateOf(value) ? value : ''} data-date-picker-value="0" />
      {range && <input type="hidden" name={endName} defaultValue={dateOf(endValue) ? endValue : ''} data-date-picker-value="1" />}
      <dialog
        className={modal ? 'dialog-modal date-picker-dialog' : 'date-picker-popover'}
        aria-label={title}
        data-date-picker-dialog=""
      ></dialog>
    </div>
  );
}

// A picker the editor changes (`onChange`): made to work here as on the site, telling the editor what is picked, and
// showing what the editor's value is when it changes from outside (a version restored).
function useWorking(onChange: ((value: string, endValue: string) => void) | undefined, values: string[], typed: string) {
  const box = useRef<HTMLDivElement>(null);
  const told = useRef(onChange);
  told.current = onChange;
  const working = onChange !== undefined;
  useEffect(() => {
    const field = box.current;
    if (!working || !field) return;
    datePickerField(field);
    const inputs = [...field.querySelectorAll<HTMLInputElement>('[data-date-picker-value]')];
    const changed = () => told.current?.(inputs[0]?.value ?? '', inputs[1]?.value ?? '');
    inputs.forEach((i) => i.addEventListener('change', changed));
    return () => inputs.forEach((i) => i.removeEventListener('change', changed));
  }, [working]);
  useEffect(() => {
    const field = box.current;
    if (!working || !field) return;
    const inputs = [...field.querySelectorAll<HTMLInputElement>('[data-date-picker-value]')];
    if (inputs.every((input, i) => input.value === (dateOf(values[i] ?? '') ? values[i] : ''))) return;
    inputs.forEach((input, i) => (input.value = dateOf(values[i] ?? '') ? values[i]! : ''));
    const text = field.querySelector<HTMLInputElement>('[data-date-picker-text]');
    if (text) text.value = typed;
  }, [working, ...values]);
  return box;
}
