---
name: material-3
description: Use before writing a spec or making a change that touches the site, the theme Material or any screen outside the editor's own workspace, or that may deviate from Material Design 3 - "M3", "MD3", "Material", "m3.material.io", "component", "token", "deviation". Says how to read and quote the real M3 pages and how to record a deviation.
---

# Following Material 3

Announce "Using material-3". Owner, 13 Nov 2026: "We follow MD3 everywhere except the editor. You need to look up every
page and check it. I don't want to tell you more times to follow MD3."

1. Outside the editor's own workspace (its toolbar/bar, overflow menu, text and block menus) every design choice follows
   what m3.material.io prints.
2. When you build a new component or edit an existing component's design (look, measurements, behaviour, states), read
   the real pages of every component involved, with a real browser (Playwright). Owner rule, 15 Nov: m3.material.io
   pages are JavaScript-rendered, so a plain fetch (WebFetch, curl) returns only the page title, an empty shell. A
   session never writes a spec or a change from memory or from a failed fetch. If a page can't be read, say so plainly
   instead of guessing. When you only use an existing theme component as it is (for example a text Button, a ListItem
   or a Chip with their current props), you do not need to read the M3 pages.
3. Never invent a part, mark, size or behaviour M3 does not print. Where M3 is silent, say so and use the nearest M3
   pattern.
4. Which M3: Expressive wherever a component has an Expressive variant, otherwise baseline (owner, 15 Nov 2026). The specs' variant table says which one a component has.
   Priority order (owner, 15 Nov 2026): 1. Modern web, 2. M3 Expressive, 3. M3, 4. M2 with M3 styling. Where they conflict, the lower number wins.
5. A deviation is allowed only in the editor workspace or when the owner says so in words. Record it in
   `docs/material-deviations.md` in the same pull request as the change: what Material says (quoted), what we do instead,
   why, the date and the pull request. A deviation that is not listed there is a bug.

5. Dialogs are only for short messages (owner, 15 Nov 2026: "Dialogs are only for short messages, not for settings."): a short message, a confirmation or a single short choice. Settings or a form with several controls are a standard side sheet from 600 dp and a page below it (`docs/material-deviations.md`, B3).

Wording follows M3's word choice (`CLAUDE.md`, *Word choice*). A theme's own look is the skill `site-editor-theme`.

## Reading the real pages

Chromium and Playwright are pre-installed in the cloud container: `require('playwright')` works from any directory
(use `NODE_PATH=$(npm root -g)` if `require` fails). Do not run `playwright install`. Read a page like this (required for the build/edit case in rule 2):

```js
const { chromium } = require('playwright');
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1400, height: 1000 } });
await pg.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await pg.waitForTimeout(3000);
const text = await pg.evaluate(() => document.body.innerText);
```

- Read every tab of the component: Overview, Specs, Guidelines and Accessibility.
- Quote the numbers and role names the pages print, in the spec or the pull request.
- Say in the pull request which pages were read (the URLs).
- List anything the text omits. Images carry some measurements: then take a screenshot of the page with Playwright and
  read the image.
