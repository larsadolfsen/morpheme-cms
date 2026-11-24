// The demo's Names view: a small label on every block and on every part of the theme a page draws, so the owner can say
// what a thing is called. Only the demo's build puts this file in a page (scripts/demo-build.mjs, scripts/demo-names.mjs): never the
// starter, never a site. Off by default; On with `?names` in the address, or with the "Names" button (the choice is remembered in this
// browser). No inline script, no eval, no request: the labels are drawn in a layer over the page, so nothing moves.
(() => {
  const script = document.currentScript;
  const KEY = 'morpheme-demo-names';

  // A block's name as the editor calls it, in the order the blocks are on the page (the build wrote them in `data-blocks`,
  // each `type=Name`, separated by `|`).
  const blocks = (script?.dataset.blocks ?? '')
    .split('|')
    .filter(Boolean)
    .map((s) => s.split('='));

  // A part of the theme by its class (theme/ui writes one for each, and one for its style): its name, then what is shown after `·`.
  // The first rule that matches an element wins.
  const kind = (el, prefix) => {
    const part = `mo-${prefix}__`;
    const c = [...el.classList].find((n) => n.startsWith(part) || n.startsWith('mo-is-'));
    return c?.startsWith(part) ? c.slice(part.length) : c?.slice('mo-is-'.length);
  };
  const named = (name, prefix) => (el) => {
    const style = kind(el, prefix);
    return style ? `${name} · ${style}` : name;
  };
  const PARTS = [
    ['.mo-button-group', named('ButtonGroup', 'button-group')],
    ['.mo-split-button', () => 'SplitButton'],
    ['.mo-button', named('Button', 'button')],
    ['.mo-icon-button', named('IconButton', 'icon-button')],
    ['.mo-fab', () => 'Fab'],
    ['.mo-card', named('Card', 'card')],
    ['.mo-chip__set', () => 'ChipSet'],
    ['.mo-chip', named('Chip', 'chip')],
    ['.mo-list__item-container', (el) => `ListItem · ${[...el.classList].find((c) => /^mo-list__item-(one|two|three)-line$/.test(c))?.slice(14) ?? 'one-line'}`],
    ['.mo-list', (el) => (el.classList.contains('mo-list__segmented') ? 'List · segmented' : 'List')],
    ['.mo-carousel', () => 'Carousel'],
    ['.mo-text-field', named('TextField', 'text-field')],
    ['.mo-switch', () => 'Switch'],
    ['.mo-checkbox', () => 'Checkbox'],
    ['.mo-radio-button', () => 'RadioButton'],
    ['.mo-slider', () => 'Slider'],
    ['.mo-segmented-button', () => 'SegmentedButton'],
    ['.mo-tabs', named('Tabs', 'tabs')],
    ['.mo-badge', named('Badge', 'badge')],
    ['.mo-divider', () => 'Divider'],
    ['.mo-snackbar', () => 'Snackbar'],
    ['.mo-tooltip__anchor', () => 'Tooltip'],
    ['.mo-block-video__facade', () => 'Video facade'],
  ];
  // A theme's part has more than one class (`mo-button`, `mo-is-filled`): `.mo-list__item-container` must not take `.mo-list`, so each rule is
  // matched on the element's own class list, never on a parent's.
  const partOf = (el) => {
    for (const [selector, label] of PARTS) if (el.matches(selector)) return label(el);
    return null;
  };

  // What a block draws beside itself in the text (its "more" button): it has the block's space, but it is not a block of its own.
  const EXTRA = '.mo-block-list__button, .mo-block-more__button, .mo-block-buttons__row';

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

  /** The elements to label: the blocks in the text (`.mo-is-in-text` that is not inside another one), then the theme's parts. */
  const targets = () => {
    const main = document.querySelector('main') ?? document.body;
    const roots = [...main.querySelectorAll('.mo-is-in-text')].filter((el) => !el.parentElement?.closest('.mo-is-in-text') && !el.matches(EXTRA));
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
      const count = t.block ? 1 : runs.get(t.key);
      chip.textContent = count > 1 ? `${t.text} ×${count}` : t.text;
      // The theme's Label type (its tokens) in the theme's inverse colors (a block) or container colors (a part), which read on every
      // section color in light and dark; no class, no color of its own.
      Object.assign(chip.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        padding: '0 0.375rem',
        borderRadius: 'var(--mo-sys-shape-corner-extra-small)',
        border: '1px solid var(--mo-sys-color-outline)',
        fontSize: 'var(--mo-sys-typescale-label-medium-size)',
        lineHeight: 'var(--mo-sys-typescale-label-medium-line-height)',
        fontWeight: 'var(--mo-sys-typescale-label-medium-weight)',
        letterSpacing: 'var(--mo-sys-typescale-label-medium-tracking)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        background: t.block ? 'var(--mo-sys-color-inverse-surface)' : 'var(--mo-sys-color-surface-container-highest)',
        color: t.block ? 'var(--mo-sys-color-inverse-on-surface)' : 'var(--mo-sys-color-on-surface)',
      });
      chip.dataset.demoNames = t.block ? 'block' : 'part';
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
    // One name to a line, stacked: a chip sits just above its part's top edge, never on text. One that would meet text or share a line
    // with another chip goes up a line. The parts are placed first and each block's chip last, so a block's name is on top, its parts under it. It stays inside the window's width.
    const lines = items.slice().sort((a, b) => a.block - b.block || a.y - b.y || a.x - b.x);
    for (const { chip, x, y } of lines) {
      const w = chip.offsetWidth;
      const h = chip.offsetHeight;
      const left = Math.max(0, Math.min(x, width - w));
      let top = Math.max(0, y - h - 2);
      for (let n = 0; n < 200 && top > 0 && taken.some((o) => top < o.top + o.h && o.top < top + h) || texts.some((o) => meets(o, left, top, w, h)); n++) top -= 2;
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
  button.className = 'mo-button mo-is-outlined mo-is-xsmall';
  button.dataset.demoNames = 'toggle';
  button.textContent = 'Names';
  const show = () => {
    button.setAttribute('aria-pressed', String(on));
    document.documentElement.toggleAttribute('data-demo-names', on);
  };
  button.addEventListener('click', () => {
    on = !on;
    write(on);
    show();
    draw();
  });

  const start = () => {
    layer = document.createElement('div');
    Object.assign(layer.style, { position: 'absolute', top: '0', left: '0', width: '0', height: '0', overflow: 'visible', pointerEvents: 'none', zIndex: '2147483000' });
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
    // The button goes in the footer, next to the theme's own switch, where it covers no content; a page without that footer has it
    // at the bottom of the window.
    const bar = document.querySelector('.mo-footer__bottom > div');
    if (bar) bar.prepend(button);
    else {
      Object.assign(button.style, { position: 'fixed', left: '1rem', bottom: '1rem', zIndex: '2147483001' });
      document.body.append(button);
    }
    show();
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
