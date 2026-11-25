// The class names the editor writes into a site's Markdown, rewritten to the names of contract 7 (docs/class-names.md, M1's map
// docs/superpowers/plans/mo-names/map.json): the text styles (`<p class="body-small">`, `<span class="body-large">`, `<p class="label-medium">`),
// the colours of a word (`<span class="color-accent">`) and the label's former class (`block-eyebrow`). Only the value of a `class`
// attribute of an HTML tag changes: never a word of text, a code fence, an inline code span or a Markdown link. Idempotent: a text
// with the new names comes back as it was. Used by lib/migrate-content.mjs (`morpheme migrate`) and by the Worker's update (worker/cms-update.js),
// which is why it has no dependencies. Exposes CLASS_NAMES_SINCE, CLASS_NAMES, CLASS_NAMES_M3_SINCE, CLASS_NAMES_M3, crossesClassNames, migrateClassNames, revertClassNames and the *File, *Json and *Path forms.
// The editor stores markdown in more places than a page's body: a collection entry's body and front matter (`.md`), the string values of
// `src/data/**/*.json` (globals, block templates, rich-text props) and a block's `data-props` attribute in a text. All are rewritten here;
// a JSON file is parsed and written again as the editor writes it (two-space indent, a line ending at the end), never replaced as text.

/** The first version that reads only the new names; an update that crosses into it (from any version below it) rewrites a site's content in the same commit; an update within 0.18.x or from it on does not. */
export const CLASS_NAMES_SINCE = '0.19.0';

/** Old class name to new, M1's map for the names saved in content (`block-eyebrow` was the label's name before `label-medium`). */
export const CLASS_NAMES = {
  'body-small': 'mo-type-body-small',
  'body-medium': 'mo-type-body-medium',
  'body-large': 'mo-type-body-large',
  'label-medium': 'mo-type-label-medium',
  'block-eyebrow': 'mo-type-label-medium',
  'color-accent': 'mo-has-accent-color',
  'color-muted': 'mo-has-muted-color',
  // The text style and its opt-out (docs/class-names.md): a page's own `<div class="not-prose">` block or `<div class="prose">` wrapper.
  prose: 'mo-prose',
  'not-prose': 'mo-is-not-prose',
};

/** The first version that reads the class names of Material 3's naming (contract 8, docs/superpowers/specs/2026-11-20-material-3-names-design.md,
 * *Migration* 1): a second entry beside `CLASS_NAMES_SINCE`. The spec put it at 0.20.0; the names change in 0.19.6 and the line is released as 0.20.0, so an update
 * that crosses it rewrites the content in the same commit. */
export const CLASS_NAMES_M3_SINCE = '0.19.6';

/** Old class name to new for the names the editor saves in content, from `classes` of scripts/m3-names.json (applied after `CLASS_NAMES`). The editor writes only the
 * text styles and colours above, none of which the map renames, so it is empty; `lib/content-class-names.test.mjs` fails when a name of the map is written by the
 * editor's own code without an entry here. */
export const CLASS_NAMES_M3 = {};

// The way back (an update that is undone): the names the version before wrote; `block-eyebrow` is not brought back.
const FORMER = Object.fromEntries(
  Object.entries(CLASS_NAMES)
    .filter(([old]) => old !== 'block-eyebrow')
    .map(([old, now]) => [now, old]),
);

const FORMER_M3 = Object.fromEntries(Object.entries(CLASS_NAMES_M3).map(([old, now]) => [now, old]));

