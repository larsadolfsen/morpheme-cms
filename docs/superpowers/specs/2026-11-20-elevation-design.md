# Elevation (spec)

Status: **20 November 2026.** Ships in **0.19.5 UI fixes** (owner: "add it to the 0.19 ui fixes"). The owner made both
decisions (*Decisions*, below).

Owner, 20 November 2026: "write the spec now, but only elevation". This spec is the elevation part of *Component steps*
(roadmap `plans/2026-11-14-roadmap-0-18-to-0-24.md`, 0.22). It covers elevation only: the colour roles, the type scale, shape, motion,
density and state layers will get their own specs later. The steps table (0.22.0) will produce later what this spec has
written by hand, without changing it.

## What Material 3 says

The CTO read the three elevation pages with Playwright on 20 November 2026 (skill `material-3`):
`m3.material.io/styles/elevation/overview`, `/applying-elevation` and `/tokens`.

- **Levels.** "Material uses six levels of elevation … 0, +1, +2, +3, +4, and +5. An element's resting state can be on levels 0 to
  +3, while levels +4 and +5 are reserved for user-interacted states such as hover and dragged."
- **Values are the platform's.** "Tokens have no shadows or color; each platform determines the specific shadows and values to use at
  each elevation level." Also: "Elevation has no shadow or value of its own by default."
- **Default levels.** "All components have a default resting elevation. Avoid changing the default elevation of Material components."
- **Interaction.** "Components should change elevation in response to system events or user interaction, like hovering. This
  elevation change should be consistent across all similar elements. … All Material buttons increase elevation by 1 level when
  hovered."
- **Few shadows.** "Instead of applying shadows by default to all levels, use shadows only when required to create additional
  protection against a background or to encourage interaction." Also: "When it comes to applying shadows, less is more."
- **Tone.** "By default, Material 3's surfaces use tonal difference to indicate separation." Also: "Any overlapping containment
  areas or components should have different color roles in order to visually communicate separation."
- **Contrast.** "For interactive components, edges must create sufficient contrast between surfaces (by meeting or exceeding
  accessible contrast ratios) for them to be seen as separate from one another."
- **Scrims.** "Scrims use the scrim color role at an opacity of 32%."
- **Component levels.** The tokens page lists each component's resting level, for example level 3 for FAB, dialogs and search, and
  level 1 for the elevated card and the modal bottom sheet.

## What Morpheme has today (0.18, cards and lists)

- **Tokens.** Each level is a token pair, `--mo-sys-elevation-levelN-color` and `-shadow`, from 0 to 5, with dark-mode shadows. There
  is also `-rest-shadow`, the shadow at rest, which a theme can turn off while keeping the lift. They live in
  `theme/styles/tokens/ui/ref.css` and `tokens/material/ref.css`.
- **Parts.** Every M3 part has the level M3 prints, for every state, as its own `--mo-comp-*` token, so a theme can change one part.
  `theme/styles/elevation.test.mjs` checks this.
- **Scrim.** It is `--mo-sys-color-scrim-overlay`, the scrim role at 32%, as M3 says.
- **Tokens screen.** The editor shows the levels on its tokens screen (`src/Tokens.tsx`).

What is missing:

1. **No way for a plain element to take a level.** This covers a block's own box, a theme's layout or an app's panel. Today such an
   element has two options. It can read the tokens in its own rule, as `theme/styles/blocks/person-facts.css` does. Or it can write
   a shadow by hand.
2. **Nothing stops a hand-written shadow.** `check:css-values` checks shape and type values but not shadows. Today there is one such
   shadow: the colour picker's handle (`src/editor-ui.css`), which uses `rgb(0 0 0 / 0.3)` and `0 2px 6px`. Three rules still
   carry Tailwind's empty shadow lists (`0 0 transparent` four times) in front of the token (`src/editor-settings.css` ×2,
   `src/editor-screens.css`).
3. **Deviation 12 is still open.** `docs/material-deviations.md`, item 12, says our shadow values are "not yet compared with the M3
   spec". The tokens page settles it: the values are the platform's to choose.

## The design

### The classes `mo-elevation-0` to `mo-elevation-3`

A plain class for a plain element, like `mo-type-*`. It goes in `@layer utilities`, in `theme/styles/elevation.css`, which is
imported where `type.css` is.

- **At rest:**
  - `background-color: var(--mo-sys-elevation-levelN-color)`;
  - `color: var(--mo-sys-color-on-surface)`;
  - `box-shadow: var(--mo-sys-elevation-levelN-rest-shadow)`.

  Level 0 has no shadow.
- **Only 0 to 3.** M3 says "An element's resting state can be on levels 0 to +3", so there are no classes for 4 and 5.
- **Pointed at.** Only an element that can be clicked moves up, and only when the device can hover: `a`, `button`, `summary`,
  `[role=button]` or `[tabindex]`. Its shadow becomes level N+1's (`-shadow`, so it lifts even when resting shadows are off). M3:
  "increase elevation by 1 level when hovered". The colour stays the same, because the state layer shows the hover, as on the parts.
