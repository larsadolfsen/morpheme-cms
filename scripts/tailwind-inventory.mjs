// The migration's progress meter (plan 2026-11-16-move-away-from-tailwind.md §1): what is left of Tailwind in the tree.
//   node scripts/tailwind-inventory.mjs [--json] [--files]
// It asks Tailwind's own design system (`tailwindcss`, installed until batch T16) which string in the markup is a valid utility, with the
// repository's `@theme` blocks loaded, so a word like `flex` in a comment is not counted but `rounded-(--mo-sys-block-radius)` is. It counts
//   - utility uses in class attributes (the class, className and class:list attributes, also a class built by code inside their braces),
//   - utility uses in strings of constants (in a .ts, .mjs or .js file, or outside the attributes in markup), reported apart,
//   - `theme(--…)` uses, `@theme`, `@plugin`, `@source`, `@reference` and `@apply` in CSS, `--tw-` declarations, and `prose` in class attributes,
// per folder, per file, per family and per variant. `--json` prints it as JSON, `--files` adds every file's counts to the text.
// `scripts/check-tailwind.mjs` (the ratchet) reads the same counts through `scanTree`.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const FOLDERS = ['theme', 'src', 'pages', 'starter', 'demo', 'site', 'lib', 'defaults', 'worker', 'bin'];
export const EXTENSIONS = ['tsx', 'astro', 'jsx', 'ts', 'mjs', 'js', 'md', 'css'];
const MARKUP = new Set(['tsx', 'astro', 'jsx']);
const CODE = new Set(['ts', 'mjs', 'js']);
const CSS_COUNTS = ['theme', 'themeAt', 'plugin', 'source', 'reference', 'apply', 'tw'];

/** The tracked files of the scanned folders (what is in the repository, not a build or `node_modules`). */
export function trackedFiles(root = ROOT) {
  const patterns = FOLDERS.flatMap((f) => EXTENSIONS.map((e) => `${f}/*.${e}`));
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...patterns], {
    cwd: root,
    maxBuffer: 1 << 28,
  }).toString();
  return out.split('\0').filter((f) => f && existsSync(join(root, f)));
}

let designSystem = null;
/** Tailwind's design system with this repository's `@theme` blocks (and the typography plugin), loaded once. */
export async function loadDesignSystem(root = ROOT) {
  if (designSystem) return designSystem;
  const require = createRequire(join(root, 'package.json'));
  const { __unstable__loadDesignSystem: load } = await import('tailwindcss');
  const themes = readdirSync(join(root, 'theme/styles/tokens'))
    .sort()
    .map((origin) => join(root, `theme/styles/tokens/${origin}/ref.css`))
    .filter(existsSync)
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  const css = `@import 'tailwindcss';\n${themes}`;
  designSystem = await load(css, {
    base: join(root, 'theme/styles'),
    loadStylesheet: async (id, base) => {
      const path =
        id === 'tailwindcss'
          ? require.resolve('tailwindcss/index.css')
          : id.startsWith('tailwindcss/')
            ? require.resolve(id)
            : require.resolve(id, { paths: [base] });
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
    },
    loadModule: async (id, base) => {
      const path = require.resolve(id, { paths: [base] });
      const module = await import(pathToFileURL(path).href);
      return { path, base, module: module.default ?? module };
    },
  });
  return designSystem;
}

/** Which of the candidates are valid utilities (a map candidate -> boolean), asked once for each distinct string. */
async function validOf(candidates, root) {
  const ds = await loadDesignSystem(root);
  const list = [...candidates];
  const css = ds.candidatesToCss(list);
  return new Map(list.map((c, i) => [c, css[i] !== null && css[i] !== '']));
}

// ---- Reading a file ---------------------------------------------------------------------------------------------------------------

