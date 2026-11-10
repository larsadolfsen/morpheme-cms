# Morpheme CMS

An editor for websites built with [Astro](https://astro.build) and run on [Cloudflare](https://www.cloudflare.com): the
site's owner edits pages, posts, pictures and settings in the browser at `/editor/`, and every save is one commit on
GitHub. MIT licensed, see [LICENSE](LICENSE).

`@morphemecms/cms` is the editor, the site's pages and its Astro setup (`siteConfig()` in `astro.mjs`), the
standard theme *Material* (`theme/`, id `saturn`), the site's Worker (`worker/`) and the `morpheme` command (`bin/`). A site
gives it its settings (`src/site/`, over the standard ones in `defaults/`), its content (`src/content/`, `src/data/`), its themes (`src/themes/`) and its
apps (`src/apps/`).

A new site starts from the starter (`starter/`, also in the npm package, since the demo is built from it): a site with only its own settings, the
standard pages and the standard theme, ready for Cloudflare.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/larsadolfsen/morpheme-cms/tree/main/starter)

Releases are published to npm from GitHub Actions (`.github/workflows/publish.yml`, with npm's trusted publishing)
when a release is made on GitHub with the tag `v<version>`.

## The editor

The editor for a site built with Astro, at `/editor/`, with no particular site written into it. A site gives it its collections and fields, its rules and its own blocks; the customer edits the content, and every save is one commit on GitHub.

The whole guide is in `docs/editor.md` in the site's repo. This file holds only what a site needs to use the package.

## Contents

- `src/`: the screens, the fields, save, the frame around the blocks (`blocks.ts`) and the registry (`registry.tsx`), the rules (`check.ts`, `checkSite.ts`) and the contract of the default blocks (`standard/<type>/`: fields, rules, fixed texts, lists and what they show: `view.ts` and `load.ts`; their look and CSS belong to the theme, see below), and `standard/view.tsx`, `BlockSite.astro` and `sites.ts`, which draw all blocks on the site with their `View.tsx`.
- `lib/`: what both the editor and the site use: the format of the blocks in the text (`blocks.mjs`), the cropping of pictures (`crop.mjs`), a short text with bold and links (`inline.ts`), the notice's *Show until* (`notice.mjs`), the status of a page and a post and the scheduled ones (`status.mjs`, `scheduled.mjs`) and the videos from YouTube and Vimeo (`video.mjs`, `video-id.mjs`).
- `site/`: what the site's pages and the themes read the site with (the content, the readers of the data, the pictures, the structured data, the themes and the icon packs), with the site as `@site/…` and its data as `@data/…`.
- `defaults/`: the site's default parts, what a site has when its `src/site/` has no file of the same name: the collections and fields, the start screen, the rules, *Business*, the colors, the texts and so on.
- `worker/`: the site's Worker, the same for all sites (`index.js` is its `main`): login, what the editor asks GitHub for, the copy in R2, the consents, the addresses that do not exist, the scheduled tasks, the notifications and the apps' part.

## What the site needs

- **`src/site/`**, which the package takes as `@site`, and only from there; a file the site does not have is the package's in `defaults/`:
  - `config.ts` and `worker.js` the site must have itself (`config.ts` with `defineSite` from `@morphemecms/cms/site/defineSite.mjs`: only what is the site's own); the rest it can have to give more than the default (such as the default's from `@morphemecms/cms/defaults/<file>` with its own added).
  - `@site/editor`: `collections`, `groups`, `lists`, `icons`, `siteName`, `companyParts`, `blockParts`, `relationsOf`, `usedBy`, `usesOf`, `countsOf`, `whatIsAt`, `testimonialsOf`, `siteOf`, `fixedPages`, `everyFixedPage`, `Texts`, `sectionLooks`, `headingLooks` and `config`, and the types `Props` and `SiteData`.
  - `@site/config`: the site's name, domain, GitHub repo and folders.
  - `@site/worker` (for the Worker): `apps`, `contact`, `moved`, `standard`, `oldAddresses` (the site's redirects from old addresses, `{ ids, paths }`) and the apps' part of the Worker (`appWorkers`, `appTexts`).
- **`@site`** for `src/site/`, otherwise `defaults/`: in Vite (`siteFile` in `themePlugin`, `site/theme.mjs`, used by `astro.mjs` and `scripts/check-content.mjs`, which loads the rules with Vite) and in TypeScript (`paths` in `tsconfig.json`: `"@site/*": ["./src/site/*", "./node_modules/@morphemecms/cms/defaults/*"]`); for the Worker `@site/config` and `@site/worker` in `alias` in `wrangler.jsonc`, with `main` set to the package's `worker/index.js`.
- **The site's own blocks** in the apps' `blocks/<type>/` (`src/apps/<app>/blocks/<type>/`), each with `index.tsx` (`defineBlock` from `@morphemecms/cms/src/blocks`), `viewOf.ts` and `load.ts` (what the block shows, in the editor and on the site) and `View.tsx` (the drawing, in both places). The package finds them itself.
- **A default theme**, which all of the site's themes build on, with the look of the default blocks (`blocks/<type>/View.tsx`, one drawing for the site and the editor), which the package finds itself (this site: `packages/editor/theme/`, `packages/editor/src/standard/siteLooks.ts` and `packages/editor/src/standard/themeBlocks.ts`).
- **The pages** are the package's (`pages/`, put in by `siteConfig()` in `astro.mjs`): the site's pages, the blog, 404, `/ny/` and the editor (the page that shows `src/App.tsx`, the manifest, `version.json` and the pictures the site's own code uses). The site's `astro.config.mjs` is only `export default await siteConfig()`, and `src/content.config.ts` gets the collections from `site/content.config`.
- **The style of the default blocks:** `blocks.css` in the default theme (this site: `packages/editor/theme/styles/blocks.css`), imported in each theme's CSS, and the `--block-*` variables set to the theme's colors and shapes.
- **The `morpheme` command** (`bin/morpheme.mjs`, the package's `scripts/`), run from the site's root in its `package.json`: `images` (the pictures' smaller sizes and the videos' still images, before `dev` and `build`), `after-build` (what the Worker and the editor read in `dist/`), `check:content` (the content by the editor's rules), `check:editor` (the pages come back unchanged), `check:worker`, `check:screens`, `check:themes`, `check:demo` (the CMS's demo, `demo/`, works with the CMS), `compare-html`, `app-workers`, `app-screenshots`, `theme-screenshots` (the pictures of each theme, taken of the demo) and `editor-icons`.
- **The layouts for pages and blog posts** mark with `data-editor` what *Preview* puts in (`src/pagePreview.tsx`): `heading`, `image`, `text` and optionally `end` with `data-editor-block` (a block that ends the text is placed there).
- **The dependencies** in `peerDependencies`: everything the package's code imports (Astro and its integrations, React, Milkdown, Phosphor, Tailwind, motion, the default theme's font, yaml and what makes the Markdown in *Preview*: unified, remark and rehype), and what the commands use (Vite, esbuild, sharp, Wrangler, and for the checks in a browser Playwright and jsdom, version 29 or 31; jsdom 29 needs Node ^20.19.0 || ^22.13.0 || >=24.0.0, jsdom 31 needs Node ^22.22.2 || ^24.15.0 || >=26). The starter's `package.json` has them all (`scripts/starter.mjs`).
- **The starter** (`starter/`): what a new site starts with, checked as a site with the package from `npm pack` (`scripts/check-starter.mjs`).
