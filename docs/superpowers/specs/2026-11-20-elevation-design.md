# Elevation (spec)

Status: **20 November 2026.** Ships in **0.19.5 Material 3 tokens** (owner: "add it to the 0.19 ui fixes"; the owner then put
0.19.5 Material 3 tokens before the UI fixes, "Agree", and elevation rides in it: `plans/2026-11-20-0-19-5-material-3-tokens.md`). The owner made both
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

- **Tokens.** Each level is a token pair, `--mo-sys-elevation-levelN-color` and `--mo-sys-elevation-levelN-shadow`, from 0 to 5, with dark-mode shadows. There
  is also `--mo-sys-elevation-levelN-rest-shadow`, the shadow a part shows at rest on that level. Material points it at the level's full shadow (owner, 18 Nov 2026:
  "Follow the token: 1dp shadow at rest"), which this spec changes (*Elevation and elevated*). They live in
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

### Elevation and elevated

Owner, 20 November 2026: "You need to differentiate from elevation and elevated objects. Elevations set bg and elevationshadow where as
elevated only get the elevation shadow", and "md3 sets elevation-shadow to none in the elevation-N, but keeps the elevations shadow tokens".

- **An elevation** (level N) is a surface: it sets the level's background, `--mo-sys-elevation-levelN-color`, and the level's elevation
  shadow, `--mo-sys-elevation-levelN-rest-shadow`. This is M3's default: "By default, Material 3's surfaces use tonal difference to indicate
  separation."
- **An elevated object** keeps its own background (its own colour role) and gets only the shadow, `--mo-sys-elevation-levelN-shadow`. This is
  M3's exception: "use shadows only when required to create additional protection against a background or to encourage interaction" (the
  elevated card, a FAB, a menu, a dialog, a snackbar).
- **Material sets the elevation shadow to `none`** for every level (`--mo-sys-elevation-level1-rest-shadow` to `--mo-sys-elevation-level5-rest-shadow`), in
  `tokens/material/ref.css` and `tokens/ui/ref.css`, and keeps the `--mo-sys-elevation-levelN-shadow` tokens as they are. So a surface on a
  level shows its tone only, and an elevated object still casts its shadow. This replaces the owner's rule of 18 November 2026, and the
  comment in `ref.css` quotes the new words.
- **The token keeps its name in 0.19.5.** Renaming `--mo-sys-elevation-levelN-rest-shadow` needs a `THEME_API` raise, so its final name comes
  with 0.20.0's map (`specs/2026-11-20-material-3-names-design.md`; M3 has no shadow token, so it is on the list of ours). The spec, the comments and the tokens screen call it the elevation shadow.
- **A simpler theme later.** Owner, 20 November 2026: Material is the base theme, and "when it is perfect we will make another more simpler
  theme". Such a theme turns the elevation shadow on by pointing `--mo-sys-elevation-levelN-rest-shadow` at `--mo-sys-elevation-levelN-shadow`, with no change to a part or a class.

### The classes `mo-elevation-0` to `mo-elevation-3` and `mo-elevated-1` to `mo-elevated-3`

Plain classes for a plain element, like `mo-type-*`. They go in `@layer utilities`, in `theme/styles/elevation.css`, which is imported where
`type.css` is.

- **`mo-elevation-N`, a surface:**
  - `background-color: var(--mo-sys-elevation-levelN-color)`;
  - `color: var(--mo-sys-color-on-surface)`;
  - `box-shadow: var(--mo-sys-elevation-levelN-rest-shadow)` (`none` in Material).
- **`mo-elevated-N`, a shadow only:** `box-shadow: var(--mo-sys-elevation-levelN-shadow)`, no background and no colour. There is no
  `mo-elevated-0`, because level 0 has no shadow.
- **Only 0 to 3.** M3 says "An element's resting state can be on levels 0 to +3", so there are no classes for 4 and 5.
- **Pointed at.** Only an element that can be clicked moves up, and only when the device can hover: `a`, `button`, `summary`,
  `[role=button]` or `[tabindex]`. M3: "increase elevation by 1 level when hovered". An elevated object takes `--mo-sys-elevation-level(N+1)-shadow`; a
  surface takes the elevation shadow of level N+1 (`--mo-sys-elevation-level(N+1)-rest-shadow`, so nothing in Material, where the state layer shows the hover, as on the search
  bar). The colour stays the same.
- **Dragged.** `[data-dragged]` gives `--mo-sys-elevation-level(N+3)-shadow` on both, because a dragged thing passes over other content and needs M3's
  "protection against a background". That is M3's step for cards: filled 0 → 3, elevated 1 → 4. It is never above 5.
