import { openEditor } from '../built-site.mjs';
import { browser, problems, site } from './support/context.mjs';

/** Density on "Account": Medium and Small (no Large since 0.19.5) set data-density on <html> and are kept on the account (PUT /api/settings) and in this browser (editor-density), the head script sets it again before the page is drawn, the account's step replaces the browser's copy, and a stored Large is read as Medium. */
async function checkDensitySetting(width, height) {
  const sent = [];
  let kept = null;
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${width}px density setting: ${e.message}`));
  await page.route(`${site}/api/settings`, (r) => {
    if (r.request().method() === 'PUT') {
      sent.push(JSON.parse(r.request().postData() || 'null'));
      return r.fulfill({ status: 204 });
    }
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ settings: kept ? { density: kept } : null }) });
  });
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#account'));
  const attribute = () => page.evaluate(() => document.documentElement.dataset.density ?? null);
  const stored = () => page.evaluate(() => localStorage.getItem('editor-density'));
  if (await page.getByRole('button', { name: 'Large', exact: true }).count())
    problems.push(`${width}px density setting: Large is still offered`);
  for (const [label, want, store] of [
    ['Small', '-1', 'small'],
    ['Medium', '0', null],
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    if ((await attribute()) !== want || (await stored()) !== store)
      problems.push(`${width}px density setting: ${label} gave data-density ${await attribute()} and ${await stored()} in the browser`);
  }
  if (sent.map((b) => b.density).join() !== 'small,medium')
    problems.push(`${width}px density setting: the account got ${JSON.stringify(sent)}, not small, medium`);
  // The head script, before the page is drawn: a copy in the browser is on <html> at once.
  await page.evaluate(() => localStorage.setItem('editor-density', 'small'));
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => document.documentElement.dataset.density, null, { timeout: 5000 }).catch(() => {});
  if ((await attribute()) !== '-1')
    problems.push(`${width}px density setting: after a reload the copy in the browser did not give data-density -1`);
  // The account's step replaces the copy.
  kept = 'medium';
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.density === '0', null, { timeout: 10000 }).catch(() => {});
  if ((await attribute()) !== '0' || (await stored()) !== null)
    problems.push(`${width}px density setting: the account's Medium did not replace the copy (${await attribute()}, ${await stored()})`);
  // A Large kept before 0.19.5 (on the account or in this browser) is Medium, and the editor loads.
  kept = 'large';
  await page.evaluate(() => localStorage.setItem('editor-density', 'large'));
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.density === '0', null, { timeout: 10000 }).catch(() => {});
  if ((await attribute()) !== '0' || (await stored()) !== null)
    problems.push(`${width}px density setting: a stored Large was not read as Medium (${await attribute()}, ${await stored()})`);
  await page.close();
}