/** The string literals of a piece of code (`'…'`, `"…"` and the static parts of a template literal; the code of a `${…}` is read too). */
export function stringsIn(code) {
  const found = [];
  let i = 0;
  // Reads past a string without keeping what is in it (the code of a `${…}` is read again as a whole, so a string in it is kept once).
  const skipped = (read, at) => {
    const kept = found.length;
    const end = read(at);
    found.length = kept;
    return end;
  };
  const readTemplate = (start) => {
    let j = start + 1;
    let text = '';
    while (j < code.length && code[j] !== '`') {
      if (code[j] === '\\') {
        text += ' ';
        j += 2;
      } else if (code[j] === '$' && code[j + 1] === '{') {
        found.push(text);
        text = '';
        let depth = 1;
        let k = j + 2;
        while (k < code.length && depth) {
          if (code[k] === '{') depth++;
          else if (code[k] === '}') depth--;
          else if (code[k] === '`') k = skipped(readTemplate, k) - 1;
          else if (code[k] === '"' || code[k] === "'") k = skipped(readQuoted, k) - 1;
          k++;
        }
        // The inside of `${…}`: strings in it count too.
        stringsIn(code.slice(j + 2, k - 1)).forEach((s) => found.push(s));
        j = k;
        text += ' ';
      } else text += code[j++];
    }
    found.push(text);
    return j + 1;
  };
  const readQuoted = (start) => {
    const quote = code[start];
    let j = start + 1;
    let text = '';
    while (j < code.length && code[j] !== quote && code[j] !== '\n') {
      if (code[j] === '\\') {
        text += code[j + 1] === quote ? quote : ' ';
        j += 2;
      } else text += code[j++];
    }
    found.push(text);
    return j + 1;
  };
  while (i < code.length) {
    const c = code[i];
    if (c === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
    } else if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      i = end < 0 ? code.length : end + 2;
    } else if (c === '`') i = readTemplate(i);
    else if (c === '"' || c === "'") i = readQuoted(i);
    else i++;
  }
  return found;
}

/** The expression after `={` at `at` (the text between the braces, balanced; strings and templates are skipped over). Gives [text, end]. */
function balanced(source, at) {
  let depth = 1;
  let i = at;
  while (i < source.length && depth) {
    const c = source[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '"' || c === "'") {
      i++;
      while (i < source.length && source[i] !== c && source[i] !== '\n') i += source[i] === '\\' ? 2 : 1;
    } else if (c === '`') {
      i++;
      let inner = 0;
      while (i < source.length && (source[i] !== '`' || inner)) {
        if (source[i] === '\\') i++;
        else if (source[i] === '$' && source[i + 1] === '{') {
          inner++;
          i++;
        } else if (source[i] === '}' && inner) inner--;
        i++;
      }
    }
    i++;
  }
  return [source.slice(at, i - 1), i];
}

const ATTRIBUTE = /(?<![\w-])(?:class|className|class:list)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{)/g;

/** Every class attribute of a markup file: the strings in it, each as one text of class names. */
export function classAttributes(source) {
  const strings = [];
  const spans = [];
  for (const match of source.matchAll(ATTRIBUTE)) {
    const start = match.index;
    if (match[1] !== undefined || match[2] !== undefined) {
      strings.push(match[1] ?? match[2]);
      spans.push([start, start + match[0].length]);
    } else {
      const [expression, end] = balanced(source, start + match[0].length);
      stringsIn(expression).forEach((s) => strings.push(s));
      spans.push([start, end]);
    }
  }
  return { strings, spans };
}

/** The code of a file without its class attributes (what is left is "constants"). */
const without = (source, spans) => {
  let out = '';
  let at = 0;
  for (const [a, b] of spans.sort((x, y) => x[0] - y[0])) {
    if (a < at) continue;
    out += source.slice(at, a);
    at = b;
  }
  return out + source.slice(at);
};

const tokens = (text) => text.split(/\s+/).filter(Boolean);
const isProse = (w) => /^(not-)?prose(-|$)/.test(w);
/** A string of constants counts only when every name in it is a utility and the string looks like classes (a lone `block` or `hidden` is a word). */
const looksLikeClasses = (words, valid) =>
  words.length > 0 && words.every((w) => valid.get(w)) && (words.length > 1 || /[-:[\]/]/.test(words[0]));

// ---- The classification -----------------------------------------------------------------------------------------------------------

