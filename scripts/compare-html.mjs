// Compares the pages of two built sites, so a change in how the blocks are drawn can be shown to give the same site:
// npx interstellar compare-html <before> [after, else dist]. Build the site before the change into a folder of its own
// (npx astro build --outDir <before>), make the change, build again, and compare. What only differs in how it is
// written is the same: whitespace between tags, comments (also those React puts between two pieces of text), the order
// of a tag's attributes (and one written twice, in capitals, or with an empty value; an empty class; the order of the
// classes; the spaces in a style; Astro's markers of a component's own <style>, data-astro-cid-…, which a part drawn by
// React has not: check that the component's <style> styles only what it draws itself), a closing slash in a tag
// (<img />), the hash in the name of a bundled file (/_astro/…), and the number of an island's prefix, which counts the
// React components on the page before it. The scripts Astro bundles (type="module") are left out: what they do is
// checked in a browser. Says the first place each page differs.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = `${process.cwd()}/`;
const [before, after = 'dist'] = process.argv.slice(2).map((d) => resolve(ROOT, d));
if (!before || !existsSync(before) || !existsSync(after)) {
  console.error('Brug: npx interstellar compare-html <bygget site før> [bygget site efter, ellers dist]');
  process.exit(1);
}

const pages = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.html') && !f.startsWith('editor/') && statSync(join(dir, f)).isFile())
    .sort();

const attributes = (tag) =>
  tag.replace(/^<([a-zA-Z][\w-]*)(\s[^>]*?)?\s*\/?>$/, (all, name, attrs = '') => {
    // An attribute written twice is the first (as a browser reads it).
    const seen = new Set();
    const list = [...attrs.matchAll(/\s([^\s=]+)(?:="([^"]*)")?/g)]
      .map(([, n, v]) => [n.toLowerCase(), v])
      .filter(([n, v]) => !(n === 'class' && !v) && !n.startsWith('data-astro-cid-') && !seen.has(n) && seen.add(n))
      .map(([n, v]) => [
        n,
        n === 'style'
          ? v?.replace(/([:;])\s+/g, '$1').replace(/;$/, '')
          : n === 'class'
            ? v?.split(/\s+/).filter(Boolean).sort().join(' ')
            : v,
      ])
      .map(([n, v]) => (v ? `${n}="${v}"` : n));
    return `<${name}${list.length ? ` ${list.sort().join(' ')}` : ''}>`;
  });

const normal = (html) =>
  html
    .replace(/<script type="module"[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<astro-island\b[^>]*?\sprefix=")r\d+"/g, '$1r"')
    .replace(/\/_astro\/([\w.-]+?)\.[\w-]{8}\.(\w+)/g, '/_astro/$1.$2')
    .replace(/<[a-zA-Z][^<>]*>/g, attributes)
    .replace(/>\s+/g, '>')
    .replace(/\s+</g, '<')
    .replace(/\s+/g, ' ')
    .trim();

const was = new Set(pages(before));
const now = pages(after);
const problems = [];
for (const page of now) {
  if (!was.has(page)) {
    problems.push(`${page}: findes kun efter.`);
    continue;
  }
  was.delete(page);
  const a = normal(readFileSync(join(before, page), 'utf8'));
  const b = normal(readFileSync(join(after, page), 'utf8'));
  if (a === b) continue;
  let i = 0;
  while (a[i] === b[i]) i++;
  const around = (s) => s.slice(Math.max(0, i - 120), i + 200);
  problems.push(`${page}:\n  før:   …${around(a)}…\n  efter: …${around(b)}…`);
}
for (const page of was) problems.push(`${page}: findes kun før.`);

if (problems.length) {
  console.error(`${problems.length} af ${now.length} sider er ikke de samme (${relative(ROOT, before)} og ${relative(ROOT, after)}):\n`);
  console.error(problems.join('\n\n'));
  process.exit(1);
}
console.log(`De ${now.length} sider er de samme.`);