- **Dragged.** `[data-dragged]` gives level N+3's shadow. That is M3's step for cards: filled 0 → 3, elevated 1 → 4. It is never
  above 5.
- **Focus.** With focus, the element stays as at rest, like the parts (`tokens/ui/ref.css`). The focus ring shows the focus.
- **Motion.** The change of shadow uses the theme's effects spring (`var(--mo-sys-motion-spring-default-effects)`) and no duration of its own.
- **Never on an M3 part.** A part has its own level for every state, and a class would win the cascade and freeze it. To give a part
  another level, a theme sets the part's `--mo-comp-*` token. The check below fails when a `mo-elevation-*` class sits on an
  element that has a part class (the part classes of `theme/styles/files.mjs`).
- **On a section colour.** The level colours are surface containers. The batch checks the classes on every section colour in light
  and dark mode (`check:contrast`), because M3 asks for edges with "sufficient contrast". Where a level doesn't stand out on a
  section colour, the section's swap in `theme/styles/global.css` gives it the matching container role. The class never writes a
  colour of its own.

Who uses it:

- the CMS's own blocks and layouts in place of their own level rules, starting with `person-facts.css`;
- themes in their layouts and templates;
- apps in their blocks' `View.tsx`.

The classes are listed where `mo-type-*` is described, and later in the developer guide (0.22.1).

### The check

`check:css-values` gets shadows. It covers the same files and uses the same allowlist with reasons
(`scripts/check-css-values.allow.mjs`).

- **What fails.** It runs on every `box-shadow` and `filter: drop-shadow()` in the CSS, and on every `boxShadow` in TSX. An entry
  fails if it is not `inset` and has a blur or an offset, unless it is:
  - a level token, `var(--mo-sys-elevation-levelN-shadow)` or `-rest-shadow`;
  - a part's `--mo-comp-*` variable whose fallback is a level token.

  The message names the fix: "Use `var(--mo-sys-elevation-level2-shadow)` or the class `mo-elevation-2`", with the nearest level.
- **What passes.** Lines and rings are not elevation and pass:
  - inset edges;
  - spread-only rings with no offset and no blur, such as focus rings and outlines;
  - the `kbd` key edge, which has an offset and no blur (allowlisted: it draws a key, not a height).
- **The level definitions.** They are the one place values are written (`tokens/ui/ref.css`, `tokens/material/ref.css`), and they
  are exempt.
- **The second rule.** The check also fails on a `mo-elevation-*` class together with a part class (above).

Themes and apps are not checked in this release. Holding them to it would change the theme contract (`themeProblems`), so it waits
for a contract raise and is noted for the steps table.

### The fixes that come with it

- **The colour picker's handle** sits over a busy gradient, which is M3's case for a shadow: "Protect elements". It gets
  `--mo-sys-elevation-level1-shadow` together with its white edge.
- **Tailwind's empty shadow lists** go, leaving just the token.
- **Deviation 12** in `docs/material-deviations.md` is closed with the tokens page's sentence and the date.

## The current parts (audit, 20 November 2026)

Owner, 20 November 2026: "we need to fix elevation/shadow on current elements. Search bar is for example wrong." The CTO compared every
part with M3's specs and overview pages (33 specs pages and 31 overview pages read with Playwright; the swatches' shadows read as levels)
and measured the parts in the built demo and the editor at `main` 511105c3.

**The cause.** M3 often gives a part a level and then shows that level by its tone only. The search overview: "Elevation: Lower
elevation and no shadow by default". The navigation bar: "Elevation: No shadow". The scrolled top app bar: "No drop shadow, instead a
color fill". The Material theme sets every `-rest-shadow` to the level's full shadow (`tokens/material/ref.css:28-32`), so every part at
level 1 or more draws a shadow at rest, also where M3 shows none. `theme/styles/elevation.test.mjs` checks only that a rule names the
level we chose, from our own reading, and treats a level and its shadow as one thing, so it locked these in.

**What changes.** A part's level and its shadow become two tokens: the level's colour stays, and the shadow is `none` where M3 shows
none (`--mo-comp-<part>-shadow: none`).