/** The variants (`medium:`, `hover:`, `[&>p]:`) and the utility of a class name. A variant ends at a `:` that is not inside brackets or parentheses. */
export function splitVariants(name) {
  const parts = [];
  let depth = 0;
  let at = 0;
  for (let i = 0; i < name.length; i++) {
    const c = name[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth--;
    else if (c === ':' && !depth) {
      parts.push(name.slice(at, i));
      at = i + 1;
    }
  }
  return { variants: parts, utility: name.slice(at) };
}

const FAMILIES = [
  [
    'display, flex, grid, alignment',
    /^(-?)(flex|inline-flex|grid|inline-grid|block|inline-block|inline|hidden|contents|table|flow-root|items|justify|self|place|content|order|basis|grow|shrink|gap|col|row|auto-cols|auto-rows|columns|float|clear|container|sr-only|not-sr-only)($|-)/,
  ],
  ['spacing', /^-?(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|space|inset|top|right|bottom|left|start|end)($|-)/],
  ['sizing', /^-?(w|h|size|min-w|min-h|max-w|max-h|aspect)($|-)/],
  [
    'typography',
    /^(text|font|leading|tracking|line-clamp|truncate|whitespace|break|uppercase|lowercase|capitalize|normal-case|italic|not-italic|underline|no-underline|overline|line-through|decoration|underline-offset|align|indent|list|antialiased|tabular-nums|hyphens)($|-)/,
  ],
  ['colour, background, border', /^(bg|from|via|to|fill|stroke|accent|caret|border|divide|outline|ring|rounded|color-scheme|scheme)($|-)/],
  ['effects, filters', /^(shadow|opacity|blur|backdrop|brightness|contrast|drop-shadow|grayscale|saturate|mix-blend|bg-blend|filter)($|-)/],
  [
    'position, layering, overflow',
    /^-?(absolute|relative|fixed|sticky|static|z|overflow|overscroll|isolate|visible|invisible|object|float)($|-)/,
  ],
  [
    'transform, transition, animation',
    /^-?(translate|rotate|scale|skew|origin|transform|transition|duration|ease|delay|animate|will-change)($|-)/,
  ],
  ['interaction', /^(cursor|pointer-events|select|resize|touch|scroll|snap|appearance|user-select|focus|forced-color-adjust)($|-)/],
];
export const familyOf = (utility) => {
  const base = utility.replace(/^!|!$/g, '').replace(/^\[&[^\]]*\]:/, '');
  for (const [name, test] of FAMILIES) if (test.test(base)) return name;
  return 'other';
};

// ---- Scanning ---------------------------------------------------------------------------------------------------------------------

