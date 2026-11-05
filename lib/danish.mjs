// Pure finder for Danish text: findDanish, danishValuesOf, isLanguagePath.
// Depends on: no external packages; Node 24.

const DANISH_LETTERS = new Set([
  '\u00e6', '\u00f8', '\u00e5', // æ, ø, å
  '\u00c6', '\u00d8', '\u00c5'  // Æ, Ø, Å
]);

const WORD_RE = /[\p{L}\p{N}_-]+/gu;

export function findDanish(text, danishValues) {
  const results = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

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

export function isLanguagePath(path) {
  return (
    path.includes('/i18n/da-DK/') ||
    path.startsWith('i18n/da-DK/') ||
    path.endsWith('i18n/da-DK.js')
  );
}
