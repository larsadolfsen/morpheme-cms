// The keyboard check's shared parts (WCAG 2.2 AA, owner rule of 19 Nov 2026; plan `docs/superpowers/plans/2026-11-20-0-19-3-keyboard.md`): the Tab walk of one
// editor screen, and the matching of what it and the flows find against the allowlist `scripts/keyboard-allowlist.json`. `check:keyboard`
// (scripts/check-keyboard.mjs), the screens units `screens 390` and `screens 1280` (the walk) and `checkKeyboardFlows <width>` (the flows)
// in scripts/screens/start-screens.mjs all use it, so one rule decides everywhere.
//
// A finding is a key of problem, place, selector and viewport: the problem (below), the editor screen (`#settings`) or flow (`flow A`), the node's
// selector and `phone` or `computer`. An allowlist entry is `{ problem, selector, places, viewports, reason }` and stands for one key per place and
// viewport (the same shape as scripts/a11y-allowlist.json). The check fails on a finding no entry holds and on an entry that no longer matches a
// finding, so the list only shrinks.
//
// The problems of the Tab walk (WCAG 2.1.2, 2.4.3, 2.4.7, 2.4.11, 3.2.1):
//   trap          the walk comes back to a stop that is not the first: Tab cycles among a few elements and never comes round.
//   covered       after the browser has scrolled the focused element into view, another element covers all of it (the element's centre and four
//                 inset points, `elementsFromPoint`).
//   invisible     the focused element has no size, is hidden, or lies outside the visible part of a scroll container or frame that holds it.
//   no-indicator  nothing changes on the element, its ::before / ::after or up to three ancestors between focused and not focused; an
//                 editable field counts the caret when it is shown.
//   lost-focus    focus lands on `body` before the walk comes round.
// The flows add `unreachable` (a step's control can't be reached by keyboard) and `flow-lost-focus` (focus is on `body` after something opens or
// closes); scripts/keyboard-flows.mjs.
//
// The check is the CMS repository's own: the allowlist is keyed to the demo's screens, so a site that installed the package (it ships `scripts/`, so a
// site's `morpheme check:screens` runs these units) skips it cleanly (`keyboardRuns`, as `scanRuns` of a11y.mjs does).
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PROBLEMS = ['trap', 'covered', 'invisible', 'no-indicator', 'lost-focus', 'unreachable', 'flow-lost-focus'];
/** The widths by the name an entry uses (a unit's phone is 390 or 375 px, its computer 1280). */
export const viewportOf = (width) => (width < 600 ? 'phone' : 'computer');
/** The most Tab presses a walk makes on one screen. */
export const MAX_TABS = 150;

/** Whether the check runs where `file` (this module's own path) is: not in a package a site installed (its path has a `node_modules` folder). @param {string} file */
export const runsHere = (file) => !file.split(/[\\/]/).includes('node_modules');
export const keyboardRuns = () => runsHere(fileURLToPath(import.meta.url));

const SEP = '\t';
const ALLOWLIST = new URL('keyboard-allowlist.json', import.meta.url);
/** The allowlist's entries. @returns {Array<{ problem: string, selector: string, places: string[], viewports: string[], reason: string }>} */
export const readAllowlist = () => JSON.parse(readFileSync(ALLOWLIST, 'utf8'));

/** A finding's selector without what changes from run to run (the ids React makes). */
export const cleanSelector = (selector) => selector.replace(/:r[0-9a-z]*:|_r_[0-9a-z]+_/g, 'r*');

/** The keys of the findings `[{ problem, selector }]` of one place. */
export const keysOf = (findings, place, viewport) =>
  new Set(findings.map((f) => [f.problem, place, cleanSelector(f.selector), viewport].join(SEP)));

/** The keys the allowlist holds, each with its reason; `wanted` limits them to those places (one screen or flow is checked at a time).
 * @param {ReturnType<typeof readAllowlist>} entries @param {(place: string) => boolean} [wanted] */
export function allowedKeys(entries, wanted = () => true) {
  const keys = new Map();
  for (const { problem, selector, places, viewports, reason } of entries)
    for (const place of places)
      if (wanted(place)) for (const viewport of viewports) keys.set([problem, place, selector, viewport].join(SEP), reason);
  return keys;
}

/** What is wrong: the findings the list does not hold (`unexpected`) and the entries that found nothing (`stale`), as lines to print.
 * @param {Set<string>} found @param {Map<string, string>} allowed */
