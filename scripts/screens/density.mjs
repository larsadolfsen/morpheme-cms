import { openEditor } from '../built-site.mjs';
import { browser, problems, site } from './support/context.mjs';

/** Density on "Account": Large, Medium and Small set data-density on <html> and are kept on the account (PUT /api/settings) and in this browser (editor-density), the head script sets it again before the page is drawn, and the account's step replaces the browser's copy. */
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
  for (const [label, want, store] of [
    ['Small', '-1', 'small'],
    ['Large', '1', 'large'],
    ['Medium', '0', null],
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    if ((await attribute()) !== want || (await stored()) !== store)
      problems.push(`${width}px density setting: ${label} gave data-density ${await attribute()} and ${await stored()} in the browser`);
  }
  if (sent.map((b) => b.density).join() !== 'small,large,medium')
    problems.push(`${width}px density setting: the account got ${JSON.stringify(sent)}, not small, large, medium`);
  // The head script, before the page is drawn: a copy in the browser is on <html> at once.
  await page.evaluate(() => localStorage.setItem('editor-density', 'small'));
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => document.documentElement.dataset.density, null, { timeout: 5000 }).catch(() => {});
  if ((await attribute()) !== '-1')
    problems.push(`${width}px density setting: after a reload the copy in the browser did not give data-density -1`);
  // The account's step replaces the copy.
  kept = 'large';
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.density === '1', null, { timeout: 10000 }).catch(() => {});
  if ((await attribute()) !== '1' || (await stored()) !== 'large')
    problems.push(`${width}px density setting: the account's Large did not replace the copy (${await attribute()}, ${await stored()})`);
  await page.close();
}

/** The parts read density (theme/styles/ui.css): at Large, Medium and Small a button, a chip, a segmented button and a text field are 4 px taller or lower (the chip 2 px a side), a list row follows the data-heavy step, a target keeps its size (an invisible area of at least --mo-sys-target-size, 48 on a phone and 44 on a computer), a part in the page editing area or in a row that picks the density does not change, and a menu stays at Medium. */
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
  const measure = (attr) =>
    page.evaluate(
      ([attr, parts]) => {
        const root = document.documentElement;
        if (attr === null) root.removeAttribute('data-density');
        else root.setAttribute('data-density', attr);
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;left:0;top:0;width:360px;z-index:-1;visibility:hidden';
        host.innerHTML = `<div data-where="screen">${parts}</div><div class="mo-editor-text"><div class="ProseMirror" data-where="content">${parts}</div></div><div data-density-fixed data-where="fixed">${parts}</div>`;
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
        return got;
      },
      [attr, parts],
    );
  const [large, medium, small] = [await measure('1'), await measure('0'), await measure('-1')];
  const target = medium.target;
  if (target !== (touch ? 48 : 44)) problems.push(`${width}px density parts: --mo-sys-target-size is ${target}, not ${touch ? 48 : 44}`);
  const expect = (what, ok) => ok || problems.push(`${width}px density parts: ${what}`);
  for (const part of ['button', 'chip', 'segment', 'field']) {
    const key = `screen/${part}`;
    expect(
      `${part} is ${large[key][0]} / ${medium[key][0]} / ${small[key][0]} px at Large / Medium / Small, not 4 px apart`,
      large[key][0] - medium[key][0] === 4 && medium[key][0] - small[key][0] === 4,
    );
  }
  // The row: a data-heavy part, 4 px a step, never below the target.
  expect(
    `a list row is ${large['screen/row'][0]} / ${medium['screen/row'][0]} / ${small['screen/row'][0]} px, not 4 px apart`,
    large['screen/row'][0] - medium['screen/row'][0] === 4 && medium['screen/row'][0] - small['screen/row'][0] === 4,
  );
  expect(`a list row at Small is ${small['screen/row'][0]} px, below the target ${target}`, small['screen/row'][0] >= target);
  // A target keeps its size: the part or its invisible area is at least --mo-sys-target-size, at every step.
  for (const [name, m] of [
    ['Large', large],
    ['Medium', medium],
    ['Small', small],
  ])
    for (const part of ['button', 'chip', 'segment'])
      expect(
        `${part} at ${name} has a target of ${Math.max(...m[`screen/${part}`])} px, below ${target}`,
        Math.max(...m[`screen/${part}`]) >= target,
      );
  // The page editing area and the rows that pick the density are drawn the same at every step; a menu stays at Medium.
  for (const where of ['content', 'fixed'])
    for (const part of ['button', 'chip', 'segment', 'field', 'row'])
      expect(
        `${part} in ${where} is ${large[`${where}/${part}`][0]} / ${medium[`${where}/${part}`][0]} / ${small[`${where}/${part}`][0]} px, not the same at every step`,
        large[`${where}/${part}`][0] === medium[`${where}/${part}`][0] && medium[`${where}/${part}`][0] === small[`${where}/${part}`][0],
      );
  expect(
    `a menu item changes with the step (${large['screen/menu-item'][0]} / ${medium['screen/menu-item'][0]} / ${small['screen/menu-item'][0]} px): it must not get denser than Medium`,
    small['screen/menu-item'][0] === medium['screen/menu-item'][0],
  );
  await page.close();
}

