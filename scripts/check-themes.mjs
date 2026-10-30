// Every theme installed (src/themes/) works as the site's theme, so the owner can swap to any of them: with each of the
// others than the one in use (src/data/theme.json), the editor's check of the content (check-content.mjs), the site
// built (in a folder of its own, so dist/ stays the theme in use's) and every screen of the editor opened
// (editor-screens.mjs). The theme in use is checked by the steps before (npm run build, npm run check:screens).
// src/data/theme.json is the theme being checked while it runs, and as it was after.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeTheme, installedThemes } from '@interstellarcms/cms/site/theme.mjs';

const ROOT = `${process.cwd()}/`;
const file = join(ROOT, 'src/data/theme.json');
const before = readFileSync(file, 'utf8');
const others = installedThemes().filter((t) => t !== activeTheme());
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });

const failed = [];
try {
  for (const theme of others) {
    console.log(`\nTemaet ${theme}:`);
    writeFileSync(file, `${JSON.stringify({ theme }, null, 2)}\n`);
    const out = mkdtempSync(join(tmpdir(), `theme-${theme}-`));
    try {
      run('node', [fileURLToPath(new URL('check-content.mjs', import.meta.url))]);
      run('npx', ['astro', 'build', '--outDir', out]);
      run('node', [fileURLToPath(new URL('editor-screens.mjs', import.meta.url)), out]);
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
console.log(`\n${others.length === 1 ? 'Temaet' : 'Temaerne'} ${others.join(', ')} virker også som sitets tema.`);