const TAG = /<[A-Za-z][^<>]*>/g;
// The quotes may be escaped with a backslash (a markdown string in a double-quoted YAML front matter value: class=\"body-small\").
const CLASS = /(\sclass\s*=\s*\\?)(["'])(.*?)(\\?)\2/;
const INLINE_CODE = /(``[^`]*``|`[^`]*`)/;

const inTag = (tag, names) =>
  tag.replace(CLASS, (_, before, quote, value, back) => {
    const tokens = value.split(/(\s+)/).map((t) => (Object.hasOwn(names, t) ? names[t] : t));
    return `${before}${quote}${tokens.join('')}${back}${quote}`;
  });

const hasName = (source, names) => Object.keys(names).some((old) => source.includes(old));

// A block's props (`data-props="{&quot;…&quot;}"`, as lib/blocks.mjs writes it): the JSON's strings are texts of markdown.
const attrEscape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrUnescape = (s) =>
  s
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&lt;|&#60;|&#x3c;/gi, '<')
    .replace(/&gt;|&#62;|&#x3e;/gi, '>')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&amp;|&#38;|&#x26;/gi, '&');

/** Every string of a parsed JSON value rewritten; the value itself when nothing changed (so the caller can tell). */
function inValue(value, names) {
  if (typeof value === 'string') return rewrite(value, names);
  if (Array.isArray(value)) {
    const next = value.map((v) => inValue(v, names));
    return next.some((v, i) => v !== value[i]) ? next : value;
  }
  if (value && typeof value === 'object') {
    const next = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, inValue(v, names)]));
    return Object.keys(next).some((k) => next[k] !== value[k]) ? next : value;
  }
  return value;
}

function inProps(line, names) {
  if (!line.includes('data-props=')) return line;
  return line.replace(/(\sdata-props=")([^"]*)(")/g, (all, open, raw, close) => {
    let props;
    try {
      props = JSON.parse(attrUnescape(raw));
    } catch {
      return all;
    }
    const next = inValue(props, names);
    return next === props ? all : `${open}${attrEscape(JSON.stringify(next))}${close}`;
  });
}

function rewrite(markdown, names) {
  const source = String(markdown ?? '');
  if (!hasName(source, names)) return source;
  let fence = null;
  return source
    .split('\n')
    .map((line) => {
      const f = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (f) fence = fence ? (f[1][0] === fence[0] && f[1].length >= fence.length ? null : fence) : f[1];
      if (fence || f) return line;
      return inProps(line, names)
        .split(INLINE_CODE)
        .map((part, i) => (i % 2 ? part : part.replace(TAG, (tag) => inTag(tag, names))))
        .join('');
    })
    .join('\n');
}

/** A text with its old class names written as the new ones. @param {string} markdown */
export const migrateClassNames = (markdown) => rewrite(rewrite(markdown, CLASS_NAMES), CLASS_NAMES_M3);

/** A text with the new class names written as the ones before them (the undo of an update). @param {string} markdown */
export const revertClassNames = (markdown) => rewrite(rewrite(markdown, FORMER_M3), FORMER);

/** A markdown file (collection entry or page): the body and any markdown in the front matter; only `class` attributes change. @param {string} file */
export const migrateClassNamesFile = (file) => migrateClassNames(file);
/** @param {string} file */
export const revertClassNamesFile = (file) => revertClassNames(file);

function json(text, names) {
  const source = String(text ?? '');
  if (!hasName(source, names)) return source;
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    return source;
  }
  const next = inValue(value, names);
  if (next === value) return source;
  return JSON.stringify(next, null, 2) + (source.includes('\r\n') ? '\r\n' : '\n');
}

/** A data file (`src/data/**\/*.json`) with the class names in its string values written as the new ones: parsed and written again with two spaces
 * and a line ending, as the editor writes it; the text itself when nothing changes or it is not JSON. @param {string} text */
export const migrateClassNamesJson = (text) => json(json(text, CLASS_NAMES), CLASS_NAMES_M3);
/** @param {string} text */
export const revertClassNamesJson = (text) => json(json(text, FORMER_M3), FORMER);

/** Whether an update from `from` to `to` crosses a version that rewrites content (0.19.0, 0.19.6): the one that reads only the new names. @param {(a: string, b: string) => number} compare */
export const crossesClassNames = (from, to, compare) =>
  [CLASS_NAMES_SINCE, CLASS_NAMES_M3_SINCE].some((since) => compare(to, since) >= 0 && compare(from, since) < 0);

const kind = (path) => (/\.json$/i.test(path) ? 'json' : /\.(md|mdx|markdown)$/i.test(path) ? 'md' : null);
/** Whether a site file holds markdown the editor writes (`.md`, `.mdx`, `.json`). @param {string} path */
export const holdsMarkdown = (path) => kind(path) !== null;
/** A site file by its extension; other files come back as they are. @param {string} path @param {string} text */
export const migrateClassNamesPath = (path, text) =>
  kind(path) === 'json' ? migrateClassNamesJson(text) : kind(path) === 'md' ? migrateClassNames(text) : text;
/** @param {string} path @param {string} text */
export const revertClassNamesPath = (path, text) =>
  kind(path) === 'json' ? revertClassNamesJson(text) : kind(path) === 'md' ? revertClassNames(text) : text;
