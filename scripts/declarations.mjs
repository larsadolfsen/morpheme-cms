// The .d.mts files under a folder, which scripts/types.mjs removes before it writes them and after the package is
// packed. It never goes into node_modules or a folder whose name starts with a dot (.git, .claude and checkouts there).
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export const declarations = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return e.name === 'node_modules' || e.name.startsWith('.') ? [] : declarations(join(dir, e.name));
    return e.isFile() && e.name.endsWith('.d.mts') ? [join(dir, e.name)] : [];
  });
