#!/usr/bin/env node
// m3-tokens.mjs: a tokens-only copy of the Material 3 design tokens published on m3.material.io.
//
// Usage: node scripts/m3-tokens.mjs docs/m3-tokens [--delay=1000] [--contexts] [--md]
//
// Run by hand when M3 changes, never in CI (plans/2026-11-20-0-19-5-material-3-tokens.md, The token copy).
// By default each token keeps its reference, its public M3 value (Audience 3P) in light and dark, and its
// Expressive value where the Expressive motion scheme differs. --contexts keeps every other context the data
// has (platforms, contrast levels, 1P), and --md writes a Markdown table per set; both make the copy large.
//
// How it works (no browser needed; Node 22, built-in fetch):
//   1. m3.material.io's HTML names its Angular bundle (static/angular/main.<hash>.js). The bundle holds
//      the content version (`carbonVersion`) and the route table: slug -> page content file id.
//   2. Each page content file (/_dsm/content/m3/<version>/<id>.json) is read only to find its token
//      modules (RESOURCE chunks); no page text is kept.
//   3. Each token module (/_dsm/data/dsdb-m3/<version>/<TYPE>.<id>.json) is fetched. These hold the
//      token sets, tokens, values, context tags and the per-context reference trees with resolved values.
//   4. Writes <outDir>/<set>.json per token set and <outDir>/index.json (and <outDir>/md/<set>.md with --md).
//
// Requests are sequential with a delay between them. The raw module files are not stored: they carry
// the names and e-mail addresses of the people who edited the tokens.

import fs from 'node:fs/promises';
import path from 'node:path';

const ORIGIN = 'https://m3.material.io';
const UA = 'm3-tokens/1.0 (design token reference copy; Node fetch)';
const TOKEN_MODULES = ['TOKEN_TABLE', 'COLOR', 'ELEVATION', 'MOTION', 'SHAPE', 'TYPOGRAPHY', 'OPACITY', 'MEASUREMENT'];

const args = process.argv.slice(2);
const outDir = args.find((a) => !a.startsWith('--'));
const delay = Number((args.find((a) => a.startsWith('--delay=')) || '--delay=1000').split('=')[1]);
const keepContexts = args.includes('--contexts');
const writeMd = args.includes('--md');
if (!outDir) {
  console.error('Usage: node scripts/m3-tokens.mjs <outDir> [--delay=1000] [--contexts] [--md]');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let requests = 0;
async function get(url, as = 'json') {
  if (requests++) await sleep(delay);
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: as === 'json' ? 'application/json' : '*/*' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return as === 'json' ? res.json() : res.text();
}

// A JS single-quoted string literal body -> its value.
const unescapeJs = (s) =>
  s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (m, e) => {
    if (e[0] === 'u' && e.length === 5) return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e[0] === 'x' && e.length === 3) return String.fromCharCode(parseInt(e.slice(1), 16));
    return { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }[e] ?? e;
  });

// ---------- 1. bundle: version and routes ----------
async function readBundle() {
  const html = await get(ORIGIN + '/', 'text');
  const main = html.match(/static\/angular\/main\.[0-9a-f]+\.js/);
  if (!main) throw new Error('main bundle not found in the home page');
  const js = await get(`${ORIGIN}/${main[0]}`, 'text');
  const version = (js.match(/carbonVersion:"([^"]+)"/) || [])[1];
  if (!version) throw new Error('carbonVersion not found in the bundle');
  const routes = [];
  for (const m of js.matchAll(/JSON\.parse\('((?:[^'\\]|\\[\s\S])*)'\)/g)) {
    if (!m[1].includes('exportedCarbonFileId')) continue;
    const data = JSON.parse(unescapeJs(m[1]));
    for (const r of data.v || []) if (r.exportedCarbonFileId) routes.push({ slug: r.slug, file: r.exportedCarbonFileId });
  }
  if (!routes.length) throw new Error('route table not found in the bundle');
  return { bundle: main[0], version, routes };
}

