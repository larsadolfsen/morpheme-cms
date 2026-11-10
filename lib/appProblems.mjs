// Collects problems from app hooks and builds, and writes them to dist/_apps/_problems.json.
// Exposes PROBLEMS_FILE, createProblems, buildProblems (the build's one collector), addOnce, writeProblems and problemsOf.
// Depends on APP_FILES (the _apps folder name) from ./apps.mjs.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_FILES } from './apps.mjs';

/**
 * @typedef {{
 *   app: string,
 *   place: 'hook' | 'after-build' | 'bundle' | 'manifest',
 *   hook?: string,
 *   page?: string,
 *   error: string,
 *   message: string,
 * }} AppProblem
 */

export const PROBLEMS_FILE = '_problems.json';

const MAX_MESSAGE = 500;

/** @param {AppProblem} p @returns {AppProblem} */
const cut = (p) => ({ ...p, message: String(p.message ?? '').slice(0, MAX_MESSAGE) });

/** @returns {{ add(p: AppProblem): void, list(): AppProblem[] }} */
export function createProblems() {
  /** @type {AppProblem[]} */
  const items = [];
  return {
    add(p) {
      items.push(cut(p));
    },
    list() {
      return items.slice();
    },
  };
}

const COLLECTOR = Symbol.for('morphemecms.appProblems');

/**
 * The build's one collector, the same for every caller in this Node process. The page-colors hook (site/pageColors.ts,
 * bundled by Vite for the build) and the after-build step (lib/apps.mjs, loaded by Astro) are separate module copies,
 * so the collector lives on globalThis under a registered symbol, not in a module variable.
 * @returns {{ add(p: AppProblem): void, list(): AppProblem[] }}
 */
export function buildProblems() {
  const store = /** @type {Record<symbol, ReturnType<typeof createProblems>>} */ (/** @type {unknown} */ (globalThis));
  return (store[COLLECTOR] ??= createProblems());
}

/**
 * Adds a problem unless the collector already holds the same one (an app's manifest or bundle problem is found by
 * more than one step of the build).
 * @param {{ add(p: AppProblem): void, list(): AppProblem[] }} problems
 * @param {AppProblem} p
 */
export function addOnce(problems, p) {
  const same = (/** @type {AppProblem} */ q) => JSON.stringify(cut(q)) === JSON.stringify(cut(p));
  if (!problems.list().some(same)) problems.add(p);
}

/**
 * Always writes dist/_apps/_problems.json, an empty list included.
 * @param {string} distDir
 * @param {AppProblem[]} problems
 */
export function writeProblems(distDir, problems) {
  const dir = join(distDir, APP_FILES);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, PROBLEMS_FILE), JSON.stringify(problems.map(cut), null, 2) + '\n');
}

/** @param {AppProblem[]} all @param {string} app @returns {AppProblem[]} */
export function problemsOf(all, app) {
  return all.filter((p) => p.app === app);
}
