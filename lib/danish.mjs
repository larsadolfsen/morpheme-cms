// Finds Danish text and Danish ids for scripts/check-language.mjs.
// Exposes findDanish, danishValuesOf, isLanguagePath, findDanishIds, findDanishPathIds, findDanishTexts, isIdCheckSkipped, matchPending.
// Pure: no packages, no file access. Depends on: lib/danishIds.mjs (the word lists).
import { DANISH_IDS, DANISH_ROUTE_SEGMENTS, DANISH_STOP_WORDS } from './danishIds.mjs';

const DANISH_LETTERS = new Set(['\u00e6', '\u00f8', '\u00e5', '\u00c6', '\u00d8', '\u00c5']);

const WORD_RE = /[\p{L}\p{N}_-]+/gu;

/**
 * Finds Danish text in a source text: a 'letter' match is the first word on a line with a Danish letter, a 'value' match is a quoted string equal to a Danish dictionary value.
 * @param {string} text
 * @param {Set<string>} danishValues
 * @returns {{ line: number, match: string, kind: 'letter' | 'value' }[]}
 */
export function findDanish(text, danishValues) {
  const results = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    // A line that carries a Danish id on purpose (a route or a stored value) says so: `// language-ok: <reason>`.
    if (line.includes('language-ok')) continue;

    // Find first word containing a Danish letter
    let letterMatch = null;
    const wordMatches = line.match(WORD_RE);
    if (wordMatches) {
      for (const word of wordMatches) {
        for (const ch of word) {
          if (DANISH_LETTERS.has(ch)) {
            letterMatch = word;
            break;
          }
        }
        if (letterMatch) break;
      }
    }
    if (letterMatch) {
      results.push({ line: lineNum, match: letterMatch, kind: 'letter' });
    }

    // Find value matches (quoted strings)
    const quoteRe = /'((?:[^'\\]|\\.)*?)'|\"((?:[^\"\\]|\\.)*?)\"|`((?:[^`\\]|\\.)*?)`/g;
    let qMatch;
    while ((qMatch = quoteRe.exec(line)) !== null) {
      let content = null;
      let isBacktick = false;
      if (qMatch[0].startsWith("'")) {
        content = qMatch[1];
      } else if (qMatch[0].startsWith('"')) {
        content = qMatch[2];
      } else if (qMatch[0].startsWith('`')) {
        content = qMatch[3];
        isBacktick = true;
      }

      if (content === null) continue;

      if (isBacktick && content.includes('${')) continue;

      const unescaped = content.replace(/\\(.)/g, '$1');

      if (danishValues.has(unescaped)) {
        results.push({ line: lineNum, match: unescaped, kind: 'value' });
      }
    }
  }

  results.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    if (a.kind === 'letter' && b.kind === 'value') return -1;
    if (a.kind === 'value' && b.kind === 'letter') return 1;
    return 0;
  });

  return results;
}

function collectStringLeaves(obj, set) {
  if (obj === null || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'string') {
        set.add(item);
      }
    }
    return;
  }
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      if (val !== key) {
        set.add(val);
      }
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      collectStringLeaves(val, set);
    }
  }
}

/**
 * Collects the Danish dictionary values, and skips values equal to their key, values with no letter, and values that are also English.
 * @param {Record<string, unknown>[]} dictionaries
 * @param {Record<string, unknown>[]} [englishDictionaries]
 * @returns {Set<string>}
 */
export function danishValuesOf(dictionaries, englishDictionaries = []) {
  const danishSet = new Set();
  for (const dict of dictionaries) {
    collectStringLeaves(dict, danishSet);
  }

  const englishSet = new Set();
  for (const dict of englishDictionaries) {
    collectStringLeaves(dict, englishSet);
  }

  const result = new Set();
  for (const value of danishSet) {
    if (!/\p{L}/u.test(value)) continue;
    if (englishSet.has(value)) continue;
    result.add(value);
  }

  return result;
}

/**
 * Tells whether a path is a Danish language file.
 * @param {string} path
 * @returns {boolean}
 */
export function isLanguagePath(path) {
  return path.includes('/i18n/da-DK/') || path.startsWith('i18n/da-DK/') || path.endsWith('i18n/da-DK.js');
}

const QUOTE_RE = /'((?:[^'\\\n]|\\.)*?)'|"((?:[^"\\\n]|\\.)*?)"|`((?:[^`\\\n]|\\.)*?)`/g;
const PLACEHOLDER_RE = /\{([\p{L}\p{N}_-]+)\}/gu;
const NOT_WORD_RE = /[^\p{L}\p{N}]+/u;

