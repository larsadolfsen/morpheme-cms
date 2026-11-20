// Tests for scripts/pending-ids.mjs and scripts/check-language.mjs. Run: node --test scripts/pending-ids.test.mjs
// Depends on: node:test, lib/danish.mjs, the tracked files of the repository.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { findDanishIds, findDanishPathIds, findDanishTexts } from '../lib/danish.mjs';
import { PENDING_IDS } from './pending-ids.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

/** The tokens the check finds in one file today, as it names them in PENDING_IDS. @param {string} path */
function tokensOf(path) {
  const text = readFileSync(`${root}${path}`, 'utf8');
  const tokens = new Set(findDanishPathIds(path));
  for (const { match } of findDanishIds(text)) tokens.add(match);
  for (const { match } of findDanishTexts(text)) tokens.add(`text:${match.replace(/\s+/g, ' ').slice(0, 60)}`);
  return tokens;
}

describe('PENDING_IDS', () => {
  it('has no duplicate entry', () => {
    assert.deepEqual(
      PENDING_IDS.filter((entry, n) => PENDING_IDS.indexOf(entry) !== n),
      [],
    );
  });

  it('has no entry whose file or token is gone (a finished batch deletes its rows)', () => {
    const tracked = new Set(execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0'));
    const gone = [];
    for (const entry of PENDING_IDS) {
      const at = entry.indexOf(':');
      const path = entry.slice(0, at);
      const token = entry.slice(at + 1);
      if (!tracked.has(path) || !existsSync(`${root}${path}`) || !tokensOf(path).has(token)) gone.push(entry);
    }
    assert.deepEqual(gone, []);
  });
});

describe('npm run check:language', () => {
  it('passes on the repository as it is', () => {
    const run = spawnSync('node', ['scripts/check-language.mjs'], { cwd: root, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stdout + run.stderr);
  });
});
