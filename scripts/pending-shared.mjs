// Finds places where a Worker module keeps an unfinished I/O promise (no await) in module state.
// Exposes pendingShared(source); no dependencies. Used by pending-shared.test.mjs on worker/*.js.

const PENDING_TEXTS = [
  'fetch(',
  '.prepare(',
  '.batch(',
  '.run(',
  '.all(',
  '.first(',
  '.raw(',
  '.exec(',
  '.put(',
  '.list(',
  '.then(',
  '.catch(',
  'Promise.',
];
const ID = '[A-Za-z_$][\\w$]*';

/** Replace comments and string contents with spaces; keep newlines so indexes match the source. */
function mask(src) {
  let out = '';
  for (let i = 0; i < src.length;) {
    const c = src[i];
    const next = src[i + 1];
    let end = -1;
    if (c === '/' && next === '/') {
      end = src.indexOf('\n', i);
      if (end < 0) end = src.length;
    } else if (c === '/' && next === '*') {
      end = src.indexOf('*/', i + 2);
      end = end < 0 ? src.length : end + 2;
    } else if (c === "'" || c === '"' || c === '`') {
      end = i + 1;
      while (end < src.length && src[end] !== c) end += src[end] === '\\' ? 2 : 1;
      end = Math.min(end + 1, src.length);
    }
    if (end < 0) {
      out += c;
      i += 1;
    } else {
      out += src.slice(i, end).replace(/[^\n]/g, ' ');
      i = end;
    }
  }
  return out;
}

/** End index of the statement that starts at `from`: first `;` at depth 0, an unmatched closer, or the file end. */
function statementEnd(text, from) {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) {
      if (--depth < 0) return i;
    } else if (c === ';' && depth === 0) return i;
  }
  return text.length;
}

/** Split call arguments at top-level commas. */
function splitArgs(text) {
  const args = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) {
      args.push(text.slice(start, i));
      start = i + 1;
    }
  }
  args.push(text.slice(start));
  return args;
}

/**
 * Places where a module keeps an I/O promise that is not finished (no `await`) in module state.
 * @param {string} source the text of one .js file
 * @returns {{ line: number, name: string }[]} line is 1-based; name is the module-state name
 */
export function pendingShared(source) {
  const text = mask(source);
  const sourceLines = source.split('\n');
  const lineOf = (index) => text.slice(0, index).split('\n').length;

  const names = new Set();
  for (const m of text.matchAll(new RegExp(`^(?:let|var)\\s+(${ID})`, 'gm'))) names.add(m[1]);
  for (const m of text.matchAll(new RegExp(`^const\\s+(${ID})\\s*=\\s*new\\s+(?:Weak)?(?:Map|Set)\\(`, 'gm'))) {
    names.add(m[1]);
  }
  if (!names.size) return [];

  const hasPendingText = (expr) => !/\bawait\b/.test(expr) && PENDING_TEXTS.some((t) => expr.includes(t));

  const pendingLocals = new Set();
  for (const m of text.matchAll(new RegExp(`^[ \\t]+(?:const|let)\\s+(${ID})\\s*=`, 'gm'))) {
    const start = m.index + m[0].length;
    if (hasPendingText(text.slice(start, statementEnd(text, start)))) pendingLocals.add(m[1]);
  }
  const escape = (n) => n.replace(/\$/g, '\\$');
  const isPending = (expr) => {
    if (/\bawait\b/.test(expr)) return false;
    if (hasPendingText(expr)) return true;
    return [...pendingLocals].some((n) => new RegExp(`(?<![\\w$.])${escape(n)}(?![\\w$])`).test(expr));
  };

  const found = new Map();
  const report = (index, name) => {
    if (sourceLines[lineOf(index) - 1].includes('// pending-ok')) return;
    found.set(index, name);
  };

  for (const name of names) {
    const n = escape(name);
    const assign = new RegExp(`(?<![\\w$.])${n}\\s*(?:\\?\\?=|\\|\\|=|=(?![=>]))`, 'g');
    for (const m of text.matchAll(assign)) {
      const start = m.index + m[0].length;
      if (isPending(text.slice(start, statementEnd(text, start)))) report(m.index, name);
    }
    const call = new RegExp(`(?<![\\w$.])${n}\\.(set|add)\\(`, 'g');
    for (const m of text.matchAll(call)) {
      const start = m.index + m[0].length;
      const args = splitArgs(text.slice(start, statementEnd(text, start)));
      const value = m[1] === 'set' ? args[1] : args[0];
      if (value !== undefined && isPending(value)) report(m.index, name);
    }
  }
  return [...found].sort((a, b) => a[0] - b[0]).map(([index, name]) => ({ line: lineOf(index), name }));
}
