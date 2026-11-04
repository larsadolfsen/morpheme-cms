// The site's Worker's modules (packages/editor/worker/) for the checks, built as wrangler builds them: with the
// aliases in wrangler.jsonc (`@site/config`, `@site/worker`), in one bundle, so they share what they keep, as in the
// Worker (`cloudflare:workers`, which only the runtime has, is an empty stand-in). Used by packages/editor/scripts/check-worker.mjs and packages/editor/scripts/check-consent.mjs.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const ROOT = `${process.cwd()}/`;

/** The modules named (files in packages/editor/worker/), in that order. @param {...string} names */
export async function workerModules(...names) {
  const { experimental_readRawConfig } = await import('wrangler');
  const { alias = {} } = experimental_readRawConfig({ config: join(ROOT, 'wrangler.jsonc') }).rawConfig;
  const outfile = join(mkdtempSync(join(tmpdir(), 'worker-modules-')), 'worker.mjs');
  await build({
    stdin: {
      contents: names
        .map((name, i) => `export * as m${i} from ${JSON.stringify(fileURLToPath(new URL(`../worker/${name}`, import.meta.url)))};`)
        .join('\n'),
      resolveDir: ROOT,
      loader: 'js',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    alias: Object.fromEntries(Object.entries(alias).map(([from, to]) => [from, join(ROOT, to)])),
    // `cloudflare:workers` only exists in the Worker's runtime (the app Cookiescanner's Playwright asks for its `env`).
    plugins: [
      {
        name: 'cloudflare-workers-stub',
        setup(b) {
          b.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: 'cloudflare:workers', namespace: 'stub' }));
          b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const env = {};', loader: 'js' }));
        },
      },
    ],
    logLevel: 'silent',
  });
  const bundle = await import(pathToFileURL(outfile).href);
  return names.map((_, i) => bundle[`m${i}`]);
}
