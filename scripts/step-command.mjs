// How ci-build starts Prettier and npm without a shell: Node runs their JavaScript entry points itself, so a path with a
// space or a character cmd.exe reads (& | ^ %) reaches them as one argument. Exposes stepCommand, npmCli. Depends on bin.mjs.
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { binOf } from './bin.mjs';

/**
 * npm's entry point: the one running this build (npm_execpath, from npm or npx), else the one installed beside Node.
 * @param {NodeJS.ProcessEnv} env
 * @param {string} nodePath the node executable
 * @returns {string | null}
 */
export function npmCli(env = process.env, nodePath = process.execPath) {
  const fromNpm = env.npm_execpath ? join(dirname(env.npm_execpath), basename(env.npm_execpath).replace(/^npx-cli/, 'npm-cli')) : null;
  const beside = [
    join(dirname(nodePath), 'node_modules', 'npm', 'bin', 'npm-cli.js'), // Windows
    join(dirname(nodePath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'), // Linux and macOS
  ];
  return [fromNpm, ...beside].find((file) => file && /npm-cli\.c?js$/.test(file) && existsSync(file)) ?? null;
}

/**
 * The program and arguments for a build step; never needs a shell.
 * @param {'npm' | 'prettier'} tool
 * @param {string[]} args
 * @param {{ env?: NodeJS.ProcessEnv, from?: string }} [o] `from` is the site's root, where Prettier is found
 * @returns {[string, string[]]}
 */
export function stepCommand(tool, args, { env = process.env, from = process.cwd() } = {}) {
  if (tool === 'prettier') return [process.execPath, [binOf('prettier', 'prettier', from), ...args]];
  const cli = npmCli(env);
  // Without npm's script, plain `npm` still starts on Linux (Cloudflare); on Windows the spawn fails and the build stops.
  return cli ? [process.execPath, [cli, ...args]] : ['npm', args];
}
