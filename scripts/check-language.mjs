// Checks that tracked files outside the language files hold no Danish text (a Danish letter, or a Danish dictionary value)
// and no Danish id (a word of lib/danishIds.mjs in a quoted string, a {placeholder} or a path), and, in scripts/, lib/ and
// worker/, no Danish text without a Danish letter (two stop words in a quoted string). Known findings are in scripts/pending-ids.mjs.
// Run: npm run check:language, or node scripts/check-language.mjs; `--list-ids` prints every id and text finding as a `path:token` line and exits.
// Depends on: lib/danish.mjs, lib/danishIds.mjs, scripts/pending-ids.mjs, Vite (loads the dictionaries), git (lists the files).
import { execFileSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, readSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import {
  danishValuesOf,
  findDanish,
  findDanishIds,
  findDanishPathIds,
  findDanishTexts,
  isIdCheckSkipped,
  isLanguagePath,
  matchPending,
} from '../lib/danish.mjs';
import { PENDING_IDS } from './pending-ids.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

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

// Danish ids (paths, quoted words, {placeholders}) and Danish text without a Danish letter (scripts/, lib/, worker/).
/** @type {{ path: string, token: string, line: number }[]} */
const idFindings = [];
const maxTextToken = 60;
for (const path of paths) {
  if (isIdCheckSkipped(path)) continue;
  for (const token of findDanishPathIds(path)) idFindings.push({ path, token, line: 0 });
  const text = readFileSync(`${root}${path}`, 'utf8');
  for (const { line, match } of findDanishIds(text)) idFindings.push({ path, token: match, line });
  if (/^(scripts|lib|worker)\//.test(path)) {
    for (const { line, match } of findDanishTexts(text)) {
      idFindings.push({ path, token: `text:${match.replace(/\s+/g, ' ').slice(0, maxTextToken)}`, line });
    }
  }
}

if (process.argv.includes('--list-ids')) {
  for (const key of new Set(idFindings.map((f) => `${f.path}:${f.token}`))) console.log(key);
  process.exit(0);
}

const { fresh, stale } = matchPending(idFindings, PENDING_IDS);
for (const { path, token, line } of fresh) {
  console.log(`${path}:${line}  ${token.startsWith('text:') ? 'Danish text' : 'Danish id'}: ${token.replace(/^text:/, '')}`);
  count++;
  filesWithMatches.add(path);
}
for (const entry of stale) {
  console.log(`scripts/pending-ids.mjs  stale entry, remove it: ${entry}`);
  count++;
}

if (count > 0) {
  console.log(`${count} Danish texts in ${filesWithMatches.size} files outside the language files, or stale PENDING_IDS entries.`);
  process.exitCode = 1;
} else {
  console.log('No Danish outside the language files.');
}
