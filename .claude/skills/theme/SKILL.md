---
name: theme
description: Use when a session builds, changes or checks a theme for @morphemecms/cms - Material (`theme/`), Venus or another store theme (`morpheme-apps/themes/<id>/`), or a site's own theme (`src/themes/<id>/`) - "theme", "Venus", "Material", "look", "tokens", "--mo-", "accessibility.json", "check:themes", "theme page". Holds the theme contract (what a theme must, may and may not do), its tokens and class names, and how a theme is measured and classified for accessibility.
---

# Theme

Announce "Using theme". Owner, 25 Nov 2026: one skill for everything a theme maker needs, in English, in this repository; it replaces
the former Danish rules page in `morpheme-website/docs/rules.md` and the skill `site-editor-theme` there, which now point here. The rules are checked
by `themeProblems` in `site/theme.mjs` (`check:content`, so `check:themes`); when this skill and the code differ, the code is checked
and this skill is fixed in the same pull request.

**A theme's look is its maker's.** Venus looks like Venus (owner, 25 Nov 2026: "Venus must look like venus"). No check changes a
theme's design: only Material is held to Material 3's exact values, and no theme is failed for accessibility (section 5).

## 1. What a theme is

- **A look only, built on Material.** Every theme builds on the standard theme *Material* (id `saturn`, `theme/`). What a theme does not
  have (a file, a block's look) is Material's, drawn with the theme's CSS. Never copy Material or one of its files.
- **Where it lives.** Material in this repository (`theme/`); the owner's store themes in `morpheme-apps/themes/<id>/`, checked against
  the CMS from npm; a site's own theme in `src/themes/<id>/`; a theme installed from the store in `src/themes/theme_<16 hex>/`.
- **It owns no content.** It reads the site's (`src/data/`, `src/content/`, `@morphemecms/cms/site/`) and never writes it.
- **It knows no app** and imports nothing from an app or another theme than Material.

## 2. The contract

**It must have**

- `theme.json` with `name`, `version` (`X.Y.Z`), `author` and `icon`, and `license` (with `thirdParty` for fonts, code or images it
  brings). Optional: `description` and `highlights` by language (`{ "en-US": "…", "da-DK": "…" }`), `releaseNotes` by version and
  language, `"store": true` for a store theme.
- `styles/global.css`, whose first import is `@import '@morphemecms/cms/theme/styles/global.css';` (Material's own imports
  `./base.css`).
- The look of every standard block and of every UI part in every kind (`theme/ui/`, `ui.css`), by tokens or its own CSS.

**It may have**

- layouts (`layouts/PageLayout.astro`, `layouts/PostLayout.astro`), the post page's parts (`components/Post*`, `ShareRow.astro`,
  `RelatedPosts.astro`, `PostCard.tsx`) and the standard pages' templates (`templates/Home|Blog|Category|New|NotFound.astro`), each
  under the same name as Material's (`THEME_FILES` in `site/theme.mjs`);
- `editor/previews.tsx` and `editor/looks.mjs`;
- the look of a standard block: `blocks/<type>/View.tsx` and its parts, and `script.ts`, only for a type Material has; or, without a
  `View.tsx`, a file that replaces one of Material's parts by the same name (`expand/Accordion.tsx`);
- its own icons (`icons/<name>.svg`, one `<svg>` with a `viewBox`, by a name the site draws) and icon packs (`icon-packs/<pack>/`,
  keyed by Material Symbols names, never named like a system pack), and `"icons"` in `theme.json`: the pack it uses when the owner chose
  none;
- `"motion"` in `theme.json`: `expressive`, `standard` or `calm`, used while the owner chose none;
- `"templates"` in `theme.json`: the page templates it offers, from `single`, `full`, `sidebar-left`, `sidebar-right`, no repeats, the
  first the default (without it, `single`, `sidebar-right`, `sidebar-left`);
- `accessibility.json`, written by `morpheme accessibility` (section 5), never by hand.

**It must not**

- have blocks of its own, or a block's contract (`index.tsx`, `shared.ts`, `texts.ts`, `list.ts`, `fields.ts`, `view.ts`, `load.ts`):
  those are the editor's (`src/standard/<type>/`) or an app's;
- draw a block twice (`Site.astro`, `draw.tsx`): `View.tsx` draws it on the site and in the editor;
- write a colour value of its own: the colours are the site's (*Business > Colors*), used by their role tokens;
- write durations or easing of its own: motion comes from the scheme (`--mo-sys-motion-spring-*`, `motionSpring`/`motionTiming` in `lib/motion.ts`), except for a
  continuous indicator;
