import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clickPreview, openEditor } from '../built-site.mjs';
import { BUILT_PAGE, DIST, PAGE_SOURCE, browser, problems, site } from './support/context.mjs';
import { onTestPage, ratioOf } from './support/shared.mjs';
import { shortfall } from './support/statement.mjs';

/** The Preview (the devices icon) draws a section's background from the page's text as saved, also when the built site does not have the section yet (it is rebuilt after a save), and with the colour the editor shows. */
async function checkPreviewSection() {
  const path = BUILT_PAGE;
  // (A text of its own: a site's page need not have a heading to put the section on.)
  const text =
    '---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n\n<div data-section="tertiary"></div>\n\n## Tinted\n\nTinted text.\n';
  const page = await browser.newPage({ viewport: { width: 390, height: 800 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`Preview section: ${e.message}`));
  await openEditor(page, site, { [path]: text });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror [data-section-color="tertiary"]', { timeout: 30_000 });
  await clickPreview(page);
  await page.waitForFunction(() => document.querySelector('[data-preview-page] iframe'), null, { timeout: 30_000 });
  const frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.waitForSelector('[data-editor="text"]', { timeout: 30_000 });
  const got = await frame.evaluate(() => {
    const section = document.querySelector('section.mo-is-tertiary');
    return section ? getComputedStyle(section).backgroundColor : null;
  });
  if (!got || got === 'rgba(0, 0, 0, 0)') problems.push(`Preview section: a section with a background has none in the Preview (${got})`);
  await page.close();
}

/** A filled card with a video, a headline and a text, in a section on Primary, Secondary or Tertiary (card colour: the same container colour, or none), reads 4.5:1 on its own surface in light and dark mode, on a phone and a computer: its text, the video's title and the play button (3:1) take the container's on-colour, not the section's. */
async function checkSectionCardContrast() {
  const lum = ([r, g, b]) => {
    const [R, G, B] = [r, g, b].map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  for (const scheme of ['light', 'dark']) {
    for (const [width, height] of [
      [375, 740],
      [1280, 900],
    ]) {
      const page = await browser.newPage({ viewport: { width, height }, colorScheme: scheme, locale: 'en-US' });
      page.on('pageerror', (e) => problems.push(`Section card contrast: ${e.message}`));
      if (!(await onTestPage(page, `Section card contrast (${scheme}, ${width})`))) {
        await page.close();
        continue;
      }
      const found = await page.evaluate(() => {
        const colors = ['primary', 'secondary', 'tertiary'];
        const html = colors
          .flatMap((section) => ['', ...colors].map((color) => `${section}/${color}`))
          .map((id) => {
            const [section, color] = id.split('/');
            const cardsColor = color ? ` mo-block-cards__${color}` : '';
            return `<div class="mo-text-section mo-is-${section}" data-case="${id}"><div class="mo-block-cards${cardsColor}"><div class="mo-card mo-is-filled mo-block-cards__card"><div class="mo-prose mo-block-cards__card-video"><a class="mo-block-video__facade" href="#"><svg viewBox="0 0 24 24" width="48" height="48" data-play><circle cx="12" cy="12" r="10" fill="currentColor"/></svg><span class="mo-block-video__facade-title">Title</span></a></div><span class="mo-block-cards__card-title">Headline</span><p class="mo-block-cards__card-text">Text</p></div></div></div>`;
          })
          .join('');
        document.body.insertAdjacentHTML('afterbegin', html);
        const rgba = (css) => {
          const c = document.createElement('canvas').getContext('2d');
          c.fillStyle = css;
          c.fillRect(0, 0, 1, 1);
          return [...c.getImageData(0, 0, 1, 1).data];
        };
        return [...document.querySelectorAll('[data-case]')].flatMap((box) => {
          const card = box.querySelector('.mo-card');
          const bg = rgba(getComputedStyle(card).backgroundColor);
          // The card's surface is opaque here (a container), or a veil of the section's on-colour: the section's colour under it.
          const under = rgba(getComputedStyle(box).backgroundColor);
          const surface = bg[3] === 255 ? bg : bg.slice(0, 3).map((v, i) => Math.round((v * bg[3] + under[i] * (255 - bg[3])) / 255));
          return [
            ['headline', '.mo-block-cards__card-title', 4.5],
            ['text', '.mo-block-cards__card-text', 4.5],
            ['video title', '.mo-block-video__facade-title', 4.5],
            ['play button', '.mo-block-video__facade svg', 3],
          ].map(([what, selector, need]) => ({
            id: box.dataset.case,
            what,
            need,
            fg: rgba(getComputedStyle(box.querySelector(selector)).color),
            surface,
          }));
        });
      });
      for (const f of found) {
        const got = ratio(f.fg, f.surface);
        if (got < f.need)
          problems.push(
            `Section card contrast (${f.id}, ${scheme}, ${width}): the ${f.what} of a filled card is ${got.toFixed(2)}:1 (needs ${f.need})`,
          );
      }
      await page.close();
    }
  }
}

/** A page whose H1 section has a background (a colour) has it start right under the navigation bar (gap 0 ±1px), on the site and in the Preview at 390 and 600; a page whose H1 section has none keeps its space under the bar, also with an image left in an old marker (a page's H1 has no image). */
async function checkH1SectionGap() {
  const path = BUILT_PAGE;
  const source = PAGE_SOURCE;
  const picture = '/images/uploads/2026/10/earth-from-space.webp';
  const variants = [
    { name: 'colour', marker: '<div data-section="tertiary"></div>\n\n', background: true },
    { name: 'image (ignored)', marker: `<div data-section="" data-picture="${picture}" data-alt="Earth"></div>\n\n`, background: false },
    { name: 'none', marker: '', background: false },
  ];
  const measure = () => {
    const bar = document.querySelector('header[data-header]')?.getBoundingClientRect();
    const h1 = document.querySelector('article h1');
    const section = document.querySelector('[data-editor="h1-section"]');
    const top = (section || h1)?.getBoundingClientRect().top;
    return bar && top !== undefined ? { gap: top - bar.bottom, section: Boolean(section) } : null;
  };
  const verify = (label, m, background) => {
    if (!m) return problems.push(`${label}: the page has no navigation bar or heading`);
    if (background && !m.section) return problems.push(`${label}: there is no H1 section`);
    if (background && Math.abs(m.gap) > 1)
      problems.push(`${label}: the H1 section's background is ${Math.round(m.gap)}px below the navigation bar, not 0`);
    if (!background && m.gap < 16)
      problems.push(`${label}: a heading without a background has lost its space under the bar (${Math.round(m.gap)}px)`);
  };
  for (const { name, marker, background } of variants) {
    const text = source.replace(/(\n)(# [^\n]+)/, `$1${marker}$2`);
    const page = await browser.newPage({ viewport: { width: 1700, height: 1000 }, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`H1 section gap: ${e.message}`));
    await openEditor(page, site, { [path]: text });
    await page.goto(`${site}/editor/#${path}`);
    await clickPreview(page);
    await page.waitForFunction(() => document.querySelector('[data-preview-page] iframe'), null, { timeout: 30_000 });
    const slider = page.locator('[data-preview-page] [role="slider"]').first();
    const width = async () => Number(await slider.getAttribute('aria-valuenow'));
    for (const w of [390, 600]) {
      await slider.focus();
      await page.keyboard.press('Home');
      while ((await width()) < w) await page.keyboard.press('ArrowRight');
      while ((await width()) > w) await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(600);
      const frame = page.frames().find((f) => f !== page.mainFrame());
      await frame.waitForSelector('article h1', { timeout: 30_000 });
      if (background) await frame.waitForSelector('[data-editor="h1-section"]', { timeout: 30_000 });
      verify(`${w}px Preview, H1 section ${name}`, await frame.evaluate(measure), background);
    }
    await page.close();
  }
}

/** A full-width section has the whole width only as its background: on the built site and in the Preview, its content has the same left edge as the page's text, inside the centred container, at 840, 1200 and 1600, and nothing overflows sideways at 375. */
async function checkFullSection() {
  const path = BUILT_PAGE;
  const text = PAGE_SOURCE.replace(/(\n)(## [^\n]+)/, '$1<div data-section="tertiary" data-width="full"></div>\n\n$2');
  const measure = () => {
    const box = (e) => (e ? e.getBoundingClientRect() : null);
    const section = document.querySelector('section.mo-is-full');
    const column = box(document.querySelector('[data-editor="text"]'));
    const [h2, p] = [section?.querySelector('h2'), section?.querySelector('p')].map(box);
    const intro = box(document.querySelector('[data-editor="text"] > p'));
    return { width: innerWidth, scroll: document.documentElement.scrollWidth, section: box(section), column, h2, p, intro };
  };
  const verify = (label, m) => {
    if (!m.section) return problems.push(`${label}: there is no full-width section`);
    if (m.scroll > m.width) problems.push(`${label}: the page scrolls sideways (${m.scroll} > ${m.width})`);
    if (Math.abs(m.section.left) > 0.5 || Math.abs(m.section.right - m.width) > 0.5)
      problems.push(`${label}: the background does not reach both edges (${m.section.left}-${m.section.right})`);
    for (const [name, b] of [
      ['heading', m.h2],
      ['text', m.p],
    ])
      if (Math.abs(b.left - m.column.left) > 0.5)
        problems.push(`${label}: the section's ${name} starts at ${b.left}, not at the page text's ${m.column.left}`);
    // The column is centred in the window, and a section's lines are shorter than the column (66ch) while the column is wider.
    if (Math.abs(m.column.left - (m.width - m.column.right)) > 1) problems.push(`${label}: the page column is not centred`);
    if (m.width > 600 && m.p.width >= m.column.width - 1)
      problems.push(`${label}: the section's text runs the whole column (${Math.round(m.p.width)}px)`);
  };
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`Full section: ${e.message}`));
  await openEditor(page, site, { [path]: text });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror [data-section-color="tertiary"]', { timeout: 30_000 });
  await clickPreview(page);
  await page.waitForFunction(() => document.querySelector('[data-preview-page] iframe'), null, { timeout: 30_000 });
  const slider = page.locator('[data-preview-page] [role="slider"]').first();
  const width = async () => Number(await slider.getAttribute('aria-valuenow'));
  for (const w of [840, 1200, 1600]) {
    await slider.focus();
    await page.keyboard.press('Home');
    while ((await width()) < w) await page.keyboard.press('Shift+ArrowRight');
    while ((await width()) > w) await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    const frame = page.frames().find((f) => f !== page.mainFrame());
    await frame.waitForSelector('section.mo-is-full', { timeout: 30_000 });
    verify(`${w}px Preview full section`, await frame.evaluate(measure));
  }
  await page.close();
  // On a phone the Preview is as wide as the screen: the section's background is the window, and nothing scrolls sideways.
  const phone = await browser.newPage({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  await openEditor(phone, site, { [path]: text });
  await phone.goto(`${site}/editor/#${path}`);
  await phone.waitForSelector('.ProseMirror [data-section-color="tertiary"]', { timeout: 30_000 });
  await clickPreview(phone);
  await phone.waitForFunction(() => document.querySelector('[data-preview-page] iframe'), null, { timeout: 30_000 });
  const small = phone.frames().find((f) => f !== phone.mainFrame());
  await small.waitForSelector('section.mo-is-full', { timeout: 30_000 });
  verify('375px Preview full section', await small.evaluate(measure));
  await phone.close();
}

/** A label above a heading (`<p class="mo-type-label-medium">`, lib/eyebrow.mjs) on the demo's front page, About and App store pages, at 375, 768 and 1280 px, light and dark: the label sits 8 px above its heading
 * (0.5rem, the same everywhere), so the space of the section the heading belongs to never comes between them (the front page puts the label in the section after it, Home.astro). */
async function checkLabelGap() {
  const labelGap = 8;
  // Only the demo has these pages and labels: a site without them (the starter) has nothing to measure.
  const probe = await browser.newPage({ locale: 'en-US' });
  const response = await probe.goto(new URL('/about/', site).href).catch(() => null);
  const hasLabels = !!response && response.status() < 400 && (await probe.locator('main .mo-type-label-medium').count()) > 0;
  await probe.close();
  if (!hasLabels) return;
  for (const width of [375, 768, 1280])
    for (const scheme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme, locale: 'en-US' });
      for (const path of ['/', '/about/', '/app-store/']) {
        const label = `${width}px ${scheme} ${path}`;
        const response = await page.goto(new URL(path, site).href).catch(() => null);
        if (!response || response.status() >= 400) {
          problems.push(`${label}: the page did not open`);
          continue;
        }
        const gaps = await page.evaluate(() => {
          const headings = [...document.querySelectorAll('h1, h2, h3')];
          return [...document.querySelectorAll('main .mo-type-label-medium')].map((el) => {
            const heading = headings.find((h) => el.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING);
            return {
              text: el.textContent,
              gap: heading ? Math.round(heading.getBoundingClientRect().top - el.getBoundingClientRect().bottom) : null,
            };
          });
        });
        if (!gaps.length) problems.push(`${label}: no label found to measure`);
        for (const g of gaps)
          if (g.gap !== labelGap) problems.push(`${label}: the label "${g.text}" is ${g.gap}px above its heading, should be ${labelGap}px`);
      }
      await page.close();
    }
}

/** A section on an image (no colour): the text, the placeholder, the icons and the arrow of a list row typed in place are the theme's colour for text on an image, as on the site, and read on the inverse-surface panel behind the text (4.5:1 for text, 3:1 for an icon), on a dark and on a bright photo, light and dark mode, on a phone and a computer. The contrast is taken against the scrim as drawn (the shade over the photo's average colour at the height of the part), so a part drawn in the page's own colours instead (dark on the dark scrim) fails. */
async function checkSectionOnImage() {
  const path = BUILT_PAGE;
  const list =
    '<div data-block="list" data-props="{&quot;items&quot;:[{&quot;icon&quot;:&quot;clock&quot;,&quot;title&quot;:&quot;List heading&quot;,&quot;text&quot;:&quot;Hej&quot;,&quot;href&quot;:&quot;/about/&quot;}]}"></div>';
  const photos = { dark: '/images/uploads/2026/10/moon.webp', bright: '/images/uploads/2026/10/earth-from-space.webp' };
  for (const [photo, image] of Object.entries(photos))
    for (const scheme of ['light', 'dark'])
      for (const width of [375, 1280]) {
        const label = `${width}px ${scheme} section on a ${photo} image`;
        const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme, locale: 'en-US' });
        page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
        // The photos are the demo's (the package carries them): a site that does not have them gets them here.
        await page.route(`**${image}`, (route) => {
          const own = join(DIST, image);
          const file = existsSync(own) ? own : fileURLToPath(new URL(`../../demo/public${image}`, import.meta.url));
          return route.fulfill({ body: readFileSync(file), contentType: 'image/webp' });
        });
        const text = `---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n\n<div data-section="" data-picture="${image}" data-alt="A photo"></div>\n\n## Her kommer indhold\n\nBody text.\n\n${list}\n\n## Plain\n\nPlain.\n`;
        await openEditor(page, site, { [path]: text });
        await page.goto(`${site}/editor/#${path}`);
        await page.waitForSelector('.ProseMirror > [data-section-picture]', { timeout: 30_000 });
        await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
        // The list row is the active one: the row typed in place, with its icon and arrow.
        await page
          // (At the field's left end: a block pointed at shows its row over its top right.)
          .click('.mo-site-block-inline [data-field="title"]', { position: { x: 8, y: 8 } })
          .catch(() => problems.push(`${label}: the list row cannot be typed in place`));
        await page.mouse.move(0, 0);
        await page.waitForFunction((src) => document.querySelector('.mo-editor-section-picture img')?.complete, image);
        const got = await page.evaluate(`(() => { ${ratioOf}
          const strip = document.querySelector('.mo-editor-section-picture');
          // The text sits on a panel of the inverse-surface role at full strength (editor.css, as text-section.css), whatever the photo.
          const back = pixel(getComputedStyle(strip, '::after').backgroundColor, 'rgb(0,0,0)');
          const lumOf = lum;
          const contrast = (el, css) => {
            const front = pixel(css, 'rgb(' + back + ')');
            return (Math.max(lumOf(front), lumOf(back)) + 0.05) / (Math.min(lumOf(front), lumOf(back)) + 0.05);
          };
          const row = document.querySelector('.mo-editor-inline-list-row-active');
          const parts = {
            heading: document.querySelector('.ProseMirror > h2'),
            body: document.querySelector('.ProseMirror > h2 + p'),
            rowTitle: row.querySelector('[data-field="title"]'),
            rowText: row.querySelector('[data-field="text"]'),
            icon: row.querySelector('.mo-editor-inline-list-slot'),
            chevron: row.querySelector('.mo-list__item-trailing'),
          };
          const out = {};
          for (const [name, el] of Object.entries(parts)) if (el) out[name] = contrast(el, getComputedStyle(el).color);
          const ph = row.querySelector('[data-field="title"]');
          out.placeholder = contrast(ph, getComputedStyle(ph, '::placeholder').color);
          out.outline = contrast(row, getComputedStyle(row).outlineColor);
          return out; })()`);
        for (const [part, ratio] of Object.entries(got)) {
          const min = ['icon', 'chevron', 'outline'].includes(part) ? 3 : 4.5;
          if (ratio < min) {
            const message = `${label}: the ${part} has contrast ${ratio.toFixed(2)}:1 on the panel, below ${min}`;
            if (part === 'placeholder') shortfall('1.4.3', 'placeholder', message);
            else if (part === 'outline') shortfall('1.4.11', 'section-edges', message);
            else problems.push(message);
          }
        }
        await page.close();
      }
}

/** A section of the whole width (`width` full) reaches the text field's left, right and top edges; one of the text's width stays inset. */
async function checkFullWidthSection() {
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 740 }, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${width}px full-width section: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate(() => (location.hash = '#new/pages'));
    await page.waitForSelector('.ProseMirror');
    await page.click('.ProseMirror');
    await page.keyboard.type('## Tester');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Some text.');
    const measure = (full) =>
      page.evaluate((full) => {
        const pm = document.querySelector('.ProseMirror');
        const field = pm.closest('.mo-editor-text').getBoundingClientRect();
        const border = (n) => parseFloat(getComputedStyle(pm.closest('.mo-editor-text'))[n]);
        const parts = [...pm.children].filter((n) => !n.classList.contains('mo-editor-section-picture'));
        parts.forEach((el, i) => {
          el.setAttribute('data-section-color', 'primary');
          el.setAttribute('data-section-box', parts.length === 1 ? 'only' : i === 0 ? 'start' : i === parts.length - 1 ? 'end' : 'middle');
          if (full) el.setAttribute('data-section-width', 'full');
          else el.removeAttribute('data-section-width');
        });
        const r = parts[0].getBoundingClientRect();
        const radius = getComputedStyle(parts[0]).borderStartStartRadius;
        return {
          left: r.left - field.left - border('borderLeftWidth'),
          right: field.right - border('borderRightWidth') - r.right,
          top: r.top - field.top,
          radius,
        };
      }, full);
    const inset = await measure(false);
    if (process.env.SHOTS_FULL) await page.locator('.mo-editor-text').screenshot({ path: `${process.env.SHOTS_FULL}-inset-${width}.png` });
    const full = await measure(true);
    if (process.env.SHOTS_FULL) await page.locator('.mo-editor-text').screenshot({ path: `${process.env.SHOTS_FULL}-${width}.png` });
    if (inset.left < 1 || inset.radius === '0px')
      problems.push(`${width}px full-width section: the section of the text's width should stay inset with corners`);
    if (Math.abs(full.left) > 0.5 || Math.abs(full.right) > 0.5 || full.top > 0.5 || full.radius !== '0px')
      problems.push(
        `${width}px full-width section: left ${full.left}, right ${full.right}, top ${full.top}, corner ${full.radius}, should all be 0 against the text field's edges`,
      );
    await page.close();
  }
}

