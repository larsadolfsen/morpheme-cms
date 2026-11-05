// Takes the pictures each app is shown with on its page and in the app store (AppAbout in
// packages/editor/src/AppList.tsx): the few its index.ts picks to give an idea of it (`screenshots`, AppShot in
// packages/editor/src/store.ts), as a theme's are, on a phone, in the standard theme with blue colours and with made-up
// content only, never the site's: its blocks and kinds as "Udseende" › "Dele" › "Apps" draws them with the examples,
// its lists, its settings (with the made-up `values` of the picture) and its own page in the editor, into
// src/apps/<app>/screenshots/<n>-<what>.jpg (shotFile). The site is built in a folder of its own with the theme and the
// colours (src/data/theme.json and colors.json as they were after), and the editor has every app installed, with GitHub
// answered from the files in this repository (built-site.mjs) but the apps' settings, so nothing is saved. Run it when
// an app's pictures, or how what they show looks, have changed: npx morpheme app-screenshots (or with the apps to
// take, by their folders: … calendly mailchimp). Then, for an app from the app store, raise its version, commit and run
// npm run store:release.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { aliases, themePlugin } from '@morphemecms/cms/site/theme.mjs';
import { appFoldersPlugin } from '@morphemecms/cms/lib/apps.mjs';
import { binOf } from './bin.mjs';
import { openEditor, serveBuilt } from './built-site.mjs';

const ROOT = `${process.cwd()}/`;
const APPS = join(ROOT, 'src/apps');
const THEME = join(ROOT, 'src/data/theme.json');
const COLORS = join(ROOT, 'src/data/colors.json');
/** The colours the pictures are taken with: Material's dynamic colour from a blue. */
const BLUE = { source: '#1a73e8', variant: 'tonalSpot', contrast: 'standard' };

const ids = process.argv.length > 2 ? process.argv.slice(2) : readdirSync(APPS).filter((id) => existsSync(join(APPS, id, 'index.ts')));

// The pictures each app picks, read as store-release.mjs does, in their order. `part`: its drawing under "Dele" ›
// "Blokke" or the list's screen (`parts`: #appearance/parts/blocks, #appearance/parts/list/<list>) by the part's name; `editor`: a screen of the editor (`at`: from the top of what is
// there). And each app's settings as the pictures show them: those it starts with, and the made-up ones of its picture.
const vite = await createServer({
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  plugins: [themePlugin(), appFoldersPlugin(ROOT)],
  resolve: { alias: aliases() },
  server: { middlewareMode: true, hmr: false, ws: false },
});
const shots = {};
const settings = {};
let blue;
try {
  const load = (path) => vite.ssrLoadModule(path);
  const { partScreens } = await load('@site/editor');
  const { companyParts } = await load('@site/company');
  const { colorRoles } = await load('@site/colors');
  const { dynamicColors } = await load('@morphemecms/cms/lib/dynamic-colors.ts');
  const { shotFile } = await load('@morphemecms/cms/src/store.ts');
  blue = { ...dynamicColors(BLUE, colorRoles), dynamic: BLUE };
  for (const id of ids) {
    const app = (await load(`/src/apps/${id}/index.ts`)).default;
    settings[id] = { ...app.settings?.values };
    shots[id] = [];
    for (const [i, shot] of (app.screenshots ?? []).entries()) {
      const [what, key, n] = shot.shows.split(':');
      const name = shotFile(i, shot.shows);
      if (what === 'blok')
        shots[id].push({
          name,
          parts: 'blocks',
          part: (await load(`/src/apps/${id}/blocks/${key}/index.tsx`)).default.label,
        });
      else if (what === 'slags') {
        const kind = app.kinds[key];
        const variant = kind.variants?.[Number(n)];
        shots[id].push({ name, parts: `list/${key}`, part: variant ? `${kind.label} · ${variant.label}` : kind.label });
      } else if (what === 'liste') shots[id].push({ name, editor: `list/${key}` });
      else if (what === 'indstillinger') {
        // Where they are, as settingsRoute in AppList.tsx: on the screen or the part of "Virksomheden" with its kind.
        const home = app.category && partScreens.find((s) => s.apps?.includes(app.category));
        const company = app.category && companyParts.find((p) => p.parts && p.apps?.includes(app.category));
        const at = home ? home.id : company ? `company/${company.id}` : `apps/${id}`;
        shots[id].push({ name, editor: `${at}/${home || company ? id : 'settings'}` });
        Object.assign(settings[id], shot.values);
      } else shots[id].push({ name, editor: `apps/${id}`, at: `[data-app-page="${id}"]` });
    }
  }
} finally {
  await vite.close();
}

