// The runner interface for app code: runs a bundle's default export in a sandbox with limits and returns a RunResult.
// Exposes HOOK_LIMITS, AFTER_BUILD_LIMITS and run().
// Depends on lib/sandbox/quickjs.mjs, the default engine.
import { runInQuickJS } from './quickjs.mjs';

/** @typedef {{ ms: number; memoryMb: number; outputKb: number }} Limits */
/** @typedef {Record<string, (...args: unknown[]) => unknown | Promise<unknown>>} Helpers */
/**
 * @typedef {{ ok: true; value: unknown }
 *   | { ok: false; error: 'throw' | 'timeout' | 'memory' | 'output'; message: string }} RunResult
 */

/** Limits for one hook call on one page. @type {Limits} */
export const HOOK_LIMITS = Object.freeze({ ms: 1000, memoryMb: 64, outputKb: 256 });

/** Limits for an app's after-build step. @type {Limits} */
export const AFTER_BUILD_LIMITS = Object.freeze({ ms: 30000, memoryMb: 256, outputKb: 5120 });

/**
 * Runs `code` (one ES module whose default export is called as `fn(input, helpers)`) in a sandbox.
 * @param {string} code
 * @param {unknown} input
 * @param {Helpers} helpers
 * @param {Limits} limits
 * @returns {Promise<RunResult>}
 */
export function run(code, input, helpers, limits) {
  return runInQuickJS(code, input, helpers, limits);
}
