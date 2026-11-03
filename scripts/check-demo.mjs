// The CMS's demo site (demo/, demo-site.mjs) still works with the CMS: its content checked by the editor's rules
// (check-content.mjs), each file the same after a save in the editor (editor-roundtrip.mjs) and the site built, with the
// standard theme, in a folder of its own. Run it when the CMS, the
// standard theme or the demo has changed: npx morpheme check:demo.
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { binOf } from './bin.mjs';
import { demoSite } from './demo-site.mjs';

const dir = demoSite();
try {
  const run = (args) => execFileSync(process.execPath, args, { cwd: dir, stdio: 'inherit' });
  run([fileURLToPath(new URL('check-content.mjs', import.meta.url))]);
  run([fileURLToPath(new URL('editor-roundtrip.mjs', import.meta.url))]);
  run([binOf('astro'), 'build', '--outDir', join(dir, 'dist')]);
  console.log('\nDemoen virker med CMS’et.');
} catch {
  console.error('\nDemoen virker ikke med CMS’et (se ovenfor).');
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