/** The dotted line at the start of a text section (never the first one) runs edge to edge of the text field, while the text keeps its page
 * margin; a coloured section's box is unchanged (inset, with corners). At 375 and 1280 px. */
async function checkSectionLine() {
  for (const width of [375, 1280]) {
    const label = `${width}px section line`;
    const page = await browser.newPage({ viewport: { width, height: 740 }, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    const path = BUILT_PAGE;
    const text = `---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n\n## Alpha\n\nAlpha body.\n\n## Beta\n\nBeta body.\n`;
    await openEditor(page, site, { [path]: text });
    await page.goto(`${site}/editor/#${path}`);
    await page.waitForSelector('.ProseMirror [data-section-part="start"]', { timeout: 30_000 });
    const got = await page.evaluate(() => {
      const pm = document.querySelector('.ProseMirror');
      const field = pm.closest('.mo-editor-text');
      const f = field.getBoundingClientRect();
      const border = (n) => parseFloat(getComputedStyle(field)[n]);
      const start = pm.querySelector('[data-section-part="start"]');
      const line = start.getBoundingClientRect();
      const style = getComputedStyle(start);
      const textLeft = (el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect().left;
      };
      const intro = pm.querySelector('p');
      const out = {
        style: style.borderBlockStartStyle,
        left: line.left - f.left - border('borderLeftWidth'),
        right: f.right - border('borderRightWidth') - line.right,
        shift: textLeft(start) - textLeft(intro),
        first: start === pm.firstElementChild,
      };
      // With a section colour the box is as before: inset, with corners.
      for (const el of [...pm.children]) {
        el.setAttribute('data-section-color', 'primary');
        el.setAttribute('data-section-box', 'only');
      }
      const box = start.getBoundingClientRect();
      out.boxLeft = box.left - f.left - border('borderLeftWidth');
      out.radius = getComputedStyle(start).borderStartStartRadius;
      return out;
    });
    if (got.first) problems.push(`${label}: the test text's first part is the section`);
    if (got.style !== 'dotted') problems.push(`${label}: the section's line is "${got.style}", not dotted`);
    if (Math.abs(got.left) > 0.5 || Math.abs(got.right) > 0.5)
      problems.push(`${label}: the line stands ${got.left} from the left and ${got.right} from the right of the text field, not 0`);
    if (Math.abs(got.shift) > 0.5)
      problems.push(`${label}: the heading is ${got.shift} from the text's left edge, it keeps the page margin`);
    if (got.boxLeft < 1 || got.radius === '0px')
      problems.push(`${label}: a coloured section's box changed (left ${got.boxLeft}, corner ${got.radius})`);
    await page.close();
  }
}

/** A coloured section's background runs down to the next section's divider, or to the end of the text when it is the last (the space below its text is inside the colour, not a white band), in the editor, and in the Preview where the panel has no margin below (375 px with touch, and a computer). */
async function checkSectionBackground(width, touch) {
  const path = BUILT_PAGE;
  const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  const label = `${width}px section background`;
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  for (const last of [false, true]) {
    const body = `# T\n\nIntro.\n\n<div data-section="primary"></div>\n\n## Blue\n\nBlue text.\n${last ? '' : '\n## Plain\n\nPlain text.\n'}`;
    await openEditor(page, site, { [path]: `---\ntitle: "T"\ndescription: "d"\n---\n\n${body}` });
    await page.goto(`${site}/editor/#${path}`);
    await page.waitForSelector('.ProseMirror [data-section-color="primary"]', { timeout: 30_000 });
    const got = await page.evaluate(() => {
      const pm = document.querySelector('.ProseMirror');
      const parts = [...pm.children].filter((c) => !c.classList.contains('mo-editor-section-picture'));
      const blue = parts.filter((c) => c.dataset.sectionColor === 'primary');
      const next = parts[parts.indexOf(blue.at(-1)) + 1];
      const bottom = blue.at(-1).getBoundingClientRect().bottom;
      return { gap: next ? next.getBoundingClientRect().top - bottom : pm.getBoundingClientRect().bottom - bottom, hasNext: Boolean(next) };
    });
    if (Math.abs(got.gap) > 0.5)
      problems.push(
        `${label}: the ${last ? 'last ' : ''}coloured section ends ${got.gap}px ${last ? 'above the end of the text' : 'above the next section'} (should be 0, no white band)`,
      );
  }
  await openEditor(page, site, {
    [path]: `---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n\n<div data-section="primary"></div>\n\n## Blue\n\nBlue text.\n\n## Plain\n\nPlain text.\n`,
  });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror [data-section-color="primary"]', { timeout: 30_000 });
  await clickPreview(page);
  await page.waitForFunction(() => document.querySelector('[data-preview-page] iframe'), null, { timeout: 30_000 });
  const frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.waitForSelector('section.mo-is-primary', { timeout: 30_000 });
  const panel = await frame.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('section.mo-is-primary'));
    return { margin: parseFloat(cs.marginBottom), top: parseFloat(cs.paddingTop), bottom: parseFloat(cs.paddingBottom) };
  });
  if (panel.margin !== 0 || panel.bottom <= panel.top)
    problems.push(
      `${label}: in the Preview the panel has ${panel.margin}px margin and ${panel.bottom}px padding below (the space below belongs inside the colour: no margin, more padding than above)`,
    );
  await page.close();
}

