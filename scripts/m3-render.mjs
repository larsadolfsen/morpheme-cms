// The logic of `check:m3-render` (scripts/check-m3-render.mjs), with no browser, so it is tested alone (scripts/check-m3-render.test.mjs): the Material 3 values
// of a sample read from the token copy (docs/m3-tokens/) and docs/m3-tokens/printed.json, the comparison with what the browser measured, and the allowlist
// (scripts/m3-render.allow.mjs). Plan: docs/superpowers/plans/2026-11-21-0-19-5-measured-m3-check.md, section 2.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
export const COPY = join(root, 'docs/m3-tokens');

/** One pixel of tolerance on sizes (the plan); a colour must be the role. */
export const TOLERANCE = 1;

const cache = new Map();
/** A token set of the copy (`md.comp.button.small`): its tokens by name, or an empty map when the copy has no such set. @returns {Map<string, any>} */
export function loadSet(set, dir = COPY) {
  const key = `${dir}|${set}`;
  if (!cache.has(key)) {
    const file = join(dir, `${set}.json`);
    const map = new Map();
    if (existsSync(file)) for (const t of JSON.parse(readFileSync(file, 'utf8')).tokens) map.set(t.token.slice(set.length + 1), t);
    cache.set(key, map);
  }
  return cache.get(key);
}

/** The token's value in `mode` (light or dark), the Expressive one where the token has both (skill material-3). */
export function value(token, mode = 'light') {
  if (!token) return undefined;
  const side = token.expressive ?? token.resolved;
  const v = side?.[mode] ?? side?.light ?? token.resolved?.light;
  return v;
}

/** A length, size, opacity, weight or other plain number of a token, or undefined. */
export function num(token, mode) {
  const v = value(token, mode)?.value;
  return typeof v === 'number' ? v : undefined;
}

/** A shape: a number of dp, or `full` for a circular corner. */
export function shape(token, mode) {
  const v = value(token, mode);
  if (!v) return undefined;
  if (v.shape === 'circular' || v.value === 'circular') return 'full';
  return typeof v.value === 'number' ? v.value : undefined;
}

/** A typography token's four numbers. */
export function type(token, mode) {
  const v = value(token, mode)?.value;
  if (!v || typeof v !== 'object') return undefined;
  return { fontSize: v.fontSize?.value, lineHeight: v.lineHeight?.value, fontWeight: v.fontWeight, tracking: v.fontTracking?.value };
}

/** The colour role a colour token ends in (`md.sys.color.on-primary` -> `on-primary`). */
export function role(token) {
  const hit = token?.chain?.find((c) => c.startsWith('md.sys.color.'));
  return hit ? hit.slice('md.sys.color.'.length) : undefined;
}

/** The first token of the sets (in order) that has the name. */
export function find(sets, name) {
  for (const s of sets) {
    const t = loadSet(s).get(name);
    if (t) return { token: t, set: s };
  }
  return undefined;
}

/** The names of the colour roles. */
export const roleNames = () => [...loadSet('md.sys.color').keys()];

/** The values Material 3 prints only on a page (docs/m3-tokens/printed.json). */
export function printed(file = join(COPY, 'printed.json')) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).values : [];
}

// ---- What each family of samples is, in Material 3's words ----

/** Our button sizes are Material 3's (xsmall, small the default, medium, large, xlarge), one for one. */
export const BUTTON_SIZE = { xsmall: 'xsmall', small: 'small', medium: 'medium', large: 'large', xlarge: 'xlarge' };
/** Our icon button sizes: `small` is the default one, the others have Material 3's names. */
export const ICON_BUTTON_SIZE = { xsmall: 'xsmall', small: 'small', medium: 'medium', large: 'large', xlarge: 'xlarge' };

const has = (m, c) => m.classes.includes(c);
const pick = (m, prefix, list, fallback) => list.find((s) => has(m, `${prefix}${s}`)) ?? fallback;