export function compare(found, allowed) {
  const say = (key) => {
    const [problem, place, selector, viewport] = key.split(SEP);
    return `${problem} on ${place} (${viewport}): ${selector}`;
  };
  return {
    unexpected: [...found].filter((k) => !allowed.has(k)).map(say),
    stale: [...allowed.keys()].filter((k) => !found.has(k)).map(say),
  };
}

/** The problems, as the messages the checks print. */
export function problemsOf({ unexpected, stale }) {
  return [
    ...unexpected.map((line) => `keyboard: new problem, not on scripts/keyboard-allowlist.json: ${line}. Fix it; the list only shrinks.`),
    ...stale.map(
      (line) => `keyboard: the allowlist holds an entry that no longer matches, remove it from scripts/keyboard-allowlist.json: ${line}.`,
    ),
  ];
}

/** Groups findings into allowlist entries (`--list`): one entry for each problem, selector and set of viewports, with its places. @param {Set<string>} keys */
export function entriesOf(keys, reasonOf = () => 'TODO') {
  const byNode = new Map();
  for (const key of keys) {
    const [problem, place, selector, viewport] = key.split(SEP);
    const id = [problem, place, selector].join(SEP);
    byNode.set(id, [...(byNode.get(id) ?? []), viewport]);
  }
  const grouped = new Map();
  for (const [id, viewports] of byNode) {
    const [problem, place, selector] = id.split(SEP);
    const names = ['phone', 'computer'].filter((v) => viewports.includes(v));
    const group = [problem, selector, names.join(',')].join(SEP);
    grouped.set(group, [...(grouped.get(group) ?? []), place]);
  }
  return [...grouped]
    .map(([group, places]) => {
      const [problem, selector, names] = group.split(SEP);
      return { problem, selector, places: places.sort(), viewports: names.split(','), reason: reasonOf(problem, selector) };
    })
    .sort((a, b) => a.problem.localeCompare(b.problem) || a.selector.localeCompare(b.selector));
}

/** Appends findings to a file, one key a line (`KEYBOARD_COLLECT`, for writing the allowlist from a run of check:screens). */
export const collect = (file, keys) => appendFileSync(file, [...keys].map((k) => `${k}\n`).join(''));

/** Checks one place's findings against the allowlist: gives the problems to print, or collects the keys when `KEYBOARD_COLLECT` is set.
 * `matches` says which entries are this place's (the walk of a screen at a width checks its own entries). @returns {string[]} */
export function judge(findings, place, viewport) {
  const found = keysOf(findings, place, viewport);
  if (process.env.KEYBOARD_COLLECT) {
    collect(process.env.KEYBOARD_COLLECT, found);
    return [];
  }
  const allowed = allowedKeys(readAllowlist(), (p) => p === place);
  for (const key of [...allowed.keys()]) if (!key.endsWith(`${SEP}${viewport}`)) allowed.delete(key);
  return problemsOf(compare(found, allowed));
}

