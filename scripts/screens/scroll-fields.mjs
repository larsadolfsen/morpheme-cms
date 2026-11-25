import { openEditor } from '../built-site.mjs';
import { browser, problems, site } from './support/context.mjs';
import { isMaterialTheme } from '../theme-statement.mjs';

/** The scroll field (Material 3, m3.material.io/components/scroll-fields): in the editor's UI parts page, the samples of the ScrollField part are spinbuttons
 * whose selected value is the one in the middle, the inactive values at least 48 px high; a small, a medium and a large field have the minimum widths of
 * their size (100, 120 and 186 dp, tokens/material/comp/scroll-field.css); the arrow keys, Home and End move a finite field (no wrap) and a looping one
 * wraps round; a tap on the value below goes to it; the input mode is a text field; nothing scrolls the page sideways. Run on a phone and a computer. */
async function checkScrollFields(width, height, theme) {
  const label = `${width}px ${theme} scroll fields`;
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
  const fields = page.locator('[data-scroll-fields] .mo-scroll-field__list');
  await fields
    .first()
    .waitFor({ timeout: 30_000 })
    .catch(() => problems.push(`${label}: no scroll field in the ScrollField part`));
  if (!(await fields.count())) return page.close();
  await fields.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const seen = await fields.evaluateAll((all) =>
    all.map((f) => {
      const box = f.getBoundingClientRect();
      const item = f.querySelector('[data-selected]');
      const at = item?.getBoundingClientRect();
      return {
        name: f.getAttribute('aria-label'),
        width: box.width,
        size: [...f.closest('.mo-scroll-field').classList].find((c) => /^mo-is-(small|medium|large)$/.test(c)),
        off: at ? Math.abs(at.top + at.height / 2 - (box.top + box.height / 2)) : null,
        inactive: Math.min(
          ...[...f.querySelectorAll('[data-scroll-field-item]:not([data-selected])')].map((i) => i.getBoundingClientRect().height),
        ),
        wide: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    }),
  );
  const rem = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  const minimum = { 'mo-is-small': 6.25, 'mo-is-medium': 7.5, 'mo-is-large': 11.625 };
  seen.forEach((s, i) => {
    if (s.off === null) problems.push(`${label} #${i}: no selected value`);
    else if (s.off > 2) problems.push(`${label} #${i}: the selected value is ${s.off.toFixed(1)}px from the middle`);
    // Material follows M3's 48 px; every theme keeps WCAG 2.2 AA's 24 px target size.
    if (s.inactive < (isMaterialTheme() ? 48 : 24))
      problems.push(`${label} #${i}: an inactive value is ${s.inactive}px high, ${isMaterialTheme() ? 'M3 asks for 48' : 'under 24'}`);
    if (s.width + 1 < minimum[s.size] * rem) problems.push(`${label} #${i}: ${s.size} is ${s.width}px wide, under its minimum`);
    if (s.wide) problems.push(`${label} #${i}: the page scrolls sideways`);
  });
  const move = async (field, key) => {
    await field.focus();
    await page.keyboard.press(key);
    await page.waitForTimeout(1200);
    return Number(await field.getAttribute('aria-valuenow'));
  };
  // A finite field (the first, 0 to 59, at 30): down goes to 31, End to 59 and down again stays on it, Home to 0.
  const finite = fields.nth(0);
  if ((await move(finite, 'ArrowDown')) !== 31) problems.push(`${label}: ArrowDown did not move the finite field to 31`);
  if ((await move(finite, 'End')) !== 59) problems.push(`${label}: End did not go to 59`);
  if ((await move(finite, 'ArrowDown')) !== 59) problems.push(`${label}: a finite field wrapped past its end`);
  if ((await move(finite, 'Home')) !== 0) problems.push(`${label}: Home did not go to 0`);
  // A looping field (the fourth, 1 to 12, at 12): down comes round to 1, up back to 12.
  const looping = fields.nth(3);
  if ((await move(looping, 'ArrowDown')) !== 1) problems.push(`${label}: a looping field did not wrap from 12 to 1`);
  if ((await move(looping, 'ArrowUp')) !== 12) problems.push(`${label}: a looping field did not wrap from 1 back to 12`);
  const middle = await looping.evaluate((f) => {
    const sel = f.querySelector('[data-selected]');
    const a = sel.getBoundingClientRect();
    const b = f.getBoundingClientRect();
    return Math.abs(a.top + a.height / 2 - (b.top + b.height / 2));
  });
  if (middle > 2) problems.push(`${label}: the looping field's selected value is ${middle.toFixed(1)}px from the middle after wrapping`);
  // A tap on the value below the selected one goes to it.
  const medium = fields.nth(1);
  const before = Number(await medium.getAttribute('aria-valuenow'));
  await medium.locator('[data-selected] + [data-scroll-field-item]').click();
  await page.waitForTimeout(500);
  if (Number(await medium.getAttribute('aria-valuenow')) !== before + 1)
    problems.push(`${label}: a tap on the value below did not go to it`);
  if (!(await medium.evaluate((el) => el.matches(':focus')))) problems.push(`${label}: a tap did not focus the field`);
  // The input mode: the toggle swaps the field for a text field holding the value.
  const typed = page.locator('[data-scroll-fields] [role="group"]', { has: page.locator('button') });
  await typed.locator('button').click();
  const input = typed.locator('input');
  await input.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the input mode shows no text field`));
  if ((await input.count()) && (await input.inputValue()) !== '30')
    problems.push(`${label}: the text field holds "${await input.inputValue()}", not 30`);
  await page.close();
}

export function register(unit) {
  for (const [width, height] of [
    [390, 844],
    [1280, 900],
  ])
    for (const theme of ['light', 'dark']) unit(`checkScrollFields ${width} ${theme}`, () => checkScrollFields(width, height, theme));
}
