// The Astro config of a site with the CMS: `export default await siteConfig()` in the site's astro.config.mjs. Everything
// a site is built with: its address and language (src/site/config.ts), Markdown with responsive pictures, internal links
// and videos, React, the sitemap, each page's Content-Security-Policy, what the apps make after the build, the licences,
// the CMS's pages (pages/, added as routes) and the Vite plugins and aliases (@site, @data, @saturn, @theme). The site is
// its root, the working directory; this package is where this file is.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import rehypeRaw from 'rehype-raw';
import fs from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config } from './site/siteConfig.mjs';
import { withSiteModules } from './site/siteModules.mjs';
import { rehypeResponsiveImages } from './site/images.mjs';
import { linksDigest, rehypeAutoLinks } from './site/autolinks.mjs';
import { rehypeVideo } from './lib/video.mjs';
import { rehypeEmphasize } from './lib/rehype-emphasize.mjs';
import { rehypeAlign } from './lib/text-align.mjs';
import { remarkBannerSections } from './lib/remark-banner-section.mjs';
import { remarkChecklists } from './lib/remark-checklist.mjs';
import { remarkListHeads } from './lib/remark-list-head.mjs';
import { csp, joined } from './lib/csp.mjs';
import { appBuilds, appFoldersPlugin } from './lib/apps.mjs';
import { appSelf } from './site/appSelf.mjs';
import { isNoindex } from './site/noindex.mjs';
import { activeTheme, aliases, iconPackLicenses, STANDARD_THEME, themeIcon, themePlugin } from './site/theme.mjs';
import { licensesIntegration, siteOwners } from './lib/licenses.mjs';

const ROOT = `${process.cwd()}/`;

/** The CMS's pages, by their address (pages/ in this package), added to the site as routes. */
const PAGES = {
  '/': 'index.astro',
  '/[...slug]': '[...slug].astro',
  '/404': '404.astro',
  '/blog': 'blog/index.astro',
  '/blog/tags/[category]': 'blog/tags/[category].astro',
  '/new': 'new.astro',
  '/rss.xml': 'rss.xml.js',
  '/robots.txt': 'robots.txt.js',
  '/_headers': 'headers.js',
  '/editor': 'editor/index.astro',
  '/editor/code-images.json': 'editor/code-images.json.js',
  '/editor/manifest.webmanifest': 'editor/manifest.webmanifest.js',
  '/editor/sw.js': 'editor/sw.js.js',
  '/editor/thumbnails.json': 'editor/thumbnails.json.js',
  '/editor/version.json': 'editor/version.json.js',
};

/** @returns {import('astro').AstroIntegration} */
const pagesIntegration = () => ({
  name: 'morpheme-pages',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      for (const [pattern, file] of Object.entries(PAGES))
        injectRoute({ pattern, entrypoint: fileURLToPath(new URL(`pages/${file}`, import.meta.url)) });
    },
  },
});

/** The themes the site is built with: the one in use, and the standard theme it builds on. */
const themesBuilt = () => [...new Set([activeTheme(), STANDARD_THEME])];

/** @param {string} file */
const frontMatter = (file) => fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

// Pages and posts that name another page as the original (`canonical`), are not for search engines
// (`noindex: true`) or a stored `status: "unlisted"` (migrated to `noindex`, packages/editor/lib/status.mjs):
// not in the sitemap. Drafts are not built, so not in it either.
/** @param {string} fm @param {string} name */
const field = (fm, name) => fm.match(new RegExp(`^${name}: *"?(.*?)"?\\s*$`, 'm'))?.[1] ?? '';
/** The .md files in a folder (none when the site has no folder of them yet). @param {string} dir */
const markdown = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.md')) : [];
const elsewhere = [
  ...markdown('src/content/pages').map((f) => {
    const fm = frontMatter(`src/content/pages/${f}`);
    return [field(fm, 'path') || `/${f.slice(0, -3)}/`, fm];
  }),
  ...markdown('src/content/blog').map((f) => [`/${f.slice(0, -3)}/`, frontMatter(`src/content/blog/${f}`)]),
]
  .filter(
    ([own, fm]) =>
      (field(fm, 'canonical') && field(fm, 'canonical') !== own) || field(fm, 'noindex') === 'true' || field(fm, 'status') === 'unlisted',
  )
  .map(([own]) => own);
// The blog page (src/data/standard-pages.json) is shown at /blog/, so its canonical URL (another than /blog/) or noindex
// is /blog/'s.
const blogPath = JSON.parse(fs.readFileSync('src/data/standard-pages.json', 'utf8')).blog;
const blogFile = markdown('src/content/pages').find(
  (f) => (field(frontMatter(`src/content/pages/${f}`), 'path') || `/${f.slice(0, -3)}/`) === blogPath,
);
const blogPage = blogFile ? frontMatter(`src/content/pages/${blogFile}`) : '';
if ((field(blogPage, 'canonical') && ![blogPath, '/blog/'].includes(field(blogPage, 'canonical'))) || field(blogPage, 'noindex') === 'true')
  elsewhere.push('/blog/');

