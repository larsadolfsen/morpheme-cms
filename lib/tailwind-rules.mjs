// The rules of the Tailwind check (contract 7, T16/T17), pure text to text with no Node API, so the Worker's update (worker/cms-update.js, through lib/migrate-code.mjs),
// `morpheme migrate` and the checks (site/tailwind.mjs, which adds the file walking) run one implementation.
// With no tailwindcss package to ask, the utilities are a frozen list (site/tailwind-utilities.json: the base names of the 578 classes the CMS used on
// 18 Nov 2026, docs/tailwind-migration-classes.md) and the families below. Nothing in this list grows; a name is added only when a new family is found.
//   markup, .md   a class, className or class:list attribute with a utility, a variant (`medium:`, `hover:`, `[&>p]:`) or an arbitrary value (`w-[3px]`),
//   code          the same in a string constant, when every word of the string is a utility (a lone `block` or `hidden` is only a word),
//   CSS           @import 'tailwindcss', @theme, @utility, @plugin, @apply, @source, @reference, @tailwind, @variant, @custom-variant, theme(--, --tw-,
//   config        a tailwind package in package.json, a tailwind plugin in Prettier's settings, an import of one in code.
import utilityNames from '../site/tailwind-utilities.json' with { type: 'json' };

export const UTILITIES = new Set(utilityNames);
const MARKUP = new Set(['tsx', 'astro', 'jsx']);
const CODE = new Set(['ts', 'mjs', 'js']);
export const EXTENSIONS = ['tsx', 'astro', 'jsx', 'ts', 'mjs', 'js', 'md', 'css'];

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

// ---- The rules ---------------------------------------------------------------------------------------------------------------------