// A made-up scan of a made-up site for Cookiescanner's page (its part of the Worker is not here).
const day = 24 * 60 * 60 * 1000;
const seen = (visitor) => ({ visitor, step: 'answer' });
const SCAN = {
  scan: {
    at: new Date(Date.now() - day).toISOString(),
    origin: 'https://eksempel.dk',
    cookies: [
      { name: '_ga', domain: '.eksempel.dk', days: 400, seen: seen('statistics') },
      { name: '_ga_ABC1234567', domain: '.eksempel.dk', days: 400, seen: seen('statistics') },
      { name: '_gcl_au', domain: '.eksempel.dk', days: 90, seen: seen('marketing') },
    ],
    storage: [],
  },
  begun: null,
  problems: [],
};

const before = { theme: readFileSync(THEME, 'utf8'), colors: readFileSync(COLORS, 'utf8') };
const out = mkdtempSync(join(tmpdir(), 'app-screenshots-'));
let browser;
try {
  writeFileSync(THEME, `${JSON.stringify({ theme: 'saturn' }, null, 2)}\n`);
  writeFileSync(COLORS, `${JSON.stringify(blue, null, 2)}\n`);
  execFileSync(process.execPath, [binOf('astro'), 'build', '--outDir', out], { cwd: ROOT, stdio: 'inherit' });
  const { server, site } = await serveBuilt(out);
  // CHROMIUM_PATH: another Chromium than Playwright's own (one installed for another version of Playwright).
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const phone = { width: 390, height: 520 };
  const editor = await browser.newPage({ viewport: phone, deviceScaleFactor: 2, locale: 'da-DK' });
  await editor.route(/\/api\/cookiescanner\//, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(SCAN) }));
  // Every app installed, so each has its settings, its lists and its page; and its settings made up.
  const installed = readdirSync(APPS).sort();
  await openEditor(editor, site, {
    'src/data/apps.json': `${JSON.stringify({ installed }, null, 2)}\n`,
    ...Object.fromEntries(Object.entries(settings).map(([id, values]) => [`src/data/apps/${id}.json`, JSON.stringify(values)])),
  });
  // Without the animations, so each picture is taken as it ends.
  await editor.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
  const go = async (hash) => {
    await editor.evaluate((h) => (location.hash = h), hash);
    await editor.waitForTimeout(1500);
  };

  for (const id of ids) {
    const folder = join(APPS, id, 'screenshots');
    rmSync(folder, { recursive: true, force: true });
    if (!shots[id].length) continue;
    mkdirSync(folder, { recursive: true });
    for (const [i, shot] of shots[id].entries()) {
      const options = { path: join(folder, shot.name), type: 'jpeg', quality: 80 };
      if (shot.part) {
        await go(`appearance/parts/${shot.parts}`);
        // Tall enough for the whole drawing, under the screen's top bar.
        await editor.setViewportSize({ width: phone.width, height: 1600 });
        const drawing = editor.locator(`section[data-part="${shot.part}"] > :last-child`).first();
        await drawing.evaluate((el) => el.scrollIntoView({ block: 'center' }));
        await editor.waitForTimeout(500);
        await drawing.screenshot(options);
        await editor.setViewportSize(phone);
      } else {
        await go(shot.editor);
        await editor.evaluate((at) => {
          const el = at && document.querySelector(at);
          window.scrollTo(0, el ? el.getBoundingClientRect().top + window.scrollY - 80 : 0);
        }, shot.at);
        await editor.waitForTimeout(300);
        await editor.screenshot(options);
      }
    }
    console.log(`${shots[id].length} billeder i src/apps/${id}/screenshots/.`);
  }
  server.close();
} finally {
  await browser?.close();
  writeFileSync(THEME, before.theme);
  writeFileSync(COLORS, before.colors);
  rmSync(out, { recursive: true, force: true });
}
