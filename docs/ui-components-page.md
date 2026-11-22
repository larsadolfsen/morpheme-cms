# The UI components page

A page that shows the theme's UI components as a visitor sees them, with the site's own theme and CSS. Every token change of 0.19.5 is
reviewed on it. Design: `docs/superpowers/specs/2026-11-21-ui-components-page-design.md`.

- **Setting:** `componentsPath` in `defineSite` (`src/site/config.ts`): the page's address with a slash at both ends (`'/ui/'`), or `''`. The
  standard is `''`: no page. Only the CMS's demo and `morpheme-staging` set it; the starter and every customer's site do not.
- **Route:** `astro.mjs` adds `pages/components.astro` at that address only when the setting is not empty. The address is reserved, so no page can
  have it.
- **Not for search engines:** the address is in `NOINDEX` (`site/noindex.mjs`), so the page is `noindex` and not in the sitemap. It is not in the menu
  or in the lists of pages.
- **One gallery:** the page draws `ComponentGallery` (`src/ComponentGallery.tsx`), the same groups and parts as the editor's *Developer › Parts ›
  UI components* (`#developer/parts/ui`, `ComponentParts` in `src/BlockParts.tsx`). The editor's own frame group is only in the editor. A group has
  an `h2`, a part an `h3` (an `h2` in the editor when no group heading is above it), and a subheading (`PartSub`, `src/PartsShown.tsx`) for each size
  or kind a part shows.
- **Texts:** the page's title is `siteT.theme.uiComponents`; the gallery's names are the editor's (`t.parts.screens`), each with its Danish text.
