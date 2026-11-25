// Owner rule (22 Nov 2026): Phosphor and Lucide are not in the package. Code draws an icon through the shared Icon (src/icon.tsx) by its
// Material Symbols name. This check fails on any import or reference of `@phosphor-icons/*` or Lucide (`lucide`, `lucide-react`,
// `lucide-static`, `@lucide/*`) in the tracked source, with no allowlist. A theme's own icon pack (`icon-packs/`) holds SVG files, never an import.
// Run: npm run check:phosphor, or node scripts/check-phosphor.mjs.
// Depends on: git (lists the files).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const FOLDERS = ['src', 'theme', 'defaults', 'lib', 'site', 'worker', 'bin', 'pages', 'demo/src', 'starter/src', 'scripts'];

/** The module names a file imports or names from Phosphor or Lucide: `from '…'`, `import '…'`, `import('…')`, `require('…')`. @param {string} code */
export function bannedImports(code) {
  const found = [];
  const banned = /^(@phosphor-icons\/|@lucide\/|lucide(-react|-static|-vue|-svelte|-solid|-preact)?(\/|$))/;
  for (const [, name] of code.matchAll(/(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g)) if (banned.test(name)) found.push(name);
  return found;
}

const SELF = new Set(['scripts/check-phosphor.mjs', 'scripts/check-phosphor.test.mjs']);
const files = execFileSync('git', ['ls-files', ...FOLDERS], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(tsx?|mjs|js|astro)$/.test(f) && !SELF.has(f));

const problems = [];
for (const file of files) {
  for (const name of new Set(bannedImports(readFileSync(root + file, 'utf8'))))
    problems.push(
      `${file}: imports ${name}. Phosphor and Lucide are not in the package: draw the icon with Icon (src/icon.tsx), by its Material Symbols name.`,
    );
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('check:phosphor: no import of Phosphor or Lucide');
