// The ratchet of the move away from Tailwind (plan 2026-11-16-move-away-from-tailwind.md; batch T01): `npm run check:tailwind`.
// It counts, per file, the Tailwind utilities in class attributes and in strings of constants, `theme(--`, `@theme`, `@plugin`, `@source`,
// `@reference`, `@apply` and `--tw-` (scripts/tailwind-inventory.mjs counts them), and fails when a count is higher than the one listed in
// scripts/tailwind-allowlist.json, or a file that is not listed has any. A count only goes down: a batch that removes Tailwind lowers the
// numbers in the same pull request (`node scripts/check-tailwind.mjs --write` writes the allowlist from the tree). Batch T17 takes the list to zero.
// `prose` is counted by the inventory but not here: it is the typography plugin's class and goes with batch T13.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanTree } from './tailwind-inventory.mjs';

export const KEYS = ['utilities', 'constants', 'theme', 'themeAt', 'plugin', 'source', 'reference', 'apply', 'tw'];
const NAMES = {
  utilities: 'Tailwind utilities',
  constants: 'Tailwind utilities in strings',
  theme: 'theme(--…) calls',
  themeAt: '@theme',
  plugin: '@plugin',
  source: '@source',
  reference: '@reference',
  apply: '@apply',
  tw: '--tw- declarations',
};
const here = dirname(fileURLToPath(import.meta.url));
export const ALLOWLIST = join(here, 'tailwind-allowlist.json');

/** The counts of the ratchet from a scan (only the counted keys, only files that have any). */
export function counted(files) {
  const out = {};
  for (const [file, counts] of Object.entries(files)) {
    const kept = Object.fromEntries(KEYS.filter((k) => counts[k]).map((k) => [k, counts[k]]));
    if (Object.keys(kept).length) out[file] = kept;
  }
  return out;
}

/** The problems: a count above the list, or a file that is not listed. `allowed` is { file: { key: n } }. */
export function problems(found, allowed) {
  const out = [];
  for (const [file, counts] of Object.entries(found)) {
    for (const key of KEYS) {
      const have = counts[key] ?? 0;
      const may = allowed[file]?.[key] ?? 0;
      if (have <= may) continue;
      out.push(
        allowed[file]
          ? `${file}: ${have} ${NAMES[key]}, the list allows ${may}. Remove the new ones and write the style as plain CSS. To lower a count after a batch removed some, run \`node scripts/check-tailwind.mjs --write\`.`
          : `${file}: ${have} ${NAMES[key]}, and the file is not in scripts/tailwind-allowlist.json. New code uses no Tailwind: write plain CSS.`,
      );
    }
  }
  return out;
}

/** The entries of the list that are higher than the tree: a count that can be lowered (the list must follow the tree down). */
export function loose(found, allowed) {
  const out = [];
  for (const [file, counts] of Object.entries(allowed))
    for (const key of KEYS) {
      const may = counts[key] ?? 0;
      const have = found[file]?.[key] ?? 0;
      if (may > have) out.push(`${file}: ${NAMES[key]} ${have}, the list still says ${may}`);
    }
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const found = counted((await scanTree()).files);
  if (process.argv.includes('--write')) {
    const sorted = Object.fromEntries(Object.entries(found).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(ALLOWLIST, `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`Wrote ${Object.keys(sorted).length} files to scripts/tailwind-allowlist.json.`);
    process.exit(0);
  }
  const allowed = JSON.parse(readFileSync(ALLOWLIST, 'utf8'));
  const bad = problems(found, allowed);
  const slack = loose(found, allowed);
  if (bad.length) {
    console.error(`check:tailwind: Tailwind came back (${bad.length}):\n${bad.join('\n')}`);
    process.exit(1);
  }
  // Not a failure (parallel batches would fight over the list), but the batch that removed Tailwind lowers its numbers.
  if (slack.length)
    console.warn(
      `check:tailwind: the list is higher than the tree in ${slack.length} places. Lower it with \`node scripts/check-tailwind.mjs --write\`:\n${slack.join('\n')}`,
    );
  const total = Object.values(found).reduce((n, c) => n + (c.utilities ?? 0), 0);
  console.log(`check:tailwind: no more Tailwind than listed (${total} utilities in ${Object.keys(found).length} files).`);
}
