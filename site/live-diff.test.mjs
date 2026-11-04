// Tests for site/live-diff.mjs: the files changed since the live commit, in a temporary git repository with the variables that
// point git at a repository removed (scripts/git-env.mjs) so no test touches the real one. Run: node --test packages/editor/site/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { clearRepoEnv } from '../scripts/git-env.mjs';
import { changedSinceLive } from './live-diff.mjs';

// git sets GIT_DIR and friends for hooks (the pre-push hook runs these tests), and they would point every git call here at the real repository.
clearRepoEnv();

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'live-diff-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, encoding: 'utf8' });
  return dir;
}

function git(dir, ...args) {
  return execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
}

function commit(dir, file, text) {
  mkdirSync(dirname(join(dir, file)), { recursive: true });
  writeFileSync(join(dir, file), text);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', file);
  return git(dir, 'rev-parse', 'HEAD');
}

const serve = (body) => async () => ({ status: 200, json: async () => body });

const site = { siteUrl: 'https://example.com', repoBranch: 'main' };

test('lists the files changed since the live commit', async () => {
  const dir = repo();
  try {
    const a = commit(dir, 'README.md', 'x');
    commit(dir, 'src/content/a.md', 'y');
    const result = await changedSinceLive({ ...site, cwd: dir, fetch: serve({ commit: a }) });
    assert.deepEqual(result.paths, ['src/content/a.md']);
    assert.equal(result.live, a);
    assert.equal(result.reason, 'diff against ' + a.slice(0, 7));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a code commit that was never built is still listed', async () => {
  const dir = repo();
  try {
    const a = commit(dir, 'README.md', 'x');
    commit(dir, 'packages/editor/src/ui.tsx', 'code');
    commit(dir, 'src/content/a.md', 'y');
    const result = await changedSinceLive({ ...site, cwd: dir, fetch: serve({ commit: a }) });
    assert.deepEqual(result.paths, ['packages/editor/src/ui.tsx', 'src/content/a.md']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an unreachable site gives no list', async () => {
  const dir = repo();
  try {
    commit(dir, 'README.md', 'x');
    const result = await changedSinceLive({
      ...site,
      cwd: dir,
      fetch: async () => {
        throw new Error('offline');
      },
    });
    assert.deepEqual(result, { paths: null, reason: 'live commit unknown', live: null });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a malformed commit gives no list', async () => {
  const dir = repo();
  try {
    commit(dir, 'README.md', 'x');
    const result = await changedSinceLive({ ...site, cwd: dir, fetch: serve({ commit: 'nope' }) });
    assert.equal(result.reason, 'live commit unknown');
    assert.equal(result.paths, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a commit the repository does not have gives no list', async () => {
  const dir = repo();
  try {
    commit(dir, 'README.md', 'x');
    const result = await changedSinceLive({ ...site, cwd: dir, fetch: serve({ commit: 'a'.repeat(40) }) });
    assert.equal(result.paths, null);
    assert.equal(result.reason, 'live commit not in history');
    assert.equal(result.live, 'a'.repeat(40));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a live commit off the branch gives no list', async () => {
  const dir = repo();
  try {
    commit(dir, 'README.md', 'x');
    git(dir, 'checkout', '-q', '-b', 'side');
    const side = commit(dir, 'side.md', 's');
    git(dir, 'checkout', '-q', 'main');
    commit(dir, 'src/content/a.md', 'y');
    const result = await changedSinceLive({ ...site, cwd: dir, fetch: serve({ commit: side }) });
    assert.equal(result.paths, null);
    assert.equal(result.reason, 'live commit not an ancestor of HEAD');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a branch preview gives no list and does not ask the site', async () => {
  const dir = repo();
  try {
    commit(dir, 'README.md', 'x');
    let asked = false;
    const result = await changedSinceLive({
      ...site,
      cwd: dir,
      branch: 'feature-x',
      fetch: async () => {
        asked = true;
        throw new Error('asked');
      },
    });
    assert.deepEqual(result, { paths: null, reason: 'branch preview', live: null });
    assert.equal(asked, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the live commit is HEAD: nothing changed', async () => {
  const dir = repo();
  try {
    const a = commit(dir, 'README.md', 'x');
    const result = await changedSinceLive({ ...site, cwd: dir, fetch: serve({ commit: a }) });
    assert.deepEqual(result.paths, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a code file renamed into src/content/ lists the old path too', async () => {
  const dir = repo();
  try {
    const a = commit(dir, 'src/site/config.ts', 'export const config = {};\n'.repeat(20));
    mkdirSync(join(dir, 'src/content'), { recursive: true });
    git(dir, 'mv', 'src/site/config.ts', 'src/content/config.ts');
    git(dir, 'commit', '-q', '-m', 'move');
    const result = await changedSinceLive({ ...site, cwd: dir, fetch: serve({ commit: a }) });
    assert.deepEqual([...result.paths].sort(), ['src/content/config.ts', 'src/site/config.ts']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a path with non-ASCII letters or spaces is listed as it is', async () => {
  const dir = repo();
  try {
    const a = commit(dir, 'README.md', 'x');
    commit(dir, 'src/content/blå post.md', 'y');
    const result = await changedSinceLive({ ...site, cwd: dir, fetch: serve({ commit: a }) });
    assert.deepEqual(result.paths, ['src/content/blå post.md']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an uncommitted change to a tracked file gives no list', async () => {
  const dir = repo();
  try {
    const a = commit(dir, 'src/site/config.ts', 'x');
    commit(dir, 'src/content/a.md', 'y');
    writeFileSync(join(dir, 'src/site/config.ts'), 'edited');
    const result = await changedSinceLive({ ...site, cwd: dir, fetch: serve({ commit: a }) });
    assert.equal(result.paths, null);
    assert.equal(result.reason, 'uncommitted changes in the working tree');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an untracked file does not count as an uncommitted change', async () => {
  const dir = repo();
  try {
    const a = commit(dir, 'README.md', 'x');
    commit(dir, 'src/content/a.md', 'y');
    writeFileSync(join(dir, 'dist.txt'), 'build output');
    const result = await changedSinceLive({ ...site, cwd: dir, fetch: serve({ commit: a }) });
    assert.deepEqual(result.paths, ['src/content/a.md']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a fetch that stalls past the timeout gives the full lane', async () => {
  const dir = repo();
  try {
    commit(dir, 'README.md', 'x');
    // an origin whose transport never answers
    git(dir, 'config', 'protocol.ext.allow', 'always');
    git(dir, 'remote', 'add', 'origin', 'ext::node -e setTimeout(()=>{},1500)');
    const started = Date.now();
    const result = await changedSinceLive({
      ...site,
      cwd: dir,
      gitTimeout: 300,
      fetch: serve({ commit: 'a'.repeat(40) }),
    });
    assert.equal(result.paths, null);
    assert.equal(result.reason, 'live commit not in history');
    assert.ok(Date.now() - started < 1400, 'the stalled fetch was cut off');
  } finally {
    // the stalled transport process may still hold the directory (Windows); the temp dir is then left to the OS
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  }
});
