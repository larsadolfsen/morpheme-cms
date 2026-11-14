// The rules of the editor's action registry and command palette (spec 2026-11-13-command-palette-and-context-menus-design.md, sections 3, 3.1, 4.3, 4.6).
// Exposes foldText, matchAction, scoreAction, rankActions, CONTEXT_GROUPS, GROUP_ORDER, contextGroupsOf, paletteState, orderGroups, emptyQuerySections,
// parseShortcut, formatShortcut, ariaKeyShortcuts, matchesShortcut, shortcutConflicts, isBrowserShortcut, placeProblems, MEANING_ICONS, iconProblems,
// RESULT_CAP, SUGGESTED_MAX, RECENT_KEPT, RECENT_SHOWN, readRecent, pushRecent, recentShown, clearRecent.
// Pure: no packages, no DOM, no storage. The registry (src/actions.ts) and the palette call these.

/**
 * @typedef {'go' | 'pages' | 'page' | 'text' | 'section' | 'insert' | 'block' | 'image' | 'table' | 'list' | 'setting' | 'app'} ActionGroup
 * @typedef {{ id: string, label: string, words?: string[], group: ActionGroup, path?: string, kind?: 'action' | 'page' }} SearchEntry
 * @typedef {{ mod: boolean, shift: boolean, alt: boolean, ctrl: boolean, key: string }} Shortcut
 */

/** The letters a Danish user types both ways (ae, o-slash as ae and o; a-ring loses its ring with the accents). Written by code point, not as letters. */
const LETTER_FOLDS = /** @type {[RegExp, string][]} */ ([
  [new RegExp(String.fromCharCode(0xe6), 'g'), 'ae'],
  [new RegExp(String.fromCharCode(0xf8), 'g'), 'o'],
  [new RegExp(String.fromCharCode(0xdf), 'g'), 'ss'],
]);

/**
 * Folds a text for search: lower case, accents off, and the Danish letters as their plain spellings.
 * @param {string} text
 * @returns {string}
 */
