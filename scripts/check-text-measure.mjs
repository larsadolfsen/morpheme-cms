// The page's text measure (owner, 16 Nov 2026: a paragraph is 40ch to 60ch wide, --block-text-measure-min/-max in blocks.css): on every built
// page of the site, at 1280 and 1580, a plain-text block (List, Segmented list, accordion, Steps, Blog posts as a list, Testimonials list)
// starts at the same left edge as the paragraph above it, no paragraph is wider than 60ch of its own font, and at 375 and 768 nothing scrolls sideways.
// Run in a site's folder after the site is built: node …/scripts/check-text-measure.mjs (check:screens:extra).
import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const dist = join(process.cwd(), 'dist');
const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
const server = createServer((req, res) => {
  let file = join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
}).listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://localhost:${server.address().port}`;
const pages = readdirSync(dist, { recursive: true })
  .filter((f) => f.endsWith('index.html') && !f.startsWith('editor') && !f.startsWith('_') && !f.includes('404'))
  .map((f) => `/${f.slice(0, -'index.html'.length)}`);

const BLOCKS = '.block-list, .block-accordion, .block-steps, .block-posts-rows, .block-testimonial-rows';
const problems = [];
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const width of [375, 768, 1280, 1580]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const path of pages) {
    await page.goto(base + path, { waitUntil: 'load' });
    const found = await page.evaluate(
      ({ BLOCKS, width }) => {
        const out = [];
        const left = (e) => Math.round(e.getBoundingClientRect().left);
        if (document.documentElement.scrollWidth > width) out.push(`scrolls sideways (${document.documentElement.scrollWidth}px)`);
        for (const root of document.querySelectorAll('.prose')) {
          const paragraphs = [...root.querySelectorAll(':scope > p')];
          // The lead (first paragraph, its own 52ch) is not the measure.
          for (const p of paragraphs.slice(1)) {
            // 60ch of the paragraph's own font, or of its text box's (a text box that sets the width for a paragraph in a smaller font).
            const ch60 = (parent) => {
              const probe = document.createElement('span');
              probe.style.cssText = 'position:absolute;visibility:hidden;width:60ch';
              parent.append(probe);
              const w = probe.getBoundingClientRect().width;
              probe.remove();
              return w;
            };
            const max = Math.max(ch60(p), ch60(root));
            if (p.getBoundingClientRect().width > max + 1)
              out.push(`a paragraph is ${Math.round(p.getBoundingClientRect().width)}px wide, more than 60ch (${Math.round(max)}px)`);
          }
        }
        for (const block of document.querySelectorAll(BLOCKS)) {
          let before = block.parentElement.previousElementSibling ?? block.previousElementSibling;
          for (let e = block; e && !before?.matches?.('p'); e = e.parentElement) before = e.previousElementSibling;
          if (!before?.matches?.('p') || !before.closest('.prose')) continue;
          if (left(block) !== left(before))
            out.push(`${block.className.toString().split(' ')[0]} starts at ${left(block)}px, the text above it at ${left(before)}px`);
        }
        return out;
      },
      { BLOCKS, width },
    );
    for (const f of found) problems.push(`${path} at ${width}px: ${f}`);
  }
  await page.close();
}
await browser.close();
server.close();
if (problems.length) {
  console.error(`The text measure is not kept:\n${[...new Set(problems)].join('\n')}`);
  process.exit(1);
}
console.log(`The text measure is kept on ${pages.length} pages at 375, 768, 1280 and 1580.`);
