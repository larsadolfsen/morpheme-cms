// "Dele" › "UI-komponenter" (BlockParts.tsx), the group "Valg af dato og tid": the theme's date and time pickers
// (packages/editor/theme/ui/, through @site/editor) as the site draws them: the fields (docked, modal, a range, typed
// wrong), and what opens from them in each state: the docked picker's month and its list of years, the modal one's
// month with a day picked, its years, a range and the input mode with an error; the time picker's dial on the hours and
// on a minute between the fives, and its input mode with an error, on a 12-hour clock (the dial and the input mode)
// and horizontal (the dial beside the boxes, 24- and 12-hour). Only drawn: on the site datePicker.script.ts and
// timePicker.script.ts make them work.
import {
  SiteDatePicker,
  SiteDatePickerContainer,
  SiteTimePicker,
  SiteTimePickerContainer,
  datePickerTexts,
  timePickerTexts,
} from './themeUi';
import { Part } from './PartsShown';
import { Preview } from './ui';
import { t } from './i18n';

const say = t.parts.screens.pickers;

const pad = (n: number) => String(n).padStart(2, '0');
const dayOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function PickerParts() {
  const dates = datePickerTexts();
  const times = timePickerTexts();
  const now = new Date();
  const today = dayOf(now);
  const month = today.slice(0, 7);
  // A day picked in this month (not today, so both show), and a range of a week in it.
  const picked = `${month}-${now.getDate() === 12 ? '14' : '12'}`;
  const [start, end] = [`${month}-08`, `${month}-15`];
  const drawn = 'flex flex-wrap items-start gap-6 p-4';
  const box = 'w-[22.5rem] max-w-full';
  return (
    <>
      <Part name="DatePicker" use={say.datePicker}>
        <Preview>
          <div className="space-y-6 p-4">
            <div className="grid gap-6 medium:grid-cols-2" role="group" aria-label={say.fields}>
              <SiteDatePicker label={say.date} name="date" />
              <SiteDatePicker label={say.date} name="date-modal" kind="modal" value={picked} />
              <SiteDatePicker label={say.period} name="from" endName="to" range value={start} endValue={end} />
              <SiteDatePicker label={say.date} name="date-wrong" defaultValue="31.02.2026" error={dates.wrongFormat} />
            </div>
          </div>
          <div className={drawn}>
            <div className={box} role="group" aria-label={say.docked}>
              <SiteDatePickerContainer
                kind="docked"
                view="days"
                month={month}
                start={picked}
                end=""
                focus={picked}
                today={today}
                texts={dates}
              />
            </div>
            <div className={box} role="group" aria-label={say.dockedYears}>
              <SiteDatePickerContainer
                kind="docked"
                view="years"
                month={month}
                start={picked}
                end=""
                focus={picked}
                today={today}
                texts={dates}
              />
            </div>
            <div className={box} role="group" aria-label={say.modal}>
              <SiteDatePickerContainer
                kind="modal"
                view="days"
                month={month}
                start={picked}
                end=""
                focus={picked}
                today={today}
                texts={dates}
              />
            </div>
            <div className={box} role="group" aria-label={say.modalYears}>
              <SiteDatePickerContainer
                kind="modal"
                view="years"
                month={month}
                start={picked}
                end=""
                focus={picked}
                today={today}
                texts={dates}
              />
            </div>
            <div className={box} role="group" aria-label={say.range}>
              <SiteDatePickerContainer
                kind="modal"
                range
                view="days"
                month={month}
                start={start}
                end={end}
                focus={start}
                today={today}
                texts={dates}
              />
            </div>
            <div className={box} role="group" aria-label={say.input}>
              <SiteDatePickerContainer
                kind="modal"
                view="input"
                month={month}
                start=""
                end=""
                focus={today}
                today={today}
                typed={['31.02.2026']}
                error={{ field: 0, message: dates.wrongFormat }}
                texts={dates}
              />
            </div>
          </div>
        </Preview>
      </Part>
      <Part name="TimePicker" use={say.timePicker}>
        <Preview>
          <div className="grid gap-6 p-4 medium:grid-cols-2" role="group" aria-label={say.fields}>
            <SiteTimePicker label={say.time} name="time" />
            <SiteTimePicker label={say.time} name="time-set" value="14:30" />
            <SiteTimePicker label={`${say.time} (${say.twelveHours})`} name="time-12" value="14:30" timeFormat="12h" />
          </div>
          <div className={drawn}>
            <div className="w-[20.5rem] max-w-full" role="group" aria-label={say.hours}>
              <SiteTimePickerContainer view="dial" selecting="hour" hour={14} minute={30} texts={times} />
            </div>
            <div className="w-[20.5rem] max-w-full" role="group" aria-label={say.minutes}>
              <SiteTimePickerContainer view="dial" selecting="minute" hour={9} minute={7} texts={times} />
            </div>
            <div className="w-[20.5rem] max-w-full" role="group" aria-label={say.input}>
              <SiteTimePickerContainer view="input" selecting="hour" hour={14} minute={30} texts={times} />
            </div>
            <div className="w-[20.5rem] max-w-full" role="group" aria-label={say.wrong}>
              <SiteTimePickerContainer
                view="input"
                selecting="hour"
                hour={14}
                minute={30}
                typed={['25', '30']}
                error={{ field: 0, message: times.wrong }}
                texts={times}
              />
            </div>
            <div className="w-[20.5rem] max-w-full" role="group" aria-label={say.twelveHours}>
              <SiteTimePickerContainer view="dial" selecting="hour" hour={14} minute={30} texts={times} timeFormat="12h" />
            </div>
            <div className="w-[20.5rem] max-w-full" role="group" aria-label={`${say.twelveHours}: ${say.input}`}>
              <SiteTimePickerContainer view="input" selecting="hour" hour={9} minute={15} texts={times} timeFormat="12h" />
            </div>
          </div>
          {/* As wide as a phone on its side: scrolled sideways on a narrower screen. */}
          <div className={`${drawn} overflow-x-auto`}>
            <div className="w-[36rem] shrink-0" role="group" aria-label={say.horizontal}>
              <SiteTimePickerContainer view="dial" selecting="minute" hour={14} minute={30} texts={times} orientation="horizontal" />
            </div>
            <div className="w-[36rem] shrink-0" role="group" aria-label={`${say.horizontal}: ${say.twelveHours}`}>
              <SiteTimePickerContainer
                view="dial"
                selecting="hour"
                hour={20}
                minute={0}
                texts={times}
                timeFormat="12h"
                orientation="horizontal"
              />
            </div>
          </div>
        </Preview>
      </Part>
    </>
  );
}