/** The parts read density (theme/styles/ui.css): from Medium down to -3 a button, a chip, a segmented button, a text field and a menu item are 4 px lower a step (the chip 2 px a side), a list row follows the same step but never goes below the target, a target keeps its size (an invisible area of at least --mo-sys-target-size, 48 on a phone and 44 on a computer), a part in the page editing area does not follow the person's step and a part in a row that picks the density never changes. Small is the person's step (data-density -1); -2 and -3 are a theme's own step (--mo-sys-density-base), which no editor setting offers yet. */
async function checkDensityParts(width, height, touch) {
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${width}px density parts: ${e.message}`));
  await openEditor(page, site);
  const parts = `
    <button class="mo-button" data-part="button">Label</button>
    <button class="mo-chip" data-part="chip">Label</button>
    <div class="mo-segmented-button"><button class="mo-segmented-button__segment" data-part="segment">One</button><button class="mo-segmented-button__segment">Two</button></div>
    <div class="mo-text-field mo-is-outlined"><div class="mo-text-field__container"><input class="mo-text-field__input" data-part="field"></div></div>
    <div class="mo-list__item-container" data-part="row"><div class="mo-list__item-content"><span class="mo-list__item-headline">Row</span></div></div>
    <div class="mo-menu__item" data-part="menu-item">Item</div>`;
  const measure = (attr, base) =>
    page.evaluate(
      ([attr, base, parts]) => {
        const root = document.documentElement;
        if (attr === null) root.removeAttribute('data-density');
        else root.setAttribute('data-density', attr);
        if (base === null) root.style.removeProperty('--mo-sys-density-base');
        else root.style.setProperty('--mo-sys-density-base', base);
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;left:0;top:0;width:360px;z-index:-1;visibility:hidden';
        host.innerHTML = `<div data-where="screen">${parts}</div><div class="mo-editor-text"><div class="ProseMirror" data-where="content">${parts}</div></div><div data-density-fixed data-where="fixed">${parts}</div><div class="mo-dialog" data-where="dialog">${parts}</div><div class="mo-snackbar" data-where="snackbar">${parts}</div>`;
        document.body.append(host);
        const got = {};
        for (const where of host.querySelectorAll('[data-where]'))
          for (const part of where.querySelectorAll('[data-part]')) {
            const box = part.getBoundingClientRect().height;
            const after = parseFloat(getComputedStyle(part, '::after').height);
            got[`${where.dataset.where}/${part.dataset.part}`] = [Math.round(box * 100) / 100, Number.isNaN(after) ? 0 : after];
          }
        got.target = parseFloat(getComputedStyle(root).getPropertyValue('--mo-sys-target-size'));
        host.remove();
        root.removeAttribute('data-density');
        root.style.removeProperty('--mo-sys-density-base');
        return got;
      },
      [attr, base, parts],
    );
  // The steps 0, -1 (the person's Small), -2 and -3 (a theme's step).
  const steps = [await measure('0', null), await measure('-1', null), await measure(null, '-2'), await measure(null, '-3')];
  const names = ['Medium', 'Small', '-2', '-3'];
  const target = steps[0].target;
  if (target !== (touch ? 48 : 44)) problems.push(`${width}px density parts: --mo-sys-target-size is ${target}, not ${touch ? 48 : 44}`);
  const expect = (what, ok) => ok || problems.push(`${width}px density parts: ${what}`);
  const sizes = (key) => steps.map((m) => m[key][0]);
  for (const part of ['button', 'chip', 'segment', 'field', 'menu-item']) {
    const h = sizes(`screen/${part}`);
    expect(
      `${part} is ${h.join(' / ')} px at ${names.join(' / ')}, not 4 px apart`,
      h.every((v, i) => i === 0 || h[i - 1] - v === 4),
    );
  }
  // The row: 4 px a step, never below the target.
  const rows = sizes('screen/row');
  expect(
    `a list row is ${rows.join(' / ')} px at ${names.join(' / ')}, not 4 px apart down to the target ${target}`,
    rows.every((v, i) => v === Math.max(target, rows[0] - 4 * i)),
  );
  // A target keeps its size: the part or its invisible area is at least --mo-sys-target-size, at every step.
  for (const [i, m] of steps.entries())
    for (const part of ['button', 'chip', 'segment'])
      expect(
        `${part} at ${names[i]} has a target of ${Math.max(...m[`screen/${part}`])} px, below ${target}`,
        Math.max(...m[`screen/${part}`]) >= target,
      );
  // The page editing area follows the theme's step, not the person's: Small changes nothing in it. A row that picks the density never changes.
  for (const part of ['button', 'chip', 'segment', 'field', 'row', 'menu-item']) {
    expect(
      `${part} in the page editing area is ${steps[0][`content/${part}`][0]} px at Medium and ${steps[1][`content/${part}`][0]} px at Small, not the same`,
      steps[0][`content/${part}`][0] === steps[1][`content/${part}`][0],
    );
    const fixed = steps.map((m) => m[`fixed/${part}`][0]);
    expect(`${part} in a row that picks the density is ${fixed.join(' / ')} px, not the same at every step`, new Set(fixed).size === 1);
  }
  // A dialog and a snackbar alert a person, and everything in them stays at Medium (M3, Density: "Don't increase the density in components that
  // alert a person of changes, such as snackbars or dialogs"): a part in them is as high at -3 as at Medium.
  for (const where of ['dialog', 'snackbar'])
    for (const part of ['button', 'chip', 'segment', 'field', 'row', 'menu-item']) {
      const h = steps.map((m) => m[`${where}/${part}`][0]);
      expect(`${part} in a ${where} is ${h.join(' / ')} px at ${names.join(' / ')}, not the same at every step`, new Set(h).size === 1);
    }
  await page.close();
}

/** The editor's layout gaps follow density (src/editor.css): the space between stacked sections (space-y, the margins above and below, a column's gap) and the screen's top padding change 4 px at Small, the side padding never changes, a theme's step below Small does not go further, and in the page editing area and in a row that picks the density nothing changes. */
async function checkDensityLayout(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${width}px density layout: ${e.message}`));
  await openEditor(page, site);
  const layout = `
    <div class="mo-editor-stack-300"><p data-part="space-y">One</p><p>Two</p></div>
    <p style="margin-block-end: var(--mo-comp-editor-rhythm-400)" data-part="mb">Margin</p>
    <p style="padding-block-start: var(--mo-comp-editor-rhythm-200)" data-part="pt">Padding</p>
    <p style="padding-inline-start: 1rem" data-part="px">Side</p>
    <div style="display: flex; flex-direction: column; row-gap: var(--mo-comp-editor-rhythm-200)"><p data-part="gap">One</p><p>Two</p></div>
    <p style="margin-block-end: 0.5rem" data-part="small">Small gap</p>
    <p style="margin-block-end: 0" data-part="last">Last</p>`;
  const measure = (attr, base = null) =>
    page.evaluate(
      ([attr, base, layout]) => {
        const root = document.documentElement;
        if (attr === null) root.removeAttribute('data-density');
        else root.setAttribute('data-density', attr);
        if (base === null) root.style.removeProperty('--mo-sys-density-base');
        else root.style.setProperty('--mo-sys-density-base', base);
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;left:0;top:0;width:360px;z-index:-1;visibility:hidden';
        host.innerHTML = `<div data-where="screen">${layout}</div><div class="mo-editor-text"><div class="ProseMirror" data-where="content">${layout}</div></div><div data-density-fixed data-where="fixed">${layout}</div>`;
        document.body.append(host);
        const px = (v) => Math.round(parseFloat(v) * 100) / 100;
        const got = {};
        for (const where of host.querySelectorAll('[data-where]')) {
          const part = (n) => where.querySelector(`[data-part="${n}"]`);
          const c = (n) => getComputedStyle(part(n));
          got[where.dataset.where] = {
            'space-y': px(getComputedStyle(part('space-y')).marginBlockEnd),
            mb: px(c('mb').marginBlockEnd),
            pt: px(c('pt').paddingBlockStart),
            px: px(c('px').paddingInlineStart),
            gap: px(getComputedStyle(part('gap').parentElement).rowGap),
            small: px(c('small').marginBlockEnd),
            last: px(c('last').marginBlockEnd),
          };
        }
        const screenEl = document.querySelector('.mo-editor-screen');
        got.screen.top = screenEl ? px(getComputedStyle(screenEl).paddingTop) : null;
        host.remove();
        root.removeAttribute('data-density');
        root.style.removeProperty('--mo-sys-density-base');
        return got;
      },
      [attr, base, layout],
    );
  const [medium, small, deep] = [await measure('0'), await measure('-1'), await measure(null, '-3')];
  const expect = (what, ok) => ok || problems.push(`${width}px density layout: ${what}`);
  for (const key of ['space-y', 'mb', 'pt', 'gap'])
    expect(
      `${key} is ${medium.screen[key]} / ${small.screen[key]} / ${deep.screen[key]} px at Medium / Small / a theme's -3, not 4 px apart and then the same`,
      medium.screen[key] - small.screen[key] === 4 && small.screen[key] === deep.screen[key],
    );
  if (medium.screen.top !== null)
    expect(
      `the screen's top padding is ${medium.screen.top} / ${small.screen.top} / ${deep.screen.top} px, not 4 px apart and then the same`,
      medium.screen.top - small.screen.top === 4 && small.screen.top === deep.screen.top,
    );
  for (const key of ['px', 'small', 'last'])
    expect(
      `${key} is ${medium.screen[key]} / ${small.screen[key]} / ${deep.screen[key]} px: it must not change with density`,
      medium.screen[key] === small.screen[key] && small.screen[key] === deep.screen[key],
    );
  for (const key of Object.keys(medium.fixed))
    expect(
      `${key} in a row that picks the density is ${medium.fixed[key]} / ${small.fixed[key]} / ${deep.fixed[key]} px, not the same at every step`,
      medium.fixed[key] === small.fixed[key] && small.fixed[key] === deep.fixed[key],
    );
  for (const key of Object.keys(medium.content))
    expect(
      `${key} in the page editing area is ${medium.content[key]} px at Medium and ${small.content[key]} at Small, not the same`,
      medium.content[key] === small.content[key],
    );
  await page.close();
}

