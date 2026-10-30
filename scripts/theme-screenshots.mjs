// Takes the pictures of the site in each theme installed (src/themes/), shown on the theme's page in the editor
// ("Udseende" › "Temaer" › the theme, ThemePage in packages/editor/src/Library.tsx): the site built with the theme (in a
// folder of its own, so dist/ stays the theme in use's), opened on a phone, and the top of each page in SHOTS taken, into
// src/themes/<theme>/screenshots/<n>-<key>.jpg (src/site/theme.ts reads them; their names in the editor are
// t.library.themeShots[key]). Without the cookie question and the pop-ups, which would cover the page.
// src/data/theme.json is each theme while it runs, and as it was after. Run it again when the site or a theme has
// changed much: npx interstellar theme-screenshots (or with the themes to take, by folder: … standard material).
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { installedThemes, themeFolder } from '@interstellarcms/cms/site/theme.mjs';
import { binOf } from './bin.mjs';

const ROOT = `${process.cwd()}/`;
const standardPages = JSON.parse(readFileSync(join(ROOT, 'src/data/standard-pages.json'), 'utf8'));
const file = join(ROOT, 'src/data/theme.json');
const before = readFileSync(file, 'utf8');
const themes = process.argv.length > 2 ? process.argv.slice(2) : installedThemes();
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });

/** The pictures, in their order: the key (its name in the editor), the page and whether it is in dark mode. */
const SHOTS = [
  { key: 'front', path: '/' },
  { key: 'front-dark', path: '/', dark: true },
  { key: 'blog', path: '/blog/' },
  { key: 'contact', path: standardPages.contact },
];

// The built site, as the host serves it: a folder is its index.html.
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
function serve(dir) {
  const server = createServer((req, res) => {
    let path = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
    if (!existsSync(path)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(readFileSync(path));
  });
  return new Promise((done) => server.listen(0, () => done(server)));
}

// CHROMIUM_PATH: another Chromium than Playwright's own (one installed for another version of Playwright).
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  for (const theme of themes) {
    console.log(`\nTemaet ${theme}:`);
    writeFileSync(file, `${JSON.stringify({ theme }, null, 2)}\n`);
    const out = mkdtempSync(join(tmpdir(), `theme-${theme}-`));
    try {
      run(process.execPath, [binOf('astro'), 'build', '--outDir', out]);
      const server = await serve(out);
      const site = `http://localhost:${server.address().port}`;
      const folder = join(ROOT, `${themeFolder(theme)}/screenshots`);
      rmSync(folder, { recursive: true, force: true });
      mkdirSync(folder, { recursive: true });
      for (const [i, shot] of SHOTS.entries()) {
        const page = await browser.newPage({
          viewport: { width: 390, height: 520 },
          deviceScaleFactor: 2,
          locale: 'da-DK',
          colorScheme: shot.dark ? 'dark' : 'light',
        });
        await page.goto(`${site}${shot.path}`, { waitUntil: 'networkidle' });
        await page.addStyleTag({ content: '#cookie-consent, dialog[data-popup] { display: none !important; }' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(800);
        await page.screenshot({ path: join(folder, `${i + 1}-${shot.key}.jpg`), type: 'jpeg', quality: 80 });
        await page.close();
      }
      server.close();
      console.log(`${SHOTS.length} billeder i ${themeFolder(theme)}/screenshots/.`);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }
} finally {
  writeFileSync(file, before);
  await browser.close();
}
