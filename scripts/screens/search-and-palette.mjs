import { openEditor } from '../built-site.mjs';
import { PACK, browser, problems, site } from './support/context.mjs';
import { acornProblem } from './support/icon-pack.mjs';
import { pressInsert } from './support/shared.mjs';

/** The theme's search view driven by React (theme/ui/Search.tsx, SearchView; the command palette's view, spec docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md,
 * sections 4.1, 4.5 and 4.7) on "Parts" › "UI components" (NavigationRestParts.tsx), on a phone and a computer, in English and Danish: it opens as a modal <dialog> with the focus in its
 * field, full screen on a phone and docked, in the middle near the top, on a computer; the results are in groups, each named by its label (role=group, aria-labelledby), as options
 * with their key as trailing text (aria-keyshortcuts), a toggle checked and a disabled one aria-disabled; the arrow keys, Home and End move aria-activedescendant (the focus stays in the
 * field), Enter runs an option but not a disabled one; typing narrows the groups and a live region says how many; nothing found shows its text and hides the list; Clear empties the
 * field and keeps it open; Enter on an option and Escape close it and the focus goes back to the button that opened it, and on a computer a tap outside closes it; every row and
 * button is at least 48 px and the page does not scroll sideways. */
async function checkSearchViewParts(width, locale) {
  const label = `${width}px ${locale} search view`;
  const touch = width < 600;
  const say =
    locale === 'da-DK'
      ? {
          open: '\u00c5bn s\u00f8gevisningen',
          groups: ['Seneste', 'Foresl\u00e5et'], // language-ok: the Danish group names the Parts page example must show
          four: '4 resultater',
          one: '1 resultat',
          none: 'Intet passer til s\u00f8gningen',
          word: 'fed',
          shortcut: 'Ctrl+B',
        }
      : {
          open: 'Open the search view',
          groups: ['Recent', 'Suggested'],
          four: '4 results',
          one: '1 result',
          none: 'Nothing fits the search',
          word: 'bold',
          shortcut: 'Ctrl+B',
        };
  const page = await browser.newPage({ viewport: { width, height: 812 }, hasTouch: touch, isMobile: touch, locale });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#developer/parts/ui'));
  const part = page.locator('[data-part="Search"]');
  await part.waitFor({ timeout: 30_000 }).catch(() => problems.push(`${label}: the Search part is not on the page`));
  if (!(await part.count())) return page.close();
  await part.scrollIntoViewIfNeeded();
  const opener = part.getByRole('button', { name: say.open });
  const view = page.locator('[data-search-controlled] [data-search-view-open]');
  const input = view.locator('input[role=combobox]');
  const options = view.locator('[role=option]');
  const live = view.locator('.mo-search-view__live');
  const active = () => input.getAttribute('aria-activedescendant');
  const selected = () => view.locator('[role=option][aria-selected=true]').evaluateAll((els) => els.map((e) => e.id));
  const focusIsInField = () => input.evaluate((el) => el === document.activeElement);
  const where = () => page.evaluate(() => document.activeElement?.textContent?.trim() ?? document.activeElement?.tagName);

  await opener.click();
  await view.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the view does not open`));
  if (!(await view.count())) return page.close();
  await page.waitForTimeout(400);
  const box = await view.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      modal: el.matches(':modal'),
      docked: el.classList.contains('mo-search-view__docked'),
      left: r.left,
      right: r.right,
      top: r.top,
      width: r.width,
      height: r.height,
      vw: innerWidth,
      vh: innerHeight,
      sideways: document.documentElement.scrollWidth > innerWidth,
    };
  });
  // Full screen on a phone is a modal <dialog>; from medium the view is a dropdown: not modal, the page behind it stays usable.
  if (touch !== box.modal) problems.push(`${label}: the view is ${box.modal ? 'modal' : 'not modal'} on a ${touch ? 'phone' : 'computer'}`);
  if (touch) {
    if (box.docked || box.width < box.vw - 1 || box.height < box.vh - 1)
      problems.push(
        `${label}: on a phone the view is full screen: ${Math.round(box.width)}x${Math.round(box.height)} of ${box.vw}x${box.vh}`,
      );
  } else {
    if (!box.docked) problems.push(`${label}: on a computer the view is docked`);
    if (box.width > 36 * 16 + 1 || box.top < 0 || box.top > 120 || Math.abs((box.left + box.right) / 2 - box.vw / 2) > 2)
      problems.push(
        `${label}: docked, the view is in the middle near the top, at most 36rem wide: left ${Math.round(box.left)}, top ${Math.round(box.top)}, width ${Math.round(box.width)}`,
      );
  }
  if (box.sideways) problems.push(`${label}: the page scrolls sideways with the view open`);
  if (!(await focusIsInField())) problems.push(`${label}: the focus is not in the field when the view opens`);

  const names = await view
    .locator('[role=group]')
    .evaluateAll((els) => els.map((g) => document.getElementById(g.getAttribute('aria-labelledby') ?? '')?.textContent ?? ''));
  if (JSON.stringify(names) !== JSON.stringify(say.groups))
    problems.push(`${label}: the groups are named ${JSON.stringify(names)}, not ${JSON.stringify(say.groups)}`);
  if ((await options.count()) !== 4) problems.push(`${label}: ${await options.count()} options, not 4`);
  if ((await live.textContent()) !== say.four)
    problems.push(`${label}: the live region says "${await live.textContent()}", not "${say.four}"`);
  const opt = await options.evaluateAll((els) =>
    els.map((e) => ({
      selected: e.getAttribute('aria-selected'),
      disabled: e.getAttribute('aria-disabled'),
      checked: e.getAttribute('aria-checked'),
      keys: e.getAttribute('aria-keyshortcuts'),
      trailing: e.querySelector('.mo-list__item-trailing-supporting')?.textContent ?? '',
      height: e.getBoundingClientRect().height,
    })),
  );
  if (opt[0]?.selected !== 'true') problems.push(`${label}: the first option is not the one the arrow keys are on`);
  if (opt[2]?.trailing !== say.shortcut || opt[2]?.keys !== 'Control+B')
    problems.push(`${label}: the key of Bold: "${opt[2]?.trailing}", aria-keyshortcuts "${opt[2]?.keys}"`);
  if (opt[2]?.checked !== 'true') problems.push(`${label}: the toggle is not checked`);
  if (opt[3]?.disabled !== 'true') problems.push(`${label}: the disabled option is not aria-disabled`);
  const short = opt.filter((o) => o.height < 47.5);
  if (short.length) problems.push(`${label}: ${short.length} option(s) are lower than 48 px`);
  const buttons = await view
    .locator('.mo-search-view__header button')
    .evaluateAll((els) =>
      els.map((b) => Math.max(b.getBoundingClientRect().height, parseFloat(getComputedStyle(b, '::after').height) || 0)),
    );
  if (buttons.some((h) => h < 47.5))
    problems.push(`${label}: a button of the field's row is lower than 48 px (${buttons.map(Math.round)})`);

  // The arrow keys move the highlight; the focus stays in the field.
  const ids = await options.evaluateAll((els) => els.map((e) => e.id));
  await page.keyboard.press('ArrowDown');
  if ((await active()) !== ids[1] || (await selected()).join() !== ids[1])
    problems.push(`${label}: ArrowDown does not move to the second option`);
  await page.keyboard.press('End');
  if ((await active()) !== ids[3]) problems.push(`${label}: End does not go to the last option`);
  await page.keyboard.press('ArrowDown');
  if ((await active()) !== ids[0]) problems.push(`${label}: ArrowDown on the last option does not go round to the first`);
  await page.keyboard.press('ArrowUp');
  if ((await active()) !== ids[3]) problems.push(`${label}: ArrowUp on the first option does not go round to the last`);
  if (!(await focusIsInField())) problems.push(`${label}: the focus left the field while the arrow keys moved`);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  if (!(await view.count())) problems.push(`${label}: Enter on a disabled option closed the view`);
  await page.keyboard.press('Home');

  // Typing narrows the groups, says how many, and puts the highlight on the first.
  await page.keyboard.type(say.word);
  await page.waitForTimeout(150);
  if ((await options.count()) !== 1) problems.push(`${label}: "${say.word}" leaves ${await options.count()} options, not 1`);
  if ((await live.textContent()) !== say.one)
    problems.push(`${label}: the live region says "${await live.textContent()}", not "${say.one}"`);
  if ((await view.locator('[role=group]').count()) !== 1) problems.push(`${label}: a group with no hit is shown`);
  if ((await active()) === null) problems.push(`${label}: no option is highlighted after typing`);
  await input.fill('zzz');
  await page.waitForTimeout(150);
  const empty = view.locator('.mo-search-view__empty');
  if (!(await empty.isVisible()) || (await empty.textContent()) !== say.none)
    problems.push(`${label}: the text for nothing found is not shown`);
  if (await view.locator('[role=listbox]').isVisible()) problems.push(`${label}: the list is shown when nothing is found`);
  if ((await live.textContent()) !== say.none) problems.push(`${label}: the live region does not say nothing was found`);
  await view.locator('.mo-search-view__clear').click();
  if ((await input.inputValue()) !== '' || !(await focusIsInField()) || (await options.count()) !== 4)
    problems.push(`${label}: Clear does not empty the field, keep the focus in it and show the results`);

  // Enter on an option runs it and closes the view; the focus goes back to the button.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  if (await view.count()) problems.push(`${label}: Enter on an option does not close the view`);
  else if ((await where()) !== say.open)
    problems.push(`${label}: the focus is not back on the button after Enter (it is on "${await where()}")`);
  // Escape closes it, with the focus back on the button.
  await opener.click();
  await view.waitFor({ timeout: 5000 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  if (await view.count()) problems.push(`${label}: Escape does not close the view`);
  else if ((await where()) !== say.open)
    problems.push(`${label}: the focus is not back on the button after Escape (it is on "${await where()}")`);
  // On a computer a tap outside it closes it too.
  if (!touch) {
    await opener.click();
    await view.waitFor({ timeout: 5000 });
    await page.mouse.click(5, 800);
    await page.waitForTimeout(250);
    if (await view.count()) problems.push(`${label}: a tap outside does not close the view`);
  }
  await page.close();
}

/** The search button in the top bar (src/Screen.tsx SearchButton; spec docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md section 4.2 and 4.8):
 * on every screen it is one button named "Search" of at least 48 px, the first of the bar's trailing actions (before the screen's own and the bell), with its key in
 * `aria-keyshortcuts`, and the page does not scroll sideways with it; while rows are selected (the selection's own bar) it is not drawn. */
async function checkSearchButton(width) {
  const label = `${width}px search button`;
  const touch = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 812 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  let where = '';
  page.on('pageerror', (e) => problems.push(`${label} ${where}: ${e.message}`));
  await openEditor(page, site);
  const routes = [
    '',
    'settings',
    'licenses',
    'seo',
    'apps',
    'files',
    'list/pages',
    'list/blog',
    'new/pages',
    'new/blog',
    'company/colors',
    'appearance/themes',
  ];
  for (const route of routes) {
    where = `#${route}`;
    await page.evaluate((h) => (location.hash = h), route);
    await page.waitForSelector('header h1', { state: 'attached', timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(250);
    const found = await page.evaluate(() => {
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      };
      const bar = document.querySelector('header');
      const heading = bar?.querySelector('h1');
      let mine = [...(bar?.querySelectorAll('button[aria-label="Search"], [data-search-bar-button]') ?? [])].filter(visible);
      // On a phone the start screen's search bar is the first thing in the page, not in the top bar.
      const inPage = !mine.length;
      if (inPage) mine = [...document.querySelectorAll('[data-search-bar-button]')].filter(visible);
      // The bar's actions after the title, in the order they are in the page.
      const after = [...(bar?.querySelectorAll('button, a[href]') ?? [])].filter(
        (el) => visible(el) && heading && heading.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      const box = mine[0]?.getBoundingClientRect();
      return {
        n: mine.length,
        first: inPage || after[0] === mine[0],
        keys: mine[0]?.getAttribute('aria-keyshortcuts'),
        w: box?.width ?? 0,
        h: box?.height ?? 0,
        sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    if (found.n !== 1) problems.push(`${label} ${where}: ${found.n} search buttons in the top bar, not 1`);
    else {
      if (!found.first) problems.push(`${label} ${where}: the search button is not the first trailing action of the top bar`);
      if (found.keys !== 'Control+K') problems.push(`${label} ${where}: aria-keyshortcuts is "${found.keys}", not "Control+K"`);
      if (found.w < 47.5 || found.h < 47.5) problems.push(`${label} ${where}: the search button is ${found.w}x${found.h}, under 48 px`);
    }
    if (found.sideways) problems.push(`${label} ${where}: the page scrolls sideways with the search button`);
  }
  await page.close();
}

/** The command palette (src/CommandPalette.tsx, spec section 4): it opens from the top bar's button and from Ctrl+K, also with the cursor in text (and a second Ctrl+K
 * closes it); it is a modal view with the focus in its field, full screen on a phone and docked on a computer, 48 px rows and buttons, no sideways scroll; before typing it
 * shows *Suggested* (the first places of the menu), a place of the menu is found by its name (Files, under Go to), a page by its title (under Pages and posts), a live region
 * says how many, the arrow keys move the highlight, Enter goes there, closes it and puts the focus on the new screen's heading, and the next time *Recent* has it first;
 * nothing found says so; Escape closes it and the focus goes back to the button, or to the text. */
async function checkCommandPalette(width) {
  const label = `${width}px command palette`;
  const touch = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 812 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.waitForSelector(':is(header button[aria-label="Search"], [data-search-bar-button]):visible', { timeout: 15_000 });
  // A page of this site (the demo's and the starter's differ): the first of the pages list, found by its title further down.
  await page.evaluate(() => (location.hash = '#list/pages'));
  await page.waitForSelector('main a.mo-list__item-container', { timeout: 15_000 }).catch(() => {});
  const pageTitle = (
    await page
      .locator('main a.mo-list__item-container .mo-list__item-headline')
      .first()
      .textContent({ timeout: 3000 })
      .catch(() => null)
  )?.trim();
  await page.evaluate(() => (location.hash = ''));
  await page.waitForTimeout(300);
  const button = page.locator(':is(header button[aria-label="Search"], [data-search-bar-button]):visible');
  // The start screen shows the search bar all the time (M3 contained, 56 px high), not the icon; other screens keep the icon.
  const homeBar = await page.evaluate(() => {
    const bar = [...document.querySelectorAll('[data-search-bar-button]')].find((b) => b.getClientRects().length > 0);
    const r = bar?.getBoundingClientRect();
    const own = bar?.closest('.mo-search-bar')?.getBoundingClientRect();
    return {
      bar: !!r && r.width > 0,
      height: own?.height ?? 0,
      left: own?.left ?? 0,
      icon: [...document.querySelectorAll('header button[aria-label="Search"]')].some((b) => b.getClientRects().length > 0),
    };
  });
  if (!homeBar.bar || Math.abs(homeBar.height - 56) > 0.5)
    problems.push(`${label}: the start screen has no 56 px search bar (${JSON.stringify(homeBar)})`);
  // M3 specs, Measurements: an unfocused search bar is 24dp from the screen's edge (on a phone, in the page; from medium it stands in the top bar).
  if (touch && Math.abs(homeBar.left - 24) > 0.5)
    problems.push(`${label}: the phone's search bar is ${homeBar.left} dp from the edge, not 24 (M3 specs)`);
  if (homeBar.icon) problems.push(`${label}: the start screen also has the search icon button`);
  const view = page.locator('[data-search-controlled] [data-search-view-open]');
  const input = view.locator('input[role=combobox]');
  const options = view.locator('[role=option]');
  const live = view.locator('.mo-search-view__live');
  const groups = () =>
    view
      .locator('.mo-search-view__group')
      .evaluateAll((els) => els.map((g) => document.getElementById(g.getAttribute('aria-labelledby') ?? '')?.textContent ?? ''));
  const names = () => options.evaluateAll((els) => els.map((e) => e.querySelector('.mo-list__item-headline')?.textContent ?? ''));
  const active = () => input.getAttribute('aria-activedescendant');
  const activeIs = async (i) => (await active()) === (await options.nth(i).getAttribute('id'));
  const focusOn = () =>
    page.evaluate(
      () =>
        `${document.activeElement?.tagName}:${document.activeElement?.getAttribute('aria-label') ?? ''}:${document.activeElement?.className?.toString().includes('ProseMirror') ?? false}`,
    );
  const shut = async (why) => {
    await page.waitForTimeout(250);
    if (await view.count()) problems.push(`${label}: the palette is still open ${why}`);
  };

  // The button opens it: a modal view with the focus in the field, full screen on a phone and docked in the middle near the top on a computer.
  await button.click();
  await view.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the button does not open the palette`));
  if (!(await view.count())) return page.close();
  await page.waitForTimeout(400);
  const box = await view.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      modal: el.matches(':modal'),
      docked: el.classList.contains('mo-search-view__docked'),
      left: r.left,
      right: r.right,
      top: r.top,
      width: r.width,
      height: r.height,
      vw: innerWidth,
      vh: innerHeight,
      sideways: document.documentElement.scrollWidth > innerWidth,
    };
  });
  if (touch !== box.modal)
    problems.push(
      `${label}: the palette is ${box.modal ? 'modal' : 'not modal'} on a ${touch ? 'phone' : 'computer'} (a dropdown from medium)`,
    );
  if (touch) {
    if (box.docked || box.width < box.vw - 1 || box.height < box.vh - 1)
      problems.push(
        `${label}: on a phone the palette is full screen (it is ${Math.round(box.width)}x${Math.round(box.height)} of ${box.vw}x${box.vh})`,
      );
  } else {
    // A dropdown on the search bar of the start screen: its left edge and top are the bar's, as wide as the bar (360 to 720 dp), no scrim.
    const bar = await page.evaluate(() => document.querySelector('header .mo-search-bar')?.getBoundingClientRect().toJSON());
    if (
      !box.docked ||
      !bar ||
      Math.abs(box.left - bar.left) > 1 ||
      Math.abs(box.top - bar.top) > 1 ||
      Math.abs(box.width - Math.min(720, Math.max(360, bar.width))) > 1
    )
      problems.push(
        `${label}: on a computer the palette is a dropdown on the search bar (palette left ${Math.round(box.left)}, top ${Math.round(box.top)}, width ${Math.round(box.width)}; bar ${JSON.stringify(bar)})`,
      );
    if (box.height > box.vh * (2 / 3) + 1 || box.height < 240 - 1)
      problems.push(`${label}: the dropdown is ${Math.round(box.height)} px high, not 240 dp to 2/3 of the window (M3 specs)`);
    if (await page.evaluate(() => getComputedStyle(document.querySelector('[data-search-view-open]')).position !== 'fixed'))
      problems.push(`${label}: the dropdown is not on top of the page`);
  }
  if (box.sideways) problems.push(`${label}: the page scrolls sideways with the palette open`);
  if (!(await input.evaluate((el) => el === document.activeElement)))
    problems.push(`${label}: the focus is not in the field when it opens`);
  if ((await view.getAttribute('aria-label')) !== 'Search actions and pages')
    problems.push(`${label}: the palette is not named "Search actions and pages"`);

  // On a computer it is a dropdown, not a layer: a press outside it closes it (and the page behind it was not inert), then the button opens it again.
  if (!touch) {
    if (await page.evaluate(() => !!document.querySelector('[inert]')))
      problems.push(`${label}: something is inert behind the dropdown (it must not be modal)`);
    await page.mouse.click(box.vw - 4, box.vh / 2);
    await shut('after a press outside it');
    await button.click();
    await view.waitFor({ timeout: 5000 });
    await page.waitForTimeout(300);
  }
  // Before typing: Suggested, the first places of the menu, 48 px rows, the first one highlighted, the count read aloud.
  const first = await groups();
  const n = await options.count();
  if (first.join() !== 'Suggested' || n < 1 || n > 6)
    problems.push(`${label}: before typing the palette shows ${JSON.stringify(first)} with ${n} options, not Suggested with 1 to 6`);
  // Nothing looks selected or focused when it opens: the highlight (the arrow keys' option, aria-activedescendant) starts after a key or the pointer.
  if (await active()) problems.push(`${label}: an option is highlighted as soon as the palette opens (${await active()})`);
  if (await view.locator('[role=option][aria-selected=true]').count())
    problems.push(`${label}: an option is drawn selected as soon as the palette opens`);
  if (
    await page.evaluate(
      () => document.activeElement?.closest('[data-search-view-open]') !== null && document.activeElement?.tagName !== 'INPUT',
    )
  )
    problems.push(`${label}: a control other than the field has the focus when the palette opens`);
  if ((await live.textContent()) !== `${n} results`)
    problems.push(`${label}: the live region says "${await live.textContent()}" for ${n} options`);
  const heights = await options.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  if (heights.some((h) => h < 47.5)) problems.push(`${label}: an option is lower than 48 px (${heights.map(Math.round)})`);
  const bars = await view
    .locator('.mo-search-view__header button')
    .evaluateAll((els) =>
      els.map((b) => Math.max(b.getBoundingClientRect().height, parseFloat(getComputedStyle(b, '::after').height) || 0)),
    );
  if (bars.some((h) => h < 47.5)) problems.push(`${label}: a button of the field's row is lower than 48 px (${bars.map(Math.round)})`);
  // The arrow keys move the highlight, the focus stays in the field.
  await page.keyboard.press('ArrowDown');
  if (!(await activeIs(0))) problems.push(`${label}: ArrowDown does not go to the first option`);
  await page.keyboard.press('ArrowDown');
  if (!(await activeIs(1))) problems.push(`${label}: ArrowDown does not move to the second option`);
  await page.keyboard.press('ArrowUp');
  if (!(await activeIs(0))) problems.push(`${label}: ArrowUp does not move back to the first option`);
  await page.keyboard.press('End');
  if (!(await activeIs(n - 1))) problems.push(`${label}: End does not go to the last option`);
  // Escape closes it, and the focus is back on the button.
  await page.keyboard.press('Escape');
  await shut('after Escape');
  if (!(await page.evaluate(() => !!document.activeElement?.matches('header button[aria-label="Search"], [data-search-bar-button]'))))
    problems.push(`${label}: after Escape the focus is on ${await focusOn()}, not the search button`);

  // A place of the menu is found by its name; Enter goes there, closes the palette and puts the focus on the screen's heading.
  await page.keyboard.press('Control+k');
  await view.waitFor({ timeout: 5000 });
  await page.keyboard.type('files');
  await page.waitForTimeout(250);
  const files = { groups: await groups(), names: await names(), live: await live.textContent() };
  if (files.groups[0] !== 'Go to' || !/^Files/.test(files.names[0] ?? ''))
    problems.push(`${label}: "files" finds ${JSON.stringify(files.names)} in ${JSON.stringify(files.groups)}, not Files first under Go to`);
  if (files.live !== `${files.names.length === 1 ? '1 result' : `${files.names.length} results`}`)
    problems.push(`${label}: the live region says "${files.live}" for ${files.names.length} results`);
  await page.keyboard.press('Enter');
  await shut('after Enter');
  await page.waitForTimeout(500);
  if ((await page.evaluate(() => location.hash)) !== '#files')
    problems.push(`${label}: Enter on Files goes to ${await page.evaluate(() => location.hash)}, not #files`);
  const heading = await page.evaluate(() => `${document.activeElement?.tagName}:${document.activeElement?.textContent?.trim()}`);
  if (!/^H1:\S/.test(heading)) problems.push(`${label}: after Go to the focus is on "${heading}", not on the screen's heading`);

  // Next time the search typed is first, under Recent searches (history icon, a button that removes it), then what was run, under Recent.
  await button.click();
  await view.waitFor({ timeout: 5000 });
  await page
    .waitForFunction(
      () => document.querySelector('[data-search-controlled] .mo-search-view__group-label')?.textContent === 'Recent searches',
      null,
      { timeout: 3000 },
    )
    .catch(() => {});
  const again = await groups();
  const againNames = await names();
  if (again[0] !== 'Recent searches' || againNames[0] !== 'files')
    problems.push(
      `${label}: the next time Recent searches does not have "files" first: ${JSON.stringify(again)} ${JSON.stringify(againNames)}`,
    );
  if (again[1] !== 'Recent' || !/^Files/.test(againNames[1] ?? ''))
    problems.push(`${label}: Recent does not have Files after Recent searches: ${JSON.stringify(again)} ${JSON.stringify(againNames)}`);
  if (!(await options.first().locator('.mo-list__item-leading svg').count()))
    problems.push(`${label}: a recent search has no history icon`);
  if (!(await view.locator('button[aria-label^="Remove"]').count()))
    problems.push(`${label}: a recent search has no button that removes it`);

  // Material 3's search (spec: contained style): the bar is a filled pill 56 px high in its own container, not a bare list; every row leads with an
  // icon or a picture; the keyboard's search key submits; a group has its name over it; the chips and the last row come with a query.
  const look = await view.evaluate((el) => {
    const bar = el.querySelector('.mo-search-view__header');
    const bs = getComputedStyle(bar);
    const r = bar.getBoundingClientRect();
    const transparent = (c) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent';
    const docked = el.classList.contains('mo-search-view__docked');
    // The container of the lists: the view itself full screen, the results container under the bar docked (M3: the bar and the results, 2dp apart).
    const container = docked ? el.querySelector('.mo-search-view__body') : el;
    const gap = docked ? el.querySelector('.mo-search-view__body').getBoundingClientRect().top - r.bottom : null;
    return {
      docked,
      gap,
      barHeight: r.height,
      barRadius: parseFloat(bs.borderTopLeftRadius),
      barFilled: !transparent(bs.backgroundColor) && (docked || bs.backgroundColor !== getComputedStyle(container).backgroundColor),
      viewFilled: !transparent(getComputedStyle(container).backgroundColor),
      barMargin: r.left - el.getBoundingClientRect().left,
      hint: el.querySelector('input[role=combobox]').enterKeyHint,
    };
  });
  if (Math.abs(look.barHeight - 56) > 0.5) problems.push(`${label}: the search bar is ${look.barHeight} px high, not 56 (M3 specs)`);
  if (look.barRadius < 28) problems.push(`${label}: the search bar is not a pill (radius ${look.barRadius})`);
  if (!look.barFilled) problems.push(`${label}: the search bar has no container of its own: the page is a bare list`);
  if (!look.viewFilled) problems.push(`${label}: the search view has no container colour`);
  // M3 tokens: "Search view contained leading margin 12dp" full screen; docked, the bar stands where the bar was, and "docked bar results gap 2dp".
  if (Math.abs(look.barMargin - (look.docked ? 0 : 12)) > 0.5)
    problems.push(`${label}: the focused search bar is ${look.barMargin} px from the view's edge, not ${look.docked ? 0 : 12} (M3 tokens)`);
  if (look.docked && Math.abs(look.gap - 2) > 0.5)
    problems.push(`${label}: the gap between the bar and the results is ${look.gap} px, not 2 (M3 tokens)`);
  if (look.hint !== 'search') problems.push(`${label}: the keyboard's key is "${look.hint}", not "search"`);
  const leadingOf = () =>
    options.evaluateAll((els) => els.map((e) => !!e.querySelector('.mo-list__item-leading svg, .mo-list__item-leading img')));
  if ((await leadingOf()).some((x) => !x))
    problems.push(`${label}: before typing a row has no leading icon ${JSON.stringify(await leadingOf())}`);
  if (await view.locator('.mo-search-view__filters').count()) problems.push(`${label}: the filter chips show before typing`);
  // A recent search runs again when it is pressed; Delete removes the one the arrows are on.
  await options.first().click();
  await page.waitForTimeout(250);
  if ((await input.inputValue()) !== 'files')
    problems.push(`${label}: a recent search does not run again (the field says "${await input.inputValue()}")`);
  await input.fill('s');
  await page.waitForTimeout(300);
  const chips = await view.locator('.mo-search-view__filters .mo-chip').allTextContents();
  if (chips.join() !== 'Actions,Pages,Posts,Images,Files') problems.push(`${label}: the filter chips are ${JSON.stringify(chips)}`);
  // A chip is not greyed out when something fits it: the pages of this site fit "pages" (the first 30 results are not all of them).
  const chipOff = await view.locator('.mo-search-view__filters .mo-chip:disabled').count();
  const pageHit = pageTitle ? pageTitle.trim().split(/\s+/)[0].slice(0, 3) : '';
  if (pageHit) {
    await input.fill(pageHit);
    await page.waitForTimeout(300);
    const pagesChip = view.locator('.mo-search-view__filters .mo-chip', { hasText: /^Pages$|^Posts$/ });
    const enabled = await pagesChip.evaluateAll((els) => els.filter((e) => !e.disabled).length);
    if (!enabled) problems.push(`${label}: no Pages or Posts chip is enabled for "${pageHit}", the first word of the page "${pageTitle}"`);
    await input.fill('s');
    await page.waitForTimeout(300);
  }
  void chipOff;
  if ((await view.locator('.mo-search-view__group-label').count()) < 1) problems.push(`${label}: the results have no group name over them`);
  if ((await leadingOf()).some((x) => !x)) problems.push(`${label}: a result has no leading icon ${JSON.stringify(await leadingOf())}`);
  const last = (await names()).at(-1) ?? '';
  if (last !== 'All search results for “s”') problems.push(`${label}: the last row is "${last}", not "All search results for “s”"`);
  // The chip Actions narrows the results to actions; pressing it again clears it.
  await view.locator('.mo-search-view__filters .mo-chip', { hasText: 'Actions' }).click();
  await page.waitForTimeout(250);
  if (!(await input.evaluate((el) => el === document.activeElement)))
    problems.push(`${label}: a filter chip took the focus from the field`);
  // The last row shows all the results and goes away.
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  if ((await names()).some((n) => n.startsWith('All search results')))
    problems.push(`${label}: the last row is still there after it was pressed`);
  if (!(await view.count())) problems.push(`${label}: the last row closed the view, it should show all the results`);
  await input.fill('');
  await page.waitForTimeout(250);
  // Delete removes the recent search the arrows are on.
  const before = (await names()).length;
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Delete');
  await page.waitForTimeout(250);
  if ((await names()).length !== before - 1) problems.push(`${label}: Delete does not remove the recent search`);
  await page.keyboard.press('Escape');
  await shut('after the searches');
  await button.click();
  await view.waitFor({ timeout: 5000 });
  // A page is found by its title, under Pages and posts.
  if (!pageTitle) problems.push(`${label}: the site has no page to find (the pages list is empty)`);
  else {
    await input.fill(pageTitle);
    await page.waitForTimeout(250);
    const pages = { groups: await groups(), names: await names() };
    if (!pages.groups.includes('Pages and posts') || !pages.names.includes(pageTitle))
      problems.push(
        `${label}: "${pageTitle}" finds ${JSON.stringify(pages.names)} in ${JSON.stringify(pages.groups)}, not that page under Pages and posts`,
      );
  }
  // Nothing found says so, and the field keeps the focus.
  await input.fill('zzzzqq');
  await page.waitForTimeout(250);
  const none = view.locator('.mo-search-view__empty');
  if (!(await none.isVisible()) || (await none.textContent()) !== 'Nothing found for “zzzzqq”')
    problems.push(`${label}: nothing found does not say so ("${await none.textContent()}")`);
  if ((await live.textContent()) !== 'Nothing found')
    problems.push(`${label}: the live region says "${await live.textContent()}", not "Nothing found"`);
  if (!(await input.evaluate((el) => el === document.activeElement)))
    problems.push(`${label}: the field lost the focus when nothing was found`);
  await page.keyboard.press('Escape');
  await shut('after nothing found');

  // The key opens it, also with the cursor in text, and a second press closes it; Escape gives the focus back to the text.
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Control+k');
  await view.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: Ctrl+K does not open the palette with the cursor in text`));
  if (await view.count()) {
    if (await page.evaluate(() => document.querySelector('.ProseMirror')?.textContent?.includes('k')))
      problems.push(`${label}: Ctrl+K typed a letter into the text`);
    await page.keyboard.press('Control+k');
    await shut('after a second Ctrl+K');
    await page.keyboard.press('Control+k');
    await view.waitFor({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await shut('after Escape');
    if (!(await page.evaluate(() => !!document.activeElement?.closest('.ProseMirror'))))
      problems.push(`${label}: after Escape the focus is not back in the text (it is on ${await focusOn()})`);
  }

  await page.close();
}

/** The text's actions in the palette (src/textActions.ts, spec section 6): with words selected in text, "bold" lists Bold first, Enter makes the selected words bold and the focus is
 * back in the text; the search button keeps the selection too (it does not take the focus off the text); Italic is found by its name and shows its key. */
async function checkEditorActions(width) {
  const label = `${width}px editor actions`;
  const touch = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 812 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  const view = page.locator('[data-search-controlled] [data-search-view-open]');
  const input = view.locator('input[role=combobox]');
  const options = view.locator('[role=option]');
  const names = () => options.evaluateAll((els) => els.map((e) => e.querySelector('.mo-list__item-headline')?.textContent ?? ''));
  const shut = async (why) => {
    await page.waitForTimeout(250);
    if (await view.count()) problems.push(`${label}: the palette is still open ${why}`);
  };
  // Outside a text there is no Bold.
  await page.waitForTimeout(400);
  await page.keyboard.press('Control+k');
  await view.waitFor({ timeout: 5000 });
  await input.fill('bold');
  await page.waitForTimeout(250);
  if ((await names()).includes('Bold')) problems.push(`${label}: Bold is offered outside a text`);
  await page.keyboard.press('Escape');
  await shut('after Escape outside a text');
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello world');
  await page.keyboard.press('Shift+Home');
  const bold = () => page.evaluate(() => document.querySelector('.ProseMirror strong, .ProseMirror b')?.textContent ?? '');

  // Through the search button the selection stays, and Bold is first for "bold".
  {
    await page.locator(':is(header button[aria-label="Search"], [data-search-bar-button]):visible').click();
    await view.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the button does not open the palette`));
    if (!(await view.count())) return page.close();
    await page.waitForTimeout(300);
    await page.keyboard.type('bold');
    await page.waitForTimeout(250);
    const found = await names();
    if (found[0] !== 'Bold') problems.push(`${label}: "bold" finds ${JSON.stringify(found)}, not Bold first`);
    await page.keyboard.press('Enter');
    await shut('after Enter on Bold');
    await page.waitForTimeout(400);
    if (!/Hello world/.test(await bold())) problems.push(`${label}: Enter on Bold made "${await bold()}" bold, not the selected words`);
    if (!(await page.evaluate(() => !!document.activeElement?.closest('.ProseMirror'))))
      problems.push(`${label}: after Bold the focus is not back in the text`);
  }

  // Ctrl+K in text: Italic is found, shows its key, and is run.
  await page.keyboard.press('Control+k');
  await view.waitFor({ timeout: 5000 });
  await input.fill('italic');
  await page.waitForTimeout(250);
  const italic = await names();
  if (italic[0] !== 'Italic') problems.push(`${label}: "italic" finds ${JSON.stringify(italic)}, not Italic first`);
  const keys = await options
    .first()
    .evaluate(
      (e) => e.getAttribute('aria-keyshortcuts') ?? e.querySelector('[aria-keyshortcuts]')?.getAttribute('aria-keyshortcuts') ?? '',
    );
  if (!/I/.test(keys)) problems.push(`${label}: Italic shows no key (aria-keyshortcuts "${keys}")`);
  await page.keyboard.press('Escape');
  await shut('after Escape');

  await page.close();
}

/** The palette's last two parts (src/CommandPalette.tsx, ShortcutsSheet.tsx; spec sections 4.6 and 5.4): the action *Keyboard shortcuts* opens a sheet that lists the key of the
 * search (Ctrl+K) and of every registered action that has one (Bold, Ctrl+B, with a text open); *Clear recent actions* forgets what this browser kept; and signing out forgets it too. */
async function checkPaletteLast(width) {
  const label = `${width}px palette shortcuts and recent`;
  const touch = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 812 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.waitForSelector(':is(header button[aria-label="Search"], [data-search-bar-button]):visible', { timeout: 15_000 });
  const view = page.locator('[data-search-controlled] [data-search-view-open]');
  const input = view.locator('input[role=combobox]');
  const options = view.locator('[role=option]');
  const names = () => options.evaluateAll((els) => els.map((e) => e.querySelector('.mo-list__item-headline')?.textContent ?? ''));
  const kept = () => page.evaluate(() => localStorage.getItem('editor-recent-actions'));
  const shut = async (why) => {
    await page.waitForTimeout(300);
    if (await view.count()) problems.push(`${label}: the palette is still open ${why}`);
  };
  const run = async (query, first) => {
    await page.keyboard.press('Control+k');
    await view.waitFor({ timeout: 5000 });
    await input.fill(query);
    await page.waitForTimeout(250);
    const found = await names();
    if (found[0] !== first) problems.push(`${label}: "${query}" finds ${JSON.stringify(found)}, not ${first} first`);
    await page.keyboard.press('Enter');
    await shut(`after ${first}`);
    await page.waitForTimeout(300);
  };

  // A text is open: its keys are in the list, with the search's.
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await run('keyboard shortcuts', 'Keyboard shortcuts');
  const wanted = [/Search actions and pages.*Ctrl\+K/, /Bold.*Ctrl\+B/, /Italic.*Ctrl\+I/];
  const missing = (rows) => wanted.filter((want) => !rows.some((r) => want.test(r ?? ''))).map(String);
  if (touch) {
    // A phone: a page with a back arrow (owner, 15 Nov), not a sheet; the rows are the ones registered when the action ran.
    await page
      .waitForFunction(() => location.hash === '#shortcuts', null, { timeout: 5000 })
      .catch(() => problems.push(`${label}: on a phone the action does not go to the page #shortcuts `));
    if (await page.locator('dialog[open]').count()) problems.push(`${label}: on a phone the list is an overlay, not a page`);
    const rows = await page.locator('main li').evaluateAll((els) => els.map((e) => e.textContent?.replace(/\s+/g, ' ').trim()));
    if (missing(rows).length) problems.push(`${label}: the page lacks ${missing(rows)} (${JSON.stringify(rows)})`);
    // The title takes the focus for screen readers, but shows no ring: it is not a control.
    const ring = await page.evaluate(() => {
      const h = document.activeElement;
      return h?.tagName === 'H1' ? getComputedStyle(h).outlineStyle : 'not on the heading';
    });
    if (ring !== 'none') problems.push(`${label}: the shortcuts page's title shows a focus ring (outline ${ring})`);
    const back = page.locator('header a[href="#"]:visible').first();
    if (!(await back.count())) problems.push(`${label}: the shortcuts page has no back arrow to the start screen`);
    else {
      await back.click();
      await page.waitForTimeout(300);
      if ((await page.evaluate(() => location.hash)) !== '') problems.push(`${label}: the back arrow does not leave the shortcuts page`);
    }
  } else {
    const sheet = page.locator('dialog[open][aria-label="Keyboard shortcuts"]');
    await sheet.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the shortcuts sheet does not open`));
    if (await sheet.count()) {
      const rows = await sheet.locator('li').evaluateAll((els) => els.map((e) => e.textContent?.replace(/\s+/g, ' ').trim()));
      if (missing(rows).length) problems.push(`${label}: the list lacks ${missing(rows)} (${JSON.stringify(rows)})`);
      // No control has the focus when it opens (the close button does not show a ring).
      const on = await page.evaluate(() => document.activeElement?.tagName);
      if (on === 'BUTTON') problems.push(`${label}: the shortcuts dialog opens with a button focused`);
      // A dialog in the middle of the screen has no drag handle (the handle belongs to a sheet from the bottom).
      if (
        await sheet.locator('.mo-bottom-sheet__drag-handle').evaluateAll((els) => els.some((e) => getComputedStyle(e).display !== 'none'))
      )
        problems.push(`${label}: the shortcuts dialog shows a drag handle`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      if (await sheet.count()) problems.push(`${label}: Escape does not close the shortcuts sheet`);
    }
  }

  // Running the shortcuts action was kept as recent; Clear recent actions forgets it.
  if (!(await kept())) problems.push(`${label}: nothing was kept after running an action`);
  await page.evaluate(() => (location.hash = '#'));
  await page.waitForTimeout(400);
  await run('clear recent', 'Clear recent actions');
  await page.waitForTimeout(300);
  const after = await kept();
  const clearedOnly = after ? JSON.parse(after).ids : [];
  if (clearedOnly.length > 1 || (clearedOnly[0] && clearedOnly[0] !== 'palette.clear-recent'))
    problems.push(`${label}: Clear recent actions leaves ${after}`);

  // Signing out forgets what is kept.
  await page.evaluate(() =>
    localStorage.setItem('editor-recent-actions', JSON.stringify({ ids: ['go.files'], counts: { 'go.files': 1 } })),
  );
  await page.evaluate(() => (location.hash = '#account'));
  await page
    .getByText('Log out', { exact: true })
    .first()
    .click({ timeout: 10_000 })
    .catch(() => problems.push(`${label}: no Log out on the account screen`));
  await page.waitForTimeout(600);
  if (await kept()) problems.push(`${label}: signing out leaves the recent actions in this browser`);
  await page.close();
}

/** No custom context menu (owner, 13 Nov; spec section 5): a right click (a `contextmenu` event that can be cancelled) in the text, on a row of a List and in a table cell is not
 * prevented, so the browser's own menu opens. */
async function checkNoContextMenu(width) {
  const label = `${width}px no context menu`;
  const touch = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 812 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const prevented = (selector) =>
    page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return 'missing';
      const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 12, clientY: 12, button: 2 });
      el.dispatchEvent(e);
      return e.defaultPrevented;
    }, selector);
  const check = async (what, selector) => {
    const got = await prevented(selector);
    if (got === 'missing') problems.push(`${label}: ${what} is not there to right click`);
    else if (got) problems.push(`${label}: a right click on ${what} is prevented, so the browser's menu does not open`);
  };
  await check('the text', '.ProseMirror p');
  await pressInsert(page, touch ? 'tap' : 'click');
  await page.locator('dialog[open] button', { hasText: 'Rows with icon, heading and text.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active', { timeout: 8000 });
  await check('a row of a List', '.mo-editor-inline-list-row-active');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  await page.click('.ProseMirror');
  await page.keyboard.press('Control+End');
  await page.keyboard.press('Enter');
  await pressInsert(page, touch ? 'tap' : 'click');
  await page.locator('dialog[open] button', { hasText: 'Rows and columns of text.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-table-cell-active textarea', { timeout: 8000 });
  await check('a table cell', '.mo-editor-inline-table-cell-active textarea');
  await page.close();
}

/** The icon picker of a List row (the slot before the title, a sheet on a phone): the first view has the "No icon" tile and the 28 icons, the search field finds an icon of the whole set, Material Symbols' ("arrow back") and no Phosphor's ("acorn": not while Material Symbols is the pack), a picked one is drawn in the slot (stored by its name, drawn by the site as the fallback), a search without a hit says so, a category filters (with the search too) 100 icons at a time with "Show more", and the sheet fits the width. */
async function checkIconSearch(width, height) {
  const label = `${width}px icon search`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await pressInsert(page, 'tap');
  await page.locator('dialog[open] button', { hasText: 'Rows with icon, heading and text.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  await page.keyboard.type('First');
  await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot').first().tap();
  const picker = page.getByRole('group', { name: 'Icon', exact: true }).last();
  await picker.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the icon picker did not open`));
  const first = await picker.getByRole('button').count();
  if (first !== 29) problems.push(`${label}: the first view has ${first} tiles instead of 29 (No icon and 28 icons)`);
  if ((await picker.getByRole('button').first().getAttribute('aria-label')) !== 'No icon')
    problems.push(`${label}: the first tile is not "No icon"`);
  const search = page.getByRole('searchbox', { name: 'Search icons' });
  if (!(await search.count())) return (problems.push(`${label}: no search field "Search icons"`), page.close());
  const box = await search.boundingBox();
  if (!box || box.x < 0 || box.x + box.width > width) problems.push(`${label}: the search field is outside the screen`);
  await search.fill('zzzqqq');
  // In the picker only: the announcer's hidden region says it too.
  await page
    .locator('.mo-editor-icon-picker-status')
    .getByText('No icons found', { exact: true })
    .waitFor({ timeout: 8000 })
    .catch(() => problems.push(`${label}: no "No icons found" for a search without a hit`));
  await search.fill('arrow back');
  const hit = picker.getByRole('button', { name: 'arrow back', exact: true });
  await hit.waitFor({ timeout: 8000 }).catch(() => problems.push(`${label}: the search "arrow back" did not find the icon arrow back`));
  if ((await picker.getByRole('button').count()) > 100) problems.push(`${label}: more than one page (100) of icons is drawn at once`);
  // A category: the chips scroll, the first load is 100 icons, "Show more" loads 100 more; the category and the search combine.
  await search.fill('');
  const chip = page.getByRole('button', { name: 'Devices', exact: true });
  await chip.scrollIntoViewIfNeeded().catch(() => {});
  await chip.tap().catch(() => problems.push(`${label}: no category chip "Devices"`));
  await page.waitForTimeout(400);
  const loaded = () => picker.getByRole('button').count();
  if ((await loaded()) !== 100) problems.push(`${label}: category Devices loaded ${await loaded()} icons first, not 100`);
  // "Show more" (clicked without a scroll, which would load the next page by itself) loads 100 more; reaching the end of them loads more again.
  const showMore = page.getByRole('button', { name: 'Show more', exact: true });
  if (!(await showMore.count())) problems.push(`${label}: no "Show more" under 100 icons`);
  await showMore.evaluate((b) => b.click()).catch(() => {});
  await page.waitForTimeout(400);
  if ((await loaded()) !== 200) problems.push(`${label}: "Show more" left ${await loaded()} icons, not 200`);
  await showMore.evaluate((b) => b.scrollIntoView({ block: 'center' })).catch(() => {});
  await page.waitForTimeout(800);
  if ((await loaded()) <= 200) problems.push(`${label}: scrolling to the end of 200 icons loaded none more (${await loaded()})`);
  await search.fill('phone');
  await page.waitForTimeout(400);
  const names = await picker.getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  if (!names.length || names.some((n) => n && n !== 'No icon' && !n.toLowerCase().includes('phone')))
    problems.push(`${label}: category Devices with the search "phone" shows icons that are not phones`);
  await page
    .getByRole('button', { name: 'Suggested', exact: true })
    .scrollIntoViewIfNeeded()
    .catch(() => {});
  await page
    .getByRole('button', { name: 'Suggested', exact: true })
    .tap()
    .catch(() => {});
  // Owner rule: Phosphor's own icons are in the search only when Phosphor is the icon pack in use (acorn: Material Symbols has none of that name); with Phosphor in use, the search finds it.
  await search.fill('acorn');
  await page.waitForTimeout(1500);
  const acorn = acornProblem(PACK, label, (await picker.getByRole('button', { name: 'acorn', exact: true }).count()) > 0);
  if (acorn) problems.push(acorn);
  await search.fill('arrow back');
  await hit.waitFor({ timeout: 8000 }).catch(() => {});
  await hit.tap().catch(() => {});
  await page.waitForTimeout(500);
  const drawn = await page.evaluate(() =>
    document.querySelector('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot svg')?.getAttribute('data-icon-fallback'),
  );
  if (drawn !== 'arrow_back') problems.push(`${label}: the picked icon is "${drawn}" in the row, not arrow_back`);
  await page.close();
}

/** The ring on the search view's field is for the keyboard only (owner, 21 Nov 2026; theme/ui/inputModality.ts, search.css): opened with a mouse click the bar draws no ring
 * although the field has the focus (a text field matches :focus-visible then too); opened with the keyboard (Tab to the bar, Enter) it draws M3's focus indicator. */
async function checkSearchRing(width) {
  const label = `${width}px search field ring`;
  const page = await browser.newPage({ viewport: { width, height: 812 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  const opener = page.locator('.mo-editor-palette-bar button:visible, button[aria-keyshortcuts*="K"]:visible').first();
  const ring = () =>
    page.evaluate(() => {
      const view = [...document.querySelectorAll('.mo-search-view')].find((e) => e.getBoundingClientRect().height > 0);
      const input = view?.querySelector('.mo-search-view__input');
      return {
        focused: input === document.activeElement,
        shadow: view ? getComputedStyle(view.querySelector('.mo-search-view__header')).boxShadow : 'no view',
      };
    });
  for (const how of ['mouse', 'keyboard']) {
    if (how === 'mouse') await opener.click();
    else {
      await opener.focus();
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(500);
    const r = await ring();
    if (!r.focused) problems.push(`${label} (${how}): the field has no focus`);
    const drawn = r.shadow !== 'none' && r.shadow !== 'no view';
    if (how === 'mouse' && drawn) problems.push(`${label}: a ring is drawn after a mouse click (${r.shadow})`);
    if (how === 'keyboard' && !drawn) problems.push(`${label}: no ring after opening with the keyboard`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  await page.close();
}

export function register(unit) {
  for (const width of [375, 1280])
    for (const locale of ['en-US', 'da-DK']) unit(`search view parts ${width} ${locale}`, () => checkSearchViewParts(width, locale));
  for (const width of [375, 1280]) unit(`search field ring ${width}`, () => checkSearchRing(width));
  for (const width of [375, 1280]) unit(`search button ${width}`, () => checkSearchButton(width));
  for (const width of [375, 1280]) unit(`command palette ${width}`, () => checkCommandPalette(width));
  for (const width of [375, 1280]) unit(`editor actions ${width}`, () => checkEditorActions(width));
  for (const width of [375, 1280]) unit(`palette shortcuts and recent ${width}`, () => checkPaletteLast(width));
  for (const width of [375, 1280]) unit(`no context menu ${width}`, () => checkNoContextMenu(width));
  for (const [width, height] of [
    [360, 740],
    [375, 740],
    [390, 844],
    [414, 896],
  ])
    unit(`checkIconSearch ${width}`, () => checkIconSearch(width, height));
}
