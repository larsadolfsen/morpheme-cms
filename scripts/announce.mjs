// The screen reader check's shared parts (WCAG 2.2 AA: 1.1.1, 1.3.1, 2.4.6, 3.3.1, 3.3.2, 4.1.2, 4.1.3; owner rule of 19 Nov 2026; plan
// `docs/superpowers/plans/2026-11-21-0-19-4-screen-readers.md`): the name walk of one editor screen, the recorder of what the flows announce, and the matching
// against the allowlist `scripts/announce-allowlist.json`. `check:announce` (scripts/check-announce.mjs), the screens units `screens 390` and `screens 1280`
// (the name walk) and `checkAnnounceFlows <width>` (the flows) in scripts/screens/start-screens.mjs all use it, so one rule decides everywhere.
//
// A finding is a key of problem, place, selector and viewport (scripts/allowlist.mjs, the shape of scripts/keyboard-allowlist.json).
//
// The name walk reads Chromium's accessibility tree (`Accessibility.getFullAXTree` over CDP: what a reader gets, not what the markup says) and the page's
// markup for what the tree can not tell. Its problems:
//   no-name            an interactive node (button, link, tab, menu item, switch, checkbox, radio, field) with no accessible name.
//   icon-name          a name that is an icon's ligature or file name (`more_vert`, `arrowBack`): the glyph's name, not what the control does.
//   bad-name           a name that is only punctuation, is the node's role (`button`), or is a file name or an id (`photo.jpg`, a uuid).
//   repeated-name      two controls of one role with the same name in one list, group or table, so a reader can not tell them apart (ten `Remove`).
//   unnamed-container  a dialog, menu, tab panel or region with no name, or a second navigation with no name.
//   tab-state          a tab with no selected state; a menu button (`aria-haspopup`) with no `aria-expanded`.
//   broken-reference   an `aria-describedby`, `aria-labelledby` or `aria-controls` that points at an element that is not there; an invalid field with no
//                      description (the error is not tied to its field).
//   disabled-no-reason a `Save` button that is disabled and says nothing of why (no `aria-describedby`).
//   live-region        `aria-live` and `role=status` or `alert` that disagree on one node, an assertive region that is not an error, a live region inside
//                      another one, or a live region inside `aria-hidden` or `inert`.
// The flows add `no-announcement`, `double-announcement`, `wrong-urgency`, `wrong-announcement`, `wrong-description` and `flow-focus-unnamed` / `flow-lost-focus` (scripts/announce-flows.mjs).
//
// The check is the CMS repository's own: the allowlist is keyed to the demo's screens, so a site that installed the package (it ships `scripts/`, so a
// site's `morpheme check:screens` runs these units) skips it cleanly (`announceRuns`).
import { fileURLToPath } from 'node:url';
import { makeAllowlist, viewportOf } from './allowlist.mjs';
import { activeTheme } from './theme-statement.mjs';
import { blockPageFile, blockPages } from './demo-blocks.mjs';

export { viewportOf };
export const PROBLEMS = [
  'no-name',
  'icon-name',
  'bad-name',
  'repeated-name',
  'unnamed-container',
  'tab-state',
  'broken-reference',
  'disabled-no-reason',
  'live-region',
  'no-announcement',
  'double-announcement',
  'wrong-urgency',
  'wrong-announcement',
  'wrong-description',
  'flow-focus-unnamed',
  'flow-lost-focus',
];

/** Whether the check runs where `file` (this module's own path) is: not in a package a site installed (its path has a `node_modules` folder). @param {string} file */
export const runsHere = (file) => !file.split(/[\\/]/).includes('node_modules');
export const announceRuns = () => runsHere(fileURLToPath(import.meta.url));

/** The WCAG criterion of a problem of the name walk, by the problem's name. None: what the walk finds (a name, a role, a state, a live region) is the editor's and the
 * CMS's markup, not a colour or size a theme sets, so by the one rule (`kindOf`, lib/accessibility.mjs) every one is our code and fails on every theme. A problem a
 * theme value can cause is added here with its criterion. */
export const CRITERION_OF_PROBLEM = /** @type {Record<string, string>} */ ({});

export const allowlist = makeAllowlist({
  file: new URL('announce-allowlist.json', import.meta.url),
  field: 'problem',
  label: 'announce',
  collectEnv: 'ANNOUNCE_COLLECT',
  criterionOf: (finding) => CRITERION_OF_PROBLEM[finding.problem] ?? null,
  theme: activeTheme,
});
export const { readAllowlist, keysOf, allowedKeys, compare, problemsOf, entriesOf, collect, judge } = allowlist;