/** What the page runs while a walk is going: the state, and the probe of the focused stop. Run in the page (they use no variable of this module). */
async function inPage(action) {
  // eslint-disable-next-line no-undef
  const w = window;
  if (action === 'start') {
    // No transition or animation: a state that is still moving is measured wrong. A constructed style sheet is not stopped by a Content-Security-Policy.
    // The screen settles first: the previews (frames) and the lists draw after the screen opens, and what the walk finds would depend on the time it started.
    // It waits until the number of focusable parts, of frames and of what is in the frames has not changed for four polls.
    const signature = () => {
      let inFrames = 0;
      for (const f of document.querySelectorAll('iframe')) {
        try {
          inFrames += f.contentDocument?.body?.getElementsByTagName('*').length ?? 0;
        } catch {
          inFrames += 1;
        }
      }
      return `${document.querySelectorAll('a[href], button, input, textarea, select, summary, [tabindex], iframe, [contenteditable]').length}:${inFrames}:${document.body.getElementsByTagName('*').length}`;
    };
    let last = '';
    let same = 0;
    for (let i = 0; i < 60 && same < 3; i++) {
      const now = signature();
      same = now === last ? same + 1 : 0;
      last = now;
      await new Promise((done) => setTimeout(done, 100));
    }
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    w.__kb = { sheet, ids: new WeakMap(), next: 1, first: 0 };
    const body = document.body;
    document.activeElement?.blur?.();
    body.setAttribute('tabindex', '-1');
    body.focus({ preventScroll: true });
    body.removeAttribute('tabindex');
    body.blur?.();
    w.scrollTo(0, 0);
    return null;
  }
  if (action === 'stop') {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== w.__kb?.sheet);
    delete w.__kb;
    return null;
  }
  const kb = w.__kb;
  // One frame: a part that CSS anchor positioning places is laid out again after the scroll.
  document.body.getBoundingClientRect();
  await new Promise((done) => requestAnimationFrame(done));

  // The focused element, through the frames that hold it (the preview of the header and footer is a frame).
  const frames = [];
  let active = document.activeElement;
  while (active && active.tagName === 'IFRAME') {
    let inner = null;
    try {
      inner = active.contentDocument?.activeElement ?? null;
    } catch {
      inner = null;
    }
    if (!inner || inner === active.contentDocument.body || inner === active.contentDocument.documentElement) break;
    frames.push(active);
    active = inner;
  }
  if (!active || active === document.body || active === document.documentElement) return { none: true };

  const selectorOf = (el) => {
    const part = (n) => {
      let s = n.tagName.toLowerCase();
      s += [...n.classList]
        .filter((c) => c.startsWith('mo-'))
        .slice(0, 3)
        .map((c) => `.${c}`)
        .join('');
      const role = n.getAttribute('role');
      if (role) s += `[role=${role}]`;
      if (n.tagName === 'INPUT' && n.type) s += `[type=${n.type}]`;
      return s;
    };
    const chain = [];
    for (let n = el, i = 0; n && n.nodeType === 1 && i < 4; n = n.parentElement, i++) chain.unshift(part(n));
    return chain.join(' > ');
  };
  // A stop inside a frame is named by the frame: its inner stops are one finding for each problem, not one for each link of the page it shows.
  const selector = frames.length ? `${frames.map(selectorOf).join(' >> ')} >> (inside)` : selectorOf(active);

  let id = kb.ids.get(active);
  const repeat = id !== undefined;
  if (!repeat) {
    id = kb.next++;
    kb.ids.set(active, id);
    if (id === 1) kb.first = 1;
  }
  const result = { selector, id, repeat, first: id === kb.first, problems: [] };
  if (repeat) return result;

  // Where the element is, in the top window's coordinates (a frame's own scroll and border are added).
  const offset = { x: 0, y: 0 };
  for (const f of frames) {
    const r = f.getBoundingClientRect();
    offset.x += r.left + f.clientLeft;
    offset.y += r.top + f.clientTop;
  }
  // A control that is hidden but focusable (the radio of a choice tile) shows its focus on the label that holds it.
  let target = active;
  let box = active.getBoundingClientRect();
  if (box.width < 4 || box.height < 4) {
    const holder = active.closest('label') ?? active.parentElement;
    const hb = holder?.getBoundingClientRect();
    if (hb && hb.width >= 4 && hb.height >= 4) {
      target = holder;
      box = hb;
    }
  }
  const win = target.ownerDocument.defaultView;
  const view = win.getComputedStyle(target);
  let rect = { l: box.left + offset.x, t: box.top + offset.y, r: box.right + offset.x, b: box.bottom + offset.y };
  const empty = (q) => q.r - q.l < 1 || q.b - q.t < 1;
  const cut = (q, c) => ({ l: Math.max(q.l, c.l), t: Math.max(q.t, c.t), r: Math.min(q.r, c.r), b: Math.min(q.b, c.b) });

  // What of it can be seen: cut by every scroll container and frame that holds it (up to a fixed ancestor, which its scrollers do not move) and by the window.
  let visible = rect;
  const clipBy = (el, off) => {
    for (let n = el.parentElement; n && n !== el.ownerDocument.documentElement; n = n.parentElement) {
      const s = n.ownerDocument.defaultView.getComputedStyle(n);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const r = n.getBoundingClientRect();
        visible = cut(visible, { l: r.left + off.x, t: r.top + off.y, r: r.right + off.x, b: r.bottom + off.y });
      }
      if (s.position === 'fixed') break;
    }
  };
  // The offsets of each frame level.
  const levels = [];
  {
    let x = 0;
    let y = 0;
    levels.push({ x, y });
    for (const f of frames) {
      const r = f.getBoundingClientRect();
      x += r.left + f.clientLeft;
      y += r.top + f.clientTop;
      levels.push({ x, y });
    }
  }
  clipBy(target, levels[levels.length - 1]);
  frames.forEach((f, i) => {
    const r = f.getBoundingClientRect();
    visible = cut(visible, {
      l: r.left + f.clientLeft + levels[i].x,
      t: r.top + f.clientTop + levels[i].y,
      r: r.right - f.clientLeft + levels[i].x,
      b: r.bottom - f.clientTop + levels[i].y,
    });
    clipBy(f, levels[i]);
  });
  // The window is not a cut: the browser scrolls the focused element into view (Tab), and one it can't scroll to is not this check's problem.

  const hidden = view.visibility === 'hidden' || view.display === 'none' || win.getComputedStyle(active).visibility === 'hidden';
  result.detail = JSON.stringify({ rect, visible, hidden, vw: innerWidth, vh: innerHeight, scrollY: Math.round(scrollY) });
  if (
    hidden ||
    empty(rect) ||
    empty(visible) ||
    visible.r - visible.l < Math.min(4, rect.r - rect.l) ||
    visible.b - visible.t < Math.min(4, rect.b - rect.t)
  )
    result.problems.push('invisible');
  else if (view.pointerEvents !== 'none') {
    // Covered: the topmost element at the centre and at four inset points of what is on the screen is another element, at every one of them.
    const seen = cut(visible, { l: 0, t: 0, r: innerWidth, b: innerHeight });
    const w4 = Math.min(4, (seen.r - seen.l) / 4);
    const h4 = Math.min(4, (seen.b - seen.t) / 4);
    const points = [
      [(seen.l + seen.r) / 2, (seen.t + seen.b) / 2],
      [seen.l + w4, seen.t + h4],
      [seen.r - w4, seen.t + h4],
      [seen.l + w4, seen.b - h4],
      [seen.r - w4, seen.b - h4],
    ];
    const own = frames[0] ?? target;
    const covered =
      !empty(seen) &&
      points.every(([x, y]) => {
        const top = document.elementsFromPoint(x, y)[0];
        return top && top !== own && !own.contains(top) && !top.contains(own);
      });
    if (covered) result.problems.push('covered');
  }

  // The indicator: what changes on the element, its pseudo-elements and up to three ancestors between focused and not focused.
  const editable =
    (active.tagName === 'TEXTAREA' ||
      (active.tagName === 'INPUT' && /^(text|search|email|url|tel|password|number|date|datetime-local|time)$/.test(active.type))) &&
    !active.readOnly &&
    !active.disabled
      ? true
      : active.isContentEditable;
  const caretColor = win.getComputedStyle(active).caretColor;
  const caretShown = editable && caretColor !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(caretColor);
  if (!result.problems.includes('invisible') && !caretShown) {
    const watched = [...new Set([active, target])];
    for (let n = target.parentElement, i = 0; n && i < 3; n = n.parentElement, i++) watched.push(n);
    const props = [
      'outlineStyle',
      'outlineWidth',
      'outlineColor',
      'outlineOffset',
      'boxShadow',
      'backgroundColor',
      'backgroundImage',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'borderTopWidth',
      'borderBottomWidth',
      'color',
      'textDecorationLine',
      'opacity',
      'filter',
      'transform',
      'content',
    ];
    const snap = () =>
      watched.flatMap((n) =>
        [null, '::before', '::after'].map((pseudo) => {
          const s = n.ownerDocument.defaultView.getComputedStyle(n, pseudo);
          return props.map((p) => s[p]).join('|');
        }),
      );
    const focused = snap();
    active.blur();
    const plain = snap();
    active.focus({ preventScroll: true });
    if (focused.every((s, i) => s === plain[i])) result.problems.push('no-indicator');
    if (frames.length ? frames[0].contentDocument.activeElement !== active : document.activeElement !== active) result.refocusFailed = true;
  }
  return result;
}

