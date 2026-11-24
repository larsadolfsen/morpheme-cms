// Owner rule, 17 Nov 2026: every token follows Material 3's naming, `--mo-ref-*`, `--mo-sys-*` and `--mo-comp-<component>-*`,
// and the old names are gone, with no alias (docs/superpowers/plans/2026-11-16-token-rename-table.md). This check fails on a name that was renamed
// and comes back: scripts/renamed-tokens.json maps each old name to its new one (a rename PR adds its names), and a tracked file that still
// writes an old name, whole, is a problem. Not read: docs/superpowers/ (plans and specs are history), release notes, changesets, CHANGELOG.md, and the list and test of this check.
// Run: npm run check:token-names. Depends on: git (lists the files).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SKIP =
  /^(node_modules|docs\/superpowers|release-notes|\.changeset|package-lock\.json|CHANGELOG\.md|scripts\/renamed-tokens\.json|scripts\/m3-names\.json|scripts\/check-token-names\.test\.mjs)/;
const TEXT = /\.(css|ts|tsx|mjs|js|cjs|astro|md|json|html|svg|yml|yaml|txt|toml|jsonc)$/;

/** The lines of `text` that write a renamed name whole: `[{ line, name, now }]`. @param {string} text @param {Record<string, string>} renamed */
export function oldNamesIn(text, renamed) {
  const names = Object.keys(renamed).sort((a, b) => b.length - a.length);
  if (names.length === 0) return [];
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(?<![\\w-])(' + names.map(escape).join('|') + ')(?![\\w-])', 'g');
  const found = [];
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(re)) found.push({ line: i + 1, name: m[1], now: renamed[m[1]] });
  });
  return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const renamed = JSON.parse(readFileSync(root + 'scripts/renamed-tokens.json', 'utf8'));
  const files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\n')
    .filter((f) => f && !SKIP.test(f) && TEXT.test(f));
  const problems = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(root + file, 'utf8');
    } catch {
      continue;
    }
    for (const { line, name, now } of oldNamesIn(text, renamed)) problems.push(`${file}:${line}: ${name} was renamed to ${now}`);
  }
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    console.error(
      `\n${problems.length} old token name(s). They were renamed with no alias (scripts/renamed-tokens.json); use the new name.`,
    );
    process.exit(1);
  }
  console.log(`check:token-names: none of the ${Object.keys(renamed).length} renamed names is written in ${files.length} files.`);
}
