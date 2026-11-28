import { join } from 'node:path';
import { openEditor } from '../built-site.mjs';
import { blocksOf, browser, has, problems, shots, site } from './support/context.mjs';
import { chooseKind, onTestPage, pressInsert } from './support/shared.mjs';
import { isMaterialTheme } from '../theme-statement.mjs';
import { pageLanguage } from './support/page-language.mjs';

/** Scrolling a carousel never forces a layout (the flicker on a fast swipe): while the row scrolls, the layout script reads no offsetLeft, offsetWidth, scrollWidth or getBoundingClientRect, and a frame that moves nothing writes no style. Where the browser has scroll-driven animations (ScrollTimeline) the items' growing and shrinking is tied to the scroll by the browser (data-carousel-driven="scroll"), so the script writes no style at all while the row scrolls (the owner's phone: the item did not grow smoothly while a swipe ran the script on every frame; before, 1000 to 3800 style writes and 400 to 750 ms of style work in four swipes at 4x CPU). Every carousel on the Blocks page, 375 px, touch. */
async function checkCarouselScrollCost() {
  const label = '375px carousel scroll cost';
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const n = await page.locator('[data-carousel-items]').count();
  for (let k = 0; k < n; k++) {
    const r = await page.evaluate(async (idx) => {
      const row = document.querySelectorAll('[data-carousel-items]')[idx];
      const reads = [];
      const spy = (proto, name) => {
        const d = Object.getOwnPropertyDescriptor(proto, name);
        Object.defineProperty(proto, name, {
          configurable: true,
          get() {
            reads.push(name);
            return d.get.call(this);
          },
        });
        return () => Object.defineProperty(proto, name, d);
      };
      const undo = [
        spy(HTMLElement.prototype, 'offsetLeft'),
        spy(HTMLElement.prototype, 'offsetWidth'),
        spy(Element.prototype, 'scrollWidth'),
      ];
      const gbr = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        reads.push('getBoundingClientRect');
        return gbr.call(this);
      };
      const max = row.scrollWidth - row.clientWidth;
      const carousel = row.closest('[data-carousel]');
      const scripted = ['multi-browse', 'hero'].includes(carousel.dataset.carouselLayout);
      let writes = 0;
      const watch = new MutationObserver((l) => (writes += l.length));
      watch.observe(carousel, { attributes: true, attributeFilter: ['style'], subtree: true });
      // One warm-up scroll first: a row is measured once when it is first shown or resized, which is not what is checked.
      row.style.scrollSnapType = 'none';
      row.scrollLeft = max * 0.1;
      await new Promise((res) => setTimeout(res, 300));
      watch.takeRecords();
      writes = 0;
      reads.length = 0;
      for (const f of [0.25, 0.6, 0.9, 0.3]) {
        row.style.scrollSnapType = 'none';
        row.scrollLeft = max * f;
        await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      }
      writes += watch.takeRecords().length;
      watch.disconnect();
      undo.forEach((u) => u());
      Element.prototype.getBoundingClientRect = gbr;
      row.style.scrollSnapType = '';
      return {
        max,
        reads: [...new Set(reads)],
        writes,
        scripted,
        driven: carousel.dataset.carouselDriven === 'scroll',
        supported: typeof ScrollTimeline === 'function',
      };
    }, k);
    if (r.max > 0 && r.reads.length)
      problems.push(`${label}: carousel ${k} reads ${r.reads.join(', ')} while it scrolls, which forces a layout each frame`);
    if (r.max > 0 && r.scripted && r.supported && !r.driven)
      problems.push(
        `${label}: carousel ${k} is not tied to the scroll by the browser (no data-carousel-driven="scroll"), so its items follow the finger a frame late`,
      );
    if (r.max > 0 && r.scripted && r.supported && r.writes)
      problems.push(
        `${label}: carousel ${k} writes style ${r.writes} times while it scrolls (limit 0): the script runs on every scroll frame and each write costs a style recalculation, a layout of the text and a paint`,
      );
  }
  await page.close();
}

