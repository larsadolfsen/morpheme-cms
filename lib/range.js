// Whether a version satisfies an npm range, for the ranges packages write in peerDependencies: exact versions,
// x-ranges (1, 1.2, 1.2.x, *), ^, ~, the comparators (>=, >, <=, <, =), hyphen ranges and ||. Anything else (and a
// version with a pre-release) throws Unsupported, so the caller can say that `npm install` must do it instead of
// guessing.

export class Unsupported extends Error {}

const PART = '(0|[1-9]\\d*|[xX*])';
const PARTIAL = new RegExp(`^v?${PART}(?:\\.${PART}(?:\\.${PART})?)?$`);
const VERSION = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

const wild = (p) => p === undefined || /^[xX*]$/.test(p);

/** [major, minor, patch] of a version, or Unsupported. */
function parse(version) {
  const m = VERSION.exec(version);
  if (!m) throw new Unsupported(`version ${version}`);
  return m.slice(1, 4).map(Number);
}

function compare(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return 0;
}

/** A partial version as [numbers given] (1.2 → [1, 2]); x, X and * end it. */
function partial(text) {
  const m = PARTIAL.exec(text);
  if (!m) throw new Unsupported(`range ${text}`);
  const parts = [];
  for (const p of m.slice(1, 4)) {
    if (wild(p)) break;
    parts.push(Number(p));
  }
  return parts;
}

const pad = (parts) => [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
/** The first version above everything a partial version covers (1.2 → 1.3.0, 1 → 2.0.0). */
function above(parts) {
  if (parts.length === 0) return null;
  if (parts.length === 1) return [parts[0] + 1, 0, 0];
  if (parts.length === 2) return [parts[0], parts[1] + 1, 0];
  return null;
}

/** One comparator as [low, lowInclusive, high, highInclusive] bounds (null: none). */
function bounds(token) {
  const op = /^(>=|<=|>|<|=|\^|~)?(.*)$/.exec(token);
  const [, sign = '', rest] = op;
  const parts = partial(rest);
  const full = pad(parts);
  const next = above(parts);
  switch (sign) {
    case '':
    case '=':
      if (parts.length === 3) return [full, true, full, true];
      return [parts.length ? full : null, true, next, false];
    case '>=':
      return [parts.length ? full : null, true, null, false];
    case '>':
      if (!parts.length) throw new Unsupported(`range ${token}`);
      return parts.length === 3 ? [full, false, null, false] : [next, true, null, false];
    case '<':
      if (!parts.length) throw new Unsupported(`range ${token}`);
      return [null, true, full, false];
    case '<=':
      if (!parts.length) return [null, true, null, false];
      return parts.length === 3 ? [null, true, full, true] : [null, true, next, false];
    case '~':
      if (!parts.length) return [null, true, null, false];
      return [full, true, parts.length === 1 ? [parts[0] + 1, 0, 0] : [parts[0], parts[1] + 1, 0], false];
    case '^': {
      if (!parts.length) return [null, true, null, false];
      const [a, b, c] = full;
      if (a > 0 || parts.length === 1) return [full, true, [a + 1, 0, 0], false];
      if (b > 0 || parts.length === 2) return [full, true, [0, b + 1, 0], false];
      return [full, true, [0, 0, c + 1], false];
    }
  }
  throw new Unsupported(`range ${token}`);
}

function within(v, [low, lowIn, high, highIn]) {
  if (low && (lowIn ? compare(v, low) < 0 : compare(v, low) <= 0)) return false;
  if (high && (highIn ? compare(v, high) > 0 : compare(v, high) >= 0)) return false;
  return true;
}

/** Whether version satisfies range; throws Unsupported for what this does not read. */
export function satisfies(version, range) {
  const v = parse(version);
  return range.split('||').some((set) => {
    const text = set.trim().replace(/(>=|<=|>|<|=|\^|~)\s+/g, '$1');
    if (text === '' || text === '*') return true;
    const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(text);
    if (hyphen) {
      const [from, to] = [partial(hyphen[1]), partial(hyphen[2])];
      return within(v, [pad(from), true, to.length === 3 ? pad(to) : above(to), to.length === 3]);
    }
    return text.split(/\s+/).every((token) => within(v, bounds(token)));
  });
}
