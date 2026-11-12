// The types of this package's JavaScript modules, for a site that has it from npm (tsconfig.types.json): `write` before
// it is packed (prepack), `clean` after (postpack), so they are never left beside the code they were made from.
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { binOf } from './bin.mjs';
import { declarations } from './declarations.mjs';

const PACKAGE = fileURLToPath(new URL('..', import.meta.url));

for (const file of declarations(PACKAGE)) rmSync(file);
if (process.argv[2] === 'write')
  execFileSync(process.execPath, [binOf('typescript', 'tsc', PACKAGE), '-p', join(PACKAGE, 'tsconfig.types.json')], {
    cwd: PACKAGE,
    stdio: 'inherit',
  });