/** What a measured root is: `{ family, sets, kind, state, label }`, or undefined when no family measures it. `m`: what the page measured (see `measure` in check-m3-render.mjs). */
export function resolve(m) {
  const state = [m.disabled && 'disabled', m.selected === true && 'selected', m.selected === false && 'unselected'].filter(Boolean);
  const kindOf = (k) => ['filled', 'tonal', 'elevated', 'outlined'].find((x) => has(m, `mo-is-${x}`)) ?? k;
  if (m.root === 'mo-button') {
    const kind = has(m, 'mo-is-text') ? 'text' : kindOf('filled');
    const ours = pick(m, 'mo-is-', ['xsmall', 'medium', 'large', 'xlarge'], 'small');
    const size = BUTTON_SIZE[ours];
    return {
      family: 'button',
      sets: [`md.comp.button.${size}`, `md.comp.button.${kind}`, 'md.comp.button'],
      kind,
      size,
      ours,
      state,
      shape: has(m, 'mo-is-square') ? 'square' : 'round',
    };
  }
  if (m.root === 'mo-icon-button') {
    const kind = kindOf('standard');
    const ours = pick(m, 'mo-is-', ['xsmall', 'medium', 'large', 'xlarge'], 'small');
    const size = ICON_BUTTON_SIZE[ours];
    const width = pick(m, 'mo-is-', ['narrow', 'wide'], 'default');
    return {
      family: 'icon-button',
      sets: [`md.comp.icon-button.${size}`, `md.comp.icon-button.${kind}`, 'md.comp.icon-button'],
      kind,
      size,
      ours,
      width,
      state,
      shape: has(m, 'mo-is-square') ? 'square' : 'round',
    };
  }
  if (m.root === 'mo-chip') {
    const kind = ['assist', 'filter', 'input', 'suggestion'].find((x) => has(m, `mo-is-${x}`)) ?? 'assist';
    return { family: 'chip', sets: [`md.comp.${kind}-chip`], kind, state, elevated: has(m, 'mo-is-elevated') };
  }
  if (m.root === 'mo-text-field') {
    const kind = has(m, 'mo-is-filled') ? 'filled' : 'outlined';
    return { family: 'text-field', sets: [`md.comp.${kind}-text-field`], kind, state, error: has(m, 'mo-is-error') };
  }
  if (m.root === 'mo-card') {
    const kind = kindOf('outlined');
    return { family: 'card', sets: [`md.comp.${kind}-card`], kind, state };
  }
  if (m.root === 'mo-fab' || m.root === 'mo-extended-fab') {
    const color =
      ['primary-container', 'secondary-container', 'tertiary-container', 'primary', 'secondary', 'tertiary', 'surface'].find((x) =>
        has(m, `mo-is-${x}`),
      ) ?? 'primary-container';
    const ours = pick(m, 'mo-is-', ['small', 'medium', 'large'], 'baseline');
    const base = m.root === 'mo-fab' ? 'md.comp.fab' : 'md.comp.extended-fab';
    return {
      family: m.root === 'mo-fab' ? 'fab' : 'extended-fab',
      sets: [ours === 'baseline' ? base : `${base}.${ours}`, `${base}.${color}`, base],
      kind: color,
      size: ours,
      state,
    };
  }
  if (m.root === 'mo-checkbox')
    return { family: 'checkbox', sets: ['md.comp.checkbox'], kind: 'checkbox', state, error: has(m, 'mo-is-error') };
  if (m.root === 'mo-switch') return { family: 'switch', sets: ['md.comp.switch'], kind: 'switch', state };
  if (m.root === 'mo-radio-button') return { family: 'radio-button', sets: ['md.comp.radio-button'], kind: 'radio-button', state };
  if (m.root === 'mo-divider') return { family: 'divider', sets: ['md.comp.divider'], kind: 'divider', state };
  return undefined;
}

/** Samples whose own tokens restyle the components inside them (a button in a split button, a text field in a picker): measured when their own family has an adapter. */
export const RESTYLES = [
  'md.comp.split-button',
  'md.comp.button-group',
  'md.comp.fab-menu',
  'md.comp.toolbar',
  'md.comp.snackbar',
  'md.comp.date-picker',
  'md.comp.time-picker',
  'md.comp.navigation-rail',
  'md.comp.navigation-bar',
  'md.comp.badge',
  'md.comp.select',
  'md.comp.tabs',
];

