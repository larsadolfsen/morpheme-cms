// An app's CSS scoped at build time (docs/superpowers/specs/2026-11-20-scoped-app-css-design.md, "The design"). The developer writes plain CSS; this
// turns it into CSS that reaches only the app's own blocks (the outer element of each carries `data-mo-app="<id>"`, src/standard/appScope.tsx):
//  1. selectors: every rule applies inside `[data-mo-app="<id>"]`. Mode `scope` wraps the rules in `@scope ([data-mo-app="<id>"]) to
//     ([data-mo-app]:not([data-mo-app="<id>"]))` (another app's block inside this one stays out); mode `prefix` puts `:where([data-mo-app="<id>"])`
//     before each selector (the same specificity, the nested case not excluded). Which one runs: APP_CSS_MODE.
//  2. custom properties: a `--mo-…` name the app declares that is not the CMS's is private: `--mo-app-<id>-<name>`, where it is declared and read.
//  3. `@keyframes`, `@property`, `@font-face` families and `@layer` names the app declares: renamed `mo-app-<id>-<name>`, with every use.
//  4. the app's rules go into the layer `mo-app`, the lowest of the page's layers (theme/styles/base.css declares the order).
// Exposes scopeAppCss, collectNames, privateName, APP_CSS_MODE, SCOPED_CSS_FROM_API, APP_LAYER, scopeAttr. Depends on postcss.
import postcss from 'postcss';

/** Which scoping the build writes. `@scope` is Baseline only since Firefox 146 (Dec 2025; Chrome 118, Safari 17.4), and the site builds for Vite's
 * `baseline-widely-available` target (Chrome 111, Firefox 114, Safari 16.4), so the build writes `prefix`. Set to `scope` when the target moves past
 * Firefox 146 and Safari 17.4 (the Modern Web Guidance's css guide prefers `@scope`; the tests cover both). */
export const APP_CSS_MODE = 'prefix';

/** The app contract the scoping starts with: an app written to an older one keeps its global CSS until its publisher updates it (the spec, "Contract").
 * The CMS's APP_API is still below it (lib/contracts.mjs); the contract raise goes with the names feature's last batch. */
export const SCOPED_CSS_FROM_API = 8;

/** The layer an app's rules go into. */
export const APP_LAYER = 'mo-app';

/** The attribute selector of an app's scope. @param {string} id */
export const scopeAttr = (id) => `[data-mo-app="${id}"]`;

/** The name a private custom property gets: `--mo-foo` in app `shop` is `--mo-app-shop-foo`. @param {string} id @param {string} name */
export const privateName = (id, name) => `--mo-app-${id}-${name.slice('--mo-'.length)}`;
/** The name a keyframes, font family or layer gets: `fade` in app `shop` is `mo-app-shop-fade`. @param {string} id @param {string} name */
export const globalName = (id, name) => `mo-app-${id}-${name}`;

// The names of the CMS: never private. `--mo-sys-*`, `--mo-ref-*` and `--mo-comp-*` are its namespaces (an app that declares one is a collision for
// check:css-tokens, not a private name); `cmsNames` adds every other name the CMS's own CSS declares.
const CMS_NAMESPACE = /^--mo-(sys|ref|comp)-/;

/** Whether a custom property the app declares is private to it. @param {string} name @param {string} id @param {Set<string>} [cmsNames] */
export const isPrivate = (name, id, cmsNames = new Set()) =>
  name.startsWith('--mo-') && !CMS_NAMESPACE.test(name) && !cmsNames.has(name) && !name.startsWith(`--mo-app-${id}-`);

