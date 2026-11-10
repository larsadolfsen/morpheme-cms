// Bundles one app entry (a hook or the after-build step) into a single ESM string for the sandbox runner. Exposes
// ALLOWED_CORE and bundleEntry. Depends on esbuild; runs no app code, and refuses every import outside the allow-list.
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const lib = path.resolve(here, '..');
const SELF = '@app/self';
const SELF_NAMESPACE = 'app-self';

/** The core modules an app may import, and the file in this package each one is. */
export const ALLOWED_CORE = Object.freeze([
  '@morphemecms/cms/lib/colors',
  '@morphemecms/cms/lib/dynamic-colors',
  '@morphemecms/cms/lib/hooks',
]);
const CORE_FILES = new Map(ALLOWED_CORE.map((name) => [name, path.join(lib, `${name.split('/').pop()}.ts`)]));

/** @param {string} dir @param {string} file */
const inside = (dir, file) => file === dir || file.startsWith(dir + path.sep);

/** @param {string} file */
const real = (file) => {
  try {
    return realpathSync(file);
  } catch {
    return file;
  }
};

/** The plugin that applies the allow-list to the imports made by files in the app folder.
 * @param {string} appDir real path of the app folder @param {string} appId */
function allowList(appDir, appId) {
  return {
    name: 'app-allow-list',
    /** @param {import('esbuild').PluginBuild} b */
    setup(b) {
      b.onResolve({ filter: /.*/ }, async (args) => {
        // The entry itself, and the imports of the trusted core files, resolve as usual.
        if (args.kind === 'entry-point' || args.pluginData === 'inner') return undefined;
        if (!inside(appDir, real(args.importer))) return undefined;
        const spec = args.path;
        if (spec === SELF) return { path: SELF, namespace: SELF_NAMESPACE };
        if (spec.startsWith('.') || path.isAbsolute(spec)) {
          const r = await b.resolve(spec, { importer: args.importer, resolveDir: args.resolveDir, kind: args.kind, pluginData: 'inner' });
          if (r.errors.length) return { errors: r.errors };
          if (!inside(appDir, real(r.path))) return { errors: [{ text: `The import "${spec}" reaches outside the app folder` }] };
          return { path: r.path };
        }
        const core = ALLOWED_CORE.find((name) => spec === name || spec.replace(/\.[mc]?[jt]s$/, '') === name);
        if (core) return { path: /** @type {string} */ (CORE_FILES.get(core)) };
        return { errors: [{ text: `The import "${spec}" is not allowed in an app` }] };
      });
      b.onLoad({ filter: /.*/, namespace: SELF_NAMESPACE }, () => ({
        contents: `export default { id: ${JSON.stringify(appId)} };`,
        loader: 'js',
      }));
    },
  };
}

/** Bundles `entry` (a path in the app folder) to one ESM string. Never throws.
 * @param {string} appDir @param {string} entry @param {string} appId
 * @returns {Promise<{ ok: true; code: string } | { ok: false; message: string }>} */
export async function bundleEntry(appDir, entry, appId) {
  try {
    const dir = real(path.resolve(appDir));
    const file = real(path.join(dir, entry));
    if (!inside(dir, file) || file === dir) return { ok: false, message: `The entry "${entry}" is not in the app folder` };
    const result = await build({
      entryPoints: [file],
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'neutral',
      mainFields: ['module', 'main'],
      logLevel: 'silent',
      plugins: [allowList(dir, appId)],
    });
    const out = result.outputFiles?.[0];
    if (!out) return { ok: false, message: 'The bundle has no output' };
    return { ok: true, code: out.text };
  } catch (e) {
    const errors = /** @type {{ errors?: { text: string }[] }} */ (e).errors;
    const message = errors?.length ? errors.map((x) => x.text).join('\n') : e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
}