/** The roots (a class) the page looks for, and the mark's family each must stand under. The mark is a prefix of the family's set names, or `none`. */
export const ROOTS = {
  'mo-button': 'md.comp.button',
  'mo-icon-button': 'md.comp.icon-button',
  'mo-chip': 'md.comp.chip',
  'mo-text-field': 'md.comp.text-field',
  'mo-card': 'md.comp.card',
  'mo-fab': 'md.comp.fab',
  'mo-extended-fab': 'md.comp.fab',
  'mo-checkbox': 'md.comp.checkbox',
  'mo-switch': 'md.comp.switch',
  'mo-radio-button': 'md.comp.radio-button',
  'mo-divider': 'md.comp.divider',
  'mo-list': 'md.comp.list',
  'mo-menu': 'md.comp.menu',
  'mo-dialog': 'md.comp.dialog',
  'mo-sheet': 'md.comp.sheet',
  'mo-carousel': 'md.comp.carousel',
  'mo-avatar': 'none',
  'mo-top-app-bar': 'md.comp.top-app-bar',
  'mo-search': 'md.comp.search',
  'mo-search-bar': 'md.comp.search',
  'mo-search-view': 'md.comp.search',
  'mo-dropdown-menu': 'md.comp.menu',
  'mo-select': 'md.comp.select',
  'mo-navigation-drawer': 'md.comp.navigation-drawer',
  'mo-tabs': 'md.comp.tabs',
  'mo-badge': 'md.comp.badge',
  'mo-button-group': 'md.comp.button-group',
  'mo-choice-group': 'md.comp.button-group',
  'mo-radio-group': 'md.comp.radio-button',
  'mo-setting-row': 'md.comp.list',
  'mo-split-button': 'md.comp.split-button',
  'mo-fab-menu': 'md.comp.fab-menu',
  'mo-slider': 'md.comp.slider',
  'mo-loading-indicator': 'md.comp.loading-indicator',
  'mo-linear-progress-indicator': 'md.comp.progress-indicator.linear',
  'mo-circular-progress-indicator': 'md.comp.progress-indicator.circular',
  'mo-snackbar': 'md.comp.snackbar',
  'mo-tooltip': 'md.comp.plain-tooltip',
  'mo-nav-bar': 'md.comp.navigation-bar',
  'mo-nav-rail': 'md.comp.navigation-rail',
  'mo-toolbar': 'md.comp.toolbar',
  'mo-date-picker': 'md.comp.date-picker',
  'mo-time-picker': 'md.comp.time-picker',
};

/** A mark agrees with a root's family: equal, or a more exact set of it (`md.comp.sheet.bottom` stands for `md.comp.sheet`). */
export const agrees = (mark, family) => mark === family || mark.startsWith(`${family}.`) || family.startsWith(`${mark}.`);

// ---- What to compare ----

const NUMERIC = (a, b) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= TOLERANCE;
const round = (n) => (typeof n === 'number' ? Math.round(n * 100) / 100 : n);