const cssCounts = (source) => {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const n = (re) => (code.match(re) ?? []).length;
  return {
    theme: n(/\btheme\(\s*--/g),
    themeAt: n(/@theme\b/g),
    plugin: n(/@plugin\b/g),
    source: n(/@source\b/g),
    reference: n(/@reference\b/g),
    apply: n(/@apply\b/g),
    tw: n(/--tw-[\w-]+\s*:/g),
  };
};

/** One file: the class names found in its class attributes and in its string constants, and what it counts of the rest.
 * Gives { attributes: [names], constants: [names], typographyClass, css: {…} } once the valid names are known (see scanTree). */
function read(file, source) {
  const ext = file.split('.').pop();
  const out = { attributes: [], constants: [], css: null };
  if (ext === 'css') out.css = cssCounts(source);
  else if (MARKUP.has(ext)) {
    const { strings, spans } = classAttributes(source);
    out.attributes = strings;
    out.constants = stringsIn(without(source, spans));
    out.css = cssCounts('');
  } else if (CODE.has(ext)) out.constants = stringsIn(source);
  else if (ext === 'md') out.attributes = classAttributes(source).strings;
  return out;
}

/** Scans the tree. Gives { files: { path: counts }, uses: [{ file, name, where }] }; the counts of one file are
 * `utilities` (class attributes), `constants` (strings), `typographyClass` (prose) and the CSS counts (`theme`, `themeAt`, `plugin`, `source`, `reference`, `apply`, `tw`). */
export async function scanTree(root = ROOT, list = trackedFiles(root), filesRoot = root) {
  // `filesRoot`: where the files are read from, when it is not the repository (a test's made-up tree); Tailwind's design system is always the repository's.
  const reads = list.map((file) => [file, read(file, readFileSync(join(filesRoot, file), 'utf8'))]);
  const candidates = new Set();
  for (const [, r] of reads) for (const s of [...r.attributes, ...r.constants]) for (const w of tokens(s)) candidates.add(w);
  const valid = await validOf(candidates, root);
  const files = {};
  const uses = [];
  for (const [file, r] of reads) {
    // `prose` is our own rules since T13 (not a utility, not Tailwind's): it is counted apart, and left out of a string of constants before the string is judged.
    const attribute = r.attributes.flatMap(tokens).filter((w) => valid.get(w) && !isProse(w));
    const constant = r.constants
      .map((s) => tokens(s).filter((w) => !isProse(w)))
      .filter((words) => looksLikeClasses(words, valid))
      .flat();
    const typographyClass = r.attributes.flatMap(tokens).filter((w) => /^prose(-|$)/.test(w)).length;
    const counts = { utilities: attribute.length, constants: constant.length, typographyClass, ...(r.css ?? {}) };
    if (Object.values(counts).some(Boolean)) files[file] = counts;
    for (const name of attribute) uses.push({ file, name, where: 'attribute' });
    for (const name of constant) uses.push({ file, name, where: 'constant' });
  }
  return { files, uses };
}

const top = (file) => file.split('/')[0];

/** The report: totals and the tables, from a scan. */
export function report({ files, uses }) {
  const sum = (key, of = Object.values(files)) => of.reduce((n, c) => n + (c[key] ?? 0), 0);
  const folders = {};
  for (const [file, counts] of Object.entries(files)) {
    const f = (folders[top(file)] ??= {});
    for (const [key, n] of Object.entries(counts)) f[key] = (f[key] ?? 0) + n;
  }
  const distinct = (where) => new Set(uses.filter((u) => u.where === where).map((u) => u.name));
  const tally = (list, by) => {
    const map = {};
    for (const u of list) {
      const keys = by(u);
      for (const k of keys) {
        const e = (map[k] ??= { uses: 0, names: new Set() });
        e.uses++;
        e.names.add(u.name);
      }
    }
    return Object.fromEntries(
      Object.entries(map)
        .sort((a, b) => b[1].uses - a[1].uses)
        .map(([k, e]) => [k, { uses: e.uses, distinct: e.names.size }]),
    );
  };
  const attribute = uses.filter((u) => u.where === 'attribute');
  const all = uses;
  return {
    totals: {
      utilityUses: sum('utilities'),
      distinctClasses: distinct('attribute').size,
      constantUses: sum('constants'),
      distinctConstants: distinct('constant').size,
      distinctInAll: new Set(all.map((u) => u.name)).size,
      themeFunction: sum('theme'),
      themeFunctionFiles: Object.values(files).filter((c) => c.theme).length,
      theme: sum('themeAt'),
      plugin: sum('plugin'),
      source: sum('source'),
      reference: sum('reference'),
      apply: sum('apply'),
      twDeclarations: sum('tw'),
      typographyClass: sum('typographyClass'),
    },
    folders,
    families: tally(all, (u) => [familyOf(splitVariants(u.name).utility)]),
    variants: tally(all, (u) => {
      const { variants } = splitVariants(u.name);
      return variants.length ? variants : ['(none)'];
    }),
    files,
  };
}

export function format(r, withFiles) {
  const t = r.totals;
  const lines = [
    `Tailwind in the tree (${new Date().toISOString().slice(0, 10)})`,
    '',
    `Utility uses in class attributes: ${t.utilityUses.toLocaleString('en-US')} (${t.distinctClasses} distinct classes)`,
    `Utility uses in strings of constants: ${t.constantUses} (${t.distinctConstants} distinct)`,
    `theme(--…) uses: ${t.themeFunction} in ${t.themeFunctionFiles} files`,
    `@theme ${t.theme}, @plugin ${t.plugin}, @source ${t.source}, @reference ${t.reference}, @apply ${t.apply}`,
    `--tw- declarations: ${t.twDeclarations}`,
    `prose in class attributes: ${t.typographyClass}`,
    '',
    'Per folder (utilities, constants, theme(), --tw-):',
  ];
  for (const [folder, c] of Object.entries(r.folders).sort((a, b) => (b[1].utilities ?? 0) - (a[1].utilities ?? 0)))
    lines.push(
      `  ${folder.padEnd(10)} ${String(c.utilities ?? 0).padStart(5)} ${String(c.constants ?? 0).padStart(4)} ${String(c.theme ?? 0).padStart(4)} ${String(c.tw ?? 0).padStart(4)}`,
    );
  lines.push('', 'Per family (uses, distinct):');
  for (const [k, e] of Object.entries(r.families))
    lines.push(`  ${k.padEnd(34)} ${String(e.uses).padStart(5)} ${String(e.distinct).padStart(4)}`);
  lines.push('', 'Per variant (uses, distinct):');
  for (const [k, e] of Object.entries(r.variants))
    lines.push(`  ${k.padEnd(34)} ${String(e.uses).padStart(5)} ${String(e.distinct).padStart(4)}`);
  if (withFiles) {
    lines.push('', 'Per file (utilities, constants, theme(), @theme, @plugin, @source, @reference, @apply, --tw-, prose):');
    const rows = Object.entries(r.files).sort((a, b) => (b[1].utilities ?? 0) - (a[1].utilities ?? 0) || a[0].localeCompare(b[0]));
    for (const [file, c] of rows)
      lines.push(
        `  ${String(c.utilities ?? 0).padStart(5)} ${String(c.constants ?? 0).padStart(3)} ${String(c.theme ?? 0).padStart(3)} ${c.themeAt ?? 0} ${c.plugin ?? 0} ${c.source ?? 0} ${c.reference ?? 0} ${c.apply ?? 0} ${String(c.tw ?? 0).padStart(3)} ${c.prose ?? 0}  ${file}`,
      );
  }
  return lines.join('\n');
}

export { CSS_COUNTS };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const result = report(await scanTree());
  console.log(args.includes('--json') ? JSON.stringify(result, null, 2) : format(result, args.includes('--files')));
}
