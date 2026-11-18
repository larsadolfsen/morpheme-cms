// The ratchet for the `mo-` names (plan docs/superpowers/plans/2026-11-18-mo-names-contract-7.md, PR M1; the pattern: docs/class-names.md).
// Every class and custom property of ours starts with `mo-` (owner, 18 Nov 2026). Until the renames (M2 to M6) have landed, this check counts per
// file what is still unprefixed and fails when a count is higher than scripts/mo-names-allowlist.json lists or a file not listed has any:
//   classDefs     unprefixed class names defined in a stylesheet,
//   markup        unprefixed class names written in markup or code strings (only names a stylesheet defines),
//   propsDeclared / propsRead   unprefixed custom properties declared or read.
// A count can only fall: when a PR renames names, it lowers the numbers in the allowlist (`--list` prints the current ones). M7 takes the
// allowlist to zero. What is not counted, with reasons: NOT_RENAMED in scripts/mo-names.mjs. Built like scripts/check-tailwind.mjs (T01).
// Run: npm run check:mo-names; `--list` prints the current counts as the allowlist's `files`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readTree, scan } from './mo-names.mjs';

export const METRICS = ['classDefs', 'markup', 'propsDeclared', 'propsRead'];
const LABEL = {
  classDefs: 'unprefixed class definitions',
  markup: 'unprefixed class names in markup or code',
  propsDeclared: 'unprefixed custom properties declared',
  propsRead: 'unprefixed custom properties read',
};

/**
 * @param {Record<string, Record<string, number>>} counts the current counts per file  @param {{ files: Record<string, Record<string, number>> }} allow
 * @returns {{ problems: string[], lowered: string[] }} problems fail the check; lowered are counts that fell below the list
 */
export function compare(counts, allow) {
  const problems = [];
  const lowered = [];
  for (const [file, row] of Object.entries(counts)) {
    const listed = allow.files?.[file];
    for (const metric of METRICS) {
      const now = row[metric] ?? 0;
      const max = listed?.[metric] ?? 0;
      if (now > max)
        problems.push(
          listed
            ? `${file}: ${now} ${LABEL[metric]}, ${max} allowed. A name of ours starts with mo- (docs/class-names.md); write the new one, or find it in docs/superpowers/plans/mo-names/map.json.`
            : `${file}: ${now} ${LABEL[metric]} in a file the list does not know. Nothing new gets an unprefixed name: use mo-… (docs/class-names.md).`,
        );
    }
  }
  for (const [file, row] of Object.entries(allow.files ?? {}))
    for (const metric of METRICS) {
      const now = counts[file]?.[metric] ?? 0;
      if (now < (row[metric] ?? 0))
        lowered.push(
          `${file}: ${metric} is ${now} of ${row[metric]} allowed: lower it in scripts/mo-names-allowlist.json (npm run check:mo-names -- --list).`,
        );
    }
  return { problems, lowered };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const allow = JSON.parse(readFileSync(new URL('mo-names-allowlist.json', import.meta.url), 'utf8'));
  const { perFile } = scan(readTree());
  if (process.argv.includes('--list')) {
    console.log(JSON.stringify(perFile, null, 2));
    process.exit(0);
  }
  const { problems, lowered } = compare(perFile, allow);
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  for (const l of lowered) console.log(`check:mo-names: ${l}`);
  const total = Object.fromEntries(METRICS.map((m) => [m, Object.values(perFile).reduce((n, r) => n + (r[m] ?? 0), 0)]));
  console.log(
    `check:mo-names: ${total.classDefs} class definitions, ${total.markup} class names in markup, ${total.propsDeclared} properties declared and ${total.propsRead} read are still unprefixed, in ${Object.keys(perFile).length} files; none new.`,
  );
}
