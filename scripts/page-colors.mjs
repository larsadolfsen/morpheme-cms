// After the build: each page's colours as it was built, in dist/editor/page-colors.json, for "Farver" › "Sider" in the
// editor (Colors.tsx), while an app changes the pages' colours (hooks/page-colors.ts):
// { pages: [{ path, light: { bg, … }, dark: { … }, app?, picture? }] }, by address, read from the <style> Base.astro
// writes them in (data-page-colors, colorsCss in packages/editor/lib/colors.ts: light mode on :root, dark mode on
// :root[data-theme='dark']), with the app that changed them and the picture they came from (data-app, data-picture;
// packages/editor/site/pageColors.ts), without them for a page with the site's own. Without the new versions under /ny/ and the editor.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPreview } from '@morphemecms/cms/site/noindex.mjs';

const ROOT = `${process.cwd()}/`;
const DIST = join(ROOT, process.argv[2] ?? 'dist');
const STYLE = /<style\b([^>]*\bdata-page-colors\b[^>]*)>([^<]*)<\/style>/;
const LIGHT = /:root\{([^}]*)\}/;
const DARK = /:root\[data-theme='dark'\]\{([^}]*)\}/;

const attribute = (attributes, name) => {
  const value = new RegExp(`\\b${name}="([^"]*)"`).exec(attributes)?.[1];
  return value && value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
};
const declarations = (css) =>
  Object.fromEntries([...(css ?? '').matchAll(/--([a-z][a-z0-9-]*):(#[0-9a-f]{6});/gi)].map(([, name, value]) => [name, value]));

const pages = [];
for (const file of readdirSync(DIST, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('index.html'))) {
  const path = `/${file.replace(/index\.html$/, '')}`;
  if (path.startsWith('/editor/') || isPreview(path)) continue;
  const style = STYLE.exec(readFileSync(join(DIST, file), 'utf8'));
  if (!style) continue;
  const [, attributes, css] = style;
  const app = attribute(attributes, 'data-app');
  const picture = attribute(attributes, 'data-picture');
  pages.push({
    path,
    light: declarations(LIGHT.exec(css)?.[1]),
    dark: declarations(DARK.exec(css)?.[1]),
    ...(app && { app }),
    ...(picture && { picture }),
  });
}
pages.sort((a, b) => a.path.localeCompare(b.path));
writeFileSync(join(DIST, 'editor', 'page-colors.json'), `${JSON.stringify({ pages })}\n`);