/** The checks of one sample: `{ attr, got, want, token, color? }`, from what the page measured (`m`), what the sample is (`r`) and the mode. Colours: `got` and `want` are roles. */
export function expectations(m, r, mode = 'light') {
  const out = [];
  const add = (attr, got, want, token, extra = {}) => {
    if (want === undefined || got === undefined) return;
    out.push({ attr, got, want, token, set: extra.set ?? setOf(token), ...extra });
  };
  const sets = r.sets;
  const tokenOf = (...names) => {
    for (const n of names) {
      const f = find(sets, n);
      if (f) return { ...f, name: n };
    }
    return undefined;
  };
  const length = (attr, got, ...names) => {
    const f = tokenOf(...names);
    if (f) add(attr, got, num(f.token, mode), `${f.set}.${f.name}`);
  };
  const colour = (attr, gotRoles, ...names) => {
    const f = tokenOf(...names);
    if (!f) return;
    const want = role(f.token);
    if (!want) return;
    add(attr, gotRoles, want, `${f.set}.${f.name}`, { color: true });
  };
  const font = (prefix, got, ...names) => {
    const f = tokenOf(...names);
    const t = f && type(f.token, mode);
    if (!t) return;
    add(`${prefix}.size`, got.fontSize, t.fontSize, `${f.set}.${f.name}`);
    add(`${prefix}.line-height`, got.lineHeight, t.lineHeight, `${f.set}.${f.name}`);
    add(`${prefix}.weight`, got.fontWeight, t.fontWeight, `${f.set}.${f.name}`);
    add(`${prefix}.tracking`, got.tracking, t.tracking, `${f.set}.${f.name}`);
  };
  const corner = (attr, got, ...names) => {
    const f = tokenOf(...names);
    if (!f) return;
    const want = shape(f.token, mode);
    if (want === undefined) return;
    add(attr, got.full ? 'full' : got.px, want, `${f.set}.${f.name}`);
  };
  const live = !r.state.includes('disabled');
  const toggled = r.state.includes('selected') || r.state.includes('unselected');
  const sel = r.state.includes('selected') ? 'selected' : 'unselected';

  if (r.family === 'button') {
    length('container.height', m.box.h, 'container.height');
    length('leading-space', m.pad.l, 'leading-space');
    length('trailing-space', m.pad.r, 'trailing-space');
    if (m.icon) length('icon-label-space', m.gap, 'icon-label-space');
    if (m.icon) length('icon.size', m.icon.w, 'icon.size');
    font('label-text', m.label, 'label-text');
    const sh = toggled ? `${sel}.container.shape.${r.shape}` : `container.shape.${r.shape}`;
    corner('container.shape', m.radius, sh);
    if (r.kind === 'outlined') length('outline.width', m.border.w, 'outlined.outline.width');
    if (live) {
      if (toggled || ['filled', 'tonal', 'elevated'].includes(r.kind))
        colour('container.color', m.bgRoles, toggled ? `${sel}.container.color` : 'container.color');
      colour('label-text.color', m.label.roles, toggled ? `${sel}.label-text.color` : 'label-text.color');
      if (m.icon) colour('icon.color', m.icon.roles, toggled ? `${sel}.icon.color` : 'icon.color');
    }
  } else if (r.family === 'icon-button') {
    length('container.height', m.box.h, 'container.height');
    const w = r.width;
    if (m.icon) {
      length('leading-space', (m.box.w - m.icon.w) / 2, `${w}.leading-space`);
      length('trailing-space', (m.box.w - m.icon.w) / 2, `${w}.trailing-space`);
    }
    if (m.icon) length('icon.size', m.icon.w, 'icon.size');
    const sh = toggled ? `${sel}.container.shape.${r.shape}` : `container.shape.${r.shape}`;
    corner('container.shape', m.radius, sh);
    if (r.kind === 'outlined') length('outline.width', m.border.w, 'outlined.outline.width', 'outline.width');
    if (live && m.icon) colour('icon.color', m.icon.roles, toggled ? `${sel}.icon.color` : 'icon.color');
    if (live && ['filled', 'tonal'].includes(r.kind) && !toggled) {
      const own = find([`md.comp.icon-button.${r.kind}`], 'container.color');
      if (own) add('container.color', m.bgRoles, role(own.token), `${own.set}.container.color`, { color: true });
    }
  } else if (r.family === 'chip') {
    length('container.height', m.box.h, 'container.height');
    corner('container.shape', m.radius, 'container.shape');
    font('label-text', m.label, 'label-text.type');
    const ic = m.icon;
    if (ic) length('icon.size', ic.w, 'with-icon.icon.size', 'with-leading-icon.icon.size', 'icon.size');
    if (live && r.kind === 'filter' && !r.elevated) length('outline.width', m.border.w, `flat.${sel}.outline.width`);
  } else if (r.family === 'text-field') {
    if (!m.multiline) length('container.height', m.container.h, 'container.height');
    corner('container.shape', m.radius, 'container.shape.top', 'container.shape');
    if (r.kind === 'outlined' && live) length('outline.width', m.border.w, 'outline.width');
    font('input-text', m.input, 'input-text.type');
    if (m.icon) length('leading-icon.size', m.icon.w, 'leading-icon.size');
    if (live && !r.error) colour('input-text.color', m.input.roles, 'input-text.color');
  } else if (r.family === 'card') {
    corner('container.shape', m.radius, 'container.shape');
    if (r.kind === 'outlined') length('outline.width', m.border.w, 'outline.width');
    if (live && !r.state.length) colour('container.color', m.bgRoles, 'container.color');
  } else if (r.family === 'fab' || r.family === 'extended-fab') {
    length('container.height', m.box.h, 'container.height');
    if (r.family === 'fab') length('container.width', m.box.w, 'container.width');
    corner('container.shape', m.radius, 'container.shape');
    if (m.icon) length('icon.size', m.icon.w, 'icon.size');
    colour('container.color', m.bgRoles, 'container.color');
    if (r.family === 'extended-fab') font('label-text', m.label, 'label-text');
  } else if (r.family === 'divider') {
    length('thickness', Math.min(m.box.w, m.box.h), 'thickness');
  }
  return out;
}

