// The demo's Names view: a small label on every block and on every part of the theme a page draws, so the owner can say
// what a thing is called. Only the demo's build puts this file in a page (scripts/demo-build.mjs, scripts/demo-names.mjs): never the
// starter, never a site. Off by default; On with `?names` in the address, or with the "Names" button (the choice is remembered in this
// browser). No inline script, no eval, no request: the labels are drawn in a layer over the page, so nothing moves.
(() => {
  const script = document.currentScript;
  const KEY = 'morpheme-demo-names';
  const STYLE = '/demo-names.css';

  // A block's name as the editor calls it, in the order the blocks are on the page (the build wrote them in `data-blocks`,
  // each `type=Name`, separated by `|`).
  const blocks = (script?.dataset.blocks ?? '')
    .split('|')
    .filter(Boolean)
    .map((s) => s.split('='));

  // A part of the theme by its class (theme/ui writes one for each, and one for its style): its name, then what is shown after `·`.
  // The first rule that matches an element wins.
  const kind = (el, prefix) => [...el.classList].find((c) => c.startsWith(`${prefix}-`))?.slice(prefix.length + 1);
  const named = (name, prefix) => (el) => {
    const style = kind(el, prefix);
    return style ? `${name} · ${style}` : name;
  };
  const PARTS = [
    ['.button-group', named('ButtonGroup', 'button-group')],
    ['.split-button', () => 'SplitButton'],
    ['.button', named('Button', 'button')],
    ['.icon-button', named('IconButton', 'icon-button')],
    ['.fab', () => 'Fab'],
    ['.card', named('Card', 'card')],
    ['.chip-set', () => 'ChipSet'],
    ['.chip', named('Chip', 'chip')],
    ['.list-item-container', (el) => `ListItem · ${[...el.classList].find((c) => /^list-item-(one|two|three)-line$/.test(c))?.slice(10) ?? 'one-line'}`],
    ['.list', (el) => (el.classList.contains('list-segmented') ? 'List · segmented' : 'List')],
    ['.carousel', () => 'Carousel'],
    ['.text-field', named('TextField', 'text-field')],
    ['.switch', () => 'Switch'],
    ['.checkbox', () => 'Checkbox'],
    ['.radio-button', () => 'RadioButton'],
    ['.slider', () => 'Slider'],
    ['.segmented-button', () => 'SegmentedButton'],
    ['.tabs', named('Tabs', 'tabs')],
    ['.badge', named('Badge', 'badge')],
    ['.divider', () => 'Divider'],
    ['.snackbar', () => 'Snackbar'],
    ['.tooltip-anchor', () => 'Tooltip'],
    ['.video-facade', () => 'Video facade'],
  ];
  // A theme's part has more than one class (`button`, `button-filled`): `.list-item-container` must not take `.list`, so each rule is
  // matched on the element's own class list, never on a parent's.
  const partOf = (el) => {
    for (const [selector, label] of PARTS) if (el.matches(selector)) return label(el);
    return null;
  };

  // What a block draws beside itself in the text (its "more" button): it has the block's space, but it is not a block of its own.
  const EXTRA = '.block-list-button, .block-more-button';

  const read = () => {
    const q = new URLSearchParams(location.search);
    if (q.has('names')) return q.get('names') !== '0' && q.get('names') !== 'off';
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  };
  const write = (on) => {
    try {
      localStorage.setItem(KEY, on ? '1' : '0');
    } catch {}
    const url = new URL(location.href);
    if (on) url.searchParams.set('names', '');
    else url.searchParams.delete('names');
    history.replaceState(null, '', url.search === '?names=' ? `${url.pathname}?names${url.hash}` : url);
  };

  let on = read();
  let layer;
  let queued = false;

  const style = () => {
    if (document.querySelector(`link[href="${STYLE}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLE;
    document.head.append(link);
  };

  /** The elements to label: the blocks in the text (`.block-in-text` that is not inside another one), then the theme's parts. */
  const targets = () => {
    const main = document.querySelector('main') ?? document.body;
    const roots = [...main.querySelectorAll('.block-in-text')].filter((el) => !el.parentElement?.closest('.block-in-text') && !el.matches(EXTRA));
    const found = [];
    roots.forEach((el, i) => {
      const [type, name] = blocks[i] ?? [];
      found.push({ el, text: name ?? 'Block', code: type, block: true });
    });
    for (const el of main.querySelectorAll('*')) {
      const text = partOf(el);
      if (text && !roots.includes(el)) found.push({ el, text, block: false });
    }
    return found;
  };

  const draw = () => {
    queued = false;
    if (!layer) return;
    layer.replaceChildren();
    if (!on) return;
    const width = document.documentElement.clientWidth;
    const taken = [];
    const items = [];
    // A run of the same part in one place (the rows of a list, the cards of a grid) is labelled once, the first, with how many.
    const runs = new Map();
    const ids = new Map();
    const all = targets();
    for (const t of all) {
      if (t.block) continue;
      const unit = t.el.parentElement?.tagName === 'LI' ? t.el.parentElement : t.el;
      const key = `${t.text}\n${ids.get(unit.parentElement) ?? ids.set(unit.parentElement, ids.size).get(unit.parentElement)}`;
      t.key = key;
      runs.set(key, (runs.get(key) ?? 0) + 1);
    }
    const seen = new Set();
    for (const t of all) {
      if (!t.block) {
        if (seen.has(t.key)) continue;
        seen.add(t.key);
      }
      const r = t.el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const chip = document.createElement('span');
      chip.className = t.block ? 'demo-names-chip demo-names-block' : 'demo-names-chip demo-names-part';
      const name = document.createElement('span');
      const count = t.block ? 1 : runs.get(t.key);
      name.textContent = count > 1 ? `${t.text} ×${count}` : t.text;
      if (!t.block) name.className = 'demo-names-code';
      chip.append(name);
      if (t.block && t.code) {
        const code = document.createElement('span');
        code.className = 'demo-names-code';
        code.textContent = t.code;
        chip.append(code);
      }
      items.push({ chip, block: t.block, x: r.left + scrollX, y: r.top + scrollY, w: r.width });
    }
    layer.append(...items.map((i) => i.chip));
    // The boxes of the page's text, which a chip must keep off.
    const texts = [];
    const walk = document.createTreeWalker(document.querySelector('main') ?? document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent.trim() || !n.parentElement.checkVisibility()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const t of range.getClientRects()) texts.push({ left: t.left + scrollX, top: t.top + scrollY, w: t.width, h: t.height });
    }
    const meets = (o, left, top, w, h) => left < o.left + o.w - 1 && o.left + 1 < left + w && top < o.top + o.h - 1 && o.top + 1 < top + h;
    // A chip sits just above its part's top edge, never on text: the block's first, then the parts. If that spot meets text or another
    // chip it goes up in small steps, then beside the part, then beside the chips already there; it stays inside the window's width.
    for (const { chip, x, y, w: pw } of items.sort((a, b) => a.y - b.y || a.x - b.x || b.block - a.block)) {
      const w = chip.offsetWidth;
      const h = chip.offsetHeight;
      const fit = (left) => Math.max(0, Math.min(left, width - w));
      const free = (left, top) => top >= 0 && ![...taken, ...texts].some((o) => meets(o, left, top, w, h));
      const spots = [];
      for (let up = 2; up <= 42; up += 4) spots.push([fit(x), y - h - up]);
      spots.push([fit(x + pw + 4), y], [fit(x - w - 4), y]);
      for (const o of taken) spots.push([fit(o.left + o.w + 4), o.top]);
      const [left, top] = spots.find(([l, t]) => free(l, t)) ?? [fit(x), Math.max(0, y - h - 2)];
      taken.push({ left, top, w, h });
      chip.style.translate = `${left}px ${top}px`;
    }
  };
  const later = () => {
    if (queued || !on) return;
    queued = true;
    requestAnimationFrame(draw);
  };

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button button-outlined button-xsmall demo-names-toggle';
  button.textContent = 'Names';
  const show = () => {
    button.setAttribute('aria-pressed', String(on));
    document.documentElement.toggleAttribute('data-demo-names', on);
  };
  button.addEventListener('click', () => {
    on = !on;
    write(on);
    show();
    if (on) style();
    draw();
  });

  const start = () => {
    layer = document.createElement('div');
    layer.className = 'demo-names-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
    // The button goes in the footer, next to the theme's own switch, where it covers no content; a page without that footer has it
    // at the bottom of the window.
    const bar = document.querySelector('.md-footer-bottom > div');
    if (bar) bar.prepend(button);
    else {
      button.classList.add('demo-names-fixed');
      document.body.append(button);
    }
    show();
    if (on) style();
    // The toggle's own stylesheet is needed at once; the labels' wait for it.
    style();
    draw();
    addEventListener('resize', later);
    addEventListener('scroll', later, { capture: true, passive: true });
    addEventListener('load', later);
    document.addEventListener('toggle', later, true);
    document.fonts?.ready.then(later);
    new ResizeObserver(later).observe(document.body);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
