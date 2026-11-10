// Checks that tracked files outside the language files hold no Danish text (a Danish letter, or a Danish dictionary value).
// Run: npm run check:language, or node scripts/check-language.mjs; --all ignores PENDING.
// Depends on: lib/danish.mjs, Vite (loads the dictionaries), git (lists the files).
import { execFileSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, readSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { danishValuesOf, findDanish, isLanguagePath } from '../lib/danish.mjs';

// Path prefixes not converted to English yet. Each batch of docs/superpowers/plans/2026-11-04-english-source.md
// removes its own. The last batch deletes the list.
const PENDING = ['astro.mjs', 'demo/', 'src/i18n/', 'starter/'];

const root = fileURLToPath(new URL('..', import.meta.url));
const all = process.argv.includes('--all');

/** Whether the first 8000 bytes of a file hold a zero byte. @param {string} file */
function isBinary(file) {
  const fd = openSync(file, 'r');
  try {
    const buffer = Buffer.alloc(8000);
    const n = readSync(fd, buffer, 0, 8000, 0);
    return buffer.subarray(0, n).includes(0);
  } finally {
    closeSync(fd);
  }
}

/** Whether a path is left out of the check. @param {string} path */
function isSkipped(path) {
  if (isLanguagePath(path)) return true;
  if (path === 'CHANGELOG.md' || path === 'package-lock.json') return true;
  if (path.startsWith('docs/superpowers/')) return true;
  if (!all && PENDING.some((prefix) => path.startsWith(prefix))) return true;
  if (!existsSync(`${root}${path}`)) return true;
  return isBinary(`${root}${path}`);
}

const names = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 })
  .split('\0')
  .filter(Boolean);
const paths = names.filter((path) => !isSkipped(path));

const server = await createServer({
  root,
  configFile: false,
  logLevel: 'silent',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true },
});
let danishValues;
try {
  const danish = [(await server.ssrLoadModule('/src/i18n/da-DK/index.ts')).daDK];
  if (existsSync(`${root}defaults/i18n/da-DK/index.ts`)) {
    const defaults = await server.ssrLoadModule('/defaults/i18n/da-DK/index.ts');
    for (const value of Object.values(defaults)) {
      if (value && typeof value === 'object') danish.push(value);
    }
  }
  const english = [(await server.ssrLoadModule('/src/i18n/en-US/index.ts')).enUS];
  danishValues = danishValuesOf(danish, english);
} finally {
  await server.close();
}

let count = 0;
const filesWithMatches = new Set();
/** @param {string} path @param {{ line: number, match: string }[]} matches */
function report(path, matches) {
  for (const { line, match } of matches) {
    console.log(`${path}:${line}  ${match}`);
    count++;
    filesWithMatches.add(path);
  }
}

for (const path of paths) {
  report(
    path,
    findDanish(path, new Set()).map((m) => ({ ...m, line: 0 })),
  );
  report(path, findDanish(readFileSync(`${root}${path}`, 'utf8'), danishValues));
}

if (count > 0) {
  console.log(`${count} Danish texts in ${filesWithMatches.size} files outside the language files.`);
  process.exitCode = 1;
} else {
  console.log('No Danish outside the language files.');
}