// ---------------------------------------------------------------------------------------------------- what the walk reads (pure, tested in announce.test.mjs)

// The scope (owner, 21 Nov 2026: "It is checking content, not blocks"). The name walk checks the CMS, not the demo's text, which differs on every site:
// the editor's own screens, and every block once, in the editor, on its demo Blocks page (scripts/demo-blocks.mjs, `blockPages`). Every other content item
// (a page, a post or a data entry under `src/content/` or `src/data/`) is not walked, and a link or text a site owner wrote in a text area is never a finding
// (`isAuthored`, in the walk below), also on the Blocks pages; the editor's chrome around the text (bars, block cards, handles, slots, notices) is.

/** The editor's addresses of the demo's Blocks pages, one for each main component or special block (`demo/src/content/pages/blocks-<name>.md`). */
export const BLOCK_PAGES = Object.keys(blockPages).map((slug) => `src/content/pages/${blockPageFile(slug)}`);

/** An editor address (`settings`, `#src/content/pages/home.md`) as the walk compares it: no `#`, no query, decoded. @param {string} hash */
const addressOf = (hash) => {
  const path = hash.replace(/^#/, '').split('?')[0];
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

/** Whether the name walk reads the editor screen at `hash`: every screen of the editor's own, and of the content items only the demo's Blocks pages.
 * Used by `check:announce` (scripts/check-announce.mjs) and the screens units (scripts/screens/start-screens.mjs), so one rule decides both. @param {string} hash */
export function announceWalks(hash) {
  const address = addressOf(hash);
  if (!/^src\/(?:content|data)\//.test(address)) return true;
  return BLOCK_PAGES.includes(address);
}

/** The Blocks pages a walk has not read yet, to walk after its links (so every block is walked whichever links the screens have). @param {Iterable<string>} walked */
export const blockPagesLeft = (walked) => {
  const done = new Set([...walked].map(addressOf));
  return BLOCK_PAGES.filter((hash) => !done.has(hash));
};

// ---------------------------------------------------------------------------------------------------- names (pure, tested in announce.test.mjs)

/** The roles of the nodes a person operates: each must have a name. */
export const INTERACTIVE = new Set([
  'button',
  'link',
  'tab',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'switch',
  'checkbox',
  'radio',
  'textbox',
  'searchbox',
  'combobox',
  'slider',
  'spinbutton',
]);
/** Roles that must be named when they hold the person's place (a reader says the name on arrival). */
export const NAMED_CONTAINERS = new Set(['dialog', 'alertdialog', 'menu', 'tabpanel', 'region']);
/** Landmarks that need a name only when there are two of one role. Only `navigation`: whether a second `complementary`, `form` or `search` is in the page depends on
 * which panel is open when the walk reads it, so a finding for those would come and go from run to run (CI found it on `aside.mo-editor-main-drawer-frame`). */
export const LANDMARKS = new Set(['navigation']);
/** The roles a list of controls is made in: a repeated name is told apart only inside one of these. */
export const GROUPS = new Set([
  'list',
  'listbox',
  'menu',
  'table',
  'grid',
  'tree',
  'treegrid',
  'tablist',
  'toolbar',
  'group',
  'radiogroup',
  'feed',
]);

/** What is wrong with a name, or `null`: `empty`, `icon`, `punctuation`, `role`, `file` or `id`. @param {string} name @param {string} role */
export function badName(name, role) {
  const text = name.trim();
  if (!text) return 'empty';
  // The glyph's ligature (`more_vert`) or its component name (`arrowBack`), alone or among words.
  if (text.split(/\s+/).some((word) => /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(word) || /^[a-z]+(?:[A-Z][a-z0-9]+)+$/.test(word)))
    return 'icon';
  if (!/[\p{L}\p{N}]/u.test(text)) return 'punctuation';
  if (text.toLowerCase() === role) return 'role';
  if (/^\S+\.(?:jpe?g|png|gif|webp|svg|avif|pdf|mp4|webm|md|json)$/i.test(text)) return 'file';
  if (/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{16,}|:r[0-9a-z]*:|_r_[0-9a-z]+_)$/i.test(text))
    return 'id';
  return null;
}

/** The name problem a node has, as the finding's kind, or `null`. */
export function nameProblem(name, role) {
  const wrong = badName(name, role);
  if (wrong === null) return null;
  return wrong === 'empty' ? 'no-name' : wrong === 'icon' ? 'icon-name' : 'bad-name';
}

// ---------------------------------------------------------------------------------------------------- the walk (in the browser)

/** Whether an element is in the text a site owner wrote: inside a text area (`[role=textbox]`, `contenteditable`) and not inside an island of the editor's own in
 * it (a block's card, handle or slot is `contenteditable=false`). The text area itself is the editor's and is walked. Runs in the page (as its source text), so it
 * uses nothing from outside. @param {Element} el */
export function isAuthored(el) {
  if (el.getAttribute('contenteditable') === 'false') return false;
  const host = el.parentElement && el.parentElement.closest('[contenteditable], [role=textbox]');
  return Boolean(host) && host.getAttribute('contenteditable') !== 'false';
}
const AUTHORED = isAuthored.toString();

/** Run in the page: `{ selector, authored }` of an element. The selector holds no name (names are in the language of the run) and nothing that changes
 * from run to run; `authored` is `isAuthored`. */
const DESCRIBE_FUNCTION = `function () {
  const el = this;
  const authored = (${AUTHORED})(el);
  const parts = [];
  for (let node = el; node && node.nodeType === 1 && parts.length < 4; node = node.parentElement) {
    if (node === document.body) break;
    const tag = node.tagName.toLowerCase();
    const classes = [...node.classList].filter((c) => c.startsWith('mo-')).slice(0, 2).map((c) => '.' + c).join('');
    const role = node.getAttribute('role');
    const type = tag === 'input' ? node.getAttribute('type') : null;
    parts.unshift(tag + classes + (role ? '[role=' + role + ']' : '') + (type ? '[type=' + type + ']' : ''));
    // Stop at the first element that has a class of ours or a role: that names the part well enough.
    if (classes || role) break;
  }
  return { selector: parts.join(' > '), authored };
}`;

/** The markup problems the tree can not tell (run in the page), none in the text a site owner wrote (`isAuthored`). Gives `[{ problem, selector }]`. */
const MARKUP_PROBLEMS = `() => {
  const out = [];
  const authored = ${AUTHORED};
  const path = (el) => {
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && parts.length < 4; node = node.parentElement) {
      if (node === document.body) break;
      const tag = node.tagName.toLowerCase();
      const classes = [...node.classList].filter((c) => c.startsWith('mo-')).slice(0, 2).map((c) => '.' + c).join('');
      const role = node.getAttribute('role');
      const type = tag === 'input' ? node.getAttribute('type') : null;
      parts.unshift(tag + classes + (role ? '[role=' + role + ']' : '') + (type ? '[type=' + type + ']' : ''));
      if (classes || role) break;
    }
    return parts.join(' > ');
  };
  const add = (problem, el) => {
    if (!authored(el)) out.push({ problem, selector: path(el) });
  };
  const missing = (el, attr) => (el.getAttribute(attr) || '').split(/\\s+/).filter(Boolean).some((id) => !document.getElementById(id));
  for (const el of document.querySelectorAll('[aria-describedby], [aria-labelledby], [aria-controls]'))
    if (missing(el, 'aria-describedby') || missing(el, 'aria-labelledby') || missing(el, 'aria-controls')) add('broken-reference', el);
  for (const el of document.querySelectorAll('[aria-invalid="true"]'))
    if (!(el.getAttribute('aria-describedby') || el.getAttribute('aria-errormessage'))) add('broken-reference', el);
  for (const el of document.querySelectorAll('button[aria-haspopup]:not([aria-haspopup=false])'))
    if (!el.hasAttribute('aria-expanded')) add('tab-state', el);
  for (const el of document.querySelectorAll('button:disabled')) {
    const name = (el.getAttribute('aria-label') || el.textContent || '').trim();
    if (/^save\\b/i.test(name) && !el.getAttribute('aria-describedby')) add('disabled-no-reason', el);
  }
  const LIVE = '[role=status], [role=alert], [role=log], [aria-live]:not([aria-live=off])';
  for (const el of document.querySelectorAll(LIVE)) {
    const role = el.getAttribute('role');
    const live = el.getAttribute('aria-live');
    if (live && (role === 'status' || role === 'alert') && live !== (role === 'alert' ? 'assertive' : 'polite')) add('live-region', el);
    if (live === 'assertive' && role !== 'alert') add('live-region', el);
    if (el.parentElement && el.parentElement.closest(LIVE)) add('live-region', el);
    if (el.closest('[aria-hidden=true], [inert]')) add('live-region', el);
  }
  return out;
}`;

/**
 * Walks one screen as a reader would: the accessibility tree and the markup, at the width the page has now.
 * @param {import('playwright').Page} page @returns {Promise<{ findings: Array<{ problem: string, selector: string }>, tree: any[] }>}
 */
export async function walk(page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Accessibility.enable');
    await cdp.send('DOM.enable');
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const byId = new Map(nodes.map((n) => [n.nodeId, n]));
    const live = nodes.filter((n) => !n.ignored);
    const roleOf = (n) => n.role?.value ?? '';
    const nameOf = (n) => String(n.name?.value ?? '');
    const prop = (n, name) => n.properties?.find((p) => p.name === name)?.value?.value;
    const hasProp = (n, name) => n.properties?.some((p) => p.name === name) ?? false;
    const groupOf = (n) => {
      for (let p = byId.get(n.parentId); p; p = byId.get(p.parentId)) if (GROUPS.has(roleOf(p))) return p.nodeId;
      return 'page';
    };
    /** @type {Array<{ problem: string, node: any }>} */
    const found = [];
    const seen = new Map();
    for (const n of live) {
      const role = roleOf(n);
      if (INTERACTIVE.has(role)) {
        // A field without a label is axe's `label`; the walk says what a reader says instead.
        const problem = nameProblem(nameOf(n), role);
        if (problem) found.push({ problem, node: n });
        else {
          const key = [groupOf(n), role, nameOf(n).trim()].join('\u0001');
          seen.set(key, [...(seen.get(key) ?? []), n]);
        }
        if (role === 'tab' && !hasProp(n, 'selected')) found.push({ problem: 'tab-state', node: n });
      }
      if (NAMED_CONTAINERS.has(role) && !nameOf(n).trim()) found.push({ problem: 'unnamed-container', node: n });
    }
    // The selector of a node and whether a site owner wrote it, read from the page only for the nodes that may be a finding (a screen with no problem
    // makes no call).
    const described = new Map();
    const describe = async (node) => {
      if (described.has(node.nodeId)) return described.get(node.nodeId);
      let about = { selector: roleOf(node), authored: false };
      if (node.backendDOMNodeId) {
        try {
          const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: node.backendDOMNodeId });
          const { result } = await cdp.send('Runtime.callFunctionOn', {
            objectId: object.objectId,
            functionDeclaration: DESCRIBE_FUNCTION,
            returnByValue: true,
          });
          about = { selector: result.value?.selector || about.selector, authored: Boolean(result.value?.authored) };
          await cdp.send('Runtime.releaseObject', { objectId: object.objectId });
        } catch {
          /* a node that is gone: the role stands for it */
        }
      }
      described.set(node.nodeId, about);
      return about;
    };
    // A repeated name counts only among the editor's controls: two links a site owner wrote with one text are the owner's, not the CMS's.
    for (const group of seen.values()) {
      if (group.length < 2 || group.some((n) => roleOf(n) === 'textbox' || roleOf(n) === 'searchbox')) continue;
      const ours = [];
      for (const n of group) if (!(await describe(n)).authored && ours.push(n) === 2) break;
      if (ours.length === 2) found.push({ problem: 'repeated-name', node: ours[1] });
    }
    // A landmark that is one of two or more of its role needs a name to be told apart.
    for (const role of LANDMARKS) {
      const same = live.filter((n) => roleOf(n) === role);
      if (same.length > 1) for (const n of same) if (!nameOf(n).trim()) found.push({ problem: 'unnamed-container', node: n });
    }
    const findings = [];
    const bySelector = new Set();
    for (const { problem, node } of found) {
      const { selector, authored } = await describe(node);
      if (authored) continue;
      const id = `${problem}|${selector}`;
      if (!bySelector.has(id)) (bySelector.add(id), findings.push({ problem, selector }));
    }
    for (const f of await page.evaluate(`(${MARKUP_PROBLEMS})()`))
      if (!bySelector.has(`${f.problem}|${f.selector}`)) (bySelector.add(`${f.problem}|${f.selector}`), findings.push(f));
    return { findings, tree: live };
  } finally {
    await cdp.detach().catch(() => {});
  }
}