/** The gap between two cards of a carousel stays the carousel's gap on the whole way, not only at rest (the owner's phone, 27 Nov 2026: "the distance between cards ... differs": a card that entered or left at the row's edge trailed 16 px from its neighbour, twice the gap, because the item outside the row stood where the padding ends). Every multi-browse and hero carousel on the Blocks page, the row scrolled in steps from its start to its end: the visible edges of two cards next to each other (their masks less the clipped part) are one gap apart. */
async function checkCarouselGap(width, height) {
  const label = `${width}px carousel gap`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const n = await page.locator('[data-carousel-items]').count();
  for (let k = 0; k < n; k++) {
    const r = await page.evaluate(async (idx) => {
      const row = document.querySelectorAll('[data-carousel-items]')[idx];
      const carousel = row.closest('[data-carousel]');
      if (!['multi-browse', 'hero'].includes(carousel.dataset.carouselLayout)) return null;
      const max = row.scrollWidth - row.clientWidth;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const masks = [...carousel.querySelectorAll('[data-carousel-mask]')];
      if (max <= 0 || masks.length < 2) return null;
      row.style.scrollSnapType = 'none';
      row.style.scrollBehavior = 'auto';
      const frame = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      let worst = { diff: 0 };
      for (let s = 0; s <= max + 5; s += 5) {
        row.scrollLeft = Math.min(s, max);
        await frame();
        const window_ = row.getBoundingClientRect();
        const edges = masks.map((m) => {
          const b = m.getBoundingClientRect();
          const inset = Number(/inset\(\S+ (-?[\d.]+)px/.exec(getComputedStyle(m).clipPath)?.[1] ?? 0);
          return { left: b.left + inset, right: b.right - inset };
        });
        const shown = (e) => e.right - e.left > 1 && e.right > window_.left && e.left < window_.right;
        for (let i = 1; i < edges.length; i++) {
          if (!shown(edges[i - 1]) || !shown(edges[i])) continue;
          const diff = Math.abs(edges[i].left - edges[i - 1].right - gap);
          if (diff > worst.diff) worst = { diff, at: Math.round(row.scrollLeft), pair: i, gap: edges[i].left - edges[i - 1].right };
        }
      }
      row.style.scrollSnapType = '';
      row.style.scrollBehavior = '';
      return { gap, worst, layout: carousel.dataset.carouselLayout };
    }, k);
    // `Show all` stands at the right under the row, its label on the content's edge (M3's picture of the carousel's accessibility), not centred.
    const all = await page.evaluate((idx) => {
      const row = document.querySelectorAll('[data-carousel-items]')[idx];
      const box = row.closest('[data-carousel-block]')?.querySelector('.mo-block-carousel__show-all');
      const button = box?.querySelector('button');
      if (!box || !button || getComputedStyle(box).display === 'none') return null;
      const text = document.createRange();
      text.selectNodeContents(button);
      return { label: text.getBoundingClientRect().right, edge: box.getBoundingClientRect().right };
    }, k);
    if (all && Math.abs(all.label - all.edge) > 1)
      problems.push(
        `${label}: carousel ${k}'s Show all label ends at ${Math.round(all.label)} px, not on the content's right edge at ${Math.round(all.edge)} px`,
      );
    if (r && r.worst.diff > 0.75)
      problems.push(
        `${label}: carousel ${k} (${r.layout}) has ${r.worst.gap.toFixed(1)} px between cards ${r.worst.pair - 1} and ${r.worst.pair} with the row at ${r.worst.at}, not its gap of ${r.gap} px`,
      );
  }
  await page.close();
}

/** The Carousel block (the demo's Blocks page, /blocks/carousel/), on every screen size: at 375 px the row scrolls sideways with one card whole and the next peeking in, as Material 3's uncontained carousel is measured (gap 8, 8 above and below, 16 from the edge, corners 28), labelled, with no page indicator (M3 prints none); each layout the block offers (`layout`: multi-browse, hero, center-aligned hero, full-screen) is on the page, its items with M3's 28dp corners, and `Show all` is under every one but the full-screen one; `Show all` stacks the cards in place and `Show fewer` returns them, focus kept; the arrow keys move between the cards. At 840 and 1280 px it is the same row, with more cards in view (the hero keeps one small item), `Show all` under it, and a full-screen carousel is the hero. */
async function checkCarousel(width, height) {
  const label = `${width}px carousel`;
  const phone = width < 600;
  // A full-screen carousel is a hero from 840 px and in landscape (FULL_SCREEN_AS_HERO); below that, in portrait, it is one item at a time.
  const stillFullScreen = width < 840 && height > width;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const root = page.locator('[data-carousel-block]:not(.mo-has-cards):not(.mo-has-header):not(:has([data-carousel-layout]))').first();
  if (!(await root.count())) return (problems.push(`${label}: no carousel on the Blocks page`), page.close());
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  // The page is in the site's language, whatever the browser's: the expected texts are the site's own, from its language files. The language is the
  // served `<html lang>`: the live attribute is rewritten to the browser's locale by the site's client script.
  const { lang, live, where } = await pageLanguage(page);
  // The browser is en-US, the site's language is not necessarily: the live attribute must equal the served one (the client script must not rewrite it).
  if (live !== lang) problems.push(`${label}: the live <html lang> is "${live}" but the server sent "${lang}"`);
  const say = blocksOf(lang).carousel;
  const m = await root.evaluate((el) => {
    const row = el.querySelector('[data-carousel-items]');
    const items = [...el.querySelectorAll('[data-carousel-item]')];
    const rowBox = row.getBoundingClientRect();
    const [a, b] = items.map((i) => i.getBoundingClientRect());
    const rs = getComputedStyle(row);
    const show = el.querySelector('[data-carousel-show-all]');
    return {
      display: rs.display,
      overflowX: rs.overflowX,
      scrolls: row.scrollWidth > row.clientWidth + 1,
      gap: rs.columnGap,
      padTop: rs.paddingTop,
      padBottom: rs.paddingBottom,
      padLeft: rs.paddingLeft,
      firstLeft: Math.round(a.left - rowBox.left),
      widths: items.map((i) => Math.round(i.getBoundingClientRect().width)),
      // The card fills its item even with a short text (a flex item would shrink to its text and leave an empty gap).
      cardWidths: items.map((i) => {
        const card = i.querySelector('.mo-block-carousel__item');
        const saved = [...card.querySelectorAll('.mo-block-carousel__item-text')].map((p) => [p, p.textContent]);
        saved.forEach(([p]) => (p.textContent = 'Short'));
        const w = Math.round(card.getBoundingClientRect().width);
        saved.forEach(([p, t]) => (p.textContent = t));
        return w;
      }),
      gaps: items.slice(1).map((i, n) => Math.round(i.getBoundingClientRect().left - items[n].getBoundingClientRect().right)),
      firstRight: Math.round(a.right),
      secondLeft: Math.round(b.left),
      radius: getComputedStyle(items[0].querySelector('.mo-block-carousel__item')).borderTopLeftRadius,
      // M3, Carousel: an item has no card surface and no outline, and its label sits inside it on the image (Overview: "Contain visual items like images or video, along with optional label text").
      surfaces: items.map((i) => {
        const item = i.querySelector('.mo-block-carousel__item');
        const s = getComputedStyle(item);
        const b = item.getBoundingClientRect();
        const label = item.querySelector('.mo-block-carousel__item-label')?.getBoundingClientRect();
        const media = item.querySelector('.mo-block-carousel__item-media')?.getBoundingClientRect();
        return {
          border: s.borderTopWidth,
          shadow: s.boxShadow,
          card: !!i.querySelector('.mo-card'),
          labelInside: !!label && label.left >= b.left - 1 && label.right <= b.right + 1 && label.bottom <= b.bottom + 1,
          mediaFills: !media || (Math.abs(media.width - b.width) < 1 && Math.abs(media.height - b.height) < 1),
          height: Math.round(b.height),
        };
      }),
      indicators: el.querySelectorAll('[data-carousel-indicator], [data-carousel-dot]').length,
      items: items.length,
      showAll: getComputedStyle(show.closest('.mo-block-carousel__show-all')).display,
      region: el.querySelector('[role="region"]')?.getAttribute('aria-label') ?? null,
      itemLabels: items.map((i) => i.getAttribute('aria-label')),
      pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  if (phone) {
    if (m.overflowX !== 'auto' || !m.scrolls) problems.push(`${label}: the row does not scroll sideways (${m.overflowX}, ${m.scrolls})`);
    if (m.firstRight > width || m.secondLeft >= width)
      problems.push(`${label}: the first card is not whole with the next peeking in (${m.firstRight}, ${m.secondLeft})`);
    if (isMaterialTheme() && m.gap !== '8px') problems.push(`${label}: the gap is ${m.gap}, not 8px`);
    if (isMaterialTheme() && (m.padTop !== '8px' || m.padBottom !== '8px'))
      problems.push(`${label}: the padding above and below is ${m.padTop} and ${m.padBottom}, not 8px`);
    if (isMaterialTheme() && m.padLeft !== '16px') problems.push(`${label}: the leading padding is ${m.padLeft}, not 16px`);
    // A card is the carousel's item and takes M3's item shape: extra-large, 28dp (Carousel, Specs: md.comp.carousel-item.container.shape; owner, 24 Nov 2026: "Follow md3").
    if (isMaterialTheme() && m.radius !== '28px')
      problems.push(`${label}: the card's corners are ${m.radius}, not Material 3's 28px for a carousel item`);
    if (m.surfaces.some((x) => x.card || x.border !== '0px' || x.shadow !== 'none'))
      problems.push(
        `${label}: an item has a card surface, an outline or a shadow (${JSON.stringify(m.surfaces[0])}), which Material 3's carousel item does not`,
      );
    if (m.surfaces.some((x) => !x.labelInside)) problems.push(`${label}: an item's label is not inside the item on the image`);
    if (m.surfaces.some((x) => !x.mediaFills)) problems.push(`${label}: an item's image does not fill the whole item`);
    // Uncontained (M3): every item is as wide as the others, no empty gap between them, and the next one peeks in.
    if (new Set(m.widths).size !== 1) problems.push(`${label}: the cards are not all as wide (${m.widths})`);
    if (m.cardWidths.some((w, i) => w !== m.widths[i]))
      problems.push(`${label}: a card is narrower than its item with a short text (${m.cardWidths} in ${m.widths}), leaving an empty gap`);
    if (m.widths[0] < width * 0.6) problems.push(`${label}: the first card is only ${m.widths[0]}px of ${width}px`);
    if (isMaterialTheme() && m.gaps.some((g) => g !== 8)) problems.push(`${label}: the gaps between the cards are ${m.gaps}, not 8px`);
    if (isMaterialTheme() && m.firstLeft !== 16) problems.push(`${label}: the first card is ${m.firstLeft}px from the edge, not 16px`);
    if (isMaterialTheme() && m.indicators)
      problems.push(`${label}: the carousel has a page indicator, which Material 3's carousel does not have`);
    if (!m.region) problems.push(`${label}: the carousel has no label`);
    if (m.itemLabels.join() !== m.itemLabels.map((_, i) => say.slideOf(i + 1, m.items)).join())
      problems.push(
        `${label}: the cards are labelled "${m.itemLabels}", not "${say.slideOf('n', m.items)}" (the page's language is "${lang}", read from ${where})`,
      );
    if (m.pageOverflow) problems.push(`${label}: the page scrolls sideways`);
    // The arrow keys move between the cards.
    await root.locator('[data-carousel-item]').first().focus();
    await page.keyboard.press('ArrowRight');
    const at = await root.evaluate((el) =>
      [...el.querySelectorAll('[data-carousel-item]')].indexOf(document.activeElement?.closest('[data-carousel-item]')),
    );
    if (at !== 1) problems.push(`${label}: ArrowRight moved the focus to card ${at}, not card 1`);
    await page.screenshot({ path: join(shots, `carousel-${width}.png`) });
  } else {
    // 0.19.8: the carousel is on every screen size, so a computer shows the row too, not the grid (owner: carousels on every screen size).
    if (m.display !== 'flex') problems.push(`${label}: on a computer the carousel is not a row (${m.display})`);
    if (m.overflowX !== 'auto') problems.push(`${label}: on a computer the row does not scroll sideways (${m.overflowX})`);
    if (m.pageOverflow) problems.push(`${label}: the page scrolls sideways`);
  }
  // "Show all" is under the carousel at every width (M3, Carousel, Accessibility) and stacks the cards in place.
  const button = root.locator('[data-carousel-show-all]');
  const shown = (await button.textContent())?.trim();
  if (shown !== say.showAll)
    problems.push(`${label}: the button says "${shown}", not "${say.showAll}" (the page's language is "${lang}", read from ${where})`);
  await button.click();
  await page.waitForTimeout(300);
  const open = await root.evaluate((el) => ({
    expanded: el.hasAttribute('data-expanded'),
    grid: getComputedStyle(el.querySelector('[data-carousel-items]')).display,
    text: el.querySelector('[data-carousel-show-all]').textContent.trim(),
    pressed: el.querySelector('[data-carousel-show-all]').getAttribute('aria-expanded'),
    focus: document.activeElement === el.querySelector('[data-carousel-show-all]'),
  }));
  if (!open.expanded || open.grid !== 'grid' || open.text !== say.showFewer || open.pressed !== 'true' || !open.focus)
    problems.push(
      `${label}: "Show all" did not stack the cards in place with focus kept, or the button did not say "${say.showFewer}" (${JSON.stringify(open)}; the page's language is "${lang}", read from ${where})`,
    );
  await button.click();
  await page.waitForTimeout(300);
  if (await root.evaluate((el) => el.hasAttribute('data-expanded'))) problems.push(`${label}: "Show fewer" did not return the carousel`);
  // Every layout the block offers is on the page (the examples of the demo's Carousel page), each measured as Material 3 prints it.
  const layouts = await page.evaluate(() =>
    [...document.querySelectorAll('[data-carousel-block]')].map((el) => {
      const c = el.querySelector('[data-carousel]');
      const row = el.querySelector('[data-carousel-items]');
      row.scrollLeft = 0;
      const first = el.querySelector('[data-carousel-item]');
      const mask = el.querySelector('[data-carousel-mask]');
      const rb = row.getBoundingClientRect();
      const fb = first.getBoundingClientRect();
      return {
        cards: el.classList.contains('mo-has-cards'),
        layout:
          (c.getAttribute('data-carousel-layout') ?? 'uncontained') +
          (c.getAttribute('data-carousel-alignment') === 'center' ? '-center' : ''),
        scrolls: row.scrollWidth > row.clientWidth + 1,
        radius: getComputedStyle(mask ?? first.firstElementChild).borderTopLeftRadius,
        itemWidth: Math.round(fb.width),
        widths: [...el.querySelectorAll('[data-carousel-item]')].map((i) => Math.round(i.getBoundingClientRect().width)),
        // A video item's box is the item (the video fills it: no empty area below or beside the still), and in the multi-aspect ratio layout as wide as its video.
        videoGaps: [...el.querySelectorAll('[data-carousel-item]')]
          .map((i) => [i.getBoundingClientRect(), i.querySelector('[data-video]')?.getBoundingClientRect()])
          .filter(([, v]) => v)
          .filter(([i, v]) => Math.abs(i.width - v.width) > 1 || Math.abs(i.height - v.height) > 1)
          .map(([i, v]) => `${Math.round(v.width)}x${Math.round(v.height)} in ${Math.round(i.width)}x${Math.round(i.height)}`),
        itemLeft: Math.round(fb.left),
        rowLeft: Math.round(rb.left),
        rowWidth: Math.round(rb.width),
        showAll: (() => {
          const box = el.querySelector('.mo-block-carousel__show-all');
          return !!box && getComputedStyle(box).display !== 'none';
        })(),
        header: !!el.querySelector('.mo-block-carousel__header'),
        indicators: el.querySelectorAll('[data-carousel-indicator], [data-carousel-dot]').length,
        count: el.querySelectorAll('[data-carousel-item]').length,
      };
    }),
  );
  for (const want of ['uncontained', 'multi-aspect-ratio', 'multi-browse', 'hero', 'hero-center', 'full-screen'])
    if (!layouts.some((l) => l.layout === want)) problems.push(`${label}: no ${want} carousel on the Blocks page`);
  for (const l of layouts) {
    const at = `${label} (${l.layout})`;
    if (l.count >= 8 && !l.scrolls) problems.push(`${at}: the row does not scroll sideways`);
    if (isMaterialTheme() && l.indicators) problems.push(`${at}: it has a page indicator, which Material 3's carousel does not`);
    // Full-screen items go edge to edge without corners on a phone (the theme's M3 rule); every other item has the 28dp item shape.
    // An item that is a card keeps the Card component's own shape (the uncontained layouts only).
    if (isMaterialTheme() && !l.cards && !(stillFullScreen && l.layout === 'full-screen') && l.radius !== '28px')
      problems.push(`${at}: the item's corners are ${l.radius}, not 28px`);
    // M3, Carousel, Accessibility: a Show all button below the carousel, at every width. A full-screen one shows it from 840 px, where it is the hero.
    // With a header the arrow beside it does the same and the button under the row is not drawn (the header's own unit below).
    const wantShow = !l.header && !(stillFullScreen && l.layout === 'full-screen');
    if (l.showAll !== wantShow) problems.push(`${at}: ${l.showAll ? 'it has' : 'it has no'} "Show all" (wanted: ${wantShow})`);
    if (phone) {
      // Multi-aspect ratio: leading padding 16dp, the cards of different widths (each as wide as its image's aspect ratio makes it).
      if (l.layout === 'multi-aspect-ratio') {
        if (l.itemLeft !== 16 || l.rowLeft !== 0) problems.push(`${at}: the first item is ${l.itemLeft}px from the edge, not 16px`);
        if (new Set(l.widths).size < 2)
          problems.push(`${at}: the items have the same width (${l.widths.join(', ')}px), not their images' aspect ratios`);
      }
      if (['multi-browse', 'hero', 'hero-center'].includes(l.layout) && (l.itemLeft !== 16 || l.rowLeft !== 0))
        problems.push(
          `${at}: the first item is ${l.itemLeft}px from the edge (the row starts at ${l.rowLeft}px), not 16px from the screen's edge`,
        );
      if (l.layout === 'full-screen' && Math.abs(l.itemWidth - l.rowWidth) > 1)
        problems.push(`${at}: a full-screen item is ${l.itemWidth}px of the row's ${l.rowWidth}px`);
    }
    if (l.videoGaps.length) problems.push(`${at}: a video does not fill its item (${l.videoGaps.join('; ')})`);
    if (l.layout === 'hero' && l.itemWidth <= l.rowWidth / 3)
      problems.push(`${at}: the hero's large item is only ${l.itemWidth}px of ${l.rowWidth}px`);
  }
  // Down from a card leaves the carousel to its own `Show all` (M3, Accessibility: "use the up and down arrow keys to leave the carousel"), in every carousel
  // with one, not to the next carousel's first card; Up goes to the control before the carousel.
  const carousels = page.locator('[data-carousel-block]');
  for (let i = 0; i < (await carousels.count()); i++) {
    const one = carousels.nth(i);
    const kind = await one.evaluate((el) => el.querySelector('[data-carousel]')?.getAttribute('data-carousel-layout') ?? 'uncontained');
    if (
      !(await one.evaluate((el) => {
        const box = el.querySelector('.mo-block-carousel__show-all');
        return !!box && getComputedStyle(box).display !== 'none';
      }))
    )
      continue;
    await one.scrollIntoViewIfNeeded();
    const card = one.locator('[data-carousel-item]').first();
    await card.evaluate((el) => (el.querySelector('a[href], button') ?? el).focus());
    await page.keyboard.press('ArrowDown');
    const onShowAll = await one.evaluate(
      (el) => document.activeElement === el.querySelector('.mo-block-carousel__show-all [data-carousel-show-all]'),
    );
    if (!onShowAll)
      problems.push(`${label} (${kind}, carousel ${i + 1}): Down from a card did not move the focus to that carousel's "Show all"`);
  }
  // Center-aligned hero (M3, Specs: "at least one large item and two small items"): scrolled to the start it is small, large, small, and to the end it is small, large with room after it, not a large
  // card flush against an edge (M3 is silent on the ends of the scroll: the last item rests in the middle, as the first one does).
  const centre = page.locator('[data-carousel-block]:has([data-carousel-alignment="center"])').first();
  if (await centre.count()) {
    await centre.scrollIntoViewIfNeeded();
    for (const at of ['start', 'end']) {
      await centre
        .locator('[data-carousel-items]')
        .evaluate((row, to) => row.scrollTo({ left: to === 'start' ? 0 : row.scrollWidth, behavior: 'instant' }), at);
      await page.waitForTimeout(400);
      const { seen, rowMid } = await centre.evaluate((el) => {
        const row = el.querySelector('[data-carousel-items]').getBoundingClientRect();
        // A mask keeps the large width; the theme shrinks it with its inset on both sides.
        const seen = [...el.querySelectorAll('[data-carousel-mask]')]
          .map((m) => {
            const b = m.getBoundingClientRect();
            const inset = parseFloat(m.style.getPropertyValue('--mo-comp-carousel-mask-inset')) || 0;
            return { left: b.left + inset, right: b.right - inset };
          })
          // Whole items: a card peeking in at the other end does not count, nor the item outside the row, which has no width.
          .filter((b) => b.right - b.left > 1 && b.left >= row.left - 1 && b.right <= row.right + 1);
        return { seen, rowMid: (row.left + row.right) / 2 };
      });
      const widths = seen.map((b) => Math.round(b.right - b.left));
      // At the start the first item is the small one, then the large one, centred, and a small one after it; at the end the last item is the large one, centred, with the
      // small one before it and room after it for the small one that no item fills (the row's padding, not a drawn part).
      const big = at === 'start' ? 1 : seen.length - 1;
      const mid = seen[big] ? (seen[big].left + seen[big].right) / 2 : NaN;
      const shape = at === 'start' ? seen.length === 3 : seen.length === 2;
      if (!(shape && widths[big] > widths[big - 1] && (at === 'end' || widths[2] < widths[1]) && Math.abs(mid - rowMid) <= 1))
        problems.push(
          `${label} (hero-center): at the ${at} the visible items are ${widths.join(', ')}px wide (the large one's centre ${Math.round(mid)}, the carousel's ${Math.round(rowMid)}), not ${at === 'start' ? 'a small, one large one centred and a small one' : 'a small one and the last, large one centred'}`,
        );
    }
  }
  // M3, Specs: "Small item width 40-56dp, dynamic": scrolled to the start, the small items of multi-browse, hero and center-aligned hero are 40 to 56 wide.
  for (const kind of ['multi-browse', 'hero', 'hero-center']) {
    const one = page
      .locator(
        kind === 'hero-center'
          ? '[data-carousel-block]:has([data-carousel-alignment="center"])'
          : `[data-carousel-block]:has([data-carousel-layout="${kind}"]:not([data-carousel-alignment]))`,
      )
      .first();
    if (!(await one.count())) continue;
    await one.scrollIntoViewIfNeeded();
    await one.locator('[data-carousel-items]').evaluate((row) => row.scrollTo({ left: 0, behavior: 'instant' }));
    await page.waitForTimeout(400);
    const widths = await one.evaluate((el) => {
      const row = el.querySelector('[data-carousel-items]').getBoundingClientRect();
      return [...el.querySelectorAll('[data-carousel-mask]')]
        .map((m) => {
          const b = m.getBoundingClientRect();
          const inset = parseFloat(m.style.getPropertyValue('--mo-comp-carousel-mask-inset')) || 0;
          return { left: b.left + inset, right: b.right - inset };
        })
        .filter((b) => b.right - b.left > 1 && b.left >= row.left - 1 && b.right <= row.right + 1)
        .map((b) => Math.round(b.right - b.left));
    });
    const smalls = kind === 'hero-center' ? [widths[0], widths[2]] : [Math.min(...widths)];
    if (isMaterialTheme() && smalls.some((w) => !(w >= 39 && w <= 57)))
      problems.push(`${label} (${kind}): the small items are ${smalls}px wide (visible items ${widths}), not 40 to 56 (M3, Specs)`);
  }
  // M3, Guidelines: "Carousel items must be fully visible on-screen (except for the uncontained layout)": resting at the start and at the end, no item of
  // multi-browse, hero or center-aligned hero is cut off by the carousel's edge (or shows as a sliver in its padding).
  for (const kind of ['multi-browse', 'hero', 'hero-center']) {
    const one = page
      .locator(
        kind === 'hero-center'
          ? '[data-carousel-block]:has([data-carousel-alignment="center"])'
          : `[data-carousel-block]:has([data-carousel-layout="${kind}"]:not([data-carousel-alignment]))`,
      )
      .first();
    if (!(await one.count())) continue;
    await one.scrollIntoViewIfNeeded();
    for (const at of ['start', 'end']) {
      await one
        .locator('[data-carousel-items]')
        .evaluate((row, where) => row.scrollTo({ left: where === 'end' ? row.scrollWidth : 0, behavior: 'instant' }), at);
      await page.waitForTimeout(500);
      const cut = await one.evaluate((el) => {
        const row = el.querySelector('[data-carousel-items]');
        const box = row.getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
        const from = Math.max(0, box.left + pad);
        const to = Math.min(innerWidth, box.right - pad);
        // What the row shows reaches its padding too: an item may stand in the window, or be wholly outside what the row shows.
        const shownFrom = Math.max(0, box.left);
        const shownTo = Math.min(innerWidth, box.right);
        return [...el.querySelectorAll('[data-carousel-mask]')]
          .map((m) => {
            const b = m.getBoundingClientRect();
            const inset = parseFloat(m.style.getPropertyValue('--mo-comp-carousel-mask-inset')) || 0;
            return { left: b.left + inset, right: b.right - inset };
          })
          .filter((b) => {
            const seen = Math.min(b.right, shownTo) - Math.max(b.left, shownFrom);
            if (seen <= 1) return false;
            return b.left < from - 1 || b.right > to + 1;
          })
          .map((b) => `${Math.round(b.left)}-${Math.round(b.right)} in ${Math.round(from)}-${Math.round(to)}`);
      });
      if (cut.length)
        problems.push(
          `${label} (${kind}): at the ${at} an item is cut off (${cut}); M3 prints "Carousel items must be fully visible on-screen (except for the uncontained layout)"`,
        );
    }
  }
  // M3, Guidelines, Adaptive design: "Consider adapting the text to use brief labels on smaller carousel items": scrolled to the start, a large item shows its title and text,
  // a medium one hides the title and keeps the text, a small one shows no text.
  {
    const one = page.locator('[data-carousel-block]:has([data-carousel-layout="multi-browse"]:not([data-carousel-alignment]))').first();
    if (await one.count()) {
      await one.scrollIntoViewIfNeeded();
      await one.locator('[data-carousel-items]').evaluate((row) => row.scrollTo({ left: 0, behavior: 'instant' }));
      await page.waitForTimeout(500);
      const seen = await one.evaluate((el) =>
        [...el.querySelectorAll('[data-carousel-mask]')]
          .map((m) => {
            const b = m.getBoundingClientRect();
            const inset = parseFloat(m.style.getPropertyValue('--mo-comp-carousel-mask-inset')) || 0;
            const title = m.querySelector('.mo-block-carousel__item-title');
            const text = m.querySelector('.mo-block-carousel__item-text');
            const label = m.querySelector('.mo-block-carousel__item-label');
            const opacity = (n) =>
              n ? parseFloat(getComputedStyle(n).opacity) * (label ? parseFloat(getComputedStyle(label).opacity) : 1) : 0;
            return {
              width: Math.round(b.width - 2 * inset),
              left: b.left + inset,
              right: b.right - inset,
              title: opacity(title),
              text: opacity(text),
            };
          })
          .filter((b) => b.left >= 0 && b.right <= innerWidth + 1),
      );
      const large = seen[0];
      const small = seen.at(-1);
      const medium = seen.find((b) => large && b.width > 60 && b.width < large.width * 0.85);
      if (large && medium && small && small !== large) {
        if (large.title < 0.9 || large.text < 0.9)
          problems.push(`${label} (multi-browse): the large item hides its title or text (${large.title}, ${large.text})`);
        if (medium.title > 0.1 || medium.text < 0.9)
          problems.push(
            `${label} (multi-browse): the ${medium.width}px medium item shows title ${medium.title} and text ${medium.text}; M3 hides the title and keeps the label`,
          );
        if (small.text > 0.1 || small.title > 0.1)
          problems.push(`${label} (multi-browse): the ${small.width}px small item still shows text (${small.title}, ${small.text})`);
      }
    }
  }
  // A card item's media (image or video still) sits flush against the card's top and sides: no padding or margin above it.
  const flush = await page.evaluate(() =>
    [...document.querySelectorAll('.mo-block-carousel__card')].flatMap((card) => {
      const media = card.querySelector('.mo-block-carousel__card .mo-card__media-slot');
      if (!media) return [];
      const c = card.getBoundingClientRect();
      const m = media.getBoundingClientRect();
      const border = parseFloat(getComputedStyle(card).borderTopWidth);
      const gaps = [m.top - c.top - border, m.left - c.left - border, c.right - border - m.right].map((n) => Math.round(n * 10) / 10);
      return gaps.some((g) => Math.abs(g) > 0.5)
        ? [`${card.querySelector('.mo-block-carousel__card .mo-card__headline')?.textContent}: top, left, right gaps ${gaps}`]
        : [];
    }),
  );
  for (const f of flush) problems.push(`${label}: a card item's media is not flush with the card (${f})`);
  await page.close();
}

/** A carousel with a header (M3, Carousel, Accessibility: "If the carousel has a header, you can use an arrow icon button instead. Place the arrow icon directly next to the header or in the same row. Make sure the header is also displayed on the page of all carousel items."): the arrow is on the header's row and named after it, it shows every item in place with the header kept and the arrow turned back, the keyboard works it, and no `Show all` is drawn under the row. */
async function checkCarouselHeader(width, height) {
  const label = `${width}px carousel header`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const root = page.locator('[data-carousel-block].mo-has-header').first();
  if (!(await root.count())) return (problems.push(`${label}: no carousel with a header on the Blocks page`), page.close());
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const { lang, where } = await pageLanguage(page);
  const say = blocksOf(lang).carousel;
  const state = () =>
    root.evaluate((el) => {
      const arrow = el.querySelector('[data-carousel-arrow]');
      const head = el.querySelector('.mo-block-carousel__heading');
      const a = arrow?.getBoundingClientRect();
      const h = head?.getBoundingClientRect();
      const visible = (n) => !!n && getComputedStyle(n).display !== 'none' && getComputedStyle(n).visibility !== 'hidden';
      return {
        header: head?.textContent.trim() ?? null,
        name: arrow?.getAttribute('aria-label') ?? null,
        expanded: arrow?.getAttribute('aria-expanded') ?? null,
        isButton: arrow?.tagName === 'BUTTON',
        sameRow: !!a && !!h && Math.abs(a.top + a.height / 2 - (h.top + h.height / 2)) <= 4,
        headerFirst: !!a && !!h && (getComputedStyle(el).direction === 'rtl' ? h.left > a.left : h.left < a.left),
        headerLeft: h ? Math.round(h.left) : null,
        firstLeft: Math.round(el.querySelector('[data-carousel-item]').getBoundingClientRect().left),
        forward: visible(arrow?.querySelector('.mo-block-carousel__arrow-forward')),
        back: visible(arrow?.querySelector('.mo-block-carousel__arrow-back')),
        showAll: !!el.querySelector('.mo-block-carousel__show-all'),
        stacked: el.hasAttribute('data-expanded'),
        columns: getComputedStyle(el.querySelector('[data-carousel-items]')).gridTemplateColumns.split(' ').length,
        focus: document.activeElement === arrow,
        headerShown: visible(head) && h.height > 0,
      };
    });
  const closed = await state();
  const wantName = say.showAllOf(closed.header ?? '');
  if (!closed.header || !closed.isButton) problems.push(`${label}: the header or its arrow button is missing (${JSON.stringify(closed)})`);
  if (!closed.sameRow || !closed.headerFirst)
    problems.push(`${label}: the arrow is not on the header's row after the header (${JSON.stringify(closed)})`);
  if (isMaterialTheme() && closed.headerLeft !== closed.firstLeft)
    problems.push(`${label}: the header is at ${closed.headerLeft}px, not on the first card's leading edge (${closed.firstLeft}px)`);
  if (closed.name !== wantName)
    problems.push(
      `${label}: the arrow is named "${closed.name}", not "${wantName}" (the page's language is "${lang}", read from ${where})`,
    );
  if (closed.expanded !== 'false' || !closed.forward || closed.back || closed.stacked)
    problems.push(`${label}: the closed arrow is not a forward arrow with aria-expanded=false (${JSON.stringify(closed)})`);
  if (closed.showAll) problems.push(`${label}: a "Show all" is drawn under the row of a carousel whose header has the arrow`);
  // The keyboard works it: Enter shows every item in place, with the header kept, a back arrow named "Show fewer", and the focus on the arrow; Space returns.
  await root.locator('[data-carousel-arrow]').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const open = await state();
  const fewer = say.showFewerOf(open.header ?? '');
  if (!open.stacked || open.columns !== 2)
    problems.push(`${label}: the arrow did not show every item in two columns in place (${JSON.stringify(open)})`);
  if (!open.headerShown || open.header !== closed.header)
    problems.push(`${label}: the all-items view does not show the header (${JSON.stringify(open)})`);
  if (open.expanded !== 'true' || !open.back || open.forward || open.name !== fewer)
    problems.push(`${label}: the all-items view has no back arrow named "${fewer}" with aria-expanded=true (${JSON.stringify(open)})`);
  if (!open.focus) problems.push(`${label}: the focus left the arrow when it was pressed`);
  if (open.showAll) problems.push(`${label}: the all-items view has a "Show all" under the cards`);
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const again = await state();
  if (again.stacked || again.expanded !== 'false' || again.name !== wantName || !again.forward)
    problems.push(`${label}: Space on the back arrow did not return the carousel (${JSON.stringify(again)})`);
  // Up from a card goes to the arrow above the row.
  await root
    .locator('[data-carousel-item]')
    .first()
    .evaluate((el) => (el.querySelector('a[href], button') ?? el).focus());
  await page.keyboard.press('ArrowUp');
  if (!(await root.evaluate((el) => document.activeElement === el.querySelector('[data-carousel-arrow]'))))
    problems.push(`${label}: Up from a card did not move the focus to the header's arrow`);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
    problems.push(`${label}: the page scrolls sideways`);
  await page.close();
}

/** The media sheet of a carousel item (the owner's PM, 27 Nov 2026: alt text and crop stay editable): a tap on the item's Image slot, then Image and a picked image, opens the sheet with Change media, Change image, Alt text and Remove under the image, as a card's sheet has, for a plain item; in the multi-aspect ratio layout it also has Crop, cut to the item's own aspect ratio. */
async function checkCarouselMediaSheet(width, height) {
  const label = `${width}px carousel media sheet`;
  if (!has('src/data/files')) return void console.log(`${label}: skipped, the site has no images in its Library, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Images, videos or cards swiped sideways.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  await page.keyboard.type('One');
  await page.waitForTimeout(300);
  await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="Image"]').click();
  await page.waitForTimeout(1000);
  await chooseKind(page, 'Image');
  await page
    .locator('dialog[open] button, .mo-editor-side-sheet button', { hasText: /^Select image$/ })
    .first()
    .click();
  await page.waitForSelector('dialog[open] [data-media-tile]', { timeout: 8000 });
  await page.locator('dialog[open] [data-media-tile]').first().click();
  await page.waitForTimeout(800);
  const sheet = () => page.locator('dialog[open], .mo-editor-side-sheet').last();
  const names = async () => (await sheet().locator('button').allTextContents()).map((b) => b.trim()).filter(Boolean);
  const plain = await names();
  for (const want of ['Change media', 'Change image', 'Alt text', 'Remove'])
    if (!plain.includes(want)) problems.push(`${label}: the sheet of a plain item's image has no "${want}" (${plain.join(', ')})`);
  if (plain.includes('Crop'))
    problems.push(`${label}: a plain item's image, which fills the item, has a Crop (there is nothing to cut it to)`);
  // Alt text is typed in the sheet and kept on the item.
  await sheet().getByRole('button', { name: 'Alt text', exact: true }).click();
  await page.waitForTimeout(400);
  // The aspect ratio is the item's own only in the multi-aspect ratio layout: in Multi-browse the Alt text view has no Aspect ratio row.
  if (/Aspect ratio/i.test(await sheet().innerText()))
    problems.push(
      `${label}: the Alt text view of a plain item in Multi-browse has an Aspect ratio, which only the multi-aspect ratio layout has`,
    );
  await sheet().getByLabel('Alt text').first().fill('A test picture');
  await page.waitForTimeout(500);
  if (!(await page.evaluate(() => /A test picture/.test(document.querySelector('.mo-site-block-inline')?.innerHTML ?? ''))))
    problems.push(`${label}: the alt text typed in the sheet is not on the item's image`);
  // In the multi-aspect ratio layout the image is cut to the item's own aspect ratio: the sheet has Crop, and the Alt text view has the aspect ratio.
  await page
    .locator('dialog[open] button[aria-label="Close"], .mo-editor-side-sheet [data-side-sheet-close]')
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Block settings' }).first().click();
  await page.waitForTimeout(900);
  await page
    .locator('dialog[open] button, .mo-editor-side-sheet button', { hasText: /^Multi-browse$/ })
    .first()
    .click();
  await page.waitForTimeout(300);
  await page
    .locator('dialog[open] *, .mo-editor-menu *, [role="listbox"] *', { hasText: /^Uncontained multi-aspect ratio$/ })
    .last()
    .click();
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.locator('.mo-editor-inline-card-media').first().dispatchEvent('click');
  await page.waitForTimeout(900);
  const cuttable = await names();
  if (!cuttable.includes('Crop'))
    problems.push(`${label}: in the multi-aspect ratio layout the sheet of an image has no Crop (${cuttable.join(', ')})`);
  await page.close();
}

// An item becomes a card with the Card button in an uncontained layout, and the block's variant (Outlined, Filled, Elevated) changes it; switching the kind back
// to Image or Video makes it a plain item again, and the buttons stored on it return when it is a card again.
async function checkCarouselCardSwitch(width, height) {
  const label = `${width}px carousel card switch`;
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Images, videos or cards swiped sideways.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  const slot = (name) => page.locator(`.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="${name}"]`);
  // In Multi-browse an item cannot be a card: no Card button.
  if ((await slot('Card').count()) > 0) problems.push(`${label}: Multi-browse has a Card button, which only the uncontained layouts have`);
  await page.getByRole('button', { name: 'Block settings' }).first().click();
  await page.waitForTimeout(900);
  await page
    .locator('dialog[open] button, .mo-editor-side-sheet button', { hasText: /^Multi-browse$/ })
    .first()
    .click();
  await page.waitForTimeout(300);
  await page
    .locator('dialog[open] *, .mo-editor-menu *, [role="listbox"] *', { hasText: /^Uncontained$/ })
    .last()
    .click();
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const isCard = () =>
    page.evaluate(
      () => !!document.querySelector('.mo-editor-inline-carousel .mo-card, .mo-editor-inline-carousel [class*="mo-block-carousel__card"]'),
    );
  if (await isCard()) problems.push(`${label}: a plain item is drawn as a card before the Card button is pressed`);
  await slot('Card').click();
  await page.waitForTimeout(500);
  if (!(await isCard())) problems.push(`${label}: the Card button does not make the item a card in the Uncontained layout`);
  if ((await slot('Card').getAttribute('aria-pressed')) !== 'true') problems.push(`${label}: the Card button is not pressed on a card`);
  // The block's variant changes the card.
  for (const [name, cls] of [
    ['Filled', 'mo-is-filled'],
    ['Elevated', 'mo-is-elevated'],
    ['Outlined', 'mo-is-outlined'],
  ]) {
    await page.getByRole('button', { name: 'Block settings' }).first().click();
    await page.waitForTimeout(700);
    await page.getByRole('radio', { name, exact: true }).dispatchEvent('click');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    if ((await page.locator(`.mo-editor-inline-carousel .mo-card.${cls}`).count()) === 0)
      problems.push(`${label}: ${name} does not change the card`);
  }
  // Switching the media kind keeps the item a card.
  for (const kind of ['Video', 'Image']) {
    await slot(kind).dispatchEvent('click');
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    if (!(await isCard())) problems.push(`${label}: ${kind} makes the card a plain item`);
  }
  await slot('Card').click();
  await page.waitForTimeout(500);
  if (await isCard()) problems.push(`${label}: the Card button pressed again does not make the card a plain item`);
  await page.close();
}

/** A video item takes its own thumbnail, as the Video block does: Media set to Video shows a Thumbnail in the item's sheet, Alt text only once one is set; the image chosen is the item's still. */
async function checkCarouselVideoThumbnail(width, height) {
  const label = `${width}px carousel video thumbnail`;
  if (!has('src/data/files')) return void console.log(`${label}: skipped, the site has no images in its Library, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Images, videos or cards swiped sideways.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="Video"]').dispatchEvent('click');
  await page.waitForTimeout(900);
  await chooseKind(page, 'Video');
  await page.waitForTimeout(600);
  const sheet = () => page.locator('dialog[open], .mo-editor-side-sheet').last();
  const text = async () => (await sheet().innerText()).replace(/\s+/g, ' ');
  if (!/Thumbnail/.test(await text())) problems.push(`${label}: the sheet of a video item has no Thumbnail`);
  if (/Alt text/.test(await text())) problems.push(`${label}: the video item has an Alt text before it has a thumbnail`);
  await sheet().getByLabel('Video link').first().fill('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  await page.waitForTimeout(700);
  if (/Alt text/.test(await text())) problems.push(`${label}: the video item has an Alt text before it has a thumbnail (with a link)`);
  // Change link has the link and the Thumbnail.
  await sheet().getByRole('button', { name: 'Change link', exact: true }).click();
  await page.waitForTimeout(500);
  await sheet()
    .locator('button', { hasText: /^Select image$/ })
    .first()
    .click();
  await page.waitForSelector('dialog[open] [data-media-tile]', { timeout: 8000 });
  await page.locator('dialog[open] [data-media-tile]').first().click();
  const use = page.locator('dialog[open]').getByRole('button', { name: /^(Use|Choose|Select)/ });
  if (await use.count()) await use.first().click();
  await page.waitForTimeout(900);
  if (!/Alt text/.test(await text())) problems.push(`${label}: the video item has no Alt text once it has a thumbnail (${await text()})`);
  const still = () => page.locator('.mo-editor-inline-carousel .mo-block-video__facade-image').first().getAttribute('src');
  const src = await still();
  const host = (() => {
    try {
      return new URL(src ?? '', 'http://localhost').hostname;
    } catch {
      return '';
    }
  })();
  if (!src || host === 'ytimg.com' || host.endsWith('.ytimg.com') || src.includes('/_video/'))
    problems.push(`${label}: the item draws "${src}", not the chosen thumbnail`);
  await page.screenshot({ path: join(shots, `carousel-video-thumbnail-${width}.png`) });
  // Removing it (the image field's own Remove, in Change link) brings the video's own still back, and the Alt text goes.
  await sheet().getByRole('button', { name: 'Change link', exact: true }).click();
  await page.waitForTimeout(500);
  await sheet()
    .getByRole('button', { name: /^Remove/ })
    .first()
    .click({ timeout: 3000 })
    .catch(() => {});
  await page.waitForTimeout(700);
  if (/Alt text/.test(await text())) problems.push(`${label}: the Alt text stays after the thumbnail is removed`);
  if ((await still().catch(() => '')) === src) problems.push(`${label}: the item still draws the thumbnail after it is removed`);
  await page.close();
}

/** On the site a video item with a thumbnail draws it, with the play button and the title, and asks YouTube and Vimeo for nothing before a click (the Blocks page of the carousel, the last video item). */
async function checkCarouselVideoThumbnailSite(width, height) {
  const label = `${width}px carousel video thumbnail (site)`;
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  const asked = [];
  page.on('request', (r) => {
    if (/(^|\.)(youtube(-nocookie)?\.com|ytimg\.com|youtu\.be|vimeo\.com|vimeocdn\.com)$/.test(new URL(r.url()).hostname))
      asked.push(r.url());
  });
  if (!(await onTestPage(page, label))) return page.close();
  const item = page.locator('.mo-block-carousel .mo-block-video__facade-image[src*="braies"]').first();
  if (!(await item.count())) problems.push(`${label}: no video item draws its own thumbnail on the carousel's Blocks page`);
  else {
    const frame = item.locator('xpath=ancestor::*[contains(@class,"mo-block-video")][1]');
    if (!(await frame.locator('svg').count())) problems.push(`${label}: the video item with a thumbnail has no play button`);
    if (!/own thumbnail/.test(await frame.innerText())) problems.push(`${label}: the video item with a thumbnail has lost its title`);
    if (typeof (await item.getAttribute('alt')) !== 'string' || !(await item.getAttribute('alt')))
      problems.push(`${label}: the thumbnail has no alt text from the item`);
  }
  if (asked.length) problems.push(`${label}: YouTube or Vimeo was asked before a click (${asked[0]})`);
  await page.close();
}

export function register(unit) {
  unit('checkCarouselVideoThumbnail 1280', () => checkCarouselVideoThumbnail(1280, 900));
  unit('checkCarouselVideoThumbnailSite 1280', () => checkCarouselVideoThumbnailSite(1280, 900));
  unit('checkCarouselScrollCost 375', () => checkCarouselScrollCost());
  unit('checkCarouselMediaSheet 1280', () => checkCarouselMediaSheet(1280, 900));
  unit('checkCarouselCardSwitch 1280', () => checkCarouselCardSwitch(1280, 900));
  unit('checkCarouselGap 390', () => checkCarouselGap(390, 800));
  unit('checkCarouselGap 1280', () => checkCarouselGap(1280, 900));
  unit('checkCarousel 768', () => checkCarousel(768, 900));
  unit('checkCarousel 600', () => checkCarousel(600, 900));
  unit('checkCarousel 840', () => checkCarousel(840, 900));
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ]) {
    unit(`checkCarousel ${width}`, () => checkCarousel(width, height));
    unit(`checkCarouselHeader ${width}`, () => checkCarouselHeader(width, height));
  }
}