/** The contents of the quoted strings of one line, as written (escapes kept). @param {string} line */
function quotedStrings(line) {
  return [...line.matchAll(QUOTE_RE)].map((m) => m[1] ?? m[2] ?? m[3] ?? '');
}

/** The lower-case words of a string, split at everything that is not a letter or a digit (so at / - _ : { } too). @param {string} text */
function wordsOf(text) {
  return text.toLowerCase().split(NOT_WORD_RE).filter(Boolean);
}

/**
 * Finds Danish ids in a source text: a word of the list DANISH_IDS in a quoted string (split at / - _ : { } and the
 * like, whole words only), a `{placeholder}` name anywhere on a line, and a Danish route segment in a quoted URL path.
 * A line with `language-ok` is skipped. Each word is reported once per line.
 * @param {string} text
 * @returns {{ line: number, match: string, kind: 'id' }[]}
 */
export function findDanishIds(text) {
  const results = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('language-ok')) continue;
    const seen = new Set();
    /** @param {string} word */
    const add = (word) => {
      if (seen.has(word)) return;
      seen.add(word);
      results.push({ line: i + 1, match: word, kind: /** @type {const} */ ('id') });
    };
    for (const content of quotedStrings(line)) {
      for (const word of wordsOf(content)) if (DANISH_IDS.has(word)) add(word);
      if (content.startsWith('/')) {
        for (const segment of content.toLowerCase().split('/')) if (DANISH_ROUTE_SEGMENTS.has(segment)) add(segment);
      }
    }
    for (const m of line.matchAll(PLACEHOLDER_RE)) {
      const word = m[1].toLowerCase();
      if (DANISH_IDS.has(word)) add(word);
    }
  }
  return results;
}

/**
 * Finds the Danish id words in a tracked path: every folder or file name (without its extension) that is a Danish
 * route segment or holds a word of DANISH_IDS when split at - and _.
 * @param {string} path
 * @returns {string[]}
 */
export function findDanishPathIds(path) {
  const found = [];
  for (const segment of path.split('/')) {
    const name = segment.replace(/^(.+)\.[^.]+$/, '$1').toLowerCase();
    if (DANISH_ROUTE_SEGMENTS.has(name)) found.push(name);
    for (const word of wordsOf(name)) if (DANISH_IDS.has(word)) found.push(word);
  }
  return [...new Set(found)];
}

/**
 * The weaker rule, for Danish text with no Danish letter: a quoted string with a word of DANISH_STOP_WORDS (all seven
 * are Danish only, so one is enough; the spec's 95 literals are the ones with one or more). A line with `language-ok` is skipped.
 * @param {string} text
 * @returns {{ line: number, match: string, kind: 'text' }[]}
 */
export function findDanishTexts(text) {
  const results = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('language-ok')) continue;
    for (const content of quotedStrings(lines[i])) {
      const hits = wordsOf(content).filter((word) => DANISH_STOP_WORDS.includes(word));
      if (hits.length >= 1) results.push({ line: i + 1, match: content.replace(/\\(.)/g, '$1'), kind: /** @type {const} */ ('text') });
    }
  }
  return results;
}

/** Files that hold Danish ids on purpose, or test data for the check itself: the id and text rules skip them. */
const ID_CHECK_SKIPPED = new Set(['src/movedRoutes.mjs', 'src/movedRoutes.test.mjs', 'lib/danishIds.mjs', 'lib/danish.test.mjs']);

/**
 * Whether the id and text rules skip a file: the legacy route table and its test, the word list, this check's test and the list of known findings.
 * @param {string} path
 * @returns {boolean}
 */
export function isIdCheckSkipped(path) {
  return ID_CHECK_SKIPPED.has(path);
}

/**
 * Compares findings with the PENDING_IDS list of `path:token` entries.
 * @param {{ path: string, token: string }[]} findings
 * @param {string[]} pending
 * @returns {{ fresh: { path: string, token: string }[], stale: string[] }} fresh: findings not on the list; stale: entries that match no finding
 */
export function matchPending(findings, pending) {
  const listed = new Set(pending);
  const found = new Set(findings.map((f) => `${f.path}:${f.token}`));
  return {
    fresh: findings.filter((f) => !listed.has(`${f.path}:${f.token}`)),
    stale: pending.filter((entry) => !found.has(entry)),
  };
}