/** A table's rows read density (theme/styles/blocks.css, the data-heavy step): the body row is 52 px at Medium and the header row 56, 4 px a step down to -3 (header 44, row 40); in a row that picks the density it is the same at every step, and in the page editing area Small changes nothing. */
async function checkDensityTable(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${width}px density table: ${e.message}`));
  await openEditor(page, site);
  const table =
    '<div class="mo-block-table mo-block-table__grid"><table><thead><tr><th>Head</th></tr></thead><tbody><tr><td data-part="row">Cell</td></tr></tbody></table></div>';
  const measure = (attr, base = null) =>
    page.evaluate(
      ([attr, base, table]) => {
        const root = document.documentElement;
        if (attr === null) root.removeAttribute('data-density');
        else root.setAttribute('data-density', attr);
        if (base === null) root.style.removeProperty('--mo-sys-density-base');
        else root.style.setProperty('--mo-sys-density-base', base);
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;left:0;top:0;width:360px;z-index:-1;visibility:hidden';
        host.innerHTML = `<div data-where="screen">${table}</div><div class="mo-editor-text"><div class="ProseMirror" data-where="content">${table}</div></div><div data-density-fixed data-where="fixed">${table}</div>`;
        document.body.append(host);
        const got = {};
        for (const where of host.querySelectorAll('[data-where]'))
          got[where.dataset.where] = [where.querySelector('thead th'), where.querySelector('[data-part="row"]')].map(
            (e) => Math.round(e.getBoundingClientRect().height * 100) / 100,
          );
        host.remove();
        root.removeAttribute('data-density');
        root.style.removeProperty('--mo-sys-density-base');
        return got;
      },
      [attr, base, table],
    );
  const steps = [await measure('0'), await measure('-1'), await measure(null, '-2'), await measure(null, '-3')];
  const [medium, small] = steps;
  const expect = (what, ok) => ok || problems.push(`${width}px density table: ${what}`);
  expect(
    `at Medium the header is ${medium.screen[0]} px and a row ${medium.screen[1]}, not 56 and 52`,
    medium.screen[0] === 56 && medium.screen[1] === 52,
  );
  for (const [i, name] of [
    [0, 'header'],
    [1, 'row'],
  ]) {
    const h = steps.map((m) => m.screen[i]);
    expect(
      `the ${name} is ${h.join(' / ')} px at Medium / Small / -2 / -3, not 4 px apart`,
      h.every((v, k) => k === 0 || h[k - 1] - v === 4),
    );
  }
  expect(
    `the table in the page editing area is ${small.content} px at Small, not ${medium.content} as at Medium`,
    small.content.join() === medium.content.join(),
  );
  expect(
    `the table in a row that picks the density is not the same at every step (${steps.map((m) => m.fixed).join(' / ')})`,
    steps.every((m) => m.fixed.join() === medium.fixed.join()),
  );
  await page.close();
}

/** Density on the editor's screens (spec: docs/superpowers/specs/2026-11-13-density-design.md, checks): the main screens open at Small and at a theme's -2 and -3 (Medium is what "screens" checks) without an error and without the page scrolling sideways, on a phone and a computer; and the colours of the parts do not depend on density (a row, a button, a chip and a field have the same text and surface colour at every step), which is why check:contrast (CONTRAST_DENSITY=-1 for Small, by hand) needs no run of its own in CI. */
async function checkDensityScreens(width, height) {
  const label = `${width}px density screens`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  let where = '';
  page.on('pageerror', (e) => problems.push(`${label} ${where}: ${e.message}`));
  await openEditor(page, site);
  const routes = [
    '',
    'settings',
    'company/colors',
    'global/header',
    'licenses',
    'appearance/themes',
    'seo',
    'apps',
    'new/pages',
    'new/blog',
  ];
  const colours = async () =>
    page.evaluate(() => {
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:0;top:0;width:360px;z-index:-1;visibility:hidden';
      host.innerHTML =
        '<button class="mo-button" data-part="button">Label</button><button class="mo-chip" data-part="chip">Label</button><div class="mo-text-field mo-is-outlined"><div class="mo-text-field__container"><input class="mo-text-field__input" data-part="field"></div></div><div class="mo-list__item-container" data-part="row"><div class="mo-list__item-content"><span class="mo-list__item-headline" data-part="headline">Row</span></div></div>';
      document.body.append(host);
      const got = {};
      for (const el of host.querySelectorAll('[data-part]')) {
        const c = getComputedStyle(el);
        got[el.dataset.part] = [c.color, c.backgroundColor, c.borderTopColor].join('|');
      }
      host.remove();
      return got;
    });
  const colourAt = {};
  for (const [name, attr, base] of [
    ['Medium', '0', '0'],
    ['Small', '-1', '0'],
    ['-2', '0', '-2'],
    ['-3', '0', '-3'],
  ]) {
    await page.evaluate(
      ([a, b]) => {
        document.documentElement.setAttribute('data-density', a);
        document.documentElement.style.setProperty('--mo-sys-density-base', b);
      },
      [attr, base],
    );
    colourAt[name] = await colours();
    if (name === 'Medium') continue;
    for (const route of routes) {
      where = `#${route} at ${name}`;
      await page.evaluate((h) => (location.hash = h), route);
      await page.waitForTimeout(150);
      if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth))
        problems.push(`${label} ${where}: the page scrolls sideways`);
    }
  }
  for (const part of Object.keys(colourAt.Medium))
    if (['Small', '-2', '-3'].some((name) => colourAt[name][part] !== colourAt.Medium[part]))
      problems.push(
        `${label}: the colours of ${part} change with density (${['Medium', 'Small', '-2', '-3'].map((name) => colourAt[name][part]).join(' / ')})`,
      );
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-density');
    document.documentElement.style.removeProperty('--mo-sys-density-base');
  });
  await page.close();
}

