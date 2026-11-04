// Tests for scripts/ci-build.mjs: decideLane's lane for an unreadable build.json, the switch turned off, and a content-only
// diff, in temporary git repositories (GIT_* variables cleared). Run: node --test packages/editor/scripts/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { clearRepoEnv } from './git-env.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { relative } from 'node:path';
import { decideLane, isMainModule } from './ci-build.mjs';

// git sets GIT_DIR and friends for hooks (the pre-push hook runs these tests), and they would point every git call here at the real repository.
clearRepoEnv();

const start = process.cwd();

const git = (dir, ...args) =>
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], { cwd: dir, encoding: 'utf8' }).trim();

function write(dir, file, text) {
  mkdirSync(dirname(join(dir, file)), { recursive: true });
  writeFileSync(join(dir, file), text);
}

/**
 * A site repository whose first commit (the live one) has the config and `files`; the working directory is moved there,
 * because the site config is loaded from it. Returns the directory and the live commit.
 */
function site(files = {}) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'ci-build-')));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  write(dir, 'src/site/config.ts', "export const config = { domain: 'example.com', repo: { branch: 'main' } };\n");
  for (const [file, text] of Object.entries(files)) write(dir, file, text);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'live');
  process.chdir(dir);
  return { dir, live: git(dir, 'rev-parse', 'HEAD') };
}

function commitContent(dir) {
  write(dir, 'src/content/a.md', 'new');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'content');
}

const serve = (commit) => async () => ({ status: 200, json: async () => ({ commit }) });

function cleanup(dir) {
  process.chdir(start);
  rmSync(dir, { recursive: true, force: true });
}

test('an unreadable build.json gives the full lane', async () => {
  const { dir, live } = site({ 'src/data/build.json': '{ not json' });
  try {
    commitContent(dir);
    const result = await decideLane({ cwd: dir, fetch: serve(live), env: {} });
    assert.equal(result.lane, 'full');
    assert.match(result.reason, /build\.json unreadable/);
    assert.equal(result.paths, null);
  } finally {
    cleanup(dir);
  }
});

test('the content lane turned off gives the full lane', async () => {
  const { dir, live } = site({ 'src/data/build.json': JSON.stringify({ contentLane: false, paidBuilds: false }) });
  try {
    commitContent(dir);
    const result = await decideLane({ cwd: dir, fetch: serve(live), env: {} });
    assert.equal(result.lane, 'full');
    assert.equal(result.reason, 'turned off in the editor');
  } finally {
    cleanup(dir);
  }
});

test('a content-only diff gives the content lane with its paths', async () => {
  const { dir, live } = site({ 'README.md': 'x' });
  try {
    commitContent(dir);
    const result = await decideLane({ cwd: dir, fetch: serve(live), env: {} });
    assert.equal(result.lane, 'content');
    assert.deepEqual(result.paths, ['src/content/a.md']);
  } finally {
    cleanup(dir);
  }
});

test('isMainModule matches the same file however argv[1] spells it', () => {
  const file = fileURLToPath(import.meta.url);
  const url = pathToFileURL(file).href;
  assert.equal(isMainModule(url, file), true);
  assert.equal(isMainModule(url, relative(process.cwd(), file)), true);
  assert.equal(
    isMainModule(
      url,
      file.replace(/^[A-Z]:/, (drive) => drive.toLowerCase()),
    ),
    true,
  );
  assert.equal(
    isMainModule(
      url,
      file.replace(/^[a-z]:/, (drive) => drive.toUpperCase()),
    ),
    true,
  );
});

test('isMainModule is false for another file, a missing path or no argument', () => {
  const url = pathToFileURL(fileURLToPath(import.meta.url)).href;
  assert.equal(isMainModule(url, fileURLToPath(new URL('./git-env.mjs', import.meta.url))), false);
  assert.equal(isMainModule(url, join(tmpdir(), 'no-such-file.mjs')), false);
  assert.equal(isMainModule(url, undefined), false);
});

test('running the file does run the build (the guard matches)', () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'ci-build-run-')));
  try {
    writeFileSync(join(dir, 'package.json'), '{"scripts":{}}'); // so npm finds no `check` script and stops
    // no site config here, so main fails fast, and "ci-build:" in the output shows that it ran
    const out = execFileSync(process.execPath, [fileURLToPath(new URL('./ci-build.mjs', import.meta.url))], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    }).toString();
    assert.match(out, /ci-build: full lane/);
  } catch (error) {
    assert.match(String(error.stdout), /ci-build: full lane/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
