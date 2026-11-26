// "Parts" › "UI components" (BlockParts.tsx), the group "Date and time": the theme's date and time pickers
// (packages/editor/theme/ui/, through @site/editor) as the site draws them: the fields (docked, modal, a range, typed
// wrong), and what opens from them in each state: the docked picker's month and its list of years, the modal one's
// month with a day picked, its years, a range and the input mode with an error; the time picker's dial on the hours and
// on a minute between the fives, and its input mode with an error, on a 12-hour clock (the dial and the input mode)
// and horizontal (the dial beside the boxes, 24- and 12-hour). Only drawn (`Drawn`: an inert picture that takes no focus): on the site
// datePicker.script.ts and timePicker.script.ts make them work.
import { useState } from 'react';
import {
  SiteDatePicker,
  SiteDatePickerContainer,
  SiteTimePicker,
  SiteTimePickerContainer,
  SiteScrollField,
  datePickerTexts,
  timePickerTexts,
} from './themeUi';
import { Example, Part } from './PartsShown';
import { IconButton, Preview } from './ui';
import { t } from './i18n';

const say = t.parts.screens.pickers;

const pad = (n: number) => String(n).padStart(2, '0');
const dayOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** A scroll field with the button that swaps it to the input mode and back (Material: "Choosing text input swaps the focused scroll field to a text field"). */
function ScrollFieldWithInput({
  typedLabel,
  scrollLabel,
  ...field
}: { typedLabel: string; scrollLabel: string } & React.ComponentProps<typeof SiteScrollField>) {
  const [mode, setMode] = useState<'scroll' | 'input'>('scroll');
  return (
    <div className="mo-editor-picker-row">
      <SiteScrollField {...field} mode={mode} invalidText={say.scrollInvalid} />
      <IconButton
        icon={mode === 'scroll' ? 'keyboard' : 'swipe_vertical'}
        label={mode === 'scroll' ? typedLabel : scrollLabel}
        onClick={() => setMode(mode === 'scroll' ? 'input' : 'scroll')}
      />
    </div>
  );
}

/** A sample that is only drawn (the container with no script behind it): a picture that takes no focus and has no role of its parts, so a keyboard or a screen reader finds nothing that ignores its keys. */
function Drawn({ className, label, children }: { className: string; label: string; children: React.ReactNode }) {
  return (
    <div className={className} role="img" aria-label={label}>
      <div className="mo-editor-picker-inert" inert>
        {children}
      </div>
    </div>
  );
}