/** What the focused node says, as a reader would: `name, role, state`, or `nothing`; read from the accessibility tree. @param {import('playwright').Page} page */
export async function speakFocus(page) {
  const cdp = await page.context().newCDPSession(page);
  const none = { text: 'nothing focused', role: '', name: '' };
  try {
    await cdp.send('Accessibility.enable');
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.activeElement' });
    if (!result.objectId || result.description === 'body') return none;
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false });
    const node = nodes.find((n) => !n.ignored);
    return node ? speech(node) : none;
  } catch {
    return none;
  } finally {
    await cdp.detach().catch(() => {});
  }
}

const STATES = ['expanded', 'selected', 'checked', 'pressed', 'disabled', 'required', 'invalid', 'busy'];
/** One node as the line of the speech log. */
export function speech(node) {
  const role = node.role?.value ?? '';
  const name = String(node.name?.value ?? '').trim();
  const states = (node.properties ?? [])
    .filter((p) => STATES.includes(p.name) && p.value?.value && p.value.value !== 'false')
    .map((p) => (p.value.value === true ? p.name : `${p.name} ${p.value.value}`));
  const level = node.properties?.find((p) => p.name === 'level')?.value?.value;
  const head = role === 'heading' ? `Heading level ${level ?? '?'}, ${name}` : `${name || '(no name)'}, ${role}`;
  return { text: [head, ...states].join(', '), role, name };
}