// ---------- 2. pages: token module references only ----------
function moduleRefs(page) {
  const refs = [];
  for (const s of page.sections || [])
    for (const b of s.contentBlocks || [])
      for (const c of b.contentChunks || [])
        if (c.contentChunkType === 'RESOURCE' && TOKEN_MODULES.includes(c.libraryModuleType) && c.resourceName) {
          const id = c.libraryModuleType === 'TOKEN_TABLE' ? c.resourceName.split('components/')[1] : c.resourceName.split('/')[1];
          if (id) refs.push(`${c.libraryModuleType}.${id}`);
        }
  return refs;
}

// ---------- values ----------
const round = (n, d = 4) => Math.round(n * 10 ** d) / 10 ** d;
const hex = (c) => {
  const h =
    '#' +
    ['red', 'green', 'blue']
      .map((k) =>
        Math.round((c[k] || 0) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .toUpperCase();
  const a = c.alpha === undefined ? 1 : c.alpha;
  return a < 1
    ? h +
        Math.round(a * 255)
          .toString(16)
          .padStart(2, '0')
          .toUpperCase()
    : h;
};
const dim = (l) => ({ value: round(l.value || 0), unit: l.unit === 'DIPS' ? 'dp' : (l.unit || '').toLowerCase() || null });
// A literal value -> { value, unit } (value may be a string, number or object); a reference -> { ref }.
function literal(v) {
  if (!v) return null;
  if (v.tokenName) return { ref: v.tokenName };
  if (v.color) return { value: hex(v.color), unit: 'color' };
  if (v.length) return dim(v.length);
  if (v.elevation) return dim(v.elevation);
  if (v.fontSize) return dim(v.fontSize);
  if (v.lineHeight) return dim(v.lineHeight);
  if (v.fontTracking) return dim(v.fontTracking);
  if (v.shape) {
    const f = (v.shape.family || '').replace('SHAPE_FAMILY_', '').toLowerCase();
    // Per-corner sizes (e.g. a "top" shape) sit beside defaultSize; keep every size the data gives.
    const sizes = Object.entries(v.shape).filter(([k, x]) => k !== 'family' && x && typeof x === 'object');
    if (!sizes.length) return { value: f, unit: null, shape: f };
    if (sizes.length === 1 && sizes[0][0] === 'defaultSize') return { value: dim(v.shape.defaultSize).value, unit: 'dp', shape: f };
    return {
      value: Object.fromEntries(sizes.map(([k, x]) => [k, x.unit || x.value !== undefined ? dim(x).value : x])),
      unit: 'dp',
      shape: f,
    };
  }
  if (v.fontNames) return { value: v.fontNames.values.join(', '), unit: 'font' };
  if (v.fontWeight !== undefined) return { value: v.fontWeight, unit: 'weight' };
  if (v.opacity !== undefined) return { value: round(v.opacity), unit: 'opacity' };
  if (v.numeric !== undefined) return { value: round(v.numeric), unit: null };
  if (v.type) return { value: v.type, unit: 'typography' };
  if (v.customComposite) {
    const o = {};
    for (const [k, p] of Object.entries(v.customComposite.properties || {})) o[k] = p.tokenName ? { ref: p.tokenName } : (literal(p) ?? p);
    return { value: o, unit: 'composite' };
  }
  if ('undefined' in v) return null;
  const rest = Object.fromEntries(
    Object.entries(v).filter(
      ([k]) =>
        !['name', 'revisionId', 'revisionCreateTime', 'state', 'createTime', 'contextTags', 'specificityScore', 'tokenName'].includes(k),
    ),
  );
  return Object.keys(rest).length ? { value: rest, unit: null } : null;
}
const show = (l) => {
  if (!l) return '—';
  if (l.ref) return l.ref;
  if (l.unit === 'typography') return Object.values(l.value).join(' / ');
  if (l.unit === 'composite')
    return Object.entries(l.value)
      .map(([k, x]) => `${k}: ${x && x.ref ? x.ref : show(x)}`)
      .join('; ');
  if (l.shape && typeof l.value === 'object')
    return Object.entries(l.value)
      .map(([k, x]) => `${k} ${typeof x === 'number' ? x + 'dp' : JSON.stringify(x)}`)
      .join(', ');
  if (typeof l.value === 'object') return JSON.stringify(l.value);
  if (l.unit === 'dp') return `${l.value}dp${l.shape && l.shape !== 'rounded_corners' ? ` (${l.shape})` : ''}`;
  return String(l.value);
};

// ---------- 3. merge modules ----------
function merge(modules) {
  const sets = new Map(),
    tokens = new Map(),
    groups = new Map(),
    tagGroups = new Map(),
    tags = new Map(),
    valueByName = new Map(),
    trees = new Map();
  for (const { system: s } of modules) {
    for (const x of s.tokenSets || []) sets.set(x.name, x);
    for (const x of s.displayGroups || []) groups.set(x.name, x);
    for (const x of s.contextTagGroups || []) tagGroups.set(x.name, x);
    for (const x of s.tags || []) tags.set(x.name, x);
    for (const x of s.values || []) valueByName.set(x.name, x);
    for (const x of s.tokens || []) if (!tokens.has(x.tokenName) || sets.has(x.name.split('/tokens/')[0])) tokens.set(x.tokenName, x);
    for (const [k, v] of Object.entries(s.contextualReferenceTrees || {})) trees.set(k, v.contextualReferenceTree || []);
  }
  return { sets, tokens, groups, tagGroups, tags, valueByName, trees };
}

function build(db) {
  const { sets, tokens, groups, tagGroups, tags, valueByName, trees } = db;
  const groupOfTag = (t) => tagGroups.get(t.split('/tags/')[0]);
  const describe = (ids = []) => {
    const o = {};
    for (const id of ids) {
      const g = groupOfTag(id),
        t = tags.get(id);
      if (g && t) o[g.displayName] = t.displayName;
    }
    return o;
  };
  // M3 baseline: every context group at its default, except Audience = 3P (the public Material 3).
  const target = (theme, motion) => {
    const o = {};
    for (const g of tagGroups.values()) o[g.displayName] = tags.get(g.defaultTag)?.displayName;
    o.Audience = '3P';
    o.Theme = theme;
    if (motion) o['Motion scheme'] = motion;
    return o;
  };
  const fits = (ids, want) =>
    (ids || []).every((id) => {
      const g = groupOfTag(id),
        t = tags.get(id);
      return g && t && want[g.displayName] === t.displayName;
    });
  const specificity = (ids) => (ids || []).reduce((n, id) => n + (groupOfTag(id)?.specificity || 1), 0);
  const best = (items, want, idsOf) =>
    items.filter((x) => fits(idsOf(x), want)).sort((a, b) => specificity(idsOf(b)) - specificity(idsOf(a)))[0];
  const chainOf = (tree) => {
    const c = [];
    let n = tree;
    while (n) {
      if (n.tokenName) c.push(n.tokenName);
      n = (n.childNodes || [])[0];
    }
    return c;
  };
  const leafValue = (tree) => {
    let n = tree;
    while (n.childNodes && n.childNodes.length) n = n.childNodes[0];
    return valueByName.get(n.value?.name);
  };

  const groupPath = (name) => {
    const p = [];
    let g = groups.get(name);
    while (g) {
      p.unshift(g.displayName);
      g = groups.get(g.parentGroup);
    }
    return p.join(' › ') || null;
  };
  const groupKey = (name) => {
    const k = [];
    let g = groups.get(name);
    while (g) {
      k.unshift(g.orderInParentDisplayGroup ?? g.orderInParentTokenSet ?? 0);
      g = groups.get(g.parentGroup);
    }
    return k;
  };

  const valuesOf = new Map();
  for (const v of valueByName.values()) {
    const k = v.name.split('/values/')[0];
    if (!valuesOf.has(k)) valuesOf.set(k, []);
    valuesOf.get(k).push(v);
  }

  const out = new Map();
  for (const t of tokens.values()) {
    const setRes = t.name.split('/tokens/')[0];
    const set = sets.get(setRes);
    const setName = set?.tokenSetName || t.tokenName.split('.').slice(0, 3).join('.');
    const vals = (valuesOf.get(t.name) || []).filter((v) => !('undefined' in v));
    const tr = trees.get(t.name) || [];
    const direct = vals.filter((v) => !v.contextTags?.length);
    const entry = {
      token: t.tokenName,
      type: t.tokenValueType || null,
      group: groupPath(t.displayGroup),
      value: direct.length === 1 ? literal(direct[0]) : null, // the token's own value (reference or literal)
      resolved: {},
      chain: null,
      contexts: [],
    };
    const resolvedFor = (theme, motion) => {
      const want = target(theme, motion);
      if (tr.length) {
        const x = best(tr, want, (y) => y.contextTags);
        if (x) return { chain: chainOf(x.referenceTree), lit: literal(x.resolvedValue) || literal(leafValue(x.referenceTree)) };
      }
      const v = best(vals, want, (y) => y.contextTags);
      if (v) return { chain: [t.tokenName], lit: literal(v) };
      return null;
    };
    for (const theme of ['Light', 'Dark']) {
      const r = resolvedFor(theme);
      if (r) {
        entry.resolved[theme.toLowerCase()] = r.lit;
        if (theme === 'Light') entry.chain = r.chain;
      }
    }
    // Expressive wins where a token has an Expressive value (skill material-3); kept only where it differs.
    const expressive = {};
    for (const theme of ['Light', 'Dark']) {
      const r = resolvedFor(theme, 'Expressive');
      if (r && JSON.stringify(r.lit) !== JSON.stringify(entry.resolved[theme.toLowerCase()])) expressive[theme.toLowerCase()] = r.lit;
    }
    if (Object.keys(expressive).length) entry.expressive = expressive;
    // Every context the data resolves; a context's chain is given only where it differs from the baseline chain.
    if (tr.length)
      for (const x of tr) {
        const c = { when: describe(x.contextTags), value: literal(x.resolvedValue) || literal(leafValue(x.referenceTree)) };
        const ch = chainOf(x.referenceTree);
        if (ch.join() !== (entry.chain || []).join()) c.chain = ch;
        entry.contexts.push(c);
      }
    else for (const v of vals) if (v.contextTags?.length) entry.contexts.push({ when: describe(v.contextTags), value: literal(v) });
    if (!entry.contexts.length || !keepContexts) delete entry.contexts;
    if (!out.has(setName))
      out.set(setName, {
        set: setName,
        displayName: set?.displayName || null,
        description: set?.description || null,
        tokenClass: set?.custom?.token_class || null,
        tokens: [],
        _keys: new Map(),
      });
    const o = out.get(setName);
    o.tokens.push(entry);
    o._keys.set(entry.token, [...groupKey(t.displayGroup), t.orderInDisplayGroup || 0]);
  }
  const cmp = (a, b) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const d = (a[i] ?? -1) - (b[i] ?? -1);
      if (d) return d;
    }
    return 0;
  };
  for (const o of out.values()) {
    o.tokens.sort((a, b) => cmp(o._keys.get(a.token), o._keys.get(b.token)) || a.token.localeCompare(b.token));
    delete o._keys;
  }
  return out;
}

