// What a change affects: the one engine that turns changed source paths into what they touch (plan
// docs/superpowers/plans/2026-11-18-build-and-check-speed.md, shared building block 2). Pure, no I/O, so CI's `changes` job, the screens
// runner and (later) the site's build lanes can all use it. A caller brings its own RULES; this file only decides how they are read.
//
//   const rules = [[/^src\/Library\.tsx$/, ['files']], [/^docs\//, 'none'], [/^src\//, 'all']];
//   select(['src/Library.tsx', 'docs/a.md'], rules)  ->  { all: false, areas: ['files'], unknown: [] }
//
// A rule is [pattern, what]: `what` is a list of area names, 'none' (the path affects no area) or 'all' (it affects every area).
// The first rule that matches a path decides. WHEN IN DOUBT, EVERYTHING: a path no rule matches, a path with `..`, an empty
// list, a rule that is malformed, and an input that is not a list all give `all: true`. A caller that catches an error must treat
// it the same way (see `EVERYTHING`).

/** The answer that means "run everything"; what a caller falls back to on any error. */
export const EVERYTHING = Object.freeze({ all: true, areas: Object.freeze([]), unknown: Object.freeze([]) });

/**
 * The rule that decides a path, or null when none does (a path that has `..`, or one no rule matches).
 * @param {string} path
 * @param {Array<[RegExp, string[] | 'all' | 'none']>} rules
 */
export function ruleFor(path, rules) {
  const p = String(path ?? '')
    .trim()
    .replace(/^\.\//, '');
  if (!p || /(^|\/)\.\.(\/|$)/.test(p)) return null; // a `..` segment, not a name like [...slug]
  return rules.find(([re]) => re.test(p)) ?? null;
}

/**
 * What a set of changed paths affects.
 * @param {string[]} paths
 * @param {Array<[RegExp, string[] | 'all' | 'none']>} rules
 * @returns {{ all: boolean, areas: string[], unknown: string[] }} `all`: every area; `areas`: the named areas (sorted, empty when
 *   `all`); `unknown`: the paths no rule knew (they are why `all` is true when it is)
 */
export function select(paths, rules) {
  try {
    if (!Array.isArray(paths) || !Array.isArray(rules)) return EVERYTHING;
    const changed = paths.map((p) => String(p ?? '').trim()).filter(Boolean);
    if (changed.length === 0) return EVERYTHING;
    const areas = new Set();
    const unknown = [];
    let all = false;
    for (const path of changed) {
      const rule = ruleFor(path, rules);
      if (!rule) {
        unknown.push(path);
        all = true;
      } else if (rule[1] === 'all') all = true;
      else if (rule[1] === 'none') continue;
      else if (Array.isArray(rule[1]) && rule[1].every((a) => typeof a === 'string' && a)) for (const a of rule[1]) areas.add(a);
      else return EVERYTHING; // a malformed rule: in doubt, everything
    }
    return { all, areas: all ? [] : [...areas].sort(), unknown };
  } catch {
    return EVERYTHING;
  }
}