// ---------------------------------------------------------------------------------------------------- the recorder (in the browser)

/** Installed before the page loads. It watches every live region and `document.title` and keeps what a reader would be given, in `window.__announced`:
 * `{ t, kind: 'live' | 'title', text, urgency, region, inserted }`. A text is an announcement when a live region's text becomes non-empty and differs
 * from what the region said last; `inserted` says the region came into the page with that text (many readers do not read such a region). */
export const RECORDER = `(() => {
  if (window.__announced) return;
  const events = (window.__announced = []);
  const LIVE = '[role=status], [role=alert], [role=log], [aria-live]:not([aria-live=off])';
  const born = new WeakSet();
  const last = new WeakMap();
  const ids = new WeakMap();
  let counter = 0;
  const idOf = (el) => (ids.has(el) ? ids.get(el) : (ids.set(el, ++counter), counter));
  const urgencyOf = (el) => (el.getAttribute('role') === 'alert' || el.getAttribute('aria-live') === 'assertive' ? 'urgent' : 'polite');
  const say = (region, inserted) => {
    const text = (region.textContent || '').replace(/\\s+/g, ' ').trim();
    if (!text) return void last.set(region, '');
    if (last.get(region) === text && !inserted) return;
    last.set(region, text);
    // A region a reader can not reach: inert, or outside the topmost open modal dialog (which makes the rest of the page inert).
    const modal = [...document.querySelectorAll('dialog[open]')].filter((d) => d.matches(':modal')).pop();
    const unreachable = Boolean(region.closest('[inert]')) || Boolean(modal && !modal.contains(region));
    events.push({ t: performance.now(), kind: 'live', text, urgency: urgencyOf(region), region: idOf(region), inserted: Boolean(inserted), unreachable });
  };
  const regionsIn = (node) => {
    if (node.nodeType !== 1) return [];
    return [...(node.matches(LIVE) ? [node] : []), ...node.querySelectorAll(LIVE)];
  };
  const start = () => {
    for (const el of document.querySelectorAll(LIVE)) last.set(el, (el.textContent || '').replace(/\\s+/g, ' ').trim());
    new MutationObserver((records) => {
      for (const r of records) {
        for (const added of r.addedNodes) for (const region of regionsIn(added)) if (!born.has(region)) (born.add(region), say(region, true));
        const target = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        const region = target?.closest?.(LIVE);
        if (region && !(r.type === 'childList' && [...r.addedNodes].some((n) => regionsIn(n).includes(region)))) say(region, false);
      }
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['role', 'aria-live'] });
    new MutationObserver(() => events.push({ t: performance.now(), kind: 'title', text: document.title, urgency: 'polite', region: 0, inserted: false })).observe(
      document.querySelector('title') || document.head,
      { subtree: true, childList: true, characterData: true },
    );
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();`;

