// The CMS's demo site (demo/, demo-site.mjs) still works with the CMS: its content checked by the editor's rules
// (check-content.mjs), each file the same after a save in the editor (editor-roundtrip.mjs) and the site built, with the
// standard theme, in a folder of its own. Run it when the CMS, the
// standard theme or the demo has changed: npx morpheme check:demo.
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { binOf } from './bin.mjs';
import { demoSite } from './demo-site.mjs';
import {
  demoBlockPages,
  demoBlocksPage,
  demoBlocksProblems,
  editorBlocks,
  exampleProblems,
  pageProblems,
  styleProblems,
} from './demo-blocks.mjs';

const blockProblems = [
  ...demoBlocksProblems(demoBlocksPage(), editorBlocks()),
  ...styleProblems(demoBlocksPage()),
  ...exampleProblems(demoBlocksPage()),
  ...pageProblems(demoBlockPages()),
];
if (blockProblems.length) {
  console.error(blockProblems.join('\n'));
  console.error("\nThe demo's Blocks pages and the editor disagree (scripts/demo-blocks.mjs).");
  process.exit(1);
}

const dir = demoSite();
try {
  const run = (args) => execFileSync(process.execPath, args, { cwd: dir, stdio: 'inherit' });
  run([fileURLToPath(new URL('check-content.mjs', import.meta.url))]);
  run([fileURLToPath(new URL('editor-roundtrip.mjs', import.meta.url))]);
  run([binOf('astro'), 'build', '--outDir', join(dir, 'dist')]);
  // The built home page carries its critical CSS (beasties is a dev dependency, so CI has it), with the theme's fonts: without
  // @font-face inline the first paint uses the fallback font and the page shifts when the real one arrives (lib/criticalCss.mjs).
  const home = readFileSync(join(dir, 'dist', 'index.html'), 'utf8');
  const critical = /<style data-critical>([\s\S]*?)<\/style>/.exec(home)?.[1];
  if (!critical) throw new Error('The built home page has no critical CSS (<style data-critical>).');
  if (!critical.includes('@font-face')) throw new Error("The home page's critical CSS has no @font-face.");
  console.log('\nThe demo works with the CMS.');
} catch (error) {
  if (error?.message) console.error(error.message);
  console.error('\nThe demo does not work with the CMS (see above).');
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