const KEYFRAMES = /^(-\w+-)?keyframes$/i;
const ident = (name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PROP_BOUNDARY = (name) => new RegExp(`(?<![\\w-])${ident(name)}(?![\\w-])`, 'g');

/**
 * The names an app's CSS files declare, over all its files (a name declared in one file and read in another is renamed in both).
 * @param {string[]} cssTexts @param {string} id @param {Set<string>} [cmsNames]
 * @returns {{ vars: Set<string>, keyframes: Set<string>, fonts: Set<string>, layers: Set<string> }}
 */
export function collectNames(cssTexts, id, cmsNames = new Set()) {
  const names = { vars: new Set(), keyframes: new Set(), fonts: new Set(), layers: new Set() };
  for (const css of cssTexts) {
    let tree;
    try {
      tree = postcss.parse(css);
    } catch {
      continue;
    }
    tree.walkDecls(/^--/, (d) => {
      if (isPrivate(d.prop, id, cmsNames)) names.vars.add(d.prop);
    });
    tree.walkAtRules((rule) => {
      const name = rule.name.toLowerCase();
      if (KEYFRAMES.test(name)) names.keyframes.add(rule.params.trim().replace(/^["']|["']$/g, ''));
      else if (name === 'property' && isPrivate(rule.params.trim(), id, cmsNames)) names.vars.add(rule.params.trim());
      else if (name === 'font-face')
        rule.walkDecls('font-family', (d) => {
          names.fonts.add(d.value.trim().replace(/^["']|["']$/g, ''));
        });
      else if (name === 'layer')
        for (const part of rule.params.split(',')) for (const seg of part.trim().split('.')) if (seg) names.layers.add(seg);
    });
  }
  return names;
}

/** The first compound of a selector when it is the page itself (`:root`, `html`, `body`): those become the block. */
const PAGE_SUBJECT = /^(?::root|html|body)(?![\w-])/i;

/** One selector of a rule inside the app's CSS, scoped by prefix. @param {string} selector @param {string} id */
function prefixed(selector, id) {
  const s = selector.trim();
  const scope = `:where(${scopeAttr(id)})`;
  if (PAGE_SUBJECT.test(s)) return scope + s.replace(PAGE_SUBJECT, '');
  return `${scope} ${s}`;
}

/** A selector in `scope` mode: only the page subjects change (`:root` is the scope root). @param {string} selector */
const scopeRoot = (selector) => selector.trim().replace(PAGE_SUBJECT, ':scope');

// At-rules that hold rules to be scoped, and the ones that are global and stay outside the scope.
const CONTAINERS = new Set(['media', 'supports', 'container', 'layer', 'document', 'starting-style']);

/**
 * The scoped CSS of one file of app `id`.
 * @param {string} css
 * @param {{ id: string, names: ReturnType<typeof collectNames>, mode?: 'scope' | 'prefix' }} options
 * @returns {string}
 */
export function scopeAppCss(css, { id, names, mode = APP_CSS_MODE }) {
  const tree = postcss.parse(css);
  rename(tree, id, names);

  const hoisted = []; // @import, @charset, and the global at-rules that must not sit inside @scope
  const body = [];
  for (const node of [...tree.nodes]) {
    node.remove();
    const name = node.type === 'atrule' ? node.name.toLowerCase() : '';
    if (name === 'import' || name === 'charset') hoisted.unshift(node);
    else if (KEYFRAMES.test(name) || name === 'property' || name === 'font-face') hoisted.push(node);
    else body.push(node);
  }

  const out = postcss.root();
  for (const n of hoisted.filter((x) => x.type === 'atrule' && /^(import|charset)$/i.test(x.name))) out.append(n);
  const layer = postcss.atRule({ name: 'layer', params: APP_LAYER });
  for (const n of hoisted.filter((x) => !(x.type === 'atrule' && /^(import|charset)$/i.test(x.name)))) layer.append(n);

  if (mode === 'scope') {
    for (const n of body) scopeNodes(n, (rule) => (rule.selectors = rule.selectors.map(scopeRoot)));
    const scope = postcss.atRule({
      name: 'scope',
      params: `(${scopeAttr(id)}) to ([data-mo-app]:not(${scopeAttr(id)}))`,
    });
    for (const n of body) scope.append(n);
    layer.append(scope);
  } else {
    for (const n of body) {
      scopeNodes(n, (rule) => (rule.selectors = rule.selectors.map((s) => prefixed(s, id))));
      layer.append(n);
    }
  }
  out.append(layer);
  return out.toString();
}

/** Applies `scope` to every top-level style rule under `node` (through the at-rules that hold rules, never into a rule: a nested rule follows its parent). */
function scopeNodes(node, scope) {
  if (node.type === 'rule') {
    scope(node);
    return;
  }
  if (node.type === 'atrule' && CONTAINERS.has(node.name.toLowerCase()) && node.nodes)
    for (const child of node.nodes) scopeNodes(child, scope);
}

/** The renamed names, in place: custom properties, keyframes, font families and layers, where they are declared and where they are read. */
function rename(tree, id, names) {
  const vars = [...names.vars].map((v) => [PROP_BOUNDARY(v), privateName(id, v)]);
  const layerMap = new Map([...names.layers].map((l) => [l, globalName(id, l)]));
  const keyframes = [...names.keyframes].map((k) => [k, globalName(id, k)]);
  const fonts = [...names.fonts].map((f) => [f, globalName(id, f)]);

  const renameVars = (text) => vars.reduce((acc, [re, to]) => acc.replace(re, to), text);
  const renameIdent = (text, from, to) => text.replace(new RegExp(`(?<![\\w-])${ident(from)}(?![\\w-])`, 'g'), to);
  const renameLayers = (params) => params.replace(/[\w-]+/g, (seg) => layerMap.get(seg) ?? seg); // every identifier in a layer's list or `layer(a.b)`

  tree.walkDecls((d) => {
    if (d.prop.startsWith('--')) {
      if (names.vars.has(d.prop)) d.prop = privateName(id, d.prop);
    }
    d.value = renameVars(d.value);
    const prop = d.prop.toLowerCase();
    if (prop === 'animation' || prop === 'animation-name') for (const [k, to] of keyframes) d.value = renameIdent(d.value, k, to);
    if (prop === 'font-family' || prop === 'font')
      for (const [f, to] of fonts)
        d.value = d.value.replace(new RegExp(`(["']?)(?<![\\w-])${ident(f)}(?![\\w-])\\1`, 'g'), (_, q) => `${q}${to}${q}`);
  });
  tree.walkAtRules((rule) => {
    const name = rule.name.toLowerCase();
    if (KEYFRAMES.test(name)) {
      const bare = rule.params.trim().replace(/^["']|["']$/g, '');
      const hit = keyframes.find(([k]) => k === bare);
      if (hit) rule.params = hit[1];
    } else if (name === 'property') {
      rule.params = renameVars(rule.params);
    } else if (name === 'layer') {
      rule.params = renameLayers(rule.params);
    } else if (name === 'import') {
      rule.params = rule.params.replace(/layer\(([^)]*)\)/, (_, p) => `layer(${renameLayers(p)})`);
    } else if (name === 'container' || name === 'media' || name === 'supports') {
      rule.params = renameVars(rule.params);
    }
  });
  tree.walkRules((rule) => {
    rule.selector = renameVars(rule.selector);
  });
}
