# The UI components page (design)

Status: **design, 21 November 2026.** 0.19.5, batch 2 (roadmap `plans/2026-11-14-roadmap-0-18-to-0-24.md`, item 0.19.5; owner, 21 November
2026: "Wouldn't it make more sense to build it in 0.19.5", then "Yes and yes").

A page on the site that shows the theme's UI components as a visitor sees them, with the site's own theme and CSS. Every token batch of
0.19.5 after it is reviewed on it.

## The setting

`componentsPath` in `defineSite` (`site/defineSite.mjs`, *SiteChoices*), like `aboutPath` and `testimonialsPath`: the page's address with a
slash at both ends, or `''`.

- **Standard `''`:** no page. A customer's site never has it unless it sets the path.
- **The demo** (`demo/src/site/config.ts`) and **`morpheme-staging`** (its own pull request there) set `componentsPath: '/ui/'`.

## The page

- `astro.mjs` injects the route only when `componentsPath` is set (`pages/components.astro`), at that path.
- It is not for search engines: in `NOINDEX` (`site/noindex.mjs`), so it is out of the sitemap and marked `noindex`. It is not in the menu
  or in the lists of pages.
- It draws the same gallery as the editor's *Parts › UI components* (`#developer/parts/ui`, `ComponentParts` in `src/BlockParts.tsx`):
  one shared list of groups and their parts, used by both, so the two never differ.
- One heading per group (Buttons, Icon buttons, FABs, Chips, Text fields …), and a subheading per size or kind (Small, Medium, Large;
  Filled, Tonal, Outlined …). The editor's gallery gets the same headings and subheadings (owner, 21 November 2026: "Yes good idea").
- Its title is *UI components*. Its texts are default texts in English with their Danish version (`defaults/i18n/da-DK/`).
- It passes `check:contrast`, `check:announce` and `check:keyboard` like every other page: headings in order, every part named.