const SCALE = String.raw`(?:\d+(?:\.\d+)?|\d+/\d+|px|full|auto|screen|min|max|fit|none|xs|sm|md|lg|xl|[2-9]xl|svw|svh|dvh|lvh)`;
const ROLE = String.raw`(?:on-)?(?:surface[\w-]*|primary[\w-]*|secondary[\w-]*|tertiary[\w-]*|error[\w-]*|outline[\w-]*|inverse[\w-]*|scrim|shadow|background)`;
const PALETTE = String.raw`(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+`;
/** Families of utilities, with the word that must follow, so a word of ours (`size`, `top`) is never taken for one. */
const FAMILIES = [
  new RegExp(
    `^(?:p[xytblrse]?|m[xytblrse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end|w|h|size|min-[wh]|max-[wh]|basis|translate-[xy]|z|order|col-span|row-span|col-start|col-end|grid-cols|grid-rows|leading|tracking|opacity|duration|delay|scale|rotate|border(?:-[xytblrse])?|ring|outline|rounded(?:-[a-z]{1,2})?|shadow|blur|line-clamp|columns|aspect)-${SCALE}$`,
  ),
  /^text-(?:xs|sm|base|lg|xl|[2-9]xl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$/,
  /^font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|sans|serif|mono|italic)$/,
  /^(?:items|justify|self|content|place-items|place-content|place-self)-(?:start|end|center|between|around|evenly|stretch|baseline|normal)$/,
  /^flex-(?:row|col|row-reverse|col-reverse|wrap|nowrap|wrap-reverse|1|auto|initial|none|grow|shrink)(?:-0)?$/,
  /^overflow(?:-[xy])?-(?:hidden|auto|scroll|visible|clip)$/,
  /^(?:object)-(?:cover|contain|fill|none|center|top|bottom|left|right)$/,
  /^(?:cursor|pointer-events|select|resize|touch|scroll|snap|whitespace|break|list|decoration|underline-offset|origin|transition|animate|ease|will-change|mix-blend|backdrop)-[a-z0-9-]+$/,
  new RegExp(
    `^(?:bg|text|border|ring|fill|stroke|outline|divide|from|to|via|accent|caret|decoration|shadow)-(?:${ROLE}|${PALETTE}|transparent|current|inherit|(?:whi|blac)(?:te|k))(?:/\\d+)?$`,
  ),
];
/** The variants Tailwind knew (a word before `:`), also `group-hover:`, `has-[…]:`, `*:` and `[&>p]:`; `medium:`, `expanded:`, `large:` and `extra-large:` were our own breakpoints. */
const VARIANT =
  /^(?:medium|expanded|large|extra-large|sm|md|lg|xl|2xl|max-[\w[\]-]+|min-[\w[\]-]+|hover|focus|focus-visible|focus-within|active|disabled|enabled|checked|first|last|only|odd|even|empty|before|after|placeholder|selection|marker|file|open|dark|motion-safe|motion-reduce|print|portrait|landscape|group-[\w-]+|peer-[\w-]+|has-[\w[\]()&:>~+*.#=-]+|not-[\w[\]()&:>~+*.#=-]+|aria-[\w[\]=-]+|data-[\w[\]=-]+|supports-[\w[\]:()-]+|@[\w[\]-]+|\*|\*\*|\[[&@].*\])$/;

/** The words of a class string, a variant split from its utility: `medium:gap-4` gives { variants: ['medium'], utility: 'gap-4' }. A `:` inside brackets or parentheses is not a split. */
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

/** Why one word of a class string is Tailwind, or '' when it is not. `mo-` names, `prose` and everything else are fine. */
export function whyUtility(word) {
  const { variants, utility } = splitVariants(word);
  if (utility && variants.some((v) => VARIANT.test(v))) return `the variant \`${variants.find((v) => VARIANT.test(v))}:\``;
  const NEGATIVE =
    /^-(?=(?:m[xytblrse]?|inset(?:-[xy])?|top|right|bottom|left|start|end|translate-[xy]|z|order|space-[xy]|scale|rotate|skew-[xy])-)/;
  const base = utility.replace(/^!|!$/g, '').replace(NEGATIVE, '');
  if (!base || base.startsWith('mo-')) return '';
  if (/^\[(?:--)?[a-z][\w-]*:[^\]]+\]$/.test(base)) return 'an arbitrary property in brackets';
  if (/^[a-z][\w-]*-\[[^\]]+\]$/.test(base) || /^[a-z][\w-]*-\(--[\w-]+\)$/.test(base)) return 'an arbitrary value';
  if (UTILITIES.has(base)) return 'a utility of the frozen list';
  if (FAMILIES.some((re) => re.test(base))) return 'a utility family';
  return '';
}
/** A string of constants counts only when every word of it is a utility and it looks like classes. */
const looksLikeClasses = (words) =>
  words.length > 0 && words.every((w) => whyUtility(w)) && (words.length > 1 || /^(?:[^\s:]+:|.*-\[|\[)/.test(words[0]));

const CSS_RULES = [
  [/@import\s+(?:url\()?['"]tailwindcss/, '@import of tailwindcss'],
  [/@tailwind\b/, '@tailwind'],
  [/@theme\b/, '@theme'],
  [/@utility\b/, '@utility'],
  [/@variant\b/, '@variant'],
  [/@custom-variant\b/, '@custom-variant'],
  [/@plugin\b/, '@plugin'],
  [/@source\b/, '@source'],
  [/@reference\b/, '@reference'],
  [/@apply\b/, '@apply'],
  [/\btheme\(\s*--/, 'theme(--…)'],
  [/--tw-[\w-]+/, '--tw-…'],
];
const PACKAGE = /^(?:tailwindcss|@tailwindcss\/[\w-]+|tailwind-merge|tailwind-variants|prettier-plugin-tailwindcss|tailwindcss-[\w-]+)$/;
const IMPORT = /['"`](?:tailwindcss|@tailwindcss\/[\w-]+|tailwind-merge|prettier-plugin-tailwindcss)(?:\/[\w./-]*)?['"`]/;

/** The problems of one file: its path (for the message), its text. Each says the file, the line and the rule. */
export function utilityProblems(file, source) {
  const ext = file.split('.').pop();
  const found = [];
  const lineOf = (text, at) => text.slice(0, at).split('\n').length;
  const note = (line, what) =>
    found.push(
      `${file}${line ? `:${line}` : ''}: Tailwind is gone (contract 7): ${what}. Write plain CSS and mo- classes (docs/tailwind-migration.md).`,
    );
  if (ext === 'css') {
    const code = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    for (const [re, name] of CSS_RULES) {
      const m = re.exec(code);
      if (m) note(lineOf(code, m.index), `${name} in a stylesheet`);
    }
    return found;
  }
  const classWords = (strings) => strings.flatMap(tokens);
  let attributes = [];
  let constants = [];
  if (MARKUP.has(ext)) {
    const { strings, spans } = classAttributes(source);
    attributes = classWords(strings);
    constants = stringsIn(without(source, spans));
  } else if (CODE.has(ext)) constants = stringsIn(source);
  else if (ext === 'md') attributes = classWords(classAttributes(source).strings);
  for (const word of attributes) {
    const why = whyUtility(word);
    if (why) note(lineOf(source, source.indexOf(word)), `\`${word}\` in a class attribute is ${why}`);
  }
  for (const text of constants) {
    const words = tokens(text);
    if (looksLikeClasses(words))
      note(lineOf(source, Math.max(0, source.indexOf(words[0]))), `\`${text.trim()}\` is a string of utilities (${whyUtility(words[0])})`);
  }
  if (CODE.has(ext) || MARKUP.has(ext)) {
    const m = IMPORT.exec(source);
    if (m) note(lineOf(source, m.index), `${m[0]} is imported or named`);
  }
  return found;
}

/** The problems of a package.json (a tailwind package in any dependency list, a tailwind plugin in the `prettier` key) or a Prettier settings file. */
export function configProblems(file, source) {
  const found = [];
  const note = (what) => found.push(`${file}: Tailwind is gone (contract 7): ${what}. Remove it.`);
  if (file.endsWith('package.json')) {
    let json = {};
    try {
      json = JSON.parse(source);
    } catch {}
    for (const key of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'])
      for (const name of Object.keys(json[key] ?? {})) if (PACKAGE.test(name)) note(`\`${name}\` in ${key}`);
    if (/tailwind/i.test(JSON.stringify(json.prettier ?? ''))) note('a tailwind plugin in the `prettier` key');
  } else if (/tailwind/i.test(source)) note("a tailwind plugin in Prettier's settings");
  return found;
}
