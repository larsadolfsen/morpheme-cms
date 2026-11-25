import { openEditor } from '../built-site.mjs';
import { browser, problems, site } from './support/context.mjs';

/** The scroll time picker (Material 3, m3.material.io/components/time-pickers): in the editor's UI parts page, each sample of it has two
 * scroll fields (spinbuttons named Hour and Minute) whose selected value is the one in the middle and is at least 48 px high as the
 * targets M3 asks for, nothing scrolls the page sideways, the fields have a focus ring for the keyboard, and a key moves the value
 * without wrapping. Run on a phone and a computer, in the light and the dark theme. */
async function checkScrollTimePicker(width, height, theme) {
  const label = `${width}px ${theme} scroll time picker`;
  const touch = width < 600;
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch,
    locale: 'en-US',
    colorScheme: theme,
  });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#developer/parts/ui'));
  const samples = page.locator('[data-scroll-time-pickers] .mo-time-picker__scroll');
  await samples
    .first()
    .waitFor({ timeout: 30_000 })
    .catch(() => problems.push(`${label}: no scroll time picker in the TimePicker part`));
  if (!(await samples.count())) return page.close();
  await samples.first().scrollIntoViewIfNeeded();
  const seen = await samples.evaluateAll((all) =>
    all.map((sample) => {
      const fields = [...sample.querySelectorAll('[role="spinbutton"]')];
      return {
        names: fields.map((f) => f.getAttribute('aria-label')),
        selected: fields.map((f) => {
          const item = f.querySelector('[data-selected]');
          if (!item) return null;
          const field = f.getBoundingClientRect();
          const box = item.getBoundingClientRect();
          return { height: box.height, off: Math.abs(box.top + box.height / 2 - (field.top + field.height / 2)) };
        }),
        inactive: fields.map((f) =>
          Math.min(...[...f.querySelectorAll('[data-time-picker-item]:not([data-selected])')].map((i) => i.getBoundingClientRect().height)),
        ),
        wide: sample.scrollWidth > sample.clientWidth + 1,
      };
    }),
  );
  seen.forEach((s, i) => {
    if (s.names.join() !== 'Hour,Minute') problems.push(`${label} #${i}: the fields are named ${s.names.join(', ')}, not Hour and Minute`);
    s.selected.forEach((v, j) => {
      if (!v) problems.push(`${label} #${i}: field ${j} has no selected value`);
      else if (v.off > 2) problems.push(`${label} #${i}: the selected value of field ${j} is ${v.off.toFixed(1)}px from the middle`);
    });
    s.inactive.forEach((h, j) => {
      if (h < 48) problems.push(`${label} #${i}: an inactive value of field ${j} is ${h}px high, M3 asks for 48`);
    });
    if (s.wide) problems.push(`${label} #${i}: the picker is wider than its room`);
  });
  // The last sample is the live inline picker, with no time: it starts at the current hour and the form field stays empty until a key moves the
  // hour one step (up at the end of the day, as there is no wrap-around).
  const hour = samples.last().locator('[role="spinbutton"]').first();
  const value = samples.last().locator('xpath=ancestor::*[@data-time-picker]//input[@data-time-picker-value]');
  if ((await value.inputValue()) !== '') problems.push(`${label}: the inline picker wrote a time before anyone changed it`);
  const before = Number(await hour.getAttribute('aria-valuenow'));
  const [key, to] = before < 23 ? ['ArrowDown', before + 1] : ['ArrowUp', before - 1];
  await hour.focus();
  await page.keyboard.press(key);
  await page.waitForTimeout(400);
  const now = Number(await hour.getAttribute('aria-valuenow'));
  const expected = `${String(to).padStart(2, '0')}:00`;
  if (now !== to) problems.push(`${label}: ${key} moved the hour from ${before} to ${now}, not ${to}`);
  if ((await value.inputValue()) !== expected)
    problems.push(`${label}: the form field holds "${await value.inputValue()}" after a change, not ${expected}`);
  if (!(await hour.evaluate((el) => el.matches(':focus-visible')))) problems.push(`${label}: the field has no :focus-visible after a key`);
  await page.close();
}

export function register(unit) {
  for (const [width, height] of [
    [390, 844],
    [1280, 900],
  ])
    for (const theme of ['light', 'dark'])
      unit(`checkScrollTimePicker ${width} ${theme}`, () => checkScrollTimePicker(width, height, theme));
}
