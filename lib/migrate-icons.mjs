// The stored icon names of contract 8 (docs/superpowers/specs/2026-11-20-material-3-names-design.md, What is renamed, 5; batch 7): every icon name a site stores
// (a card's or a button's `icon`, a list row's `icon`, a data file's `icon`, a site app's `icon` in app.json) was Phosphor's name (`map-pin`) and becomes its Material
// Symbols name (`location_on`), from the map in lib/materialIconMap.mjs. A brand logo (`github-logo`) keeps its brand name; a name that is not in the map (already Material's,
// or a site's own pack) stays; a Phosphor `-fill` name becomes the regular Material name (the filled look is the component's `weight`, never part of a stored name).
// Pure text to text, no dependencies but the map, so the Worker's update (worker/cms-update.js) and `morpheme migrate` (scripts/migrate.mjs) both run it, only once
// (when an update crosses 0.19.6, in the same commit as the rest of the rewrite). Only the value of a key named `icon` changes, never a word of text.
import { materialNameOf } from './materialIconMap.mjs';

/** The Material Symbols name of a stored icon name; the name itself when it has none (brand, unknown, already Material's). @param {string} name */
export function materialIconName(name) {
  const found = materialNameOf(name);
  return found && 'name' in found ? found.name : name;
}

// A block's props (`data-props="{&quot;…&quot;}"`, as lib/blocks.mjs writes it).
const attrEscape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrUnescape = (s) =>
  s
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&lt;|&#60;|&#x3c;/gi, '<')
    .replace(/&gt;|&#62;|&#x3e;/gi, '>')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&amp;|&#38;|&#x26;/gi, '&');

/** A parsed JSON value with every string under a key named `icon` renamed; the value itself when nothing changed. */
function inValue(value) {
  if (Array.isArray(value)) {
    const next = value.map(inValue);
    return next.some((v, i) => v !== value[i]) ? next : value;
  }
  if (value && typeof value === 'object') {
    const next = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, k === 'icon' && typeof v === 'string' ? materialIconName(v) : inValue(v)]),
    );
    return Object.keys(next).some((k) => next[k] !== value[k]) ? next : value;
  }
  return value;
}

/** A data file or an app.json with its stored icon names renamed: parsed and written again as the editor writes it (two spaces, a line ending); the text itself when nothing changes or it is not JSON. @param {string} text */
export function migrateIconNamesJson(text) {
  const source = String(text ?? '');
  if (!source.includes('"icon"')) return source;
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    return source;
  }
  const next = inValue(value);
  return next === value ? source : JSON.stringify(next, null, 2) + (source.includes('\r\n') ? '\r\n' : '\n');
}

const FRONT = /^(---\r?\n)([\s\S]*?)(\r?\n---)/;
const ICON_LINE = /^(\s*(?:-\s+)?icon:[ \t]*)(["']?)([a-z0-9][a-z0-9_-]*)\2([ \t]*)$/;

/** A page or entry with its stored icon names renamed: the `icon:` lines of the front matter and the `icon` of every block's props; code fences stay. @param {string} markdown */
export function migrateIconNamesMarkdown(markdown) {
  const source = String(markdown ?? '');
  if (!source.includes('icon')) return source;
  let text = source.replace(
    FRONT,
    (all, open, body, close) =>
      open +
      body
        .split('\n')
        .map((line) => line.replace(ICON_LINE, (m, before, q, name, after) => `${before}${q}${materialIconName(name)}${q}${after}`))
        .join('\n') +
      close,
  );
  let fence = null;
  text = text
    .split('\n')
    .map((line) => {
      const f = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (f) fence = fence ? (f[1][0] === fence[0] && f[1].length >= fence.length ? null : fence) : f[1];
      if (fence || f || !line.includes('data-props=')) return line;
      return line.replace(/(\sdata-props=")([^"]*)(")/g, (all, open, raw, close) => {
        let props;
        try {
          props = JSON.parse(attrUnescape(raw));
        } catch {
          return all;
        }
        const next = inValue(props);
        return next === props ? all : `${open}${attrEscape(JSON.stringify(next))}${close}`;
      });
    })
    .join('\n');
  return text;
}

/** The stored icon names of a file renamed, by its kind: a `.json` file, or markdown (`.md`, `.mdx`, `.markdown`); any other file as it was. @param {string} path @param {string} text */
export const migrateIconNamesPath = (path, text) =>
  /\.json$/i.test(path) ? migrateIconNamesJson(text) : /\.(md|mdx|markdown)$/i.test(path) ? migrateIconNamesMarkdown(text) : text;