- use breakpoints of its own: Material 3's five (compact under 600, medium 600, expanded 840, large 1200, extra-large 1600;
  `--mo-ref-breakpoint-*`, `atLeast()` in `lib/breakpoints.mjs`);
- change `blocks.css` or `ui.css` for itself (its own rules on the CMS's classes go in its `global.css` or files it imports);
- load anything from another address. A store theme's CSS imports only from `@morphemecms/cms/…` and its own folder (`./`, `../`
  inside it; fonts in `fonts/`).

`THEME_API` in `src/store.ts` is the contract a theme is written to; a change that breaks a theme written to the old one raises it
(`CLAUDE.md`; skill `changesets`).

## 3. Tokens and class names

- **A shared value is a `--mo-…` token** (`docs/css-tokens.md`). The CMS owns the name; the theme sets its value once on `:root`; a
  block or a section may override it on its own root element. A role is set by its name (`--mo-primary`, `--mo-on-surface`; an
  elevation level has `-color` and `-shadow`).
- **Never a second name for a value that has a `--mo-` name.** A theme's private value is `--mo-theme-*`, declared and read only in its
  own folder, and only when no `--mo-` token exists. A theme never redeclares a name the CMS declares for something else.
- **Every class starts with `mo-`** (`docs/class-names.md`: `mo-<component>`, `mo-<component>__<part>`, `mo-is-<state>`,
  `mo-has-<what>`, `mo-block-<type>`); no Tailwind (`check:tailwind`, `check:mo-names`).
- Material's tokens are in `theme/styles/tokens/` (`docs/theme-token-files.md`); its exact Material 3 values are Material's only.

## 4. Material is different

Material follows Material 3 exactly (owner, 21 Nov 2026), including where M3 falls short of WCAG; skill `material-3` for every change to
it. The checks that compare a value with Material 3 (`isMaterialTheme()` in `scripts/theme-statement.mjs`: button sizes, leading space,
dialog corners, carousel gaps …) run only when the theme in use is Material. **A theme is never changed to pass a Material-only check:**
if one fails on another theme, the check is the bug; report it (the PM brings it to the Architect).

## 5. Accessibility: measured and classified, never failed

Owner, 25 Nov 2026: "We agreed upon not testing themes for wcag etc, but classify instead"; also for the page and post editor, "because
this may run on the site theme"; spec `docs/superpowers/specs/2026-11-25-themes-classified-design.md`.

- **A theme's values are classified.** Contrast, sizes, target sizes, corners, spacing and the focus ring's colour (WCAG 1.4.3, 1.4.4,
  1.4.10, 1.4.11, 1.4.12, 2.5.8) are measured by the checks and written into the theme's `accessibility.json` by
  `morpheme accessibility [<theme>]`. No check fails on them, for any theme.
- **Our code is a hard check on every theme.** Keyboard use, a focus ring on keyboard focus at all, names for screen readers, roles and
  states, focus order, status messages (WCAG 1.1.1, 1.3.1, 2.1.1, 2.1.2, 2.4.3, 2.4.6, 2.4.7, 2.4.11, 3.3.1, 3.3.2, 4.1.2, 4.1.3). A
  failure is a CMS bug whatever the theme; a theme does not work around it. A theme that removes the focus ring (`outline: none` with no
  ring) fails here.
- The split is `lib/accessibility.mjs`; a finding it does not place counts as our code.
- **The statement is measured, never written by hand.** Run `morpheme accessibility` after a change to the theme's look and commit the
  file; a person may add a reason after the measured sentence. `morpheme-apps`' release runs it before a theme is sent to the store. The
  editor shows it on the theme's page ("meets WCAG 2.2 AA" or "falls short", with the parts and "Measured with Morpheme <version>").
- **The base theme** (0.22.3, `docs/superpowers/specs/2026-11-21-base-theme-notes.md`) is the one exception: every finding is a hard
  check for it, theme values included.

## 6. Checking a theme

- `npm run check:content`: the contract (`themeProblems`), names, tokens.
- `check:themes` (skill `checks`): the screens and contrast checks with each installed theme; it prints the theme's classification.
- In `morpheme-apps`: `npm test` and `npm run check` (the CMS's checks on every theme in `themes/`).
- Look at it as a person does: build, and take screenshots of the home page, a page with every block (`/blocks/`), a post and the
  editor, on a phone and a computer, light and dark (skill `developer`, *Screenshots in the pull request*).

## 7. A store theme

- Its folder is copied into a site as it is: everything it needs is in it or in `@morphemecms/cms`.
- A change gets the next version (one step) and a release note in `theme.json`'s `releaseNotes`, in both languages; a released version
  never changes. Only the owner releases (`morpheme-apps`: `npm run release -- <id>`).
- Nothing of any customer's content (names, pages, images) in a public theme.
