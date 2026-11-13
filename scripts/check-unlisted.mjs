// A blog post that is not on the blog (`unlisted: true`, lib/status.mjs) is kept out of every list of posts but is still a page of
// the site: it opens at its address, is open to search engines and is in the sitemap. Checked on the built site.
// Run from a folder with a built site: npm run build, then `cd .morpheme/demo/site && node ../../../scripts/check-unlisted.mjs`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = `${process.cwd()}/`;
const dist = join(ROOT, 'dist');
const read = (file) => (existsSync(join(dist, file)) ? readFileSync(join(dist, file), 'utf8') : '');
const folder = join(ROOT, 'src/content/blog');
const unlisted = readdirSync(folder)
  .filter((f) => f.endsWith('.md') && /^unlisted: *"?true"?\s*$/m.test(readFileSync(join(folder, f), 'utf8').split(/^---\s*$/m)[1] ?? ''))
  .map((f) => f.slice(0, -3));
const fail = [];
if (!unlisted.length) fail.push('no post with `unlisted: true` to check');

const lists = ['index.html', '404.html', 'rss.xml', 'blog/index.html'];
for (const dir of existsSync(join(dist, 'blog/tags')) ? readdirSync(join(dist, 'blog/tags')) : [])
  lists.push(`blog/tags/${dir}/index.html`);
const sitemap = readdirSync(dist)
  .filter((f) => /^sitemap-\d+\.xml$/.test(f))
  .map(read)
  .join('\n');
for (const slug of unlisted) {
  for (const list of lists) if (read(list).includes(`/${slug}/`)) fail.push(`${slug} is in ${list}`);
  const own = read(`${slug}/index.html`);
  if (!own) fail.push(`${slug} does not open at its address`);
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(own)) fail.push(`${slug} is hidden from search engines`);
  if (!sitemap.includes(`/${slug}/<`)) fail.push(`${slug} is not in the sitemap`);
}
if (fail.length) {
  console.error(`A post that is not on the blog is wrong:\n- ${fail.join('\n- ')}`);
  process.exit(1);
}
console.log(`${unlisted.length} post(s) not on the blog: out of every list, open at their address, in the sitemap.`);
