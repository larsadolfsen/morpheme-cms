// The class names the editor writes into a site's Markdown, rewritten to the names of contract 7 (docs/class-names.md, M1's map
// docs/superpowers/plans/mo-names/map.json): the text styles (`<p class="body-small">`, `<span class="body-large">`, `<p class="label-medium">`),
// the colours of a word (`<span class="color-accent">`) and the label's former class (`block-eyebrow`). Only the value of a `class`
// attribute of an HTML tag changes: never a word of text, a code fence, an inline code span or a Markdown link. Idempotent: a text
// with the new names comes back as it was. Used by lib/migrate-content.mjs (`morpheme migrate`) and by the Worker's update (worker/cms-update.js),
// which is why it has no dependencies. Exposes CLASS_NAMES_SINCE, CLASS_NAMES, migrateClassNames, revertClassNames and the *File forms.

/** The first version that reads only the new names; an update to it rewrites a site's content in the same commit. */
export const CLASS_NAMES_SINCE = '0.18.2';

/** Old class name to new, M1's map for the names saved in content (`block-eyebrow` was the label's name before `label-medium`). */
export const CLASS_NAMES = {
  'body-small': 'mo-type-body-small',
  'body-medium': 'mo-type-body-medium',
  'body-large': 'mo-type-body-large',
  'label-medium': 'mo-type-label-medium',
  'block-eyebrow': 'mo-type-label-medium',
  'color-accent': 'mo-has-accent-color',
  'color-muted': 'mo-has-muted-color',
};

// The way back (an update that is undone): the names the version before wrote; `block-eyebrow` is not brought back.
const FORMER = Object.fromEntries(Object.entries(CLASS_NAMES).filter(([old]) => old !== 'block-eyebrow').map(([old, now]) => [now, old]));

const TAG = /<[A-Za-z][^<>]*>/g;
const CLASS = /(\sclass\s*=\s*)(["'])(.*?)\2/;
const INLINE_CODE = /(``[^`]*``|`[^`]*`)/;

const inTag = (tag, names) =>
  tag.replace(CLASS, (_, before, quote, value) => {
    const tokens = value.split(/(\s+)/).map((t) => (Object.hasOwn(names, t) ? names[t] : t));
    return `${before}${quote}${tokens.join('')}${quote}`;
  });

function rewrite(markdown, names) {
  const source = String(markdown ?? '');
  if (!Object.keys(names).some((old) => source.includes(old))) return source;
  let fence = null;
  return source
    .split('\n')
    .map((line) => {
      const f = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (f) fence = fence ? (f[1][0] === fence[0] && f[1].length >= fence.length ? null : fence) : f[1];
      if (fence || f) return line;
      return line
        .split(INLINE_CODE)
        .map((part, i) => (i % 2 ? part : part.replace(TAG, (tag) => inTag(tag, names))))
        .join('');
    })
    .join('\n');
}

/** A text with its old class names written as the new ones. @param {string} markdown */
export const migrateClassNames = (markdown) => rewrite(markdown, CLASS_NAMES);

/** A text with the new class names written as the ones before them (the undo of an update). @param {string} markdown */
export const revertClassNames = (markdown) => rewrite(markdown, FORMER);

const withBody = (file, change) => {
  const m = String(file).match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n?)([\s\S]*)$/);
  return m ? m[1] + change(m[2]) : change(String(file));
};

/** A page file with the front matter untouched. @param {string} file */
export const migrateClassNamesFile = (file) => withBody(file, migrateClassNames);
/** @param {string} file */
export const revertClassNamesFile = (file) => withBody(file, revertClassNames);
