// The class rename of Material 3's names (docs/superpowers/specs/2026-11-20-material-3-names-design.md), as pure text to text: a stylesheet's selectors and a script's
// class names, from a map of old class -> new class(es) (null: the map drops it, listed as manual). No dependencies, so the Worker's update can run it;
// scripts/rename-m3-classes.mjs runs it on this repository's own sources and lib/migrate-code.mjs on a site's own themes and apps. How a name is written after
// the rename depends on where it stands, so the look does not change (see scripts/rename-m3-classes.mjs). Whole names only: `mo-bottom-sheet` never inside `mo-bottom-sheet__fit`.

export const NAME = /(?<![\w-])(mo-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?)(?![\w-])/g;
const SHEET = /^mo-(bottom|side)-sheet(?:__(.+))?$/;
const SCOPED_PARTS = new Set(['container', 'standard', 'header', 'headline', 'content', 'actions']);
const CONTAINER_PARTS = new Set(['container', 'standard']);

const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

/** How an old name is written in a class list: the new classes, space separated; null when the map drops it. @param {string} old @param {Record<string, any>} classes */
export function classList(old, classes) {
  if (!Object.hasOwn(classes, old)) return undefined;
  const sheet = SHEET.exec(old);
  const list = asList(classes[old]);
  if (sheet && sheet[2] === 'container') return [...list, `mo-is-${sheet[1]}`].join(' ');
  return list.join(' ');
}

/** The compound selector for an old name (comments and strings): `.mo-button.mo-is-text`. */
function compound(old, classes) {
  if (!Object.hasOwn(classes, old)) return undefined;
  const sheet = SHEET.exec(old);
  const list = asList(classes[old]);
  const kind = list.length === 1 && list[0].startsWith('mo-is-') ? `.mo-${/^mo-([a-z0-9-]+)__/.exec(old)?.[1]}` : '';
  if (sheet && sheet[2] && SCOPED_PARTS.has(sheet[2])) {
    return CONTAINER_PARTS.has(sheet[2]) ? `.${list[0]}.mo-is-${sheet[1]}` : `.mo-is-${sheet[1]} .${list[0]}`;
  }
  return kind + list.map((c) => `.${c}`).join('');
}

/** A stylesheet's complex selector, an old name at a time. Returns the text and what it could not do. */
function selectorOf(selector, classes, manual) {
  const seen = new Set();
  const out = selector.replace(/\.(mo-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?)(?![\w-])/g, (all, old, at) => {
    if (!Object.hasOwn(classes, old)) return all;
    const list = asList(classes[old]);
    if (list.length === 0) {
      manual.push(`${all} is dropped by the map`);
      return all;
    }
    const sheet = SHEET.exec(old);
    if (sheet) {
      const kind = `mo-is-${sheet[1]}`;
      const part = sheet[2];
      const first = !seen.has(sheet[1]);
      seen.add(sheet[1]);
      if (!part) return `:where(.mo-sheet).${kind}`;
      if (CONTAINER_PARTS.has(part)) return `:where(.${list[0]}).${kind}`;
      if (SCOPED_PARTS.has(part)) {
        if (!first) return `.${list[0]}`;
        const before = selector.slice(0, at).trimEnd();
        const spaced = selector.slice(0, at).length > before.length;
        if (before === '' || (spaced && !/[>+~]$/.test(before))) return `:where(.${kind}) .${list[0]}`;
        manual.push(`${all} follows a combinator or a compound, so it cannot be scoped by the kind`);
        return all;
      }
      return `.${list[0]}`;
    }
    const kindClass = list.length === 1 && list[0].startsWith('mo-is-');
    if (kindClass) {
      const rootName = /^(mo-[a-z0-9-]+?)__/.exec(old)?.[1];
      // Already on its root in the same compound: `.mo-button.mo-button__text` → `.mo-button.mo-is-text`.
      if (selector.slice(0, at).endsWith(`.${rootName}`)) return `.${list[0]}`;
      return `:where(.${rootName}).${list[0]}`;
    }
    return list.map((c) => `.${c}`).join('');
  });
  return out;
}

/** The top-level commas of a selector list. */
function splitTop(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

function renameCss(text, classes, manual, file) {
  const note = (line, what) => manual.push(`${file}:${line}: ${what}`);
  let out = '';
  let pos = 0;
  // Comments: the compound form. Code: the rule preludes.
  const comment = /\/\*[\s\S]*?\*\//g;
  const code = (chunk, offset) =>
    chunk.replace(/([^{}};]+)(?=\{)/g, (prelude, _p, at) => {
      if (prelude.trim().startsWith('@')) return prelude;
      const line = text.slice(0, offset + at).split('\n').length;
      const problems = [];
      const next = splitTop(prelude)
        .map((sel) => selectorOf(sel, classes, problems))
        .join(',');
      for (const p of problems) note(line, p);
      return next;
    });
  for (const m of text.matchAll(comment)) {
    out += code(text.slice(pos, m.index), pos);
    out += m[0].replace(
      /\.(mo-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?)(?![\w-])/g,
      (all, old) => compound(old, classes) ?? all,
    );
    pos = m.index + m[0].length;
  }
  out += code(text.slice(pos), pos);
  return out;
}

function renameScript(text, classes, manual, file) {
  const lineOf = (i) => text.slice(0, i).split('\n').length;
  let result = text.replace(NAME, (all, old, at) => {
    if (!Object.hasOwn(classes, old)) return all;
    if (asList(classes[old]).length === 0) {
      manual.push(`${file}:${lineOf(at)}: ${old} is dropped by the map`);
      return all;
    }
    if (text[at - 1] === '.') return compound(old, classes).slice(1); // the dot before it stays
    return classList(old, classes);
  });
  // A class list that names a kind twice (a root and a container both carry it) keeps it once.
  for (let n = 0; n < 4; n++) result = result.replace(/(mo-is-[a-z0-9-]+)((?: [a-z0-9_-]+)*?) \1(?![\w-])/g, '$1$2');
  // A name built from parts cannot be read here.
  const stems = new Set(
    Object.keys(classes)
      .map((c) => c.split('__')[0])
      .concat(Object.keys(classes).filter((c) => !c.includes('__'))),
  );
  for (const m of text.matchAll(/(mo-[a-z0-9-]+?)(?:__)?\$\{/g))
    if (stems.has(m[1])) manual.push(`${file}:${lineOf(m.index)}: ${m[0]}…} is built from parts`);
  return result;
}

/** One file's text with its class names renamed (a stylesheet by its selectors, anything else by its names). @param {string} file @param {string} text @param {Record<string, any>} classes
 * @returns {{ text: string, manual: string[] }} manual: `file:line: …` for what could not be renamed safely. */
export function renameClassText(file, text, classes) {
  const manual = [];
  const next = /\.css$/.test(file) ? renameCss(text, classes, manual, file) : renameScript(text, classes, manual, file);
  return { text: next, manual };
}