/** A tap below the last section, or between two sections, puts the cursor on a free line there (an empty paragraph that is not saved unless typed in), and typing adds text after the section, not in a heading (375 px with touch, and a computer). */
async function checkTapBelowSection(width, touch) {
  const label = `${width}px tap below a section`;
  const page = await browser.newPage({ viewport: { width, height: 740 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  for (const line of ['# Title', '## One', 'First', '## Two', 'Second']) {
    await page.keyboard.type(line);
    await page.keyboard.press('Enter');
  }
  await page.keyboard.press('Backspace');
  const parts = () =>
    page.evaluate(() =>
      [...document.querySelector('.ProseMirror').children]
        .filter((c) => !c.classList.contains('mo-editor-section-picture'))
        .map((c) => ({ tag: c.tagName, text: c.textContent, ...c.getBoundingClientRect().toJSON() })),
    );
  const tapAt = async (y) => {
    const pm = await page.evaluate(() => document.querySelector('.ProseMirror').getBoundingClientRect().toJSON());
    const x = pm.left + pm.width / 2;
    if (touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
  };
  const lines = async () => (await parts()).map((p) => `${p.tag}:${p.text}`).join(' | ');
  await page.evaluate(() => document.querySelector('.ProseMirror').scrollIntoView({ block: 'center' }));
  // Between the sections: the white between "First" and the heading "Two".
  let all = await parts();
  const first = all.findIndex((p) => p.text === 'First');
  await tapAt((all[first].bottom + all[first + 1].top) / 2);
  await page.keyboard.type('Between');
  let got = await lines();
  if (got !== 'H1:Title | H2:One | P:First | P:Between | H2:Two | P:Second')
    problems.push(`${label}: typing between two sections gave ${got}`);
  // Below the last section.
  all = await parts();
  await tapAt(all.at(-1).bottom + 8);
  await page.keyboard.type('After');
  got = await lines();
  if (got !== 'H1:Title | H2:One | P:First | P:Between | H2:Two | P:Second | P:After')
    problems.push(`${label}: typing below the last section gave ${got}`);
  await page.close();
}

/** The editor draws the lead as the site does (editor.css, `data-lead` from sectionFrame.ts): the first paragraph after the H1 has the lead's size, line height, weight and tracking (the site's `mo-type-lead`, read from a probe), muted and at most 52ch on a page; the second paragraph does not; a page with a column beside its text has no lead. At 375 and 1280. */
async function checkEditorLead() {
  const path = BUILT_PAGE;
  const text = (template) =>
    `---\ntitle: "T"\ndescription: "d"\n${template ? `template: ${template}\n` : ''}---\n\n# T\n\nThe lead text of the page.\n\nThe second paragraph.\n\n## Alpha\n\nAlpha body.\n`;
  const read = `(() => {
    const pm = document.querySelector('.ProseMirror');
    const probe = document.createElement('p');
    probe.className = 'mo-type-lead';
    probe.textContent = 'Probe';
    document.body.append(probe);
    const pick = (e) => { const c = getComputedStyle(e); return { size: c.fontSize, line: c.lineHeight, weight: c.fontWeight, tracking: c.letterSpacing }; };
    const ps = [...pm.children].filter((e) => e.tagName === 'P');
    const out = { probe: pick(probe), marked: ps.map((e) => e.hasAttribute('data-lead')), lead: pick(ps[0]), second: pick(ps[1]), muted: getComputedStyle(ps[0]).color, measure: getComputedStyle(ps[0]).maxInlineSize };
    probe.remove();
    return out; })()`;
  for (const width of [375, 1280]) {
    const label = `editor lead ${width}px`;
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: 'light', locale: 'en-US', hasTouch: width < 600 });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await openEditor(page, site, { [path]: text('') });
    await page.goto(`${site}/editor/#${path}`);
    await page.waitForSelector('.ProseMirror > p[data-lead]', { timeout: 30_000 });
    const got = await page.evaluate(read);
    if (JSON.stringify(got.marked) !== '[true,false,false]')
      problems.push(`${label}: lead marks ${JSON.stringify(got.marked)}, wanted only the first paragraph`);
    if (JSON.stringify(got.lead) !== JSON.stringify(got.probe))
      problems.push(`${label}: the lead is ${JSON.stringify(got.lead)}, the site's is ${JSON.stringify(got.probe)}`);
    if (JSON.stringify(got.second) === JSON.stringify(got.probe)) problems.push(`${label}: the second paragraph is drawn as a lead`);
    if (got.measure === 'none') problems.push(`${label}: a page's lead has no 52ch measure`);
    await page.close();
  }
}

/** Focus is shown on what has it, not on the whole text: with the cursor in text, the text field has no outline and only the section the cursor is in (the page's top part before the first H2, or an H2 section) shows its focus by horizontal dotted lines only (data-section-focus, sectionFrame.ts: its own line above it and a line under it, no sides), 3:1 on every section colour; the first section has no line above it; a block is no part of a section; a block in focus shows its own outline instead, and with the cursor gone there is no frame. At 375, 768 and 1280, light and dark. */
async function checkFocusFrame() {
  const path = BUILT_PAGE;
  const list =
    '<div data-block="list" data-props="{&quot;items&quot;:[{&quot;icon&quot;:&quot;clock&quot;,&quot;title&quot;:&quot;List heading&quot;,&quot;text&quot;:&quot;Hej&quot;,&quot;href&quot;:&quot;/about/&quot;}]}"></div>';
  const text = `---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nTop part text.\n\n<div data-section="tertiary"></div>\n\n## Alpha\n\nAlpha body.\n\n${list}\n\n## Beta\n\nBeta body.\n`;
  // The frame of each top-level part: whether its ::after is drawn, and its colour's contrast on the part's own background.
  const read = (colors) => `(() => { ${ratioOf}
    const pm = document.querySelector('.ProseMirror');
    const parts = [...pm.children].filter((e) => !e.classList.contains('mo-editor-section-picture'));
    const first = parts.findIndex((e) => e.textContent.includes('Alpha'));
    const last = parts.findIndex((e) => e.textContent.includes('Beta')) - 1;
    const rows = parts.map((e, i) => ({ inAlpha: i >= first && i <= last, text: e.textContent.trim().slice(0, 12), focus: e.dataset.sectionFocus ?? null, drawn: getComputedStyle(e, '::after').content !== 'none' && getComputedStyle(e, '::after').content !== 'normal', isBlock: e.matches('.mo-site-block') || !!e.querySelector('.mo-site-block-inline'), bottom: e.hasAttribute('data-section-bottom'), below: e.hasAttribute('data-section-focus-below'), part: e.dataset.sectionPart ?? null, side: getComputedStyle(e, '::after').borderInlineStartWidth, afterLine: getComputedStyle(e, '::after').borderBlockEndStyle, afterWidth: getComputedStyle(e, '::after').borderBlockEndWidth, topStyle: getComputedStyle(e, '::before').borderBlockStartStyle, topWidth: getComputedStyle(e, '::before').borderBlockStartWidth, topColor: getComputedStyle(e, '::before').borderBlockStartColor, topSpan: Math.round(parseFloat(getComputedStyle(e, '::before').width)), fieldWidth: Math.round(e.closest('.mo-editor-text')?.getBoundingClientRect().width ?? 0) }));
    const out = { editorOutline: getComputedStyle(pm).outlineStyle, focused: pm.matches(':focus-visible'), rows, contrast: {} };
    if (${colors}) {
      const alpha = parts[first];
      const block = parts.find((e) => e.matches('.mo-site-block-inline') || e.querySelector('.mo-site-block-inline'));
      const blockEl = block?.matches('.mo-site-block-inline') ? block : block?.querySelector('.mo-site-block-inline');
      for (const color of ['surface', 'primary', 'secondary', 'tertiary']) {
        for (const e of parts.slice(first, last + 1)) { e.setAttribute('data-section-color', color); e.setAttribute('data-section-box', 'only'); }
        out.contrast[color] = {
          frame: pm.matches(':focus-visible') ? ratio(getComputedStyle(alpha, '::before').borderBlockStartColor, alpha) : null,
          block: blockEl ? ratio(getComputedStyle(blockEl).outlineColor, block, 1, blockEl) : null,
          blockBorder: blockEl ? getComputedStyle(blockEl).outlineStyle : null,
        };
      }
    }
    return out; })()`;
  for (const scheme of ['light', 'dark'])
    for (const width of [375, 768, 1280]) {
      const label = `focus frame ${width}px ${scheme}`;
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme, locale: 'en-US', hasTouch: width < 600 });
      page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
      await openEditor(page, site, { [path]: text });
      await page.goto(`${site}/editor/#${path}`);
      await page.waitForSelector('.ProseMirror [data-section-part="start"]', { timeout: 30_000 });
      await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
      const tap = (selector, position) =>
        width < 600 ? page.locator(selector).first().tap({ position }) : page.locator(selector).first().click({ position });
      // Cursor in a section's text: the whole text has no outline and only that section has the frame.
      await tap('.ProseMirror > p:has-text("Alpha body")', { x: 6, y: 6 });
      // Wait for the tapped section itself: focusing the editor first puts the cursor where it was (the top text), which is marked too.
      await page
        .waitForFunction(
          () =>
            document.querySelector('.ProseMirror').matches(':focus-visible') &&
            [...document.querySelectorAll('.ProseMirror > p[data-section-focus]')].some((p) => p.textContent.includes('Alpha body')),
          null,
          { timeout: 10_000 },
        )
        .catch(() => problems.push(`${label}: the section under the cursor has no frame`));
      let got = await page.evaluate(read(true));
      if (got.editorOutline !== 'none')
        problems.push(`${label}: the text field has an outline (${got.editorOutline}) with the cursor in text`);
      // Alpha's own line above it is in the focus colour and 2px dotted, the next section's line (Beta, right below Alpha) takes the colour as the line
      // under it, and nothing is drawn at the sides or below Alpha's last text (the next section's line is there); the block between is no part of it.
      for (const r of got.rows) {
        const isBlock = r.isBlock;
        if (r.inAlpha && !isBlock && !r.focus) problems.push(`${label}: "${r.text}" is in the focused section but is not marked`);
        if (r.inAlpha && isBlock && r.focus) problems.push(`${label}: the block "${r.text}" is marked as part of a section`);
        if (!r.inAlpha && r.focus) problems.push(`${label}: "${r.text}" is outside the focused section but is marked`);
        if (r.drawn && r.side !== '0px') problems.push(`${label}: "${r.text}" has a line at its sides (${r.side})`);
        if (r.bottom) problems.push(`${label}: "${r.text}" draws a bottom line, though the next section's line is below it`);
        if (r.text.startsWith('Alpha') && r.part === 'start' && !(r.topStyle === 'dotted' && r.topWidth === '2px'))
          problems.push(`${label}: Alpha's line above is not 2px dotted (${r.topStyle} ${r.topWidth})`);
        if (r.part === 'start' && r.topSpan < r.fieldWidth - 2)
          problems.push(`${label}: the line above "${r.text}" is ${r.topSpan}px wide, not the text field's full width (${r.fieldWidth}px)`);
      }
      const alphaRow = got.rows.find((r) => r.text === 'Alpha');
      const betaRow = got.rows.find((r) => r.text === 'Beta');
      if (!alphaRow?.part) problems.push(`${label}: the second section has no line above it`);
      if (!betaRow?.below) problems.push(`${label}: the line under the focused section is not marked`);
      if (alphaRow && betaRow && alphaRow.topColor !== betaRow.topColor)
        problems.push(
          `${label}: the line under the section (${betaRow.topColor}) is not the colour of the line above it (${alphaRow.topColor})`,
        );
      for (const [color, c] of Object.entries(got.contrast))
        if (c.frame < 3) problems.push(`${label}: the frame on a ${color} section is ${c.frame?.toFixed(2)}:1, under 3:1`);
      // Cursor in the page's top text: the top part has the frame, the sections do not.
      await tap('.ProseMirror > p:has-text("Top part")', { x: 6, y: 6 });
      await page
        .waitForFunction(() => document.querySelector('.ProseMirror > p[data-section-focus]')?.textContent.includes('Top part'), null, {
          timeout: 10_000,
        })
        .catch(() => problems.push(`${label}: the page's top text has no frame with the cursor in it`));
      got = await page.evaluate(read(false));
      for (const r of got.rows) {
        const top = r.text.startsWith('T') && (r.text === 'T' || r.text.startsWith('Top'));
        if (top !== !!r.focus)
          problems.push(`${label}: with the cursor in the top text, "${r.text}" ${r.focus ? 'has' : 'lacks'} the frame`);
        if (r.part && !r.text.startsWith('Alpha') && !r.text.startsWith('Beta'))
          problems.push(`${label}: "${r.text}" has a section line above it`);
      }
      if (got.rows.some((r) => r.text === 'T' && r.part)) problems.push(`${label}: the first section has a line above it`);
      // The last section has nothing below it: a 2px dotted line under its last text, none at the sides.
      await tap('.ProseMirror > p:has-text("Beta body")', { x: 6, y: 6 });
      await page
        .waitForFunction(() => document.querySelector('.ProseMirror > p[data-section-bottom]')?.textContent.includes('Beta body'), null, {
          timeout: 10_000,
        })
        .catch(() => problems.push(`${label}: the last section has no line under it`));
      got = await page.evaluate(read(false));
      const bottomRow = got.rows.find((r) => r.text.startsWith('Beta body'));
      if (!bottomRow?.drawn || bottomRow.afterLine !== 'dotted' || bottomRow.afterWidth !== '2px' || bottomRow.side !== '0px')
        problems.push(`${label}: the line under the last section is not 2px dotted without sides (${JSON.stringify(bottomRow)})`);
      // A block in focus: its own outline shows it, no section frame, and the line stands 3:1 on every section colour.
      await tap('.mo-site-block-inline [data-field="title"]', { x: 8, y: 8 });
      await page
        .waitForFunction(
          () =>
            !document.querySelector('.ProseMirror').matches(':focus-visible') &&
            document.querySelector('.mo-site-block-inline:focus-within'),
          null,
          { timeout: 10_000 },
        )
        .catch(() => problems.push(`${label}: the block did not get the focus`));
      got = await page.evaluate(read(true));
      if (got.rows.some((r) => r.drawn)) problems.push(`${label}: a section frame is drawn while a block has the focus`);
      for (const [color, c] of Object.entries(got.contrast)) {
        if (c.blockBorder !== 'dotted') problems.push(`${label}: the focused block has no dotted outline on a ${color} section`);
        else if (c.block < 3)
          problems.push(`${label}: the focused block's outline on a ${color} section is ${c.block?.toFixed(2)}:1, under 3:1`);
      }
      // The cursor leaves: no focus, no frame.
      await page.evaluate(() => document.activeElement?.blur());
      await page.waitForFunction(() => !document.querySelector('.ProseMirror').matches(':focus-within'), null, { timeout: 10_000 });
      got = await page.evaluate(read(false));
      if (got.rows.some((r) => r.drawn)) problems.push(`${label}: a frame is drawn with the cursor gone`);
      await page.close();
    }
}

export function register(unit) {
  unit('checkSectionOnImage', () => checkSectionOnImage());
  unit('checkLabelGap', () => checkLabelGap());
  unit('checkFullWidthSection', () => checkFullWidthSection());
  unit('checkSectionLine', () => checkSectionLine());
  unit('checkSectionBackground 375', () => checkSectionBackground(375, true));
  unit('checkSectionBackground 1280', () => checkSectionBackground(1280, false));
  unit('checkTapBelowSection 375', () => checkTapBelowSection(375, true));
  unit('checkTapBelowSection 1280', () => checkTapBelowSection(1280, false));
  unit('checkPreviewSection', () => checkPreviewSection());
  unit('checkFullSection', () => checkFullSection());
  unit('checkH1SectionGap', () => checkH1SectionGap());
  unit('checkFocusFrame', () => checkFocusFrame());
  unit('checkEditorLead', () => checkEditorLead());
  unit('checkSectionCardContrast', () => checkSectionCardContrast());
}
