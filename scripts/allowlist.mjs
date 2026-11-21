// The matching of what a check finds against its allowlist, one shape for the checks that keep one (WCAG 2.2 AA; `check:announce` uses it first).
// A finding is a key of kind, place, selector and viewport: the kind (the name of the problem or the axe rule), the editor screen (`#settings`) or flow
// (`flow A`), the node's selector and `phone` or `computer`. An allowlist entry is `{ <field>, selector, places, viewports, reason }` and stands for one key
// per place and viewport. A check fails on a finding no entry holds and on an entry that no longer matches a finding, so the list only shrinks.
// `<field>` is `rule` in scripts/a11y-allowlist.json and `problem` in scripts/keyboard-allowlist.json and scripts/announce-allowlist.json: the same entry shape.
//
// Reconcile (0.19.4 batch 1): scripts/a11y.mjs and scripts/keyboard.mjs each hold their own copy of this code, written before this file. When a later
// batch touches them, they can import `makeAllowlist` and drop their copy; batch 1 leaves them as they are, so check:a11y and check:keyboard do not change.
import { appendFileSync, readFileSync } from 'node:fs';

/** The widths by the name an entry uses (a unit's phone is 375 or 390 px, its computer 1280). */
export const viewportOf = (width) => (width < 600 ? 'phone' : 'computer');

const SEP = '\t';

/** A finding's selector without what changes from run to run (the ids React makes). */
export const cleanSelector = (selector) => selector.replace(/:r[0-9a-z]*:|_r_[0-9a-z]+_/g, 'r*');

/**
 * @param {{ file: URL, field: string, label: string, collectEnv: string }} options `file`: the list; `field`: the name of the kind in an entry;
 *   `label`: the name in the messages (`announce`); `collectEnv`: the environment variable that collects findings instead of judging them.
 */
export function makeAllowlist({ file, field, label, collectEnv }) {
  /** The allowlist's entries. @returns {Array<Record<string, any>>} */
  const readAllowlist = () => JSON.parse(readFileSync(file, 'utf8'));

  /** The keys of the findings `[{ problem, selector }]` of one place. */
  const keysOf = (findings, place, viewport) =>
    new Set(findings.map((f) => [f.problem, place, cleanSelector(f.selector), viewport].join(SEP)));

  /** The keys the allowlist holds, each with its reason; `wanted` limits them to those places. */
  function allowedKeys(entries, wanted = () => true) {
    const keys = new Map();
    for (const entry of entries)
      for (const place of entry.places)
        if (wanted(place))
          for (const viewport of entry.viewports) keys.set([entry[field], place, entry.selector, viewport].join(SEP), entry.reason);
    return keys;
  }

  /** The findings the list does not hold (`unexpected`) and the entries that found nothing (`stale`), as lines to print. @param {Set<string>} found @param {Map<string, string>} allowed */
  function compare(found, allowed) {
    const say = (key) => {
      const [kind, place, selector, viewport] = key.split(SEP);
      return `${kind} on ${place} (${viewport}): ${selector}`;
    };
    return {
      unexpected: [...found].filter((k) => !allowed.has(k)).map(say),
      stale: [...allowed.keys()].filter((k) => !found.has(k)).map(say),
    };
  }

  /** The messages the checks print. */
  const problemsOf = ({ unexpected, stale }) => [
    ...unexpected.map((line) => `${label}: new problem, not on ${file.pathname.split('/').pop()}: ${line}. Fix it; the list only shrinks.`),
    ...stale.map(
      (line) => `${label}: the allowlist holds an entry that no longer matches, remove it from ${file.pathname.split('/').pop()}: ${line}.`,
    ),
  ];

  /** Groups findings into allowlist entries (`--list`): one entry for each kind, selector and set of viewports, with its places. @param {Set<string>} keys */
  function entriesOf(keys, reasonOf = () => 'TODO') {
    const byNode = new Map();
    for (const key of keys) {
      const [kind, place, selector, viewport] = key.split(SEP);
      const id = [kind, place, selector].join(SEP);
      byNode.set(id, [...(byNode.get(id) ?? []), viewport]);
    }
    const grouped = new Map();
    for (const [id, viewports] of byNode) {
      const [kind, place, selector] = id.split(SEP);
      const names = ['phone', 'computer'].filter((v) => viewports.includes(v));
      const group = [kind, selector, names.join(',')].join(SEP);
      grouped.set(group, [...(grouped.get(group) ?? []), place]);
    }
    return [...grouped]
      .map(([group, places]) => {
        const [kind, selector, names] = group.split(SEP);
        return { [field]: kind, selector, places: places.sort(), viewports: names.split(','), reason: reasonOf(kind, selector) };
      })
      .sort((a, b) => a[field].localeCompare(b[field]) || a.selector.localeCompare(b.selector));
  }

  /** Appends findings to a file, one key a line (for writing the allowlist from a run of check:screens). */
  const collect = (path, keys) => appendFileSync(path, [...keys].map((k) => `${k}\n`).join(''));

  /** Checks one place's findings against the allowlist: gives the problems to print, or collects the keys when the collect variable is set. @returns {string[]} */
  function judge(findings, place, viewport) {
    const found = keysOf(findings, place, viewport);
    if (process.env[collectEnv]) {
      collect(process.env[collectEnv], found);
      return [];
    }
    const allowed = allowedKeys(readAllowlist(), (p) => p === place);
    for (const key of [...allowed.keys()]) if (!key.endsWith(`${SEP}${viewport}`)) allowed.delete(key);
    return problemsOf(compare(found, allowed));
  }

  return { readAllowlist, keysOf, allowedKeys, compare, problemsOf, entriesOf, collect, judge };
}