/** Compares what the page measured (`m`) with Material 3's: the differences of one sample in one mode, `{ id, attr, got, want, token }`. */
export function compare(m, r, mode) {
  const found = [];
  for (const e of expectations(m, r, mode)) {
    let same;
    if (e.color) same = Array.isArray(e.got) && e.got.includes(e.want);
    else same = typeof e.want === 'number' ? NUMERIC(e.got, e.want) : e.got === e.want;
    if (same) continue;
    const got = e.color ? (e.got.length ? e.got.join('|') : 'no role') : round(e.got);
    found.push({ set: e.set, attr: e.attr, token: e.token, got, want: e.color ? e.want : round(e.want), mode: e.color ? mode : undefined });
  }
  return found;
}

/** The set a token name belongs to: the longest prefix that is a set of the copy. */
function setOf(token) {
  const parts = token.split('.');
  for (let i = parts.length - 1; i >= 3; i--) {
    const s = parts.slice(0, i).join('.');
    if (loadSet(s).size) return s;
  }
  return parts.slice(0, 4).join('.');
}

/** The key of a difference, as the allowlist names it. */
export const keyOf = (f) => [f.set, f.attr, f.mode ?? '', `got=${f.got}`, `want=${f.want}`].join('|');

/** Counts differences by key: `Map<key, { finding, count, examples }>`; `where`: how to name the sample where it stood. */
export function tally(list, where) {
  const map = new Map();
  for (const f of list) {
    const k = keyOf(f);
    const e = map.get(k) ?? { finding: f, count: 0, examples: [] };
    e.count++;
    if (e.examples.length < 3) e.examples.push(where);
    map.set(k, e);
  }
  return map;
}

/** The allowlist against what was found: `{ unlisted, stale, bad }` (differences not listed, entries that no longer differ, entries without a class or a batch/reason). */
export function judge(found, allow) {
  const listed = new Map(allow.map((a) => [keyOf(a), a]));
  const unlisted = [...found.keys()].filter((k) => !listed.has(k));
  const stale = [...listed.keys()].filter((k) => !found.has(k));
  const bad = allow.filter((a) => !['fix', 'owner', 'wcag'].includes(a.class) || (a.class === 'fix' ? !a.batch : !a.why)).map(keyOf);
  return { unlisted, stale, bad };
}

/** The component batches of 0.19.5 (the plan's list); an entry of class `fix` names one of them. */
export const BATCHES = [
  'buttons',
  'icon buttons',
  'lists',
  'text fields',
  'menus',
  'chips',
  'cards',
  'dialogs and sheets',
  'app bars and navigation',
  'search',
  'the rest',
];

/** The batch a set belongs to (the component batches of the plan). */
export function batchOf(set) {
  const s = set.replace(/^md\.comp\./, '');
  if (/^(button|split-button|button-group|segmented)/.test(s)) return 'buttons';
  if (/^icon-button/.test(s)) return 'icon buttons';
  if (/^list/.test(s)) return 'lists';
  if (/text-field|select|autocomplete/.test(s)) return 'text fields';
  if (/^menu/.test(s)) return 'menus';
  if (/chip/.test(s)) return 'chips';
  if (/card/.test(s)) return 'cards';
  if (/^(dialog|full-screen-dialog|sheet)/.test(s)) return 'dialogs and sheets';
  if (/^(app-bar|top-app-bar|bottom-app-bar|nav|navigation|toolbar|tabs|primary-navigation|secondary-navigation)/.test(s))
    return 'app bars and navigation';
  if (/^search/.test(s)) return 'search';
  return 'the rest';
}
