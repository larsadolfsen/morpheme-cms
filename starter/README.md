# A site with Morpheme CMS

The website is built with [Astro](https://astro.build), runs on [Cloudflare](https://www.cloudflare.com) and is edited
in the editor at `/editor/`: pages, posts, images and settings. Every save is one commit in this repository, and
Cloudflare builds and publishes the site by itself afterwards.

The editor, the standard theme *Material* and the site's Worker are the package [`@morphemecms/cms`](https://www.npmjs.com/package/@morphemecms/cms)
(MIT). What belongs to the site itself is here:

- `src/site/config.ts`: the site's name, domain, language and GitHub repository; the rest is the package's standard (`defineSite`).
- `src/site/worker.js`: what the Worker gets from the site.
- The secret `GITHUB_PUBLISH_TOKEN` (`npx wrangler secret put GITHUB_PUBLISH_TOKEN`) lets the Worker write to the site's GitHub repository, also when it updates the CMS. The token needs **Contents: Read and write** and **Checks: Read**.
- The secret `MORPHEME_STORE_KEY` (`npx wrangler secret put MORPHEME_STORE_KEY`) connects the site to the Morpheme store; without it, the *Appstore* only has the site's own apps and themes.
- The secret `MCP_VAULT_KEY` (`npx wrangler secret put MCP_VAULT_KEY`, any long random text) turns on *Assistants* under *Settings*: an assistant such as Claude can then connect to the site's address `/mcp` and read the site. The Worker keeps the connecting person's GitHub token, sealed with this secret, in the same D1 database as the consent log.
- `src/content/`: the pages and posts, `src/data/`: the site's settings, `public/`: images, logo and icons.
- `src/drafts/`: the waiting versions of pages and posts (saved but not published). The site is not built from it. Saving a waiting version builds the site with only the editor's checks; to skip even that build, add `src/drafts/**` under *Build watch paths* › *Exclude paths* in the Worker's build settings in Cloudflare (optional; the editor explains it under *Settings* › *Developer* › *Caching and builds*).
- `src/themes/` and `src/apps/`: themes and apps from the app store, when any are installed.

## Development

```bash
npm install
```

```bash
npm run dev
```

`npm run check` runs the checks (formatting, types, the content by the editor's rules, the editor and the Worker) before
every push. Cloudflare builds with `npx morpheme ci-build`: all the checks, or only the editor's own when only content has
changed since the live site; and `npm run build` builds the site in `dist/`.

## Start a Danish site

`npx morpheme locale da-DK` lays the Danish language layer over the starter (once, in a new site). It sets `locale` to
`da-DK`, replaces the English pages and texts with the Danish ones and deletes the `i18n/` folder.