export function foldText(text) {
  let out = String(text ?? '').toLowerCase();
  for (const [re, plain] of LETTER_FOLDS) out = out.replace(re, plain);
  return out.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

/** @param {string} folded */
const wordsOf = (folded) => folded.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Whether the letters of `needle` stand in order inside `hay`. @param {string} needle @param {string} hay */
function inOrder(needle, hay) {
  let at = 0;
  for (const ch of needle) {
    at = hay.indexOf(ch, at);
    if (at < 0) return false;
    at++;
  }
  return true;
}

/** The fewest letters a query needs before the letters-in-order match counts ("bld" finds "Bold"). */
const FUZZY_MIN = 3;

/**
 * Whether every word of the query matches something of the entry: its label, its other words, its group's name or its path.
 * @param {SearchEntry} entry
 * @param {string} query
 * @param {string} [groupLabel] the group's name in the editor's language
 */
export function matchAction(entry, query, groupLabel = '') {
  const q = wordsOf(foldText(query));
  if (q.length === 0) return true;
  const label = foldText(entry.label);
  const fields = [label, ...(entry.words ?? []).map(foldText), foldText(groupLabel), foldText(entry.path ?? '')].filter(Boolean);
  return q.every(
    (word) => fields.some((field) => field.includes(word)) || (word.length >= FUZZY_MIN && inOrder(word, label.replace(/ /g, ''))),
  );
}

/**
 * The match score of one entry for a query (section 4.3, step 3), without the boosts; null when it does not match.
 * Whole label equal 100, label starts with the query 80, a word of the label starts with it 60, all query words start words of the label 50,
 * a match in its other words or its path 30, the letters in order inside the label 20, only the group's name 10.
 * @param {SearchEntry} entry
 * @param {string} query
 * @param {string} [groupLabel]
 * @returns {number | null}
 */
export function scoreAction(entry, query, groupLabel = '') {
  const q = foldText(query);
  if (!q) return 0;
  if (!matchAction(entry, query, groupLabel)) return null;
  const label = foldText(entry.label);
  const labelWords = wordsOf(label);
  const qWords = wordsOf(q);
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (labelWords.some((w) => w.startsWith(q))) return 60;
  if (qWords.length > 1 && qWords.every((qw) => labelWords.some((w) => w.startsWith(qw)))) return 50;
  const others = [...(entry.words ?? []).map(foldText), foldText(entry.path ?? '')].filter(Boolean);
  if (qWords.every((qw) => others.some((f) => f.includes(qw)) || label.includes(qw))) return 30;
  if (q.replace(/ /g, '').length >= FUZZY_MIN && inOrder(q.replace(/ /g, ''), label.replace(/ /g, ''))) return 20;
  return 10;
}

/** The palette shows at most this many results for a query. */
export const RESULT_CAP = 30;

/**
 * Ranks the entries for a query: score, +15 when in the current context, +10 when among the last 5 run, up to +5 for how often it ran.
 * Pages and posts rank under actions on a tie; other ties keep the registry order. At most `cap` results.
 * @param {SearchEntry[]} entries in registry order
 * @param {string} query
 * @param {{ context?: ActionGroup[], recent?: string[], counts?: Record<string, number>, groupLabels?: Partial<Record<ActionGroup, string>>, cap?: number }} [opts]
 * @returns {{ entry: SearchEntry, score: number }[]}
 */
export function rankActions(entries, query, opts = {}) {
  const { context = [], recent = [], counts = {}, groupLabels = {}, cap = RESULT_CAP } = opts;
  const lastRun = recent.slice(0, RECENT_SHOWN);
  const scored = [];
  entries.forEach((entry, index) => {
    const base = scoreAction(entry, query, groupLabels[entry.group] ?? '');
    if (base === null) return;
    let score = base;
    if (context.includes(entry.group)) score += 15;
    if (lastRun.includes(entry.id)) score += 10;
    score += Math.min(5, Math.max(0, counts[entry.id] ?? 0));
    scored.push({ entry, score, index, page: entry.kind === 'page' ? 1 : 0 });
  });
  scored.sort((a, b) => b.score - a.score || a.page - b.page || a.index - b.index);
  return scored.slice(0, cap).map(({ entry, score }) => ({ entry, score }));
}

/** The groups that belong to a context (what is active), in the order the palette shows them first. */
export const CONTEXT_GROUPS = /** @type {const} */ (['text', 'section', 'block', 'image', 'table', 'list']);

/** The palette's group order for a query after the current context's groups (section 4.1). */
export const GROUP_ORDER = /** @type {const} */ (['insert', 'page', 'go', 'pages', 'setting', 'app']);

/**
 * The groups of the current context.
 * @param {{ text?: boolean, section?: boolean, block?: boolean, image?: boolean, table?: boolean, list?: boolean }} ctx
 * @returns {ActionGroup[]}
 */
export function contextGroupsOf(ctx) {
  return CONTEXT_GROUPS.filter((g) => Boolean(ctx?.[g]));
}

/**
 * How the palette shows an action: a hidden one never; a disabled one only when its group is the current context (with its reason),
 * since actions of a context you are not in would be noise (section 4.1).
 * @param {'enabled' | 'disabled' | 'hidden'} state
 * @param {ActionGroup} group
 * @param {ActionGroup[]} context
 * @returns {'shown' | 'disabled' | 'left-out'}
 */
export function paletteState(state, group, context) {
  if (state === 'hidden') return 'left-out';
  const contextual = /** @type {readonly string[]} */ (CONTEXT_GROUPS).includes(group);
  if (contextual && !context.includes(group)) return 'left-out';
  if (state === 'disabled') return context.includes(group) ? 'disabled' : 'left-out';
  return 'shown';
}

/**
 * Puts ranked results into groups: the current context's groups first, then Insert, Page, Go to, Pages and posts, Settings, Apps.
 * A group with no result is left out; inside a group the rank order stays.
 * @template {{ entry: SearchEntry }} R
 * @param {R[]} ranked
 * @param {ActionGroup[]} context
 * @returns {{ group: ActionGroup, items: R[] }[]}
 */
export function orderGroups(ranked, context) {
  const order = [...context, ...CONTEXT_GROUPS.filter((g) => !context.includes(g)), ...GROUP_ORDER];
  const byGroup = new Map();
  for (const r of ranked) {
    if (!byGroup.has(r.entry.group)) byGroup.set(r.entry.group, []);
    byGroup.get(r.entry.group).push(r);
  }
  const known = order.filter((g) => byGroup.has(g)).map((group) => ({ group, items: byGroup.get(group) }));
  const rest = [...byGroup.keys()].filter((g) => !order.includes(g)).map((group) => ({ group, items: byGroup.get(group) }));
  return [...known, ...rest];
}

/** The most suggestions shown before typing. */
export const SUGGESTED_MAX = 6;

/**
 * The palette before typing (section 4.1): with a block selected or active, Suggested (that block's actions) first, then Recent;
 * otherwise Recent first, then Suggested (the text's or the screen's actions). Nothing else.
 * @template T
 * @param {{ blockActive: boolean, suggested: T[], recent: T[] }} input suggested in row, bar, then ⋮ order; recent newest first
 * @returns {{ section: 'suggested' | 'recent', items: T[] }[]}
 */
export function emptyQuerySections({ blockActive, suggested, recent }) {
  const s = { section: /** @type {const} */ ('suggested'), items: suggested.slice(0, SUGGESTED_MAX) };
  const r = { section: /** @type {const} */ ('recent'), items: recent.slice(0, RECENT_SHOWN) };
  return (blockActive ? [s, r] : [r, s]).filter((x) => x.items.length > 0);
}

// Shortcuts --------------------------------------------------------------------------------------------------------

const KEY_NAMES = { esc: 'Escape', escape: 'Escape', enter: 'Enter', tab: 'Tab', space: ' ', up: 'ArrowUp', down: 'ArrowDown' };

/**
 * Reads a shortcut such as 'Mod+K' or 'Mod+Shift+Z'. `Mod` is ⌘ on a Mac and Ctrl elsewhere; `Ctrl` is Ctrl on every system.
 * @param {string} text
 * @returns {Shortcut}
 */
export function parseShortcut(text) {
  const parts = String(text)
    .split('+')
    .map((p) => p.trim());
  const keyPart = parts.pop() || '';
  if (!keyPart) throw new Error(`A shortcut needs a key: "${text}"`);
  const mods = new Set(parts.map((p) => p.toLowerCase()));
  for (const m of mods) {
    if (!['mod', 'shift', 'alt', 'ctrl'].includes(m)) throw new Error(`Unknown modifier "${m}" in "${text}"`);
  }
  const named = KEY_NAMES[/** @type {keyof typeof KEY_NAMES} */ (keyPart.toLowerCase())];
  const key = named ?? (keyPart.length === 1 ? keyPart.toUpperCase() : keyPart);
  return { mod: mods.has('mod'), shift: mods.has('shift'), alt: mods.has('alt'), ctrl: mods.has('ctrl'), key };
}

/** @param {string} key */
const keyLabel = (key) => ({ ' ': 'Space', ArrowUp: '↑', ArrowDown: '↓', Escape: 'Esc' })[key] ?? key;

/**
 * The shortcut as people read it: '⌘K' and '⇧⌘Z' on a Mac (Apple's order: ⌃ ⌥ ⇧ ⌘), 'Ctrl+K' and 'Ctrl+Shift+Z' elsewhere.
 * @param {Shortcut | string} shortcut
 * @param {boolean} mac
 */
export function formatShortcut(shortcut, mac) {
  const s = typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;
  if (mac) {
    return `${s.ctrl ? '⌃' : ''}${s.alt ? '⌥' : ''}${s.shift ? '⇧' : ''}${s.mod ? '⌘' : ''}${keyLabel(s.key)}`;
  }
  const parts = [];
  if (s.mod || s.ctrl) parts.push('Ctrl');
  if (s.alt) parts.push('Alt');
  if (s.shift) parts.push('Shift');
  parts.push(keyLabel(s.key));
  return parts.join('+');
}

/**
 * The value of `aria-keyshortcuts` (WAI-ARIA names: Meta, Control, Alt, Shift).
 * @param {Shortcut | string} shortcut
 * @param {boolean} mac
 */
export function ariaKeyShortcuts(shortcut, mac) {
  const s = typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;
  const parts = [];
  if (s.ctrl || (s.mod && !mac)) parts.push('Control');
  if (s.mod && mac) parts.push('Meta');
  if (s.alt) parts.push('Alt');
  if (s.shift) parts.push('Shift');
  parts.push(s.key === ' ' ? 'Space' : s.key);
  return parts.join('+');
}

/**
 * Whether a key event is the shortcut. Extra modifiers do not match.
 * @param {{ key: string, metaKey: boolean, ctrlKey: boolean, altKey: boolean, shiftKey: boolean }} event
 * @param {Shortcut | string} shortcut
 * @param {boolean} mac
 */
export function matchesShortcut(event, shortcut, mac) {
  const s = typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;
  const wantMeta = mac && s.mod;
  const wantCtrl = s.ctrl || (!mac && s.mod);
  if (event.metaKey !== wantMeta || event.ctrlKey !== wantCtrl) return false;
  if (event.altKey !== s.alt || event.shiftKey !== s.shift) return false;
  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  return key === s.key;
}

/** A shortcut as one comparable string, the same for 'Mod+k' and 'mod+K'. @param {Shortcut} s */
const shortcutKey = (s) => `${s.mod ? 'M' : ''}${s.ctrl ? 'C' : ''}${s.alt ? 'A' : ''}${s.shift ? 'S' : ''}+${s.key}`;

/** Keys the browser keeps for itself (tabs, windows, the address bar, reload), so no action may take them. */
const BROWSER_KEYS = new Set(
  [
    'Mod+T',
    'Mod+Shift+T',
    'Mod+W',
    'Mod+Shift+W',
    'Mod+N',
    'Mod+Shift+N',
    'Mod+L',
    'Mod+R',
    'Mod+Shift+R',
    'Mod+Q',
    'Mod+Tab',
    'Mod+Shift+Tab',
    'Ctrl+Tab',
    'Ctrl+Shift+Tab',
    'F5',
    'Mod+F5',
    'F6',
    'F11',
    'F12',
    'Alt+F4',
    'Alt+Left',
    'Alt+Right',
  ].map((k) => shortcutKey(parseShortcut(k))),
);

/** Whether the browser keeps the shortcut for itself. @param {Shortcut | string} shortcut */
export function isBrowserShortcut(shortcut) {
  const s = typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;
  return BROWSER_KEYS.has(shortcutKey(s));
}

/** Groups whose actions apply everywhere, so their keys overlap every other scope. */
const GLOBAL_GROUPS = new Set(['go', 'pages', 'page', 'insert', 'setting', 'app']);

/**
 * The shortcut problems of a registry: two actions with the same key in overlapping scopes (the same context group, or one of them global),
 * and keys the browser keeps.
 * @param {{ id: string, group: ActionGroup, shortcut?: { key: string } }[]} actions
 * @returns {string[]} one sentence per problem
 */
export function shortcutConflicts(actions) {
  const problems = [];
  const withKeys = actions.filter((a) => a.shortcut?.key).map((a) => ({ a, s: parseShortcut(/** @type {string} */ (a.shortcut?.key)) }));
  for (const { a, s } of withKeys) {
    if (isBrowserShortcut(s)) problems.push(`${a.id}: the browser keeps ${a.shortcut?.key}`);
  }
  for (let i = 0; i < withKeys.length; i++) {
    for (let j = i + 1; j < withKeys.length; j++) {
      const x = withKeys[i];
      const y = withKeys[j];
      if (shortcutKey(x.s) !== shortcutKey(y.s)) continue;
      const overlap = x.a.group === y.a.group || GLOBAL_GROUPS.has(x.a.group) || GLOBAL_GROUPS.has(y.a.group);
      if (overlap) problems.push(`${x.a.id} and ${y.a.id} share ${x.a.shortcut?.key}`);
    }
  }
  return problems;
}

// Places -----------------------------------------------------------------------------------------------------------

/**
 * An action stands in at most one of the bar, its ⋮ (`more`) and the block action row: "Each action is in one place only."
 * @param {{ id: string, where?: { bar?: unknown, more?: unknown, row?: unknown } }} action
 * @returns {string | null}
 */
export function placeProblems(action) {
  const places = ['bar', 'more', 'row'].filter((p) => action.where?.[/** @type {'bar' | 'more' | 'row'} */ (p)]);
  return places.length > 1 ? `${action.id} is in ${places.join(' and ')}; an action is in one place only` : null;
}

// One icon per meaning (section 3.1) ------------------------------------------------------------------------------

/** The owner's standard (14 November): one Material Symbols icon per meaning. */
export const MEANING_ICONS = Object.freeze({
  'settings-here': 'tune',
  'settings-editor': 'settings',
  'settings-app': 'settings',
  'edit-elsewhere': 'edit',
});

/**
 * The icon problems of a registry: two actions with the same meaning and different icons, an action whose meaning has a fixed icon
 * drawing another, `settings` (the gear) on anything but the editor's Settings and an app's Settings tab, and `edit` (the pencil) on a settings action.
 * @param {{ id: string, icon?: string, meaning?: string }[]} actions
 * @returns {string[]} one sentence per problem
 */
export function iconProblems(actions) {
  const problems = [];
  const firstIcon = new Map();
  for (const a of actions) {
    if (!a.icon) continue;
    const fixed = a.meaning ? MEANING_ICONS[/** @type {keyof typeof MEANING_ICONS} */ (a.meaning)] : undefined;
    if (fixed && a.icon !== fixed) problems.push(`${a.id} means ${a.meaning} and must draw ${fixed}, not ${a.icon}`);
    if (a.icon === 'settings' && a.meaning !== 'settings-editor' && a.meaning !== 'settings-app') {
      problems.push(`${a.id} draws settings (the gear), which is only for the editor's Settings and an app's Settings tab`);
    }
    if (a.icon === 'edit' && a.meaning?.startsWith('settings')) {
      problems.push(`${a.id} draws edit (the pencil) for settings; settings of the thing you are on draw tune`);
    }
    if (a.meaning) {
      const seen = firstIcon.get(a.meaning);
      if (seen && seen.icon !== a.icon) problems.push(`${seen.id} and ${a.id} both mean ${a.meaning} but draw ${seen.icon} and ${a.icon}`);
      if (!seen) firstIcon.set(a.meaning, { id: a.id, icon: a.icon });
    }
  }
  return problems;
}

// Recent actions (section 4.6) ------------------------------------------------------------------------------------

/** How many ids are kept, and how many the palette shows. */
export const RECENT_KEPT = 8;
export const RECENT_SHOWN = 5;

/**
 * @typedef {{ ids: string[], counts: Record<string, number> }} RecentState
 */

/**
 * Reads a stored value as a recent state; anything broken is an empty one.
 * @param {unknown} value
 * @returns {RecentState}
 */
export function readRecent(value) {
  const v = /** @type {any} */ (value);
  const ids = Array.isArray(v?.ids) ? v.ids.filter((x) => typeof x === 'string').slice(0, RECENT_KEPT) : [];
  const counts = {};
  if (v?.counts && typeof v.counts === 'object') {
    for (const [k, n] of Object.entries(v.counts)) if (typeof n === 'number' && n > 0) counts[k] = Math.floor(n);
  }
  return { ids, counts };
}

/**
 * The state after running an action: its id first (once), the last 8 kept, its use count up by one.
 * An id with a target is written `<action>:<target>` (`go.page:/about`).
 * @param {RecentState} state
 * @param {string} id
 * @returns {RecentState}
 */
export function pushRecent(state, id) {
  const ids = [id, ...state.ids.filter((x) => x !== id)].slice(0, RECENT_KEPT);
  const counts = { ...state.counts, [id]: (state.counts[id] ?? 0) + 1 };
  for (const k of Object.keys(counts)) if (!ids.includes(k)) delete counts[k];
  return { ids, counts };
}

/**
 * The recent ids the palette shows: newest first, at most 5, without ids whose action or target no longer exists.
 * @param {RecentState} state
 * @param {(id: string) => boolean} exists
 */
export function recentShown(state, exists) {
  return state.ids.filter(exists).slice(0, RECENT_SHOWN);
}

/** An empty recent state (sign-out, *Clear recent actions*). @returns {RecentState} */
export function clearRecent() {
  return { ids: [], counts: {} };
}
