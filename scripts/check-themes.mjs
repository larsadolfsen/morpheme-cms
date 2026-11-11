// Every theme installed (src/themes/) works as the site's theme, so the owner can swap to any of them: with each of the
// others than the one in use (src/data/theme.json), the editor's check of the content (check-content.mjs), the site
// built (in a folder of its own, so dist/ stays the theme in use's) and every screen of the editor opened
// (editor-screens.mjs). The theme in use is checked by the steps before (npm run build, npm run check:screens).
// src/data/theme.json is the theme being checked while it runs, and as it was after. The theme in use too builds once with
// a test block beside the text of the pages (check-side.mjs), as each of the others does after its screens.
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeTheme, installedThemes } from '@morphemecms/cms/site/theme.mjs';
import { binOf } from './bin.mjs';
import { buildOutDir } from './build-out.mjs';
import { checkSide } from './check-side.mjs';

const ROOT = `${process.cwd()}/`;
const file = join(ROOT, 'src/data/theme.json');
const before = readFileSync(file, 'utf8');
const others = installedThemes().filter((t) => t !== activeTheme());
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });

const failed = [];
const side = (theme) => {
  try {
    console.log(`
Kolonnen ved siden af teksten med temaet ${theme}:`);
    checkSide(ROOT);
  } catch (error) {
    console.error(error.message);
    failed.push(`${theme} (kolonnen)`);
  }
};
try {
  side(activeTheme());
  for (const theme of others) {
    console.log(`\nTemaet ${theme}:`);
    writeFileSync(file, `${JSON.stringify({ theme }, null, 2)}\n`);
    const out = buildOutDir(ROOT, `theme-${theme}`);
    try {
      run(process.execPath, [fileURLToPath(new URL('check-content.mjs', import.meta.url))]);
      run(process.execPath, [binOf('astro'), 'build', '--outDir', out]);
      run(process.execPath, [fileURLToPath(new URL('editor-screens.mjs', import.meta.url)), out]);
      checkSide(ROOT);
    } catch {
      failed.push(theme);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }
} finally {
  writeFileSync(file, before);
}

if (failed.length) {
  console.error(`\nDet virker ikke med ${failed.length === 1 ? 'temaet' : 'temaerne'} ${failed.join(', ')} (se ovenfor).`);
  process.exit(1);
}
if (!others.length) console.log('Der er ingen andre temaer installeret i src/themes/.');
else console.log(`\n${others.length === 1 ? 'Temaet' : 'Temaerne'} ${others.join(', ')} also work as the site's theme.`);