| Part | M3 | Today | Fix |
| --- | --- | --- | --- |
| Search bar | surface-container-high, level 3, no shadow; hover and press only a state layer (`components/search/overview`, `md.comp.search-bar.*`) | level 3 shadow at rest, hovered and focused (`ui/search.css:29-33`, `:98-102`), in the editor's start screen and every search bar | no shadow |
| Search view | docked and full-screen: no shadow | level 3 shadow (`ui/search.css:165-170`) | no shadow |
| Top app bar, scrolled | surface-container, level 2, "No drop shadow" | level 2 shadow (`ui/top-app-bar.css:35-39`) | no shadow |
| Navigation bar | surface-container, level 2, "No shadow" | level 2 shadow (`ui/navigation-bar.css:29-30`, `tokens/material/comp/navigation.css:18`) | no shadow |
| Docked toolbar | level 2, "No shadow" | level 2 shadow (`ui/toolbar.css:31`) | no shadow |
| Date pickers | surface-container-high, level 3, "no shadow" | level 3 shadow (`ui/dialog.css:16`, `ui/pickers.css:119`) | no shadow |
| FAB menu items | level 0 at rest, hover 4, focus and pressed 3 | level 3 at rest (they take `ui/fab.css:31`) | level 0 at rest |
| List - Expand | list item on surface, level 0 | level 1 shadow on surface-container-low (`ui/list.css:400` falls back to `--mo-sys-block-shadow`) | level 0, no fallback to the block shadow |
| Bottom sheet from 600 dp | level 1 (standard and modal) | level 3 (`ui/bottom-sheet.css:206`) | level 1 |
| Navigation drawer, modal | surface-container-low, level 1 | surface-container with a level 1 shadow (`ui/navigation-drawer.css:51-52`) | surface-container-low |
| Carousel item | surface, level 0, hover level 1 | no lift on hover | hover level 1 |
| Buttons (Expressive) | the hover lift tokens are deprecated in the Expressive sets | elevated hover 2, filled and tonal hover 1 (`ui/buttons.css:159-204`) | no hover lift (Expressive wins, skill `material-3`) |
| Switch and slider handles (Expressive) | the handle elevation tokens are deprecated; Expressive prints none | level 1 shadow (`ui/switch.css:117`, `ui/slider.css:226`, `:237`) | no shadow |
| Floating toolbar and menu, vibrant | primary-container (toolbar) and tertiary-container (menu) | primary | the M3 roles |

They match M3 today and stay as they are: cards (all three kinds, every state), chips, FAB and extended FAB, the basic dialog, time
pickers, snackbar, rich tooltip, side sheet, navigation rail, the floating toolbar's level, lists (dragged level 4), icon buttons,
segmented buttons, button groups, tabs, text fields, badges and progress indicators.

**Other current shadows.** The video facade's icon (`theme/styles/blocks/prose.css:113`, `drop-shadow(0 2px 8px rgb(0 0 0 / .5))`)
is hand-written: it sits on a video, M3's case for a shadow ("Protect elements"), and takes a level shadow in batch 2. The colour picker's dots
(`src/editor-ui.css:195-203`, `:288`) and Tailwind's empty lists (`src/editor-screens.css:657`, `src/editor-settings.css:1539`,
`:1703`) are the fixes already listed. The editor's dragged block (level 4) and contextual menu (level 2) match M3's dragged and menu
levels.

**The test.** `elevation.test.mjs` is rewritten to compare each part with M3's own tokens, the level and whether a shadow is shown per
state, read from the M3 token copy (`docs/m3-tokens/`, owner, 20 November 2026: "only the tokens … go ahead") with a short list of the
overview pages' "no shadow" sentences, which the tokens don't carry. A part that differs fails, so a value from our own reading can't lock
in a mistake again.

## Decisions

1. **Component levels in a customizer** (then 0.22.2, now an idea without a version). Decided by the owner on 20 November 2026: "No, save the shadow changer in a none planned customizer feature". A component keeps
   M3's level (M3: "Avoid changing the default elevation of Material components"); a theme can still change one part's level
   through its token. A site-wide *Shadows at rest* (`On`/`Off`) setting, which sets the `-rest-shadow` tokens, is saved in the
   roadmap's *Ideas without a version* for a customizer that has no version yet.
2. **When.** Decided by the owner on 20 November 2026: "add it to the 0.19 ui fixes". It ships in **0.19.5**, the 0.19 line's fix
   release, as two pull requests into that release's feature branch. It needs no contract change for the CMS's own code.

## Batches (pull requests into the 0.19.5 feature branch)

1. **The classes.** If it is 0.19.5's first pull request, it sets the version (`plans/2026-11-19-version-at-feature-start.md`).
   It adds `theme/styles/elevation.css` with its tests in `elevation.test.mjs`: levels 0 to 3 only, the hover and dragged steps, and no colour of their own. The tokens screen
   shows a sample of each class. `person-facts.css` uses the class. `check:contrast` passes on every section colour.
2. **The check and the fixes.** Adds shadows and the part rule to `check:css-values`, fixes the colour picker's handle, removes
   Tailwind's empty shadow lists and closes deviation 12. Adds a release note line, because a theme or app developer can now use the
   class (skill `release-notes`).

3. **The current parts.** The table above: the shadow tokens split from the levels, the fixes, and `elevation.test.mjs` against M3's
   tokens. Measured again in the built demo and the editor, at rest, hovered, focused, pressed and dragged. A release note line: search
   bars and bars lose their shadow, as Material 3 draws them (skill `release-notes`).

Elevation is done when `check:css-values` fails on a hand-written shadow, every part matches M3's levels and shadows, the classes are on the demo and on the tokens screen,
the owner has seen them on the demo, and 0.19.5 has run on staging.
