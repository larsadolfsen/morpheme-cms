// Runs a contract 4 app's after-build step (after-build.ts) in the build sandbox and writes the files it gives to
// dist/_apps/<app>/. Exposes FILE_NAME, MAX_FILES, afterBuildOutputProblems and runAfterBuild.
// Depends on apps.mjs (APP_FILES), sandbox/bundle.mjs, sandbox/runner.mjs, appManifest.mjs, appProblems.mjs, reads.mjs.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { APP_FILES } from './apps.mjs';
import { readManifest, settingsFor } from './appManifest.mjs';
import { addOnce } from './appProblems.mjs';
import { bundleEntry } from './sandbox/bundle.mjs';
import { AFTER_BUILD_LIMITS, run } from './sandbox/runner.mjs';
import { readsFor } from './reads.mjs';

/** The name of a file an app gives: lower case letters, digits and hyphens, then `.json`. */
export const FILE_NAME = /^[a-z0-9-]+\.json$/;

/** The most files an app gives. */
export const MAX_FILES = 20;

const ENTRY = 'after-build.ts';

/** @param {unknown} v @returns {v is Record<string, unknown>} */
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * What is wrong with the value an after-build step gave, a sentence each, or [] when it is `{ files }` with at most
 * MAX_FILES files, each named like FILE_NAME and holding a JSON value.
 * @param {unknown} value @returns {string[]}
 */
export function afterBuildOutputProblems(value) {
  if (!isObject(value)) return ['The step must give an object with a key "files".'];
  const problems = Object.keys(value)
    .filter((key) => key !== 'files')
    .map((key) => `The key "${key}" is not known; the step gives only "files".`);
  const files = value.files;
  if (!isObject(files)) return [...problems, 'The key "files" must be an object of file names and JSON values.'];
  const names = Object.keys(files);
  if (names.length > MAX_FILES) problems.push(`The step gives ${names.length} files; the most is ${MAX_FILES}.`);
  for (const name of names) {
    if (!FILE_NAME.test(name)) problems.push(`The file name "${name}" must be lower case letters, digits and hyphens, then .json.`);
    else if (files[name] === undefined) problems.push(`The file "${name}" has no value.`);
  }
  return problems;
}

/**
 * Runs the app's after-build step and writes its files to `<dist>/_apps/<appId>/<name>`, each as JSON. Never throws
 * for what the app does: a bundle that fails, a run that fails or an output that is not valid becomes one problem, and
 * then no file is written at all.
 * @param {{
 *   root: string,
 *   dist: string,
 *   appId: string,
 *   build: { commit: string, committed: string },
 *   problems: { add(p: import('./appProblems.mjs').AppProblem): void, list(): import('./appProblems.mjs').AppProblem[] },
 * }} options `root` is the site's folder, `dist` the build's folder, `build` the last commit (empty strings without git).
 * @returns {Promise<void>}
 */
export async function runAfterBuild({ root, dist, appId, build, problems }) {
  const dir = path.join(root, 'src/apps', appId);
  const { manifest, problems: found } = readManifest(dir);
  if (found.length) addOnce(problems, { app: appId, place: 'manifest', error: 'manifest', message: found.join(' ') });
  if (!manifest?.afterBuild) return;

  /** @param {string} error @param {string} message */
  const fail = (error, message) => addOnce(problems, { app: appId, place: 'after-build', error, message });

  const bundle = await bundleEntry(dir, ENTRY, appId);
  if (!bundle.ok) return addOnce(problems, { app: appId, place: 'bundle', error: 'bundle', message: bundle.message });

  const input = { settings: settingsFor(root, appId, manifest), reads: await readsFor(manifest.reads ?? [], root), build };
  const hash = (/** @type {unknown} */ text) => createHash('sha256').update(String(text)).digest('hex');
  const result = await run(bundle.code, input, { hash }, AFTER_BUILD_LIMITS);
  if (!result.ok) return fail(result.error, result.message);

  const wrong = afterBuildOutputProblems(result.value);
  if (wrong.length) return fail('invalid', wrong.join(' '));

  const files = /** @type {{ files: Record<string, unknown> }} */ (result.value).files;
  const out = path.join(dist, APP_FILES, appId);
  mkdirSync(out, { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(path.join(out, name), JSON.stringify(content));
}
