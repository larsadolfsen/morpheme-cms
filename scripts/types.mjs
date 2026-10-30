// The types of this package's JavaScript modules, for a site that has it from npm (tsconfig.types.json): `write` before
// it is packed (prepack), `clean` after (postpack), so they are never left beside the code they were made from.
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { binOf } from './bin.mjs';

const PACKAGE = fileURLToPath(new URL('..', import.meta.url));

const declarations = () =>
  readdirSync(PACKAGE, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.d.mts') && !relative(PACKAGE, e.parentPath).split(sep).includes('node_modules'))
    .map((e) => join(e.parentPath, e.name));

for (const file of declarations()) rmSync(file);
if (process.argv[2] === 'write')
  execFileSync(process.execPath, [binOf('typescript', 'tsc', PACKAGE), '-p', join(PACKAGE, 'tsconfig.types.json')], {
    cwd: PACKAGE,
    stdio: 'inherit',
  });