export default function PickerParts() {
  const dates = datePickerTexts();
  const times = timePickerTexts();
  const now = new Date();
  const today = dayOf(now);
  const month = today.slice(0, 7);
  // A day picked in this month (not today, so both show), and a range of a week in it.
  const picked = `${month}-${now.getDate() === 12 ? '14' : '12'}`;
  const [start, end] = [`${month}-08`, `${month}-15`];
  const drawn = 'mo-editor-picker-row';
  const box = 'mo-editor-picker-box';
  return (
    <>
      <Part name="DatePicker" m3="md.comp.date-picker" use={say.datePicker}>
        <Preview>
          <div className="mo-editor-sample-stack-6">
            <div className="mo-editor-two-columns" role="group" aria-label={say.fields}>
              <Example label={t.parts.screens.example(1)} flat>
                <SiteDatePicker label={say.date} name="date" />
              </Example>
              <Example label={t.parts.screens.example(2)} flat>
                <SiteDatePicker label={say.date} name="date-modal" kind="modal" value={picked} />
              </Example>
              <Example label={t.parts.screens.example(3)} flat>
                <SiteDatePicker label={say.period} name="from" endName="to" range value={start} endValue={end} />
              </Example>
              <Example label={t.parts.screens.example(4)} flat>
                <SiteDatePicker label={say.date} name="date-wrong" defaultValue="31.02.2026" error={dates.wrongFormat} />
              </Example>
            </div>
          </div>
          <div className={drawn}>
            <Drawn className={box} label={say.docked}>
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
            </Drawn>
            <Drawn className={box} label={say.dockedYears}>
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
            </Drawn>
            <Drawn className={box} label={say.modal}>
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
            </Drawn>
            <Drawn className={box} label={say.modalYears}>
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
            </Drawn>
            <Drawn className={box} label={say.range}>
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
            </Drawn>
            <Drawn className={box} label={say.input}>
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
            </Drawn>
          </div>
        </Preview>
      </Part>
      <Part name="TimePicker" m3="md.comp.time-picker" use={say.timePicker}>
        <Preview>
          <div className="mo-editor-sample-columns" role="group" aria-label={say.fields}>
            <Example label={t.parts.screens.example(1)} flat>
              <SiteTimePicker label={say.time} name="time" />
            </Example>
            <Example label={t.parts.screens.example(2)} flat>
              <SiteTimePicker label={say.time} name="time-set" value="14:30" />
            </Example>
            <Example label={t.parts.screens.example(3)} flat>
              <SiteTimePicker label={`${say.time} (${say.twelveHours})`} name="time-12" value="14:30" timeFormat="12h" />
            </Example>
          </div>
          <div className={drawn}>
            <Drawn className="mo-editor-picker-sample" label={say.hours}>
              <SiteTimePickerContainer view="dial" selecting="hour" hour={14} minute={30} texts={times} />
            </Drawn>
            <Drawn className="mo-editor-picker-sample" label={say.minutes}>
              <SiteTimePickerContainer view="dial" selecting="minute" hour={9} minute={7} texts={times} />
            </Drawn>
            <Drawn className="mo-editor-picker-sample" label={say.input}>
              <SiteTimePickerContainer view="input" selecting="hour" hour={14} minute={30} texts={times} />
            </Drawn>
            <Drawn className="mo-editor-picker-sample" label={say.wrong}>
              <SiteTimePickerContainer
                view="input"
                selecting="hour"
                hour={14}
                minute={30}
                typed={['25', '30']}
                error={{ field: 0, message: times.wrong }}
                texts={times}
              />
            </Drawn>
            <Drawn className="mo-editor-picker-sample" label={say.twelveHours}>
              <SiteTimePickerContainer view="dial" selecting="hour" hour={14} minute={30} texts={times} timeFormat="12h" />
            </Drawn>
            <Drawn className="mo-editor-picker-sample" label={`${say.twelveHours}: ${say.input}`}>
              <SiteTimePickerContainer view="input" selecting="hour" hour={9} minute={15} texts={times} timeFormat="12h" />
            </Drawn>
          </div>
          <div className={drawn} data-scroll-time-pickers="">
            <Drawn className="mo-editor-picker-sample" label={say.scrollPicker}>
              <SiteTimePickerContainer view="scroll" kind="scroll" selecting="hour" hour={14} minute={30} texts={times} />
            </Drawn>
            <Drawn className="mo-editor-picker-sample" label={`${say.scrollPicker}: ${say.twelveHours}`}>
              <SiteTimePickerContainer view="scroll" kind="scroll" selecting="hour" hour={14} minute={30} texts={times} timeFormat="12h" />
            </Drawn>
            <div className="mo-editor-picker-sample" role="group" aria-label={`${say.scrollPicker}: ${say.inline}`}>
              <SiteTimePicker inline label={say.time} name="time-inline" onChange={() => {}} />
            </div>
          </div>
          {/* As wide as a phone on its side: scrolled sideways on a narrower screen. */}
          <div className={`${drawn} mo-editor-picker-scroll`}>
            <Drawn className="mo-editor-picker-wide" label={say.horizontal}>
              <SiteTimePickerContainer view="dial" selecting="minute" hour={14} minute={30} texts={times} orientation="horizontal" />
            </Drawn>
            <Drawn className="mo-editor-picker-wide" label={`${say.horizontal}: ${say.twelveHours}`}>
              <SiteTimePickerContainer
                view="dial"
                selecting="hour"
                hour={20}
                minute={0}
                texts={times}
                timeFormat="12h"
                orientation="horizontal"
              />
            </Drawn>
          </div>
        </Preview>
      </Part>
      <Part name="ScrollField" m3="md.comp.scroll-field" use={say.scrollField}>
        <Preview>
          <div className={drawn} data-scroll-fields="">
            <div className="mo-editor-picker-sample" role="group" aria-label={say.sizeSmall}>
              <SiteScrollField label={say.number} items={range(0, 59)} value={30} size="small" />
            </div>
            <div className="mo-editor-picker-sample" role="group" aria-label={say.sizeMedium}>
              <SiteScrollField label={say.number} items={range(100, 199)} value={150} size="medium" />
            </div>
            <div className="mo-editor-picker-sample" role="group" aria-label={say.sizeLarge}>
              <SiteScrollField label={say.year} items={range(2000, 2060)} value={2026} size="large" />
            </div>
            <div className="mo-editor-picker-sample" role="group" aria-label={say.looping}>
              <SiteScrollField label={say.number} items={range(1, 12)} value={12} looping />
            </div>
            <div className="mo-editor-picker-sample" role="group" aria-label={say.texts}>
              <SiteScrollField label={say.month} items={say.months} value={say.months[5]} size="large" />
            </div>
            <div className="mo-editor-picker-sample" role="group" aria-label={say.input}>
              <ScrollFieldWithInput
                label={say.number}
                items={range(0, 59)}
                value={30}
                typedLabel={times.toInput}
                scrollLabel={times.toScroll}
              />
            </div>
            <div className="mo-editor-picker-sample" role="group" aria-label={say.disabled}>
              <SiteScrollField label={say.number} items={range(0, 59)} value={30} disabled />
            </div>
          </div>
        </Preview>
      </Part>
    </>
  );
}
