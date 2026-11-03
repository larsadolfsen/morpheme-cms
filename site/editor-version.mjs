// A fingerprint of the editor's code (the package in packages/editor/, the themes in src/themes/ with their
// blocks, which one is in use (src/data/theme.json), the icon packs in packages/editor/icons/ and which one is chosen
// (src/data/icons.json), the apps in src/apps/ and the site's configuration in src/site/), made at
// build time. It is written both in the editor's page and in /editor/version.json, so an editor that is still open from before a change to it can tell that a
// newer one is out (packages/editor/src/deploy.ts). Only changes to the editor count: a save of the owner's also
// gives a new build, but the same fingerprint.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// This package, and the site's own (from its root, the working directory).
const DIRS = [fileURLToPath(new URL('..', import.meta.url)), 'src/themes', 'src/apps', 'src/site'];

export function editorVersion() {
  const hash = createHash('sha256');
  for (const dir of DIRS.filter((d) => existsSync(d)))
    for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && !relative(dir, e.parentPath).split(sep).includes('node_modules'))
      .map((e) => join(e.parentPath, e.name))
      .sort())
      hash.update(entry).update(readFileSync(entry));
  hash.update(readFileSync('src/data/theme.json'));
  if (existsSync('src/data/icons.json')) hash.update(readFileSync('src/data/icons.json'));
  return hash.digest('hex').slice(0, 12);
}