/** The editor's layout gaps follow density (src/editor.css): the space between stacked sections (space-y, the margins above and below, a column's gap) and the screen's top padding change 4 px a step at Large, Medium and Small, the side padding never changes, and in the page editing area and in a row that picks the density nothing changes. */
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
  const measure = (attr) =>
    page.evaluate(
      ([attr, layout]) => {
        const root = document.documentElement;
        if (attr === null) root.removeAttribute('data-density');
        else root.setAttribute('data-density', attr);
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
        return got;
      },
      [attr, layout],
    );
  const [large, medium, small] = [await measure('1'), await measure('0'), await measure('-1')];
  const expect = (what, ok) => ok || problems.push(`${width}px density layout: ${what}`);
  for (const key of ['space-y', 'mb', 'pt', 'gap'])
    expect(
      `${key} is ${large.screen[key]} / ${medium.screen[key]} / ${small.screen[key]} px at Large / Medium / Small, not 4 px apart`,
      large.screen[key] - medium.screen[key] === 4 && medium.screen[key] - small.screen[key] === 4,
    );
  if (medium.screen.top !== null)
    expect(
      `the screen's top padding is ${large.screen.top} / ${medium.screen.top} / ${small.screen.top} px, not 4 px apart`,
      large.screen.top - medium.screen.top === 4 && medium.screen.top - small.screen.top === 4,
    );
  for (const key of ['px', 'small', 'last'])
    expect(
      `${key} is ${large.screen[key]} / ${medium.screen[key]} / ${small.screen[key]} px: it must not change with density`,
      large.screen[key] === medium.screen[key] && medium.screen[key] === small.screen[key],
    );
  for (const where of ['content', 'fixed'])
    for (const key of Object.keys(medium[where]))
      expect(
        `${key} in ${where} is ${large[where][key]} / ${medium[where][key]} / ${small[where][key]} px, not the same at every step`,
        large[where][key] === medium[where][key] && medium[where][key] === small[where][key],
      );
  await page.close();
}

/** A table's rows read density (theme/styles/blocks.css, the data-heavy step): the body row is 52 px at Medium and the header row 56, 4 px a step (Large +4, Small -4); in the page editing area and in a row that picks the density it is the same at every step. */
async function checkDensityTable(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${width}px density table: ${e.message}`));
  await openEditor(page, site);
  const table =
    '<div class="mo-block-table mo-block-table__grid"><table><thead><tr><th>Head</th></tr></thead><tbody><tr><td data-part="row">Cell</td></tr></tbody></table></div>';
  const measure = (attr) =>
    page.evaluate(
      ([attr, table]) => {
        const root = document.documentElement;
        if (attr === null) root.removeAttribute('data-density');
        else root.setAttribute('data-density', attr);
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
        return got;
      },
      [attr, table],
    );
  const [large, medium, small] = [await measure('1'), await measure('0'), await measure('-1')];
  const expect = (what, ok) => ok || problems.push(`${width}px density table: ${what}`);
  expect(
    `at Medium the header is ${medium.screen[0]} px and a row ${medium.screen[1]}, not 56 and 52`,
    medium.screen[0] === 56 && medium.screen[1] === 52,
  );
  for (const [i, name] of [
    [0, 'header'],
    [1, 'row'],
  ])
    expect(
      `the ${name} is ${large.screen[i]} / ${medium.screen[i]} / ${small.screen[i]} px at Large / Medium / Small, not 4 px apart`,
      large.screen[i] - medium.screen[i] === 4 && medium.screen[i] - small.screen[i] === 4,
    );
  for (const where of ['content', 'fixed'])
    expect(
      `the table in ${where} is ${large[where]} / ${medium[where]} / ${small[where]} px, not the same at every step`,
      large[where].join() === medium[where].join() && medium[where].join() === small[where].join(),
    );
  await page.close();
}

/** Density on the editor's screens (spec: docs/superpowers/specs/2026-11-13-density-design.md, checks): the main screens open at Large and Small (Medium is what "screens" checks) without an error and without the page scrolling sideways, on a phone and a computer; and the colours of the parts do not depend on density (a row, a button, a chip and a field have the same text and surface colour at every step), which is why check:contrast (CONTRAST_DENSITY=-1 for Small, by hand) needs no run of its own in CI. */
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
  for (const [name, attr] of [
    ['Large', '1'],
    ['Medium', '0'],
    ['Small', '-1'],
  ]) {
    await page.evaluate((a) => document.documentElement.setAttribute('data-density', a), attr);
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
    if (colourAt.Large[part] !== colourAt.Medium[part] || colourAt.Small[part] !== colourAt.Medium[part])
      problems.push(
        `${label}: the colours of ${part} change with density (${colourAt.Large[part]} / ${colourAt.Medium[part]} / ${colourAt.Small[part]})`,
      );
  await page.close();
}

/** The density variables (theme/styles/base.css) work in the browser: a person's step (data-density on <html>) and a theme's step add up, each group clamps them, and a part's calc() gives its default at 0 and 4px per step. */
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
          layout: step('--mo-sys-density-layout'),
          focus: step('--mo-sys-density-focus'),
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
  // [data-density, the theme's step, the three variables (data-heavy, layout, focused), a 52px row]
  const cases = [
    [null, '0', [0, 0, 0], 52],
    ['0', '0', [0, 0, 0], 52],
    ['1', '0', [1, 1, 1], 56],
    ['-1', '0', [-1, -1, 0], 48],
    ['-1', '-1', [-2, -1, 0], 44],
    ['-1', '-3', [-3, -1, 0], 40],
    ['1', '1', [1, 1, 1], 56],
    [null, '-1', [-1, -1, 0], 48],
  ];
  for (const [attr, base, [all, layout, focus], row] of cases) {
    const got = await read(attr, base);
    const want = `${all}/${layout}/${focus}/${row}`;
    const have = `${got.all}/${got.layout}/${got.focus}/${got.row}`;
    if (have !== want || got.space !== '8px')
      problems.push(
        `${width}px density: data-density ${attr}, theme step ${base}: expected ${want} (data-heavy/layout/focused/row), got ${have}, space-100 ${got.space}`,
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
  unit('checkDensitySetting 375', () => checkDensitySetting(375, 740));
  unit('checkDensitySetting 1280', () => checkDensitySetting(1280, 900));
}
