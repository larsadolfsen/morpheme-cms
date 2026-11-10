// The fixed texts of the date and time pickers (DatePicker.tsx, TimePicker.tsx), written in English; `say` turns an
// English text into the site's language (siteText on the site). Apart from the pickers so that a test can read them.
import { dayPeriods } from './dates.ts';
import type { DatePickerTexts } from '@theme/ui/DatePickerContainer';
import type { TimePickerTexts } from '@theme/ui/TimePickerContainer';

/** A date picker's texts: `say` gives each English text in the site's language, `locale` is the one its dates are
 * written in. */
export const datePickerTextsIn = (say: (text: string) => string, locale: string): DatePickerTexts => ({
  locale,
  select: say('Select date'),
  selectRange: say('Select dates'),
  enter: say('Enter date'),
  enterRange: say('Enter dates'),
  date: say('Date'),
  start: say('Start date'),
  end: say('End date'),
  format: say('dd/mm/yyyy'),
  wrongFormat: say('Write the date as dd/mm/yyyy.'),
  notAllowed: say('The date cannot be selected.'),
  endBeforeStart: say('The end date is before the start date.'),
  previousMonth: say('Previous month'),
  nextMonth: say('Next month'),
  previousYear: say('Previous year'),
  nextYear: say('Next year'),
  chooseMonth: say('Choose month'),
  chooseYear: say('Choose year'),
  toInput: say('Switch to typing'),
  toCalendar: say('Switch to the calendar'),
  cancel: say('Cancel'),
  ok: say('OK'),
});

/** A time picker's texts (AM and PM the language's own), as `datePickerTextsIn`. */
export const timePickerTextsIn = (say: (text: string) => string, locale: string): TimePickerTexts => ({
  locale,
  select: say('Select time'),
  enter: say('Enter time'),
  hour: say('Hour'),
  minute: say('Minute'),
  format: say('hh:mm'),
  wrong: say('Enter a time between 00:00 and 23:59.'),
  format12: say('h:mm AM/PM'),
  wrong12: say('Enter a time between 1:00 and 12:59.'),
  period: say('Before or after noon'),
  am: dayPeriods(locale)[0],
  pm: dayPeriods(locale)[1],
  toInput: say('Switch to typing'),
  toDial: say('Switch to the dial'),
  cancel: say('Cancel'),
  ok: say('OK'),
});
