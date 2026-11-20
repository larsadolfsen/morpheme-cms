// The accessibility scan's shared parts (WCAG 2.2 AA, owner rule of 19 Nov 2026): axe-core run on a page, and the matching of what it finds
// against the allowlist `scripts/a11y-allowlist.json`. `check:a11y` (scripts/check-a11y.mjs, the site) and the units `screens 390` and
// `screens 1280` (scripts/screens/start-screens.mjs, the editor) both use it, so one rule decides in both places.
//
// A finding is a key of rule, place, selector and viewport: the axe rule, the page (`/blocks/image-grid/`) or the editor screen (`#settings`), the
// node's selector and `phone` or `computer`. An allowlist entry is `{ rule, selector, places, viewports, reason }` and stands for one key
// per place and viewport. The scan fails on a finding no entry holds and on an entry that no longer matches a finding, so the list only
// shrinks. Depends on: axe-core (a pinned dev dependency).
import { appendFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

/** The axe tags of WCAG 2.2 level AA (the levels A and AA of 2.0, 2.1 and 2.2). */
export const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
/** The two widths the scan runs at, by the name an entry uses. */
export const VIEWPORTS = { phone: 375, computer: 1280 };

/** The key's parts are told apart by a tab, which no selector holds. */
const SEP = '\t';
const ALLOWLIST = new URL('a11y-allowlist.json', import.meta.url);
/** The allowlist's entries. @returns {Array<{ rule: string, selector: string, places: string[], viewports: string[], reason: string }>} */
export const readAllowlist = () => JSON.parse(readFileSync(ALLOWLIST, 'utf8'));

/** A node's selector as one string, without what changes from run to run (the ids React makes: `:r1a:`, `_r_3_`). @param {Array<string | string[]>} target */
export const selectorOf = (target) =>
  target
    .map((part) => (Array.isArray(part) ? part.join(' ') : part))
    .join(' >> ')
    .replace(/:r[0-9a-z]*:|_r_[0-9a-z]+_/g, 'r*');

/** The keys of the violations axe found on one page. @param {Array<{ id: string, nodes: Array<{ target: any[] }> }>} violations */
export const keysOf = (violations, place, viewport) =>
  new Set(violations.flatMap((v) => v.nodes.map((n) => [v.id, place, selectorOf(n.target), viewport].join(SEP))));

/** The keys the allowlist holds, each with its reason; `places` limits them to those pages or screens (the editor checks one screen at a time).
 * @param {ReturnType<typeof readAllowlist>} entries @param {(place: string) => boolean} [wanted] */
export function allowedKeys(entries, wanted = () => true) {
  const keys = new Map();
  for (const { rule, selector, places, viewports, reason } of entries)
    for (const place of places)
      if (wanted(place)) for (const viewport of viewports) keys.set([rule, place, selector, viewport].join(SEP), reason);
  return keys;
}

/** What is wrong: the findings the list does not hold (`unexpected`) and the entries that found nothing (`stale`), as lines to print.
 * @param {Set<string>} found @param {Map<string, string>} allowed */
export function compare(found, allowed) {
  const say = (key) => {
    const [rule, place, selector, viewport] = key.split(SEP);
    return `${rule} on ${place} (${viewport}): ${selector}`;
  };
  return {
    unexpected: [...found].filter((k) => !allowed.has(k)).map(say),
    stale: [...allowed.keys()].filter((k) => !found.has(k)).map(say),
  };
}

/** The problems, as the messages the checks print. */
export function problemsOf({ unexpected, stale }) {
  return [
    ...unexpected.map((line) => `a11y: new violation, not on scripts/a11y-allowlist.json: ${line}. Fix it; the list only shrinks.`),
    ...stale.map(
      (line) => `a11y: the allowlist holds an entry that no longer matches, remove it from scripts/a11y-allowlist.json: ${line}.`,
    ),
  ];
}

/** Groups findings into allowlist entries (`--list`): one entry for each rule, selector and set of viewports, with its places. @param {Set<string>} keys */
export function entriesOf(keys, reasonOf = () => 'TODO') {
  const byNode = new Map();
  for (const key of keys) {
    const [rule, place, selector, viewport] = key.split(SEP);
    const id = [rule, place, selector].join(SEP);
    byNode.set(id, [...(byNode.get(id) ?? []), viewport]);
  }
  const grouped = new Map();
  for (const [id, viewports] of byNode) {
    const [rule, place, selector] = id.split(SEP);
    const names = Object.keys(VIEWPORTS).filter((v) => viewports.includes(v));
    const group = [rule, selector, names.join(',')].join(SEP);
    grouped.set(group, [...(grouped.get(group) ?? []), place]);
  }
  return [...grouped]
    .map(([group, places]) => {
      const [rule, selector, names] = group.split(SEP);
      return { rule, selector, places: places.sort(), viewports: names.split(','), reason: reasonOf(rule, selector) };
    })
    .sort((a, b) => a.rule.localeCompare(b.rule) || a.selector.localeCompare(b.selector));
}

const axeSource = () => readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
let source;

/** Runs axe on the page as it is and gives the violations. The script is evaluated through the browser's protocol, which a page's
 * Content-Security-Policy does not stop; a page opened with `bypassCSP` takes it the same way. @param {import('playwright').Page} page */
export async function scan(page) {
  if (!(await page.evaluate(() => Boolean(globalThis.axe)))) await page.evaluate((source ??= axeSource()));
  const results = await page.evaluate(
    (tags) => globalThis.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] }),
    TAGS,
  );
  return results.violations;
}

/** Appends findings to a file, one key a line (`A11Y_COLLECT`, for writing the allowlist from a run of check:screens). */
export const collect = (file, keys) => appendFileSync(file, [...keys].map((k) => `${k}\n`).join(''));