/** Walks one editor screen from the top with Tab (up to MAX_TABS presses, or until focus comes round) and gives its findings `[{ problem, selector }]`
 * and the number of stops. The page is left as it was, with no focus. @param {import('playwright').Page} page */
export async function walk(page) {
  const findings = [];
  const add = (problem, selector) => {
    if (!findings.some((f) => f.problem === problem && f.selector === selector)) findings.push({ problem, selector });
  };
  await page.evaluate(inPage, 'start');
  let stops = 0;
  let lost = null;
  let previous = '';
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(inPage, 'probe');
    if (r.none) {
      // Tab from the last stop leaves the page and comes back to the first one: a body once is the walk's end; a body that is not followed by the first stop is lost focus.
      if (stops === 0) break;
      lost = previous;
      continue;
    }
    if (lost !== null) {
      if (r.first) break;
      add('lost-focus', `after ${lost}`);
      lost = null;
    }
    if (r.repeat) {
      if (!r.first) add('trap', r.selector);
      break;
    }
    stops++;
    previous = r.selector;
    for (const problem of r.problems) add(problem, r.selector);
    if (process.env.KEYBOARD_TRACE && r.problems.length) console.log('  stop', r.problems.join(','), r.selector.slice(-90), r.detail);
    if (r.refocusFailed) break;
  }
  await page.evaluate(inPage, 'stop');
  return { findings, stops };
}
