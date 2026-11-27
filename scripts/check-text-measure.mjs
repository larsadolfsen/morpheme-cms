// The page's text measure (owner, 16 Nov 2026: a paragraph is 40ch to 60ch wide, --mo-comp-block-text-measure-min/-max in blocks.css): on every built
// page of the site, at 1280 and 1580, a plain-text block (List, Expandable list, accordion, Steps, Blog posts as a list, Testimonials list)
// starts at the left edge of the paragraph above it (a plain List or Expandable list: its layer 16px before it, its content on it; in a coloured section, the section's text), is in columns of at least 344px (Steps at most 720px wide), no paragraph is wider than 60ch of its own font, and at 375 and 768 nothing scrolls sideways.
// Run in a site's folder after the site is built: node …/scripts/check-text-measure.mjs (check:screens:extra).
import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { pathInside } from './static-path.mjs';
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
  let file = pathInside(dist, req.url);
  if (!file) return void res.writeHead(404).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
}).listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://localhost:${server.address().port}`;
const pages = readdirSync(dist, { recursive: true })
  .filter((f) => f.endsWith('index.html') && !f.startsWith('editor') && !f.startsWith('_') && !f.includes('404'))
  .map((f) => `/${f.slice(0, -'index.html'.length)}`);

const BLOCKS = '.mo-block-list, .mo-block-accordion, .mo-block-steps, .mo-block-posts__rows, .mo-block-testimonials__testimonial-rows';
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
        for (const root of document.querySelectorAll('.mo-prose')) {
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
          // Steps is one column at most 720px wide. The rows of a list are columns of at least 344px as far as they fit the list's own width:
          // one below 720px, two from 720px, three from 1080px .
          const w = Math.round(block.getBoundingClientRect().width);
          const name = block.className.toString().split(' ')[0];
          if (block.matches('.mo-block-steps')) {
            if (w > 721) out.push(`${name} is ${w}px wide, more than 720px`);
          } else {
            const grid = block.matches('.mo-block-posts__rows') ? block.querySelector('.mo-post-list') : block;
            const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
            // A post row has a thumbnail: its columns are at least 480px (two from 984px).
            // The setting Columns is off (data-columns="one"): one column at most 720px wide, whatever the width.
            const one = block.matches("[data-columns='one']");
            const wanted = one ? 1 : block.matches('.mo-block-posts__rows') ? (w >= 984 ? 2 : 1) : w >= 1080 ? 3 : w >= 720 ? 2 : 1;
            if (columns !== wanted) out.push(`${name} has ${columns} columns at ${w}px${one ? ' with Columns off' : ''}, not ${wanted}`);
            if (one && w > 721) out.push(`${name} with Columns off is ${w}px wide, more than 720px`);
          }
          if (!before?.matches?.('p') || !before.closest('.mo-prose')) continue;
          // The text edge the block lines up with. A block in a coloured text section (a panel with its own padding) lines up with the text inside the
          // panel, not with a paragraph above the panel, so when the paragraph found is outside the block's section, the edge is the section's content box.
          const section = block.closest('.mo-text-section');
          let edge = left(before);
          let edgeName = 'the text above it';
          if (section && !section.contains(before)) {
            edge = Math.round(section.getBoundingClientRect().left + parseFloat(getComputedStyle(section).paddingLeft));
            edgeName = "the section's text";
          }
          // Owner, 21 Nov 2026 (replaces the 16 Nov rule): Material 3 Lists › Specs prints 16 dp leading and trailing space inside the item's container.
          // The layer of a plain List or Expandable list (no drawn container) reaches that 16px past the text column on each side at every width
          // (--mo-comp-block-list-layer-room, tokens/lists/comp/list.css), so its box starts 16px before the text and its content (leading icon or text)
          // is on the text's edge. In the segmented design the box itself is on the text's edge.
          const bleeds = block.matches('.mo-block-list:not(.mo-list__segmented), .mo-block-accordion:not(.mo-block-accordion__segmented)');
          const name2 = block.className.toString().split(' ')[0];
          if (left(block) !== edge - (bleeds ? 16 : 0))
            out.push(
              `${name2} starts at ${left(block)}px, ${edgeName} at ${edge}px${bleeds ? ' (the layer is 16px wider, M3 Lists › Specs)' : ''}`,
            );
          if (bleeds && block.matches('.mo-block-list')) {
            const lead =
              block.querySelector('.mo-list__item-leading-icon, .mo-list__item-leading') ?? block.querySelector('.mo-list__item-content');
            if (lead && left(lead) !== edge) out.push(`${name2}'s row content starts at ${left(lead)}px, ${edgeName} at ${edge}px`);
          }
        }
        return out;
      },
      { BLOCKS, width },
    );
    for (const f of found) problems.push(`${path} at ${width}px: ${f}`);
    // The demo's Lists page has a List with the setting Columns off and one with it on (the default), so both values are checked.
    if (path === '/blocks/lists/') {
      const both = await page.evaluate(() => [
        !!document.querySelector(".mo-block-list[data-columns='one']"),
        !!document.querySelector('.mo-block-list:not([data-columns])'),
      ]);
      if (!both[0] || !both[1]) problems.push(`/blocks/lists/ at ${width}px: it needs a List with Columns off and one with Columns on`);
    }
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
