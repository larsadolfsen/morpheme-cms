// Proof that the demo's /editor/ opens and saves without sign-in (plan "The demo editor without sign-in"): serves the built demo
// (`npm run build`, .morpheme/demo/site/dist) with NO fake of the Worker, so only the demo's service worker answers
// (scripts/demo-editor-sw.js). Opens the editor, edits a page, saves with Ctrl+S, reloads (the save stays), then resets (the
// demo's own text is back). `node scripts/check-demo-editor.mjs`.
import { chromium } from 'playwright';
import { serveBuilt } from './built-site.mjs';

const dist = `${process.cwd()}/.morpheme/demo/site/dist`;
const { server, site } = await serveBuilt(dist);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const problems = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'en-US' });
  await page.addInitScript(() => (window.demoEditorProof = true));
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  const commits = [];
  page.on('request', (r) => r.url().endsWith('/api/github/commit') && commits.push(r));
  const open = async (hash = '') => {
    await page.goto(`${site}/editor/${hash}`);
    // The first visit loads the service worker and reloads once.
    // The worker answers once the page has switched it on, and then the page loads again.
    await page.waitForFunction(
      () =>
        fetch('/api/github/head').then(
          (r) => r.ok,
          () => false,
        ),
      null,
      { timeout: 30_000 },
    );
    await page.waitForTimeout(1500);
    await page.reload();
  };
  const edit = async () => {
    await page.waitForSelector('.ProseMirror p', { timeout: 60_000 });
    await page.click('.ProseMirror p');
    await page.keyboard.press('End');
    await page.keyboard.type(' kept in the browser');
    await page.keyboard.press('Control+s');
  };
  const text = () => page.locator('.ProseMirror').first().innerText();
  await open('#src/content/pages/about.md');
  await edit();
  await page.waitForFunction(() => document.body.innerText.length > 0);
  for (let i = 0; i < 40 && !commits.length; i++) await page.waitForTimeout(250);
  if (!commits.length) problems.push('Ctrl+S sent no save');
  await page.waitForTimeout(500);
  await page.goto('about:blank');
  await open('#src/content/pages/about.md');
  await page.waitForSelector('.ProseMirror p', { timeout: 60_000 });
  if (!(await text()).includes('kept in the browser')) problems.push('the save is not there after a reload');
  await page.goto(`${site}/editor/?demo-reset`);
  await page.waitForURL(`${site}/editor/`, { timeout: 30_000 });
  await open('#src/content/pages/about.md');
  await page.waitForSelector('.ProseMirror p', { timeout: 60_000 });
  if ((await text()).includes('kept in the browser')) problems.push('the reset did not bring back the demo text');
} catch (e) {
  problems.push(String(e));
} finally {
  await browser.close();
  server.close();
}
if (problems.length) {
  console.error(`check:demo-editor failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('check:demo-editor: the editor opens, saves and resets without sign-in');
