// Owner rule (14 Nov): "You should never use a phosphor icon as standard." With Material Symbols as the icon pack, nothing draws Phosphor.
// Code draws an icon through the pack system (the shared Icon part, src/icon.tsx and src/ui.tsx), by its name. This check fails on a
// direct component import from `@phosphor-icons/react` in src/ (and theme/, defaults/) that the allowlist below does not know: the
// themePlugin (site/theme.mjs) redraws such an import in the pack in use, so the listed ones are not drawn as Phosphor, but a new one
// must use Icon. Each file is allowed as many imported names as it has now, no more (a file's count can only fall).
// Run: npm run check:phosphor, or node scripts/check-phosphor.mjs; `--list` prints the current counts as the allowlist's lines.
// Depends on: git (lists the files).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const FOLDERS = ['src', 'theme', 'defaults', 'lib', 'demo/src', 'starter/src', 'pages'];

/** The names a file imports from Phosphor's React package (type imports are not components), and its SVG files imported as
 * text (`@phosphor-icons/core/assets/regular/eye.svg?raw`, themePlugin puts the pack's in their place), one each. @param {string} code */
export function phosphorImports(code) {
  const names = [];
  for (const [, type, list] of code.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s*from\s*'@phosphor-icons\/react'/g)) {
    if (type) continue;
    for (const part of list.split(',')) {
      const name = part.trim();
      if (name && !name.startsWith('type ')) names.push(name.split(/\s+as\s+/)[0]);
    }
  }
  for (const [, name] of code.matchAll(/from\s*'@phosphor-icons\/core\/assets\/(?:regular|fill)\/([a-z0-9-]+)\.svg\?raw'/g))
    names.push(name);
  return names;
}

/** The allowlist: file → { max: how many names it may import (now, never more), why }, in scripts/phosphor-allowlist.json. */
const baseline = JSON.parse(readFileSync(new URL('phosphor-allowlist.json', import.meta.url), 'utf8'));

const files = execFileSync('git', ['ls-files', ...FOLDERS], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(tsx?|mjs|astro)$/.test(f));
const counts = {};
for (const file of files) {
  const n = phosphorImports(readFileSync(root + file, 'utf8')).length;
  if (n) counts[file] = n;
}

if (process.argv.includes('--list')) {
  console.log(JSON.stringify(counts, null, 2));
  process.exit(0);
}

const problems = [];
for (const [file, n] of Object.entries(counts)) {
  const allowed = baseline[file]?.max;
  if (allowed === undefined)
    problems.push(
      `${file}: imports ${n} component(s) from @phosphor-icons/react. Draw icons with Icon (src/icon.tsx, the pack in use), by name.`,
    );
  else if (n > allowed)
    problems.push(
      `${file}: imports ${n} Phosphor components, ${allowed} allowed (scripts/phosphor-allowlist.json). Draw the new one with Icon.`,
    );
}
for (const file of Object.keys(baseline))
  if (!(file in counts) || counts[file] < baseline[file].max)
    problems.push(
      `${file}: imports fewer Phosphor components than allowed (${counts[file] ?? 0} of ${baseline[file].max}): lower it in scripts/phosphor-allowlist.json.`,
    );

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`check:phosphor: ${Object.keys(counts).length} files import Phosphor components, all on the allowlist.`);
