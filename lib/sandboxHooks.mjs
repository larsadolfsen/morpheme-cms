// Runs the page-colors hook of the contract 4 apps (app.json) in the build sandbox, for site/pageColors.ts.
// Exposes pageColorsHooks. Depends on appManifest.mjs, appProblems.mjs; loads sandbox/bundle.mjs and sandbox/runner.mjs
// (esbuild, QuickJS) only when an app has the hook, so a site without one loads neither.
import path from 'node:path';
import { readManifest, settingsFor } from './appManifest.mjs';
import { addOnce } from './appProblems.mjs';

const HOOK = 'page-colors';
const ENTRY = `hooks/${HOOK}.ts`;

/**
 * The active contract 4 apps that have the page-colors hook, in the order of their ids, and a way to run each one.
 * An app whose app.json has problems, or whose hook does not bundle, becomes one problem (not one for each page).
 * A hook that fails, or gives colours `check` refuses, becomes a problem with the page's address, and gives no colours.
 * @param {{
 *   root: string,
 *   active: string[],
 *   problems: { add(p: import('./appProblems.mjs').AppProblem): void, list(): import('./appProblems.mjs').AppProblem[] },
 *   check: (value: unknown) => string[],
 * }} options `root` is the site's folder; `active` the ids of the apps that run; `check` says what is wrong with
 * the colours a hook gave (pageColorsOutputProblems, then that they are readable), a sentence each, or [].
 * @returns {{
 *   apps: { id: string, settings: Record<string, unknown> }[],
 *   run: (id: string, page: string, input: unknown, helpers: Record<string, (...args: any[]) => unknown>) => Promise<unknown>,
 * }}
 */
export function pageColorsHooks({ root, active, problems, check }) {
  /** @type {Map<string, string>} */
  const dirs = new Map();
  /** @type {{ id: string, settings: Record<string, unknown> }[]} */
  const apps = [];
  for (const id of [...active].sort((a, b) => a.localeCompare(b))) {
    const dir = path.join(root, 'src/apps', id);
    const { manifest, problems: found } = readManifest(dir);
    if (found.length) addOnce(problems, { app: id, place: 'manifest', error: 'manifest', message: found.join(' ') });
    if (!manifest?.hooks?.includes(HOOK)) continue;
    dirs.set(id, dir);
    apps.push({ id, settings: settingsFor(root, id, manifest) });
  }

  // One bundle for each app in a build; a failed bundle is said once.
  /** @type {Map<string, Promise<string | undefined>>} */
  const bundles = new Map();
  /** @param {string} id */
  const bundleOf = (id) => {
    if (!bundles.has(id))
      bundles.set(
        id,
        (async () => {
          const { bundleEntry } = await import('./sandbox/bundle.mjs');
          const result = await bundleEntry(/** @type {string} */ (dirs.get(id)), ENTRY, id);
          if (result.ok) return result.code;
          addOnce(problems, { app: id, place: 'bundle', hook: HOOK, error: 'bundle', message: result.message });
          return undefined;
        })(),
      );
    return /** @type {Promise<string | undefined>} */ (bundles.get(id));
  };

  return {
    apps,
    async run(id, page, input, helpers) {
      const code = await bundleOf(id);
      if (code === undefined) return undefined;
      const { run, HOOK_LIMITS } = await import('./sandbox/runner.mjs');
      const result = await run(code, input, helpers, HOOK_LIMITS);
      /** @param {string} error @param {string} message */
      const fail = (error, message) => {
        problems.add({ app: id, place: 'hook', hook: HOOK, page, error, message });
        return undefined;
      };
      if (!result.ok) return fail(result.error, result.message);
      const wrong = check(result.value);
      return wrong.length ? fail('invalid', wrong.join(' ')) : result.value;
    },
  };
}