- **Focus.** With focus, the element stays as at rest, like the parts (`tokens/ui/ref.css`). The focus ring shows the focus.
- **Motion.** The change of shadow uses the theme's effects spring (`var(--mo-sys-motion-spring-default-effects)`) and no duration of its own.
- **Never on an M3 part.** A part has its own level for every state, and a class would win the cascade and freeze it. To give a part
  another level, a theme sets the part's `--mo-comp-*` token. The check below fails when a `mo-elevation-*` or `mo-elevated-*` class sits
  on an element that has a part class (the part classes of `theme/styles/files.mjs`).
- **On a section colour.** The level colours are surface containers. Inside a coloured section a surface follows the section colours spec
  (`specs/2026-11-20-section-colours-design.md`: a filled thing takes the reversed pair). The batch checks the classes on every section colour in light
  and dark mode (`check:contrast`), because M3 asks for edges with "sufficient contrast". Where a level doesn't stand out on a
  section colour, the section's swap in `theme/styles/global.css` gives it the matching container role. The class never writes a
  colour of its own.

Who uses them:

- the CMS's own blocks and layouts in place of their own level rules, starting with `person-facts.css` (a surface, `mo-elevation-1`);
- themes in their layouts and templates;
- apps in their blocks' `View.tsx`.

The classes are listed where `mo-type-*` is described, and later in the developer guide (0.22.1).

### The check

`check:css-values` gets shadows. It covers the same files and uses the same allowlist with reasons
(`scripts/check-css-values.allow.mjs`).

- **What fails.** It runs on every `box-shadow` and `filter: drop-shadow()` in the CSS, and on every `boxShadow` in TSX. An entry
  fails if it is not `inset` and has a blur or an offset, unless it is:
  - a level token, `var(--mo-sys-elevation-levelN-shadow)` or `--mo-sys-elevation-levelN-rest-shadow`;
  - a part's `--mo-comp-*` variable whose fallback is a level token.

  The message names the fix: "Use the class `mo-elevated-2` or `var(--mo-sys-elevation-level2-shadow)`", with the nearest level.
- **What passes.** Lines and rings are not elevation and pass:
  - inset edges;
  - spread-only rings with no offset and no blur, such as focus rings and outlines;
  - the `kbd` key edge, which has an offset and no blur (allowlisted: it draws a key, not a height).
- **The level definitions.** They are the one place values are written (`tokens/ui/ref.css`, `tokens/material/ref.css`), and they
  are exempt.
- **The second rule.** The check also fails on a `mo-elevation-*` or `mo-elevated-*` class together with a part class (above).

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
color fill". The Material theme sets every `--mo-sys-elevation-levelN-rest-shadow` to the level's full shadow (`tokens/material/ref.css:28-32`), and every part reads
`--mo-sys-elevation-levelN-rest-shadow` at rest, so every part at level 1 or more draws a shadow at rest, also where M3 shows none. `theme/styles/elevation.test.mjs`
checks only that a rule names the level we chose, from our own reading, and treats a level and its shadow as one thing, so it locked these in.

**What changes.** Every part is either a surface on its level or an elevated object (*Elevation and elevated*):

- **A surface** reads `--mo-sys-elevation-levelN-rest-shadow` at rest, as today, so it loses its shadow when Material sets the elevation
  shadow to `none`, with no change to the part's own CSS. Its level's colour stays.
- **An elevated object** reads `--mo-sys-elevation-levelN-shadow` at rest (through its `--mo-comp-*` token), so it keeps the shadow M3
  shows.
- **A lift** (hover, pressed, dragged) reads `--mo-sys-elevation-levelN-shadow` where M3 prints one, and is removed where M3 prints none.

The parts that are surfaces (they lose their shadow by the token change alone, or need the fix in the table):

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
| Carousel item | surface, level 0, hover level 1 | no lift on hover | hover level 1 (`--mo-sys-elevation-levelN-shadow`) |
| Switch and slider handles (Expressive) | the handle elevation tokens are deprecated; Expressive prints none | level 1 shadow (`ui/switch.css:117`, `ui/slider.css:226`, `:237`) | no shadow |

Also surfaces, already right once the token is `none`: the navigation rail, the standard side sheet, lists (their dragged level 4 is a lift,
`--mo-sys-elevation-levelN-shadow`), filled and outlined cards at rest, icon buttons, segmented buttons, button groups, tabs, text fields, badges and progress
indicators.

The elevated objects (they keep their shadow, so each one moves to `--mo-sys-elevation-levelN-shadow` at rest in the same pull request):

| Part | M3 | Fix besides `--mo-sys-elevation-levelN-shadow` |
| --- | --- | --- |
| Elevated card | surface-container-low, level 1, hover 2, dragged 4 | none |
| Elevated chip, elevated button | level 1 | Expressive buttons: no hover lift (the hover lift tokens are deprecated in the Expressive sets; today elevated hover 2, filled and tonal hover 1, `ui/buttons.css:159-204`) |
| FAB and extended FAB | level 3 | none |
| Basic dialog, time picker | level 3 | none |
| Menus | level 2 | none |
| Snackbar, rich tooltip | level 3 and 2 | none |
| Modal side sheet, modal bottom sheet | level 1 | the bottom sheet from 600 dp is level 3 today (`ui/bottom-sheet.css:206`): level 1 |
| Modal navigation drawer | surface-container-low, level 1 | surface-container today (`ui/navigation-drawer.css:51-52`): surface-container-low |
| Floating toolbar and its menu | level 3 | vibrant: primary-container (toolbar) and tertiary-container (menu), primary today |

