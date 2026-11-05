// Type-checks the package's whole TS source in the demo site, with the site's own tsc, as a site that has it from npm does.
// Run by `npm run check:site-types`, after the build (.morpheme/demo/site, node_modules/@morphemecms/cms). Wiring only.
import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { binOf } from './bin.mjs';
import { siteTypesConfig } from './site-types.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = join(root, '.morpheme/demo/site');
const config = join(site, 'tsconfig.package.json');
const packageDir = relative(site, join(root, 'node_modules/@morphemecms/cms')).replaceAll('\\', '/');

writeFileSync(config, JSON.stringify(siteTypesConfig(packageDir), null, 2));
try {
  execFileSync(process.execPath, [binOf('typescript', 'tsc', site), '--noEmit', '-p', 'tsconfig.package.json'], {
    cwd: site,
    stdio: 'inherit',
  });
} catch (error) {
  console.error('The package source does not type-check as a site type-checks it: sites will fail the same way.');
  process.exitCode = error.status ?? 1;
} finally {
  rmSync(config, { force: true });
}