// ---------- 4. write ----------
const mdCell = (s) => String(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
function markdown(set, version) {
  const lines = [
    `# ${set.set}`,
    '',
    `Source: m3.material.io token data, content version ${version}. Values: Material 3 baseline (3P, default contrast); light / dark where they differ.`,
    '',
  ];
  let group;
  const head = ['| Token | Reference | Value |', '| --- | --- | --- |'];
  for (const t of set.tokens) {
    if (t.group !== group || group === undefined) {
      group = t.group;
      lines.push('', `## ${group || 'Tokens'}`, '', ...head);
    }
    const ref = t.chain && t.chain.length > 1 ? t.chain.slice(1).join(' → ') : t.value && t.value.ref ? t.value.ref : '';
    const l = show(t.resolved.light ?? t.value),
      d = show(t.resolved.dark ?? t.value);
    lines.push(`| ${mdCell(t.token)} | ${mdCell(ref)} | ${mdCell(l === d ? l : `${l} / ${d}`)} |`);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

const started = Date.now();
const { bundle, version, routes } = await readBundle();
console.log(`version ${version}, ${routes.length} pages`);
const refs = new Map(); // module key -> pages
const pageErrors = [];
for (const r of [...new Map(routes.map((x) => [x.file, x])).values()]) {
  try {
    const page = await get(`${ORIGIN}/_dsm/content/m3/${version}/${r.file}`);
    for (const k of moduleRefs(page)) {
      if (!refs.has(k)) refs.set(k, []);
      refs.get(k).push(r.slug);
    }
  } catch (e) {
    pageErrors.push({ page: r.slug, error: e.message });
  }
}
// The system-wide modules (COLOR, MOTION, SHAPE, OPACITY …) of each design system seen, even when no page
// shows them; an empty or missing one is harmless.
for (const sys of new Set([...refs.keys()].filter((k) => !k.startsWith('TOKEN_TABLE.')).map((k) => k.split('.')[1])))
  for (const type of TOKEN_MODULES.slice(1)) if (!refs.has(`${type}.${sys}`)) refs.set(`${type}.${sys}`, []);
console.log(`${refs.size} token modules (referenced by pages, plus system-wide ones)`);
const modules = [],
  fetched = [],
  failed = [];
for (const key of refs.keys()) {
  try {
    const m = await get(`${ORIGIN}/_dsm/data/dsdb-m3/${version}/${key}.json`);
    if (!m.system) throw new Error('no system in module');
    modules.push(m);
    fetched.push({
      module: key,
      pages: refs.get(key),
      revision: m.system.revisionCreateTime,
      tokenSets: (m.system.tokenSets || []).map((s) => s.tokenSetName),
    });
  } catch (e) {
    failed.push({ module: key, error: e.message });
  }
}
const sets = build(merge(modules));
await fs.mkdir(path.join(outDir, writeMd ? 'md' : ''), { recursive: true });
const counts = {};
for (const s of [...sets.values()].sort((a, b) => a.set.localeCompare(b.set))) {
  counts[s.set] = s.tokens.length;
  const { tokens: list, ...head } = s; // one token per line keeps the files small and diffable
  await fs.writeFile(
    path.join(outDir, `${s.set}.json`),
    JSON.stringify(head, null, 1).replace(/\n}$/, `,\n "tokens": [\n${list.map((t) => '  ' + JSON.stringify(t)).join(',\n')}\n ]\n}\n`),
  );
  if (writeMd) await fs.writeFile(path.join(outDir, 'md', `${s.set}.md`), markdown(s, version));
}
const index = {
  source: ORIGIN,
  carbonVersion: version,
  bundle,
  fetched: new Date().toISOString(),
  baseline:
    'resolved.light / resolved.dark = Audience 3P, every other context group at its default (contrast Default, motion Standard, platform Android); expressive = the same with Motion scheme Expressive, where it differs' +
    (keepContexts ? '; every context the data has is in contexts[]' : ''),
  modules: fetched,
  failedModules: failed,
  failedPages: pageErrors,
  sets: counts,
  totalTokens: Object.values(counts).reduce((a, b) => a + b, 0),
  requests,
  seconds: Math.round((Date.now() - started) / 1000),
};
await fs.writeFile(path.join(outDir, 'index.json'), JSON.stringify(index, null, 1) + '\n');
console.log(
  `${Object.keys(counts).length} sets, ${index.totalTokens} tokens, ${failed.length} failed modules, ${pageErrors.length} failed pages, ${index.seconds}s`,
);
