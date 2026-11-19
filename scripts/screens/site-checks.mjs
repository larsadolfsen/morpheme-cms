import { openEditor } from '../built-site.mjs';
import { allow, nestedUnits } from '../spacing-grid.allow.mjs';
import { browser, problems, site } from './support/context.mjs';
import { animationsSettled, hintContrasts, onTestPage } from './support/shared.mjs';

/** The site's spacing is on the 4 dp grid (docs/superpowers/specs/2026-11-13-site-spacing-audit.md, step 6): every margin, padding and gap of what the demo's Blocks page draws is a multiple of 4 px (also 2, 6 and 10: Material 3's nested units), except what scripts/spacing-grid.allow.mjs allows with its reason. Run at 375 and 1280, as a value that follows the width is what drifts. */
async function checkSpacingGrid(width, height) {
  const label = `${width}px spacing grid`;
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  await animationsSettled(page);
  const found = await page.evaluate(
    ([nested, allowed]) => {
      const sides = {
        margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
        padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
        gap: ['rowGap', 'columnGap'],
      };
      const out = new Map();
      const root = document.querySelector('main') ?? document.body;
      for (const el of root.querySelectorAll('*')) {
        if (el.closest('svg')) continue;
        const style = getComputedStyle(el);
        if (style.display === 'none') continue;
        const parent = el.parentElement?.getBoundingClientRect();
        const box = el.getBoundingClientRect();
        // A margin the stylesheet sets to auto (a card's actions pushed to its bottom with `margin-top: auto`, a centred box) comes out as the room left over,
        // which is the box's or the window's height or width, never a spacing: the computed style map keeps the specified `auto`, so it is skipped by what the
        // stylesheet says. A margin with a real value is still measured, so an off-grid one is not hidden.
        const specified = el.computedStyleMap();
        // Margins that are auto (a centred box) come out as the room left over, which is the window's, not a spacing.
        const centred =
          parent && style.marginLeft === style.marginRight && Math.abs(box.left - parent.left - (parent.right - box.right)) < 1;
        for (const [kind, names] of Object.entries(sides)) {
          for (const name of names) {
            if (centred && (name === 'marginLeft' || name === 'marginRight')) continue;
            if (kind === 'margin' && String(specified.get(name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`))) === 'auto') continue;
            const n = parseFloat(style[name]);
            if (!Number.isFinite(n) || n === 0) continue;
            if (Math.abs(n / 4 - Math.round(n / 4)) < 0.01 || nested.includes(Math.abs(n))) continue;
            if (allowed.some(([selector, props]) => props.includes(kind) && el.matches(selector))) continue;
            const classes = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
            const key = `${el.tagName.toLowerCase()}${classes ? '.' + classes : ''} ${name}: ${Math.round(n * 100) / 100}px`;
            out.set(key, (out.get(key) ?? 0) + 1);
          }
        }
      }
      return [...out.keys()];
    },
    [nestedUnits, allow.map((a) => [a.selector, a.props])],
  );
  for (const what of found)
    problems.push(
      `${label}: ${what} is not a multiple of 4 px (a space on the 4 dp grid; or an entry of scripts/spacing-grid.allow.mjs with its reason)`,
    );
  await page.close();
}

/** The hint lines (Type text, or tap Insert …; Write text here…) read on every section colour, light and dark (4.5:1), and start where the text starts. */
async function checkHints() {
  for (const scheme of ['light', 'dark']) {
    for (const width of [360, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 740 }, colorScheme: scheme, locale: 'en-US' });
      page.on('pageerror', (e) => problems.push(`${width}px hints: ${e.message}`));
      await openEditor(page, site);
      await page.evaluate(() => (location.hash = '#new/pages'));
      await page.waitForSelector('.ProseMirror');
      await page.click('.ProseMirror');
      await page.keyboard.type('# Hej');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Some more text.');
      await page.keyboard.press('Enter');
      const colors = await hintContrasts(page, '.ProseMirror > p.mo-editor-gap-here', '::before');
      const got = await page.evaluate(() => {
        const [h1, text, gap] = [...document.querySelector('.ProseMirror').children];
        const left = (n) => n.getBoundingClientRect().left + parseFloat(getComputedStyle(n).paddingLeft);
        return { textLeft: left(text), gapLeft: left(gap), h1Left: left(h1) };
      });
      for (const [color, ratio] of Object.entries(colors))
        if (ratio < 4.5)
          problems.push(`${width}px ${scheme} hints: the hint on a ${color} section has contrast ${ratio.toFixed(2)}:1, below 4.5`);
      if (Math.abs(got.gapLeft - got.textLeft) > 0.5 || Math.abs(got.h1Left - got.textLeft) > 0.5)
        problems.push(`${width}px ${scheme} hints: the hint starts at ${got.gapLeft}, the text at ${got.textLeft}`);
      await page.close();
    }
  }
}

/** The footer links are the one named exception to the 44/48 px target checks of this file: they are exactly 36 px high by the owner's decision (14 Nov 2026, "Make the footer links 36px high clickable"), a deviation from M3's 48dp target allowed in the editor's workspace (docs/material-deviations.md, "Footer links"). No other check here skips them; this one asserts the number, so the exception is as narrow as the owner's 36 (35 or 37 fails, and so does a link narrower than its label plus 24 px). */
const FOOTER_LINK_HEIGHT = 36;

/** The editor's footer links (Support, System status, the legal links, Licenses) are exactly 36 px high at 320, 375 (touch) and 1280 px, as wide as their label plus 24 px of their own padding, never overlapping, with no sideways scroll; the lines of a wrapped row are 8px apart or more; the dividers are 16 px high and centred on the row. */
async function checkFooterTargets(width, touch) {
  const page = await browser.newPage({ viewport: { width, height: touch ? 800 : 900 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${width}px footer links: ${e.message}`));
  await openEditor(page, site);
  await page.waitForSelector('footer nav a');
  const got = await page.evaluate(() => {
    const box = (el) => el.getBoundingClientRect().toJSON();
    const links = [...document.querySelectorAll('footer nav a')].map((a) => {
      const range = document.createRange();
      // The label's own text only (the status badge has a visually hidden text of its own).
      const text = [...a.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      range.selectNodeContents(text);
      return { name: a.textContent.trim(), ...box(a), labelWidth: range.getBoundingClientRect().width };
    });
    const dividers = [...document.querySelectorAll('footer nav [data-divider]')].map((d) => ({
      ...box(d),
      visible: getComputedStyle(d).visibility !== 'hidden',
    }));
    return { links, dividers, scrolls: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });
  const boxes = got.links;
  if (boxes.length < 4) problems.push(`${width}px footer links: only ${boxes.length} found`);
  for (const b of boxes) {
    if (Math.abs(b.height - FOOTER_LINK_HEIGHT) > 0.5)
      problems.push(
        `${width}px footer link "${b.name}": ${b.height}px high, should be exactly ${FOOTER_LINK_HEIGHT}px (owner's exception to M3's 48dp)`,
      );
    if (b.width < b.labelWidth + 24 - 0.5)
      problems.push(`${width}px footer link "${b.name}": ${b.width}px wide, should be its label (${b.labelWidth}px) plus 24px of padding`);
  }
  for (const a of boxes)
    for (const b of boxes) {
      if (a === b) continue;
      if (b.top >= a.bottom - 0.5 && b.top - a.bottom < 8 - 0.5 && b.left < a.right && b.right > a.left)
        problems.push(`${width}px footer links "${a.name}" and "${b.name}": ${b.top - a.bottom}px apart, should be 8px or more`);
      const sameLine = Math.abs(a.top - b.top) < 1;
      if (sameLine && a.left < b.left && a.right > b.left + 0.5)
        problems.push(`${width}px footer links "${a.name}" and "${b.name}" overlap`);
    }
  for (const d of got.dividers.filter((x) => x.visible)) {
    if (Math.abs(d.height - 16) > 0.5) problems.push(`${width}px footer divider is ${d.height}px high, not 16`);
    const row = boxes.find((l) => Math.abs(l.top + l.height / 2 - (d.top + d.height / 2)) < 1);
    if (!row) problems.push(`${width}px footer divider is not centred on a link`);
  }
  if (got.scrolls) problems.push(`${width}px footer: the page scrolls sideways`);
  await page.close();
}

export function register(unit) {
  unit('checkSpacingGrid 375', () => checkSpacingGrid(375, 740));
  unit('checkSpacingGrid 1280', () => checkSpacingGrid(1280, 800));
  unit('checkHints', () => checkHints());
  unit('checkFooterTargets 320', () => checkFooterTargets(320, true));
  unit('checkFooterTargets 375', () => checkFooterTargets(375, true));
  unit('checkFooterTargets 1280', () => checkFooterTargets(1280, false));
}