/** The UI components page (/ui/) is a route only on a site that sets `componentsPath` (the demo, morpheme-staging; pages/components.astro): the starter has none, so a unit that reads it skips there, like the units that need the demo's Blocks pages. */
async function openUiPage(page, label) {
  const response = await page.goto(`${site}/ui/`, { waitUntil: 'networkidle' });
  if (response && response.status() === 404) {
    console.log(`${label}: skipped, the site has no UI components page, which the demo has.`);
    return false;
  }
  return true;
}

/** A tap never lands on the wrong control (owner, 21 Nov 2026: at -3 on a phone the invisible target of "Several lines 1" covered the chip above it). On the theme's UI components page (/ui/) at a theme's -3, on a phone (touch, target 48) and a computer (mouse, target 44), every visible control is hit at 9 points (the four corners, the four edge middles and the centre, 1 px inside its box): what answers there is the control, or something in it, or no other control. An area of a control that reaches into its neighbour (target-size.css, --mo-sys-target-gap) fails this. A control that is fixed or sticky on the page (the page's own jump button) lies over what is under it by design and is not counted. */
async function checkDensityTargets(width, height, touch) {
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${width}px density targets: ${e.message}`));
  if (!(await openUiPage(page, `${width}px density targets`))) return void (await page.close());
  await page.addStyleTag({
    content:
      ':root { --mo-sys-density-base: -3 !important } *, ::before, ::after { animation: none !important; transition: none !important }',
  });
  // The page draws its parts as they come into view: go down it once, so every one is there.
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total + height; y += height - 100) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(20);
  }
  const found = await page.evaluate(() => {
    const controls =
      'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=menuitem], [role=option], [role=switch], [role=checkbox], [role=radio], [tabindex]:not([tabindex="-1"])';
    const label = (e) =>
      `${e.tagName.toLowerCase()}.${String(e.className).split(' ').slice(0, 2).join('.')} "${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 28)}"`;
    const overlay = (e) => {
      for (let p = e; p; p = p.parentElement) {
        const position = getComputedStyle(p).position;
        if (position === 'fixed' || position === 'sticky') return true;
      }
      return false;
    };
    let count = 0;
    const wrong = [];
    for (const el of document.querySelectorAll(controls)) {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || overlay(el)) continue;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const box = el.getBoundingClientRect();
      if (box.width < 2 || box.height < 2 || box.left < 0 || box.right > innerWidth || box.top < 0 || box.bottom > innerHeight) continue;
      count++;
      for (const y of [box.top + 1, box.top + box.height / 2, box.bottom - 1])
        for (const x of [box.left + 1, box.left + box.width / 2, box.right - 1]) {
          const hit = document.elementFromPoint(x, y);
          if (!hit || el.contains(hit)) continue;
          const other = hit.closest(controls);
          if (other && other !== el && !other.contains(el) && !overlay(other)) {
            const o = other.getBoundingClientRect();
            wrong.push(
              `${label(el)} (${Math.round(box.width)}x${Math.round(box.height)}) at ${Math.round(x - box.left)},${Math.round(y - box.top)} answers as ${label(other)} (${Math.round(o.width)}x${Math.round(o.height)}, ${Math.round(o.left - box.left)},${Math.round(o.top - box.top)} from it)`,
            );
          }
        }
    }
    return { count, wrong };
  });
  // The page does not clip what sticks out (src/editor.css, html:has(.mo-ui-components)): a part wider than the screen is a sideways scroll, and fails here.
  const scrolls = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (scrolls > 0)
    problems.push(`${width}px density targets: /ui/ scrolls sideways by ${scrolls} px (a part or the gallery is wider than the screen)`);
  if (found.count < 300) problems.push(`${width}px density targets: only ${found.count} controls found on /ui/ (expected 300 or more)`);
  const seen = new Set();
  for (const w of found.wrong) {
    const key = w.replace(/ at \d+,\d+ /, ' ');
    if (seen.has(key) || seen.size >= 12) continue;
    seen.add(key);
    problems.push(`${width}px density targets (-3): ${w}`);
  }
  if (found.wrong.length > seen.size)
    problems.push(`${width}px density targets (-3): ${found.wrong.length} wrong hits in all, ${seen.size} parts listed`);
  await page.close();
}

/** A chip row that scrolls sideways shows the focus ring of the chip Tab reaches whole (owner, 21 Nov 2026: the row stayed put and the right side of the ring was cut off): on /ui/, on a phone and a computer, light and dark, Tab goes through every row that scrolls (.mo-chip__set-scroll), and after each press the ring of the focused chip (its outline's width and offset round its box) lies inside the visible box of the row. */
async function checkChipRowFocus(width, height, scheme) {
  const touch = width < 600;
  const label = `${width}px ${scheme} chip row focus`;
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch,
    locale: 'en-US',
    colorScheme: scheme,
  });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await openUiPage(page, label))) return void (await page.close());
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total + height; y += height - 100) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(20);
  }
  const rows = await page.locator('.mo-chip__set-scroll').count();
  if (!rows) problems.push(`${label}: no row that scrolls sideways on /ui/`);
  let checked = 0;
  for (let i = 0; i < rows; i++) {
    const chips = page.locator('.mo-chip__set-scroll').nth(i).locator('button.mo-chip, a.mo-chip, .mo-chip > .mo-is-action');
    const count = await chips.count();
    if (count < 2) continue;
    await chips.first().scrollIntoViewIfNeeded();
    await chips.first().focus();
    for (let k = 0; k < count; k++) {
      await page.waitForTimeout(60);
      const seen = await page.evaluate(() => {
        const el = document.activeElement;
        const row = el?.closest('.mo-chip__set-scroll');
        if (!row) return null;
        const style = getComputedStyle(el);
        const room = (parseFloat(style.outlineWidth) || 0) + (parseFloat(style.outlineOffset) || 0);
        const chip = el.getBoundingClientRect();
        const box = row.getBoundingClientRect();
        return {
          text: (el.textContent || '').trim().slice(0, 20),
          room,
          left: chip.left - room - box.left,
          right: box.right - (chip.right + room),
        };
      });
      if (!seen) break;
      checked++;
      if (seen.room < 5) problems.push(`${label}: "${seen.text}" has no focus ring (${seen.room} px)`);
      if (seen.left < -0.5 || seen.right < -0.5)
        problems.push(
          `${label}: row ${i + 1}, chip "${seen.text}": its focus ring is cut off (${Math.round(seen.left)} px room at the start, ${Math.round(seen.right)} px at the end)`,
        );
      await page.keyboard.press('Tab');
    }
  }
  if (rows && checked < 4) problems.push(`${label}: only ${checked} chips were focused in ${rows} rows`);
  await page.close();
}

/** The density variables (theme/styles/base.css) work in the browser: a person's step (data-density on <html>) and a theme's step add up and are clamped to 0 down to -3, and a part's calc() gives its default at 0 and 4px per step. */
async function checkDensity(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${width}px density: ${e.message}`));
  await openEditor(page, site);
  const read = (attr, base) =>
    page.evaluate(
      ([attr, base]) => {
        const root = document.documentElement;
        if (attr === null) root.removeAttribute('data-density');
        else root.setAttribute('data-density', attr);
        root.style.setProperty('--mo-sys-density-base', base);
        const probe = document.createElement('div');
        probe.style.height = 'calc(52px + var(--mo-sys-density) * var(--mo-sys-density-step))';
        document.body.append(probe);
        const style = getComputedStyle(root);
        // A variable's text is not resolved (clamp(…)): a margin of 1px per step is, and may be negative.
        const step = (name) => {
          probe.style.marginLeft = `calc(var(${name}) * 1px)`;
          return parseFloat(getComputedStyle(probe).marginLeft);
        };
        const got = {
          all: step('--mo-sys-density'),
          row: 0,
          space: style.getPropertyValue('--mo-ref-space-100').trim(),
        };
        probe.style.marginLeft = '';
        got.row = probe.getBoundingClientRect().height;
        probe.remove();
        root.removeAttribute('data-density');
        root.style.removeProperty('--mo-sys-density-base');
        return got;
      },
      [attr, base],
    );
  // [data-density, the theme's step, the step, a 52px row]: 0 down to -3 (Large went in 0.19.5, so a stale '1' and a positive theme step read as Medium)
  const cases = [
    [null, '0', 0, 52],
    ['0', '0', 0, 52],
    ['1', '0', 0, 52],
    [null, '1', 0, 52],
    ['-1', '0', -1, 48],
    ['-1', '-1', -2, 44],
    ['-1', '-3', -3, 40],
    [null, '-1', -1, 48],
    [null, '-2', -2, 44],
    [null, '-3', -3, 40],
    [null, '-5', -3, 40],
  ];
  for (const [attr, base, step, row] of cases) {
    const got = await read(attr, base);
    const want = `${step}/${row}`;
    const have = `${got.all}/${got.row}`;
    if (have !== want || got.space !== '8px')
      problems.push(
        `${width}px density: data-density ${attr}, theme step ${base}: expected ${want} (step/row), got ${have}, space-100 ${got.space}`,
      );
  }
  await page.close();
}

