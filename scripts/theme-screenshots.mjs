// Takes the pictures of the site in each theme installed (src/themes/), shown on the theme's page in the editor
// ("Appearance" › "Themes" › the theme, ThemePage in packages/editor/src/Library.tsx): the CMS's demo site (demo/, never the
// site's own content) built with the theme (demo-site.mjs, in a folder of its own), opened on a phone, and the top of each
// page in SHOTS taken, into the theme's screenshots/<n>-<key>.jpg (the standard theme's in this package's theme/, another's
// in src/themes/<theme>/; packages/editor/src/themes.ts reads them; their names in the editor are t.library.themeShots[key]). Without
// the cookie question and the pop-ups, which would cover the page. Run it again when a theme or the demo has changed much:
// npx morpheme theme-screenshots (or with the themes to take, by folder: … saturn material).
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { installedThemes, themeFolder } from '@morphemecms/cms/site/theme.mjs';
import { binOf } from './bin.mjs';
import { demoSite } from './demo-site.mjs';

const ROOT = `${process.cwd()}/`;
const themes = process.argv.length > 2 ? process.argv.slice(2) : installedThemes();
const standardPages = JSON.parse(readFileSync(new URL('../demo/src/data/standard-pages.json', import.meta.url), 'utf8'));

/** The pictures, in their order: the key (its name in the editor), the page and whether it is in dark mode. */
const SHOTS = [
  { key: 'front', path: '/' },
  { key: 'front-dark', path: '/', dark: true },
  { key: 'blog', path: '/blog/' },
  { key: 'contact', path: standardPages.contact },
];

// The built site, as the host serves it: a folder is its index.html.
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};
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
    console.log(`\nTheme ${theme}:`);
    const demo = demoSite(theme);
    const out = join(demo, 'dist');
    try {
      execFileSync(process.execPath, [binOf('astro'), 'build', '--outDir', out], { cwd: demo, stdio: 'inherit' });
      const server = await serve(out);
      const site = `http://localhost:${server.address().port}`;
      const folder = join(ROOT, `${themeFolder(theme)}/screenshots`);
      rmSync(folder, { recursive: true, force: true });
      mkdirSync(folder, { recursive: true });
      for (const [i, shot] of SHOTS.entries()) {
        const page = await browser.newPage({
          viewport: { width: 390, height: 520 },
          deviceScaleFactor: 2,
          // The demo's language (its src/site/config.ts).
          locale: 'en-US',
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
      console.log(`${SHOTS.length} pictures in ${themeFolder(theme)}/screenshots/.`);
    } finally {
      rmSync(demo, { recursive: true, force: true });
    }
  }
} finally {
  await browser.close();
}
