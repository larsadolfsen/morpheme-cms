// Batch 2 of the Material 3 names (docs/superpowers/specs/2026-11-20-material-3-names-design.md): renames every custom property of the `tokens` part of
// scripts/m3-names.json in all tracked sources, in one pass, by whole name (`--mo-…` followed by no word character or dash), so a reused name never chains
// (an old name that is also a new name is replaced once and not again). An old name that becomes several (an array in the map) is declared under each new
// name with the same value; where it is read (a `var()` call, a string, a comment) the first new name is written and the place is listed, for a person to look at.
// Run: node scripts/rename-tokens.mjs [--check]  (--check lists what would change and writes nothing). Tested in scripts/rename-tokens.test.mjs.
// A reused name (an old name that is also a new one: today --mo-comp-search-view-docked-container-shape) is renamed again by a second run, so re-run only on a tree
// where the old names are back: after merging the base, `git checkout <the pre-rename commit> -- <the files>` for the files both sides changed, or ask the PM.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SKIP =
  /^(node_modules|docs\/superpowers|release-notes|\.changeset|package-lock\.json|CHANGELOG\.md|scripts\/m3-names\.json|scripts\/renamed-tokens\.json|scripts\/rename-tokens\.(test\.)?mjs|scripts\/check-token-names\.test\.mjs)/;
const TEXT = /\.(css|ts|tsx|mjs|js|cjs|astro|md|json|html|svg|yml|yaml|txt|toml|jsonc)$/;
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Renames the tokens of `map` in `text`. @param {string} text @param {Record<string, string | string[]>} map
 * @returns {{ text: string, many: { line: number, name: string, now: string }[] }} `many`: uses of an old name that became several, written as the first new name.
 */
export function renameTokens(text, map) {
  const names = Object.keys(map).sort((a, b) => b.length - a.length);
  if (names.length === 0) return { text, many: [] };
  const alt = names.map(escape).join('|');
  const many = [];
  // A declaration of an old name that becomes several: one declaration for each new name.
  const decl = new RegExp(`(?<![\\w-])(${alt})(\\s*:\\s*)([^;{}]*?)(\\s*)(;|(?=\\}))`, 'g');
  let out = text.replace(decl, (all, name, colon, value, space, end) => {
    const to = map[name];
    if (!Array.isArray(to)) return all;
    return to.map((n) => `${n}${colon}${value}`).join('; ') + (end === ';' ? ';' : space);
  });
  // Everything else: whole names, once.
  const re = new RegExp(`(?<![\\w-])(${alt})(?![\\w-])`, 'g');
  const lineAt = (s, i) => s.slice(0, i).split('\n').length;
  out = out.replace(re, (name, _g, offset, whole) => {
    const to = map[name];
    if (!Array.isArray(to)) return to;
    many.push({ line: lineAt(whole, offset), name, now: to.join(', ') });
    return to[0];
  });
  return { text: out, many };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const map = JSON.parse(readFileSync(root + 'scripts/m3-names.json', 'utf8')).tokens;
  const files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\n')
    .filter((f) => f && !SKIP.test(f) && TEXT.test(f));
  let changed = 0;
  for (const file of files) {
    let text;
    try {
      text = readFileSync(root + file, 'utf8');
    } catch {
      continue;
    }
    const { text: next, many } = renameTokens(text, map);
    for (const m of many) console.log(`review ${file}:${m.line}: ${m.name} → first of ${m.now}`);
    if (next === text) continue;
    changed++;
    if (!check) writeFileSync(root + file, next);
  }
  console.log(`rename-tokens: ${changed} file(s) ${check ? 'would change' : 'changed'}. Run Prettier on them.`);
}
