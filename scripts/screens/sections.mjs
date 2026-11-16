import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clickPreview, openEditor } from '../built-site.mjs';
import { BUILT_PAGE, DIST, PAGE_SOURCE, browser, problems, site } from './support/context.mjs';
import { onTestPage, ratioOf } from './support/shared.mjs';

/** The Preview (the binoculars) draws a section's background from the page's text as saved, also when the built site does not have the section yet (it is rebuilt after a save), and with the colour the editor shows. */
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
    const section = document.querySelector('section.text-section-tertiary');
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
            const cardsColor = color ? ` block-cards-${color}` : '';
            return `<div class="text-section text-section-${section}" data-case="${id}"><div class="block-cards${cardsColor}"><div class="card card-filled block-card"><div class="prose block-card-video"><a class="video-facade" href="#"><svg viewBox="0 0 24 24" width="48" height="48" data-play><circle cx="12" cy="12" r="10" fill="currentColor"/></svg><span class="video-facade-title">Title</span></a></div><span class="block-card-title">Headline</span><p class="block-card-text">Text</p></div></div></div>`;
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
          const card = box.querySelector('.card');
          const bg = rgba(getComputedStyle(card).backgroundColor);
          // The card's surface is opaque here (a container), or a veil of the section's on-colour: the section's colour under it.
          const under = rgba(getComputedStyle(box).backgroundColor);
          const surface = bg[3] === 255 ? bg : bg.slice(0, 3).map((v, i) => Math.round((v * bg[3] + under[i] * (255 - bg[3])) / 255));
          return [
            ['headline', '.block-card-title', 4.5],
            ['text', '.block-card-text', 4.5],
            ['video title', '.video-facade-title', 4.5],
            ['play button', '.video-facade svg', 3],
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
    const section = document.querySelector('section.text-section-full');
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
    await frame.waitForSelector('section.text-section-full', { timeout: 30_000 });
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
  await small.waitForSelector('section.text-section-full', { timeout: 30_000 });
  verify('375px Preview full section', await small.evaluate(measure));
  await phone.close();
}

/** A section on an image (no colour): the text, the placeholder, the icons and the arrow of a list row typed in place are the theme's colour for text on an image, as on the site, and read on the image's scrim (4.5:1 for text, 3:1 for an icon), on a dark and on a bright photo, light and dark mode, on a phone and a computer. The contrast is taken against the scrim as drawn (the shade over the photo's average colour at the height of the part), so a part drawn in the page's own colours instead (dark on the dark scrim) fails. */
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
          .click('.site-block-inline [data-field="title"]', { position: { x: 8, y: 8 } })
          .catch(() => problems.push(`${label}: the list row cannot be typed in place`));
        await page.mouse.move(0, 0);
        await page.waitForFunction((src) => document.querySelector('.editor-section-picture img')?.complete, image);
        const got = await page.evaluate(`(() => { ${ratioOf}
          const strip = document.querySelector('.editor-section-picture');
          const img = strip.querySelector('img');
          const c = document.createElement('canvas'); c.width = c.height = 1;
          const g = c.getContext('2d'); g.drawImage(img, 0, 0, 1, 1);
          const photo = [...g.getImageData(0, 0, 1, 1).data.slice(0, 3)];
          const shade = pixel(getComputedStyle(strip).backgroundColor, 'rgb(0,0,0)');
          const box = strip.getBoundingClientRect();
          const lumOf = lum;
          const contrast = (el, css) => {
            const r = el.getBoundingClientRect();
            const up = 1 - Math.min(1, Math.max(0, (r.top + r.height / 2 - box.top) / box.height));
            // The scrim runs from 85% at the bottom to 55% at 70% up and 40% at the top (editor.css, as blocks.css).
            const a = up <= 0.7 ? 0.85 + (0.55 - 0.85) * (up / 0.7) : 0.55 + (0.4 - 0.55) * ((up - 0.7) / 0.3);
            const back = photo.map((v, i) => Math.round(v * (1 - a) + shade[i] * a));
            const front = pixel(css, 'rgb(' + back + ')');
            return (Math.max(lumOf(front), lumOf(back)) + 0.05) / (Math.min(lumOf(front), lumOf(back)) + 0.05);
          };
          const row = document.querySelector('.inline-list-row-active');
          const parts = {
            heading: document.querySelector('.ProseMirror > h2'),
            body: document.querySelector('.ProseMirror > h2 + p'),
            rowTitle: row.querySelector('[data-field="title"]'),
            rowText: row.querySelector('[data-field="text"]'),
            icon: row.querySelector('.inline-list-slot'),
            chevron: row.querySelector('.list-item-trailing'),
          };
          const out = {};
          for (const [name, el] of Object.entries(parts)) if (el) out[name] = contrast(el, getComputedStyle(el).color);
          const ph = row.querySelector('[data-field="title"]');
          out.placeholder = contrast(ph, getComputedStyle(ph, '::placeholder').color);
          out.outline = contrast(row, getComputedStyle(row).outlineColor);
          return out; })()`);
        for (const [part, ratio] of Object.entries(got)) {
          const min = ['icon', 'chevron', 'outline'].includes(part) ? 3 : 4.5;
          if (ratio < min) problems.push(`${label}: the ${part} has contrast ${ratio.toFixed(2)}:1 on the scrim, below ${min}`);
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
        const field = pm.closest('.editor-text').getBoundingClientRect();
        const border = (n) => parseFloat(getComputedStyle(pm.closest('.editor-text'))[n]);
        const parts = [...pm.children].filter((n) => !n.classList.contains('editor-section-picture'));
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
    if (process.env.SHOTS_FULL) await page.locator('.editor-text').screenshot({ path: `${process.env.SHOTS_FULL}-inset-${width}.png` });
    const full = await measure(true);
    if (process.env.SHOTS_FULL) await page.locator('.editor-text').screenshot({ path: `${process.env.SHOTS_FULL}-${width}.png` });
    if (inset.left < 1 || inset.radius === '0px')
      problems.push(`${width}px full-width section: the section of the text's width should stay inset with corners`);
    if (Math.abs(full.left) > 0.5 || Math.abs(full.right) > 0.5 || full.top > 0.5 || full.radius !== '0px')
      problems.push(
        `${width}px full-width section: left ${full.left}, right ${full.right}, top ${full.top}, corner ${full.radius}, should all be 0 against the text field's edges`,
      );
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
      const parts = [...pm.children].filter((c) => !c.classList.contains('editor-section-picture'));
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
  await frame.waitForSelector('section.text-section-primary', { timeout: 30_000 });
  const panel = await frame.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('section.text-section-primary'));
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
        .filter((c) => !c.classList.contains('editor-section-picture'))
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

export function register(unit) {
  unit('checkSectionOnImage', () => checkSectionOnImage());
  unit('checkFullWidthSection', () => checkFullWidthSection());
  unit('checkSectionBackground 375', () => checkSectionBackground(375, true));
  unit('checkSectionBackground 1280', () => checkSectionBackground(1280, false));
  unit('checkTapBelowSection 375', () => checkTapBelowSection(375, true));
  unit('checkTapBelowSection 1280', () => checkTapBelowSection(1280, false));
  unit('checkPreviewSection', () => checkPreviewSection());
  unit('checkFullSection', () => checkFullSection());
  unit('checkH1SectionGap', () => checkH1SectionGap());
  unit('checkSectionCardContrast', () => checkSectionCardContrast());
}
