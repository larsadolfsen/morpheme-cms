# Theme contrast report, 14 Nov 2026

`npm run check:contrast` (WCAG AA: 4.5:1 text, 3:1 large text, icons and control borders) on `@morphemecms/cms` 0.16.0
(main), built demo. Every block's text, icons and control borders on each section colour (surface, primary, secondary,
tertiary), on the site and typed in place in the editor, light and dark, phone (375 px) and computer (1280 px).

## Material (`saturn`, this repository)

| Pairs checked | Failing groups | Manual (image or gradient) |
| :--- | :--- | :--- |
| 8128 | 0 | 0 |

No failing group (block, part, section colour, mode, size, ratio): none.

## Venus (`venus` 1.3.0, `larsadolfsen/morpheme-apps`, `themes/venus/`)

Installed into `src/themes/venus/` of a temporary copy of the demo in a scratch folder, selected in
`src/data/theme.json`. Nothing was written to either repository.

| Pairs checked | Failing groups | Manual (image or gradient) |
| :--- | :--- | :--- |
| 8240 | 0 | 0 |

No failing group: none.

## Defects and limits

- **Real defects:** none found in either theme.
- **Check limitations:** the check reads no pair with an image or gradient behind it (none occurred, so the "manual"
  count is 0), and it covers the demo's Blocks page plus the site's pages, not content a site owner adds. It runs the
  editor at Medium density only (`CONTRAST_DENSITY=-1` and `1` were not run). Venus 1.3.0 declares support for
  CMS 0.15; it was run here against 0.16.0.
- **Fix owner:** nothing to fix. A future failure in a block's look or a `--mo-*` role is the CMS repo's; a failure in a
  theme's own `styles/` or colours is the theme repo's (`morpheme-apps`).

## How it was run

- Material: `npm ci`, `npm run build`, `CONTRAST_THEMES=saturn npm run check:contrast` (651 s).
- Venus: the demo copied out of `.morpheme/demo/site/`, `themes/venus` copied into `src/themes/venus/`,
  `CONTRAST_THEMES=venus node .../bin/morpheme.mjs check:contrast` (637 s).
- Both runs used the container's preinstalled Chromium (`CHROMIUM_PATH=/opt/pw-browsers/chromium`); the Playwright
  from `npm ci` expects another browser build.
