// /editor/build-installs.json: the store themes and apps the update's build replaced by newer versions (`morpheme ci-build`,
// scripts/build-install.mjs), which the site's git does not have yet: `{ cms, installs: [{ kind, id, label, from, version, files }] }`.
// The editor commits them on its first start (src/AppList.tsx commitBuildInstalls); a build with none serves `{ installs: [] }`.
import fs from 'node:fs';
import path from 'node:path';

// From where the build runs, as the other pages here; the same path as INSTALLS_PATH in scripts/build-install.mjs.
const FILE = path.resolve('.morpheme/build-installs.json');

export function GET() {
  return new Response(fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '{"installs":[]}', {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
