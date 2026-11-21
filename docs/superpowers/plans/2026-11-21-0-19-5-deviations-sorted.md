# 0.19.5 batch 9: the recorded deviations, sorted

Status: **21 November 2026, for the PM's answer.** Nothing is changed yet (no CSS, no entry removed). Plan:
`plans/2026-11-20-0-19-5-material-3-tokens.md`, batch 9. Every entry of `docs/material-deviations.md` outside the editor's own workspace
(its bar, overflow menu, text and block menus) is sorted into one of the plan's three verdicts, plus two the plan does not name, which the
sorting needed:

- **GO** — it matches M3 Expressive after all, or M3 prints no value (so there is nothing to deviate from), or it is made to match: the entry goes.
- **WCAG** — WCAG 2.2 AA requires it: the entry stays and names the criterion.
- **OWNER** — the owner decided it in words where M3 prints a value (skill `material-3`, rule 5), or where Modern Web Guidance (priority 1) outranks M3:
  the entry stays, shortened, with the owner's words or the guide. It is **not** a "keep one of ours": the PM asks the owner whether to keep it.
- **OTHER BATCH** — another batch of 0.19.5 owns the token or rewrites the entry; this batch does not touch it, so there is no overlap.

**Sources.** M3 values come from the pages read with Playwright on 21 Nov 2026 (skill `material-3`, *Reading the real pages*, the Specs and
Guidelines tabs, text read) and from the CTO's tokens-only copy of the same site (`docs/m3-tokens/`, content `2026-11-19_06-20-01`), which holds the token
tables the pages keep collapsed. Pages read (Specs and Guidelines tabs): `/components/menus`, `/cards`, `/lists`, `/chips`, `/dialogs`, `/search`, `/navigation-rail`; where a row quotes only a token, the page's prose said nothing more. Where a set has both, the Expressive value counts.

## The table

