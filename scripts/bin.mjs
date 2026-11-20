// A package's command (its package.json's `bin`), found from `from` (the site's root, or this package's), to run with
// Node: npx is npx.cmd on Windows, which execFileSync cannot start without a shell.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** @param {string} pkg @param {string} [name] @param {string} [from] */
export const binOf = (pkg, name = pkg, from = process.cwd()) => {
  const manifest = createRequire(join(from, 'package.json')).resolve(`${pkg}/package.json`);
  const { bin } = JSON.parse(readFileSync(manifest, 'utf8'));
  return join(dirname(manifest), typeof bin === 'string' ? bin : bin[name]);
};
