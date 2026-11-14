// The system's test page (core-blocks-page.mjs) on a temporary copy of the site (test-site.mjs): it builds with every core block; it
// is marked `<meta name="robots" content="noindex, nofollow">` by the CMS's own SEO settings; it is not in the sitemap, the RSS feed
// or linked from any other page; and the site's own folder has no trace of it afterwards (nothing written there, the copy deleted).
// Run in a site's folder after the site is built: node …/scripts/check-test-page.mjs (check:screens:extra).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CORE_PAGE_FILE, CORE_PAGE_ID, coreBlockTypes, coreBlocksPage } from './core-blocks-page.mjs';
import { withTestSite } from './test-site.mjs';

const root = `${process.cwd()}/`;
const problems = [];
const text = coreBlocksPage();
const types = coreBlockTypes();
// Blocks that draw what the site has (its images, posts, testimonials): on a site without any they draw nothing, which is no fault.
const SITE_DATA = ['imagegrid', 'posts', 'testimonials'];
const mustDraw = types.filter((t) => !SITE_DATA.includes(t)).length;
for (const type of types) if (!text.includes(`data-block="${type}"`)) problems.push(`the test page has no "${type}" block`);

const found = await withTestSite(root, { [CORE_PAGE_FILE]: text }, ({ copy, dist }) => {
  const files = readdirSync(dist, { recursive: true, withFileTypes: true }).filter((e) => e.isFile());
  const read = (e) => readFileSync(join(e.parentPath, e.name), 'utf8');
  const page = join(dist, CORE_PAGE_ID, 'index.html');
  if (!existsSync(page)) return { missing: true };
  const html = readFileSync(page, 'utf8');
  const address = `/${CORE_PAGE_ID}/`;
  return {
    robots: /<meta name="robots" content="noindex, nofollow"\s*\/?>/.test(html),
    canonical: /rel="canonical"/.test(html),
    inSitemap: files.filter((e) => /^sitemap.*\.xml$/.test(e.name) && read(e).includes(address)).map((e) => e.name),
    inRss: files.filter((e) => e.name === 'rss.xml' && read(e).includes(address)).map((e) => e.name),
    linkedFrom: files
      .filter((e) => e.name.endsWith('.html') && join(e.parentPath, e.name) !== page && read(e).includes(`href="${address}"`))
      .map((e) => join(e.parentPath, e.name).slice(dist.length)),
    blocksDrawn: new Set([...html.matchAll(/class="[^"]*\b(block-[a-z]+)/g)].map((m) => m[1])).size,
    copy,
  };
});
if (found.missing) problems.push(`the test page was not built (no ${CORE_PAGE_ID}/index.html)`);
else {
  if (!found.robots)
    problems.push(
      'the built test page has no <meta name="robots" content="noindex, nofollow">: "noindex" and "nofollow" in its front matter do not reach the page',
    );
  if (found.inSitemap.length) problems.push(`the test page is in the sitemap (${found.inSitemap.join(', ')}) although it is noindex`);
  if (found.inRss.length) problems.push('the test page is in the RSS feed');
  if (found.linkedFrom.length)
    problems.push(`the test page is linked from ${found.linkedFrom.slice(0, 3).join(', ')}: it must be in no list`);
  if (found.blocksDrawn < mustDraw)
    problems.push(`the built test page draws ${found.blocksDrawn} kinds of block, at least ${mustDraw} are expected`);
  if (existsSync(found.copy)) problems.push('the temporary copy of the site was not deleted');
}
// The site itself: nothing of the page, in its folder or in a built folder of its own.
if (existsSync(join(root, CORE_PAGE_FILE))) problems.push(`${CORE_PAGE_FILE} was written to the site's own folder`);
const left = join(root, '.astro', 'test-site');
if (existsSync(left) && readdirSync(left).length) problems.push('a temporary copy is left in .astro/test-site/');

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log(
  `The test page builds on a temporary copy with all ${types.length} core blocks, is noindex and nofollow, is in no sitemap, feed or list, and leaves nothing in the site.`,
);