export function register(unit) {
  unit('checkDensity 375', () => checkDensity(375, 740));
  unit('checkDensity 1280', () => checkDensity(1280, 900));
  unit('checkDensityParts 375', () => checkDensityParts(375, 740, true));
  unit('checkDensityParts 1280', () => checkDensityParts(1280, 900, false));
  unit('checkDensityLayout 375', () => checkDensityLayout(375, 740));
  unit('checkDensityLayout 1280', () => checkDensityLayout(1280, 900));
  unit('checkDensityTable 375', () => checkDensityTable(375, 740));
  unit('checkDensityTable 1280', () => checkDensityTable(1280, 900));
  unit('checkDensityScreens 375', () => checkDensityScreens(375, 740));
  unit('checkDensityScreens 1280', () => checkDensityScreens(1280, 900));
  unit('checkDensityTargets 390', () => checkDensityTargets(390, 844, true));
  unit('checkDensityTargets 1280', () => checkDensityTargets(1280, 900, false));
  for (const [width, height] of [
    [390, 844],
    [1280, 900],
  ])
    for (const scheme of ['light', 'dark']) unit(`checkChipRowFocus ${width} ${scheme}`, () => checkChipRowFocus(width, height, scheme));
  unit('checkDensitySetting 375', () => checkDensitySetting(375, 740));
  unit('checkDensitySetting 1280', () => checkDensitySetting(1280, 900));
}