/** The site's Astro config. */
export async function siteConfig() {
  // What the site's apps load from elsewhere (site/siteCsp.mjs).
  const { siteSources } = await import('./site/siteCsp.mjs');
  return defineConfig({
    site: `https://${config.domain}`,
    // Every address ends in a slash (imported ones too); keep them identical.
    trailingSlash: 'always',
    // Inline the (small) stylesheet so it does not block the first render.
    build: { format: 'directory', inlineStylesheets: 'always' },
    markdown: {
      // Images inside pages and posts: responsive srcset, width/height, lazy loading.
      // Words from src/data/internal-links.json become internal links.
      // Videos from YouTube and Vimeo are links until played (packages/editor/lib/video.mjs).
      // The prose column is at most ~720px wide.
      processor: unified({
        // A Banner block that stands alone in its section is read as the section it has become (lib/remark-banner-section.mjs).
        // A Checklist block is read as the check list it has become (lib/remark-checklist.mjs).
        // A List's label, heading and intro are the text's own lines above it (lib/remark-list-head.mjs).
        remarkPlugins: [remarkBannerSections, remarkChecklists, remarkListHeads],
        rehypePlugins: [
          // HTML written in the Markdown (tables, iframes, links) as elements before the plugins below,
          // so they see it too (Astro would parse it only after them).
          rehypeRaw,
          // Bold as <strong class="emphasize">, for a theme to style (lib/rehype-emphasize.mjs).
          rehypeEmphasize,
          // An alignment line before a block becomes its class (lib/text-align.mjs).
          rehypeAlign,
          [rehypeResponsiveImages, { sizes: '(min-width: 800px) 720px, calc(100vw - 40px)' }],
          // Internal links from the keywords (src/data/internal-links.json); with what they are made from, so the pages
          // rendered before (node_modules/.astro) are rendered again when it changes (linksDigest).
          [rehypeAutoLinks, { digest: linksDigest() }],
          // Videos load only when played (nothing from Google or Vimeo before that), with the theme's play button.
          [rehypeVideo, { play: themeIcon('play-fill') }],
        ],
      }),
    },
    integrations: [
      // The CMS's pages (pages/): the standard pages, the posts and pages, the blog, RSS and the editor.
      pagesIntegration(),
      // client:interact: hydrate an island on first touch/hover/focus (site/directives/interact.mjs).
      {
        name: 'client-interact-directive',
        hooks: {
          'astro:config:setup': ({ addClientDirective }) =>
            addClientDirective({ name: 'interact', entrypoint: fileURLToPath(new URL('site/directives/interact.mjs', import.meta.url)) }),
        },
      },
      // React is only used for interactive islands (Motion), per design-taste-frontend.
      react(),
      sitemap({
        filter: (page) => !isNoindex(new URL(page).pathname) && !elsewhere.includes(new URL(page).pathname),
      }),
      // Each page's Content-Security-Policy, after it is built: only its own scripts run (packages/editor/lib/csp.mjs),
      // with what the site's measuring and its apps load from elsewhere (packages/editor/site/siteCsp.mjs).
      csp({ site: joined(...siteSources()) }),
      // What each installed app makes after the build (its build.mjs, in dist/_apps/<app>/: Cookiescanner's scan.json).
      appBuilds(ROOT),
      // The licences of the third-party work in what is downloaded (the browser's bundle, the pages' styles and fonts), of
      // the icon sets the system offers (packages/editor/site/icons.mjs), and of the apps and the themes with what they bring, in
      // dist/editor/licenses.json for "Licenses" under "Settings" (packages/editor/lib/licenses.mjs).
      licensesIntegration({
        root: ROOT,
        iconPacks: iconPackLicenses,
        owners: () =>
          withSiteModules((load) => siteOwners(ROOT, async (id) => (await load(`/src/apps/${id}/index.ts`)).default, themesBuilt())),
      }),
    ],
    vite: {
      // The editor (packages/editor/) takes this site from src/site/ as @site (packages/editor/defaults/editor.ts), and the
      // site and the editor take the theme in use (src/data/theme.json) as @theme: its file, else the standard
      // theme's (themePlugin, packages/editor/site/theme.mjs); and what is in each app's folder (appFoldersPlugin).
      plugins: [themePlugin(), appFoldersPlugin(ROOT), appSelf(), tailwindcss()],
      resolve: { alias: aliases() },
    },
  });
}