| # | Entry (file section, item) | M3 (page / token) | Ours | Verdict | Why |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | Section colours 1: coloured section is an inverted theme | M3 "has no guidance for a brand-coloured section" (section colours spec, read 20 Nov) | roles swapped in a section | OTHER BATCH (4, 8) | The section-colours batches rewrite the swap role for role; they rewrite this entry. |
| 2 | Section colours 2: surface containers are veils | opaque tones | 6–14 % veils | OTHER BATCH (4) | The two-colour design removes the veils. |
| 3 | Section colours 3: quieter text is full colour | `on-surface-variant` is lower emphasis | full on-colour in a section | OTHER BATCH (4) | Same design: only the section colour and its on-colour exist there; M3 silent. |
| 4 | Section colours 4: placeholders and icons held to AA | placeholder 60 %, disabled 38 % | 4.5:1 / 3:1 | **WCAG** 1.4.3, 1.4.11 | 60 % fails 4.5:1; stays, batch 4 keeps the sentence. |
| 5 | O1: outlined card edge is `outline` | `md.comp.outlined-card.outline.color` = `outline-variant` (1.5:1 on surface) | `outline` | **WCAG** 1.4.11 | Already in the allowlist as `wcag`. Stays as is. |
| 6 | O2: `outline` in a coloured section is the on-colour | M3 prints nothing for it | on-colour | OTHER BATCH (4) | Rewritten with the swap; the 3:1 reason is 1.4.11. |
| 7 | Colour sweep 1: status badges | no success or warning role; M3's way is custom colours | fixed colours | OTHER BATCH (8) | Colour allowlist; M3 silent until custom colours are built. |
| 8 | Colour sweep 2–5, 9: PageSpeed ratings, Google preview, colour picker, preview frame, brand favicons | not M3 parts (an imitation of Google, the owner's colour, an image) | fixed | GO | M3 prints no value for them; they are not themed parts. They stay as one line in the colour allowlist's reasons (batch 8), not as deviations. |
| 9 | Colour sweep 6: video still, white on black scrim | `scrim` role + on-colour | `#000` / `#fff` | OTHER BATCH (8) | Colour allowlist. |
| 10 | Colour sweep 7, 8: image masks, `#000000` shadow and scrim | `md.sys.color.shadow` / `scrim` are `#000000` | same | GO | It is M3's own value; a mask has no colour. |
| 11 | Colour sweep 10: AI sign-in page, system colours | none (a page with no theme) | CSS system colours | OWNER | Stays as one line: a standalone Worker page with no theme CSS cannot use roles. |
| 12 | Colour sweep 11: `--block-*` aliases | names | aliases of the roles | OTHER BATCH (0.20 names) | A rename, not a value. |
| 13 | Colour sweep 12: elevation and panel shadows | elevation tokens `level1`…`level5` | own blur values | OTHER BATCH (3, 5) | Closed by the elevation spec; its sentence says it closes this entry. |
| 14 | CSS sweep 1: dialog corner 28 / 32 dp | `md.comp.dialog.container.shape` = extra-large **28** | `--mo-sys-shape-corner-extra-large` (28) | **GO** | Matches. (32 is not a dialog token.) |
| 15 | CSS sweep 2: menu corner 16 dp | `md.comp.menus.container.shape` = large **16** | `--mo-comp-menu-container-shape` large | **GO** | Matches Expressive; the plan names it. |
| 16 | CSS sweep 3: hero buttons 56 px, list rows 56 / 72 / 88 | button medium **56**; list one / two / three line **56 / 72 / 88** | same | **GO** | Matches Expressive; the plan names it. |
| 17 | CSS sweep 4: icon button 48 dp container | `icon-button.small.container.height` **40**; target 48 | 48 container | OTHER BATCH (7) | Allowlist entry `icon-button-small-container-height` is batch 7's. The entry goes in the later of the two pull requests, with the invisible 48 target kept (the density entry 15 below). |
| 18 | CSS sweep 5 and FR1: one focus ring in `primary` | focus indicator `secondary`, 3 dp, offset 2 dp | `primary`, 3 dp, 2 dp | **WCAG** 1.4.11, 2.4.7 | A site's secondary can sit near the page colour and lose 3:1. Stays as FR1; the sweep line is dropped (same thing). |
| 19 | CSS sweep 6: checkbox error ring corner 3 px | checkbox container shape **2** | 3 px ring over the 2 px box | GO | Not a value of ours: a ring concentric with its box by FR1's offset. |
| 20 | CSS sweep 7: slider inner track corner, inline code, fallbacks | track shape 2 (inner), M3 has no inline code | same | GO | Equal to M3 or M3 silent. |
| 21 | CSS sweep 8: spacing | measurement tokens `space0`…`space700` (2…56 dp) | `--mo-ref-space-*` exist (`tokens/base/ref.css`) | GO | The tokens exist now; the old text is out of date. Tailwind's scale is gone (contract 7). |
| 22 | CSS sweep 9: type sizes in the editor's preview and unscaled `font-size` | the type scale | some sizes off scale | OTHER BATCH (7) | Allowlisted type entries are batch 7's; the preview matches the site. |
| 23 | CSS sweep 10: Google preview, crop handle sizes | none | Google's look, handle sizes | GO | M3 silent, editor imitation of Google. |
| 24 | Editor-only parts 1, 2: score ring, pickers | no M3 part | editor-only | GO | M3 silent. |
| 25 | Density 12: Large (+1) above M3's default | no step above 0 | Large adds 4 dp | OWNER | The owner offered Large in words (screenshot). Visible only where a theme picks it. The PM asks. |
| 26 | Density 13: horizontal padding does not change | M3 prints no rule | fixed | GO | M3 silent. |
| 27 | Density 14: list row never below the target | "Target size must be at least 48x48dp" (lists/specs, read) | 48 / 44 | **GO** | We follow M3's own rule. |
| 28 | Density 15: invisible target area | "extending beyond the visual bounds of an element" (structure) | `::after` area | GO | M3 prints exactly this. |
| 29 | Footer links 36 px | structure: "consider … 48 × 48dp", pointer 44 | 36 px | OWNER | "Make the footer links 36px high clickable" (owner, 14 Nov); M3 says "consider"; WCAG 2.5.8 (24 px) is met. |
| 30 | Image tiles 17: columns | M3 prints no card count | 2 / 3 / 4 | GO | M3 silent. |
| 31 | Image tiles 17 and G1: gap between cards | cards specs: "Padding between cards **8dp max**" (read) | 16 px compact, 24 px from medium (`--mo-sys-grid-gutter`) | **GO, made to match** | Visible. See *Needs the PM's answer*, 1. |
| 32 | Lightbox 19 | M3 prints no lightbox; dialog container 28 dp | own `<dialog>`, scrim-colour container | OWNER | Owner: "a dark layer" (image grid spec). The scrim mix goes to batch 8; the entry shrinks to the size and colour. |
| 33 | Choice group D1 | button groups "shouldn't wrap" | switches to a radio list | OWNER | Behaviour (owner, 14 Nov). Not 0.19.5. |
| 34 | Choice group D2 | M3 prints no sample slot | small sample in the row | GO | M3 silent. |
| 35 | Choice group D3 | list "Leading element left padding 16dp" | 0 inside the group | OWNER | Owner's alignment request, 14 Nov. Visible if reverted. |
| 36 | Palette P1, P2 | search / menus silent on a palette; "a secondary click … should activate a context menu" | search view runs actions; browser menu kept | P1 GO; P2 OWNER | P1 uses the nearest part. P2 is the owner's "no right click menu" (and the system menu). |
| 37 | Palette P3: more than two actions in the top bar | "one action, two if necessary" | up to four | OWNER, ends 0.20 | Temporary, ends with the 0.20 search app bar. |
| 38 | Crop view C1, B1, B2, B3 (pages on a phone, Save in a bottom sheet, settings in a pane) | full-screen dialogs allowed; Save in app bar; bottom sheet is "supplementary" | pages, panes | OWNER | Owner rules in words, 14–15 Nov. Layout and behaviour: not in 0.19.5 (plan). |
| 39 | C2: zoom slider inactive track | `slider.inactive.track.color` = **secondary-container** | secondary-container | **GO** | Matches M3; the entry's own reason (the theme's value is wrong) is batch 6's allowlist. |
| 40 | F1: FAB above the footer | M3 prints nothing about a footer | FAB lifts | GO | M3 silent. |
| 41 | Bottom sheet B3: side padding is the grid margin | prints no padding for content | grid margin | GO | M3 silent. |
| 42 | SV1: contained search view, no divider | contained = Expressive; divided "Not recommended" | contained | **GO** | Matches. |
| 43 | SV2, SV8, SV9, SV11: colour roles, paddings, chips, spacing "read as printed" | `search-view.contained.*`, chips specs (32 dp, 8 dp, 18 dp icon) | match | GO | They record matches, not deviations. |
| 44 | SV3: where M3 is silent | M3 silent on match highlight, quick results, remove button, docked placement | ours | GO | M3 silent; the "28 dp corner" line is out of date (SV13: 12). |
| 45 | SV4: search view is a layer on a phone | "Full-screen layout: Default for compact breakpoints" | full-window dialog | GO | Matches. |
| 46 | SV5: focus starts in the field | "often a leading icon button or text field" | field | GO | M3 says "often". |
| 47 | SV6: start screen bar all the time, 327 dp at 375 | bar width min 360 **and** unfocused margin 24 dp | 24 dp margin, 327 dp | OWNER | M3's two numbers cannot both hold on a 375 dp phone; owner asked for the bar to show (15 Nov). |
| 48 | SV7: docked view is a dropdown, no scrim | "Docked opens a list below the search bar, with a scrim" | no scrim | OWNER | "On desktop don't make a popup, I read make a drop down." (owner, 15 Nov). |
| 49 | SV10, SV12 (1)–(3), SV13 | new parts approved; List block rows on surface container | as listed | SV10, SV13 GO; SV12 OWNER | The List block's rows on surface container are owner-approved (surface rows on a surface page would hide the 2 dp gaps). The 12 dp hover corner and 8 dp group gap: M3 now prints 12 / 16 (tokens) and is silent on the gap, so GO. |
| 50 | A1: 2 dp ring on the search field | none | 2 dp ring | **WCAG** 2.4.7, 1.4.11 | Modern Web Guidance `accessibility` (priority 1). |
| 51 | E1: error text without `role="alert"` | "alert is applied to the role" | `aria-describedby` | OWNER | Modern Web Guidance (`validate-input-after-interaction`, `accessible-error-announcement`), priority 1 over M3. Stays as the record. |
| 52 | Footer F1: `aria-pressed` group | M3 prints no ARIA roles | `aria-pressed` | GO | M3 silent. |
| 53 | N1, N2 | navigation drawer "no longer recommended"; expanded rail; indicator may fill | expanded modal rail | **GO** | Matches Expressive. |
| 54 | N3: labels only and sub-pages | rail "must use icons … one word label" | text items, sub-pages | OWNER | A site's own pages have no icons; PM accepted it, 15 Nov. |
| 55 | N4: menu from the end edge | "placed on the leading edge" | owner setting | OWNER | `menuSide` is an owner setting. |
| 56 | N5: scrim, native dialog, no swipe | scrim, swipe | native `<dialog>` | OWNER | Modern Web Guidance `dialog` (priority 1). |
| 57 | N7: values only the images carried | expanded rail container `surface-container` (modal), item 56, width 220–360 (tokens) | as set | GO | Values read from the token copy; any difference found goes to the pull request. |
| 58 | T1: text measure 40ch–60ch | M3 prints no text width | 40ch–60ch | GO | M3 silent; it is the owner's rule, not a deviation. |
| 59 | Buttons B1: text button side padding | small button leading / trailing space **16**, medium **24** (the size's padding) | 24 on a 40 dp button | OTHER BATCH (7) | Batch 7 sets the sizes' padding; the text button then equals its size's, as M3 prints, and the entry goes. |
| 60 | Cards CM1: media bottom corners | M3 prints no media shape | card radius | GO | M3 silent (the container example draws it). |
| 61 | Cards CM2, CM3 | silent on type styles, gaps, price, badge | ours | GO | M3 silent. |
| 62 | Editor-only bars 3–12, text bar, block handle 18, selection 20, block action row | editor's own workspace | — | out of scope | Outside Material 3 (13 Nov). Not touched. |

Counts: GO 30 rows, WCAG 4, OWNER 14, OTHER BATCH 9, out of scope 1 (rows can hold several entries).

## What changes, if the PM agrees

1. Entries marked GO are removed from `docs/material-deviations.md` (row 31 only after the change).
2. Entries marked WCAG and OWNER stay, shortened to: what M3 prints (quoted), what we do, the criterion or the owner's words, the date.
3. The file gets a short ending section, *Where M3 is silent*, with the one-line list of GO-silent items (rows 8, 23, 24, 26, 30, 34, 40, 41, 44, 52, 58, 60, 61), so no choice is lost.
4. `scripts/m3-tokens.allow.mjs` loses no entry here (batch 9 owns none of its tokens).

## Needs the PM's answer before any CSS changes

1. **Row 31 (G1), visible.** M3 prints "Padding between cards 8dp max". Making it match means card gaps of 8 dp (cards block, price cards, panels,
   related posts, image grid, the editor's grids) instead of 16 / 24 dp. The owner decided 16 / 24 on 15 Nov 2026 (#743); the plan of 20 Nov names G1
   as "made to match". The page's grid gutter (`--mo-sys-grid-gutter`, M3 prints none) stays 16 / 24 for everything that is not a card. Do I change the
   cards' gap to 8 dp (`--mo-comp-card-gap`, the token that already exists)?
2. **The OWNER rows** (25, 29, 32, 33, 35, 36 P2, 37, 38, 47, 48, 49, 51, 54, 55, 56): each is a place where the owner decided against a printed M3 value, in
   words. Does the owner want to keep them? I keep all of them and shorten the entries unless the PM says otherwise. Rows 35 (radio rows at 0 padding)
   and 49 (List block rows on surface container) would change something visible if reverted.
3. **Row 17 and 59** depend on batch 7 (icon button 40 dp, button padding 16 dp). Both entries go in that PR or after it. Tell me whether you prefer
   that I remove them in my PR once batch 7 has merged.
4. **Rows 1–4, 6, 7, 9, 12, 13, 22** belong to other batches; I leave their text untouched. Batch 4 and the elevation batches must rewrite them.

If everything above is accepted, the pull request is almost only text (`docs/material-deviations.md`) plus the 8 dp card gap (row 31) and its release note.
