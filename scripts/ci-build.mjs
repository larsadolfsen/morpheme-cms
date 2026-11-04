// `morpheme ci-build`, the Cloudflare build command: takes the content lane (Prettier on the changed files, the editor's
// checks, the build) when only content changed since the live commit, else the full lane (npm run check, the build).
// Exposes decideLane; running the file does the build. Depends on lib/build-lane.mjs, site/live-diff.mjs, step-command.mjs.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILD_SETTINGS_PATH, readBuildSettings } from '../lib/build-settings.mjs';
import { laneFor } from '../lib/build-lane.mjs';
import { changedSinceLive } from '../site/live-diff.mjs';
import { stepCommand } from './step-command.mjs';

/**
 * @param {object} o
 * @param {string} o.cwd the site's root; must be the working directory too, as the site config is loaded from there
 * @param {typeof globalThis.fetch} [o.fetch]
 * @param {NodeJS.ProcessEnv} [o.env]
 * @returns {Promise<{ lane: 'content' | 'full', reason: string, paths: string[] | null }>} any doubt gives the full lane.
 */
export async function decideLane({ cwd, fetch = globalThis.fetch, env = process.env }) {
  let settings;
  try {
    const file = join(cwd, BUILD_SETTINGS_PATH);
    settings = readBuildSettings(existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined);
  } catch {
    return { ...laneFor(null, { contentLane: true }, `${BUILD_SETTINGS_PATH} unreadable`), paths: null };
  }
  let config;
  try {
    // Loaded as check-content.mjs does, from the site's root (siteConfig.mjs reads the working directory).
    ({ config } = await import('../site/siteConfig.mjs'));
    if (!config?.domain || !config?.repo?.branch) throw new Error('no domain or branch');
  } catch {
    return { ...laneFor(null, settings, 'site config unknown'), paths: null };
  }
  const { paths, reason } = await changedSinceLive({
    siteUrl: 'https://' + config.domain,
    cwd,
    fetch,
    branch: env.WORKERS_CI_BRANCH,
    repoBranch: config.repo.branch,
  });
  return { ...laneFor(paths, settings, reason), paths };
}

/** Runs a command with the output shown and stops the build with its exit code when it fails. */
function step(tool, args, env = process.env) {
  console.log(`ci-build: ${[tool, ...args].join(' ')}`);
  const [command, commandArgs] = stepCommand(tool, args, { env });
  const { status } = spawnSync(command, commandArgs, { stdio: 'inherit', env });
  if (status !== 0) process.exit(status ?? 1);
}

async function main() {
  const cwd = process.cwd();
  const { lane, reason, paths } = await decideLane({ cwd });
  console.log(`ci-build: ${lane} lane — ${reason}`);
  if (lane === 'full') {
    step('npm', ['run', 'check']);
  } else {
    const existing = paths.filter((path) => existsSync(join(cwd, path)));
    if (existing.length > 0) step('prettier', ['--check', '--ignore-unknown', ...existing]);
    step('npm', ['run', 'check:content']);
    step('npm', ['run', 'check:editor']);
  }
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
  step('npm', ['run', 'build'], { ...process.env, MORPHEME_CONTENT_CHECKED: head });
}

/**
 * Whether the module at `metaUrl` is the script Node was started with. Both sides go through realpath, so symlinks, a
 * relative argv[1] and a drive letter's case (Windows) cannot make the same file look like another.
 * @param {string} metaUrl import.meta.url
 * @param {string | undefined} argv1 process.argv[1]
 */
export function isMainModule(metaUrl, argv1) {
  if (!argv1) return false;
  try {
    return realpathSync.native(fileURLToPath(metaUrl)) === realpathSync.native(argv1);
  } catch {
    return false;
  }
}

if (isMainModule(import.meta.url, process.argv[1])) await main();