/** The announcements of a window of events, as the flows judge them: `live` ones only, the twice-said text and the urgency of each.
 * `window.__announced` events with `t >= from`. The same text from two regions within `within` ms is said twice. */
export function judgeWindow(events, { expect, within = 1000 } = {}) {
  const live = events.filter((e) => e.kind === 'live');
  const problems = [];
  // A message from a region that came in with its text, or that a reader can not reach (inert, or behind a modal dialog), is not said.
  const said = live.filter((e) => !e.inserted && !e.unreachable);
  if (expect && !said.length) problems.push('no-announcement');
  for (let i = 0; i < live.length; i++)
    for (let j = i + 1; j < live.length; j++)
      if (live[i].text === live[j].text && live[i].region !== live[j].region && Math.abs(live[i].t - live[j].t) <= within) {
        problems.push('double-announcement');
        i = live.length;
        break;
      }
  if (expect?.urgent !== undefined && said.length) {
    const urgent = said.some((e) => e.urgency === 'urgent');
    if (urgent !== expect.urgent) problems.push('wrong-urgency');
  }
  // `expect.text`: what is said must be this (a block's place, a removal), not any text at all.
  if (expect?.text && said.length && !said.some((e) => expect.text.test(e.text))) problems.push('wrong-announcement');
  return problems;
}