Batch 3 confirms each part's kind from M3's token copy and the overview pages before it changes it; where a page and this table differ, the
page wins and the table is corrected in the same pull request.

**Other current shadows.** The video facade's icon (`theme/styles/blocks/prose.css:113`, `drop-shadow(0 2px 8px rgb(0 0 0 / .5))`)
is hand-written: it sits on a video, M3's case for a shadow ("Protect elements"), and takes a level shadow in batch 2. The colour picker's dots
(`src/editor-ui.css:195-203`, `:288`) and Tailwind's empty lists (`src/editor-screens.css:657`, `src/editor-settings.css:1539`,
`:1703`) are the fixes already listed. The editor's dragged block (level 4, a lift) and contextual menu (level 2, elevated) match M3's
dragged and menu levels.

**The test.** `elevation.test.mjs` is rewritten to compare each part with M3's own tokens, the level and its kind (a surface or
elevated) per state, read from the M3 token copy (`docs/m3-tokens/`, owner, 20 November 2026: "only the tokens … go ahead") with a short list of the
overview pages' "no shadow" sentences, which the tokens don't carry. A part that differs fails, so a value from our own reading can't lock
in a mistake again.

The copy was made on 20 November 2026 (M3 content version `2026-11-19_06-20-01`, 184 token sets). It gives every part's level (346
`md.comp.*.elevation` tokens in 86 sets, for example `md.comp.search-bar.container.elevation` = level 3 on `surface-container-high`), but no
shadow values (only `shadow-color` = `shadow`, and also on the navigation bar, which M3 draws with "No shadow"). So the tokens give the level,
and the overview sentences give the kind. Batch 3 commits the script as `scripts/m3-tokens.mjs` (Node, no dependency, run by hand and never
in CI) and its output as `docs/m3-tokens/`, keeping each token's reference and its public M3 value (audience 3P, light and dark) without
the other contexts, so the copy stays small.

## Decisions

1. **Component levels in a customizer** (then 0.22.2, now an idea without a version). Decided by the owner on 20 November 2026: "No, save the shadow changer in a none planned customizer feature". A component keeps
   M3's level (M3: "Avoid changing the default elevation of Material components"); a theme can still change one part's level
   through its token. A site-wide *Shadows at rest* (`On`/`Off`) setting, which sets the `--mo-sys-elevation-levelN-rest-shadow` tokens, is saved in the
   roadmap's *Ideas without a version* for a customizer that has no version yet.
2. **When.** Decided by the owner on 20 November 2026: "add it to the 0.19 ui fixes". It ships in **0.19.5 Material 3 tokens** (the
   UI fixes moved to 0.19.6), as two pull requests into that release's feature branch. It needs no contract change for the CMS's own code.

## Batches (pull requests into the 0.19.5 feature branch)

1. **The classes.** If it is 0.19.5's first pull request, it sets the version (`plans/2026-11-19-version-at-feature-start.md`).
   It adds `theme/styles/elevation.css` with its tests in `elevation.test.mjs`: `mo-elevation-0` to `-3` and `mo-elevated-1` to `-3`,
   the hover and dragged steps, and no colour on `mo-elevated-*`. The tokens screen shows a sample of each class and calls `--mo-sys-elevation-levelN-rest-shadow` the
   elevation shadow. `person-facts.css` uses the class.
2. **The check and the fixes.** Adds shadows and the part rule to `check:css-values`, fixes the colour picker's handle, removes
   Tailwind's empty shadow lists and closes deviation 12. Adds a release note line, because a theme or app developer can now use the
   class (skill `release-notes`).

3. **The current parts.** Material's elevation shadow set to `none` (`tokens/material/ref.css`, `tokens/ui/ref.css`, with the owner's
   words), the elevated objects moved to `--mo-sys-elevation-levelN-shadow`, the fixes in both tables, and `elevation.test.mjs` against M3's tokens. It goes after
   batch 1, which it needs for nothing, but before any other pull request that touches a part's shadow. Measured again in the built demo and the editor, at rest, hovered, focused, pressed and dragged. A release note line: search
   bars and bars lose their shadow, as Material 3 draws them (skill `release-notes`).

Elevation is done when `check:css-values` fails on a hand-written shadow, every part is a surface or an elevated object as M3 draws it, the classes are on the demo and on the tokens screen,
the owner has seen them on the demo, and 0.19.5 has run on staging.
