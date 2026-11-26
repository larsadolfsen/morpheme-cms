# Themes are classified, not tested, for accessibility

Architect, 25 Nov 2026; changed 26 Nov 2026 (the score). Line: **0.19.8** (owner, 25 Nov 2026; `plans/2026-11-25-0-19-8.md`, task 17).
Status: **approved by the owner, 26 Nov 2026** ("Yes to the rest of the five questions"; the score: "I was thinking that we could use
our seo score wheel", gallery and thresholds "1 yes 2 yes"). Replaces the gate of
`specs/2026-11-21-theme-accessibility-statement-design.md` (*The checks keep it honest*) and its list of shortfalls on the theme page;
its row on the theme page stays, with the score in it.

## The decision (owner, 25 Nov 2026)

- "We agreed upon not testing themes for wcag etc, but classify instead."
- Not even the page and post editor is held to WCAG 2.2 AA by a hard check: "No, because this may run on the site theme." (Owner, 26 Nov 2026: "Base theme adheres to wcag. Not others." Only the base
  theme adheres to WCAG 2.2 AA; the rest of this spec stands, since "not others" is about theme values. `CLAUDE.md`, *Accessibility*, says so.)
- "it stays a hard check for our base theme when we implement it" (the base theme of `specs/2026-11-21-base-theme-notes.md`, 0.22.3).
- The split, proposed by the Architect, approved by the owner ("1 yes, 2 yes"):
  - **A theme's values are classified, never failed:** sizes, target sizes, corners, spacing, the focus ring's width and offset. That
    is design. What the checks measure becomes the theme's statement on its page.
  - **Our code's behaviour is a hard check on every theme:** keyboard use, a focus ring at all, names for screen readers, roles and
    states. No theme can change these, so a failure is a CMS bug whatever the theme.
  - **Colours are not the theme's** (owner, 26 Nov 2026): "No, the colors are chosen by the user. Our color editor is responsible for contrast". A theme writes no colour, so
    contrast (1.4.3, 1.4.11 as colour, the focus ring's colour) is the colour editor's (`src/Colors.tsx`) and is in no theme's checks or score.
  - **The statement is measured, never hand-written,** so it never claims more than the theme does.

Why: on 25 Nov 2026 a CMS check measured Venus against Material's values, and Venus was changed to pass it (morpheme-apps #49, three
commits reverted on the owner's word: "Venus must look like venus"). A theme's look is the theme maker's; the site owner sees on the
theme's page what it meets, and chooses.

- The statement is a score (owner, 26 Nov 2026): the theme's measured values are scored like a page's SEO rating, in the same score
  wheel (`ScoreRing`), green from 90, orange from 50, else red; on the theme's page and on each theme in the store's gallery.

## The two kinds of finding

Every accessibility finding of `check:contrast`, `check:a11y`, `check:announce`, `check:keyboard` and the `check:screens` units is one
of three kinds. `lib/accessibility.mjs` holds the list, by WCAG criterion and, for axe-core, by rule id, so one rule decides everywhere.

| Kind | WCAG criteria (2.2 AA) | axe-core rules | What happens |
| --- | --- | --- | --- |
| **Theme value** | 2.5.8 Target size (minimum), 1.4.12 Text spacing, 1.4.4 Resize text, 1.4.10 Reflow | `target-size`, `link-in-text-block` | measured, scored into the theme's accessibility score, printed; never a failure |
| **Colour** (the site owner's, not the theme's) | 1.4.3 Contrast (minimum), 1.4.11 Non-text contrast (edges, icons, the focus ring's colour) | `color-contrast` | printed only for Material on the demo's colours, as today, and in the last `check:contrast` scan; never a failure; under no theme (not on its page, not in its output, not in its file) and in no score. The colour editor makes the colours. |
| **Our code** | 1.1.1, 1.3.1, 2.1.1 Keyboard, 2.1.2 No keyboard trap, 2.4.3 Focus order, 2.4.7 Focus visible (a ring is drawn at all), 2.4.11 Focus not obscured, 2.4.6, 3.3.1, 3.3.2, 4.1.2 Name, role, value, 4.1.3 Status messages | every other rule | a failure, as today, on every theme; its allowlist (`a11y-allowlist.json`, `keyboard-allowlist.json`, `announce-allowlist.json`) only shrinks |

- A finding the table does not place is **our code** until the Architect places it (so nothing slips through as a theme value by
  accident). The pull request lists each check it touched and the kind it gave each finding.
- 1.4.10 and 1.4.4 are theme values only where the theme's sizes cause them (a theme's spacing token); a page that scrolls sideways
  because of our markup is our code. The unit says which, from what it measured.
- **2.4.7 is split:** our code must draw a focus ring on keyboard focus with every theme (a hard check: an outline or ring is present
  and not `none` or transparent); its colour against what is behind it is the site's colour (1.4.11), not the theme's.
- **The base theme**, when it is built (0.22.3), runs every finding as a hard check: nothing is classified for it. Its id is written
  in `lib/accessibility.mjs` when it lands; until then no theme is hard-checked for theme values.

## The score

1. **Measured.** One command, `morpheme accessibility [<theme>]`, runs the measuring checks with the theme and writes its
   `accessibility.json`: `{ "standard": "WCAG 2.2 AA", "measured": "<CMS version>", "score": <0 to 100>, "checks": [ { criterion, part,
   ok, why } ] }`. Every measured theme value is one check (a part on a criterion: "Small button, 2.5.8"), whether it passes or not. `why` is what was measured, in one sentence with the numbers (`"Small button 16 px, under 24 px"`). A person may add a reason after it (`"…; Material 3's small button as printed"`); the command keeps an
   added reason while the check stays as it is.
2. **Scored like SEO.** `score` is the share of checks passed, rounded: `scoreOf(checks)` (`src/ui.tsx`), the same function as the SEO
   rating, imported, not copied. No weights. A theme with no measured check has no score (the row says "Not measured").
3. **Never a failure.** The checks no longer stop on a theme value, named or not, however low the score. They print the score and the
   checks that did not pass and, if the theme's file differs from what was measured, one line: `accessibility.json is not what was
   measured: run morpheme accessibility`.
4. **Where it is written.**
   - Material: the file is a measured result kept in the repository, like a snapshot, so the demo, its Previews and the npm package carry
     it (the demo is built on Cloudflare, which cannot measure). The developer runs the command and commits the file; CI's `static` job
     runs it again for `theme/` and fails only if the committed file differs in its parts, their pass or fail, or the score (a pixel count is not compared: the same page measures a few px apart on two machines). That is a check that the file is current, never a WCAG
     gate: a low score passes.
   - A store theme: `morpheme-apps`' `npm run release` runs the command before it sends the theme, so the released score is the measured
     one, and sends `score` and `measured` with the theme's entry (`themeEntry` in `scripts/release-store.mjs`). `npm run check` there
     prints the score and never fails on it.
   - A site's own theme (`src/themes/<id>/`): `check:themes` prints the score; the site's editor shows "Not measured" until its file is
     written by the command.
5. **Parts.** `PARTS` in `lib/accessibility.mjs` is one part for each interactive part the theme styles, all on 2.5.8 (24 px): segmented button, button in each of its five sizes, icon button, floating action button, chip, switch, checkbox, radio button, slider handle, text field, menu item, tab, list item, carousel control, navigation bar and rail item and sheet drag handle (20 parts; the gallery on `/ui/` already draws the theme's navigation bar, rail and sheets, so the two parts that were left out in #1260 return with the scan visiting an item the gallery draws as a span, since it gives no address). Each is its own check, so the score is the share of parts that meet 24 px; a part is added in the pull request that first measures it, a part nothing measured has no check, the size is the area that takes the click (the scan tests which points reach the control, never the state layer by assumption: Material's Checkbox and Radio button Specs give a 48dp target), and the spacing exception of 2.5.8 is not read. Corners and spacing have no WCAG criterion and stay out. The focus ring's width and offset are a later part (no scan measures them today). No colour part is in it. Each part has its criterion and its label for the theme
   page. A part is added in the pull request that first measures it, as today. Adding a part can change a theme's score; the pull
   request says which scores moved.

## On the theme page

The Accessibility row of `specs/2026-11-21-theme-accessibility-statement-design.md` stays, and holds the theme's score in the
`ScoreRing` at its start (the part as it is, `src/ui.tsx`), its label for screen readers "Accessibility score <n>", its text the
standard and "Measured with Morpheme <version>." (the file's `measured`). A tap on the row opens the checks as the `CheckList` the SEO
rating uses: the ones not passed first, each with its part, its criterion and its `why`. No list of shortfalls is printed on the page
itself. New labels in `src/i18n/en-US/library.ts` first (`themeA11y…`, drawn in `src/Library.tsx`), then `da-DK/` (skill
`site-editor-writing`).

## In the store's gallery

Each theme in the editor's gallery of store themes (`#appearance/themes`, the store's themes) shows its score in the same `ScoreRing`
in its row or card, so themes can be compared before one is installed; a theme released before this has no ring. The store keeps
`score` and `measured` with each theme version it receives (`larsadolfsen/morpheme-appstore`: the release accepts the two fields and the
catalog returns them; a pull request there, by this line's PM, before the editor shows them). A version's score is never changed after
it is released (a version is forever).

## What changes in the code (read on `origin/main`, 25 Nov 2026)

- `lib/accessibility.mjs`: the two kinds; `judgeShortfalls` classifies a theme value and fails only our code; the stale rule goes.
- `scripts/screens/support/statement.mjs` (`shortfall`): classifies, never adds a problem.
- `scripts/screens/inline-blocks.mjs`: the 24 px target size for a theme other than Material (0.19.7) becomes a 2.5.8 finding, not a
  problem. Material's exact M3 values (`isMaterialTheme()`) stay a hard check: that is M3 fidelity, not WCAG, and only for Material.
- `scripts/check-contrast.mjs`, `scripts/check-a11y.mjs`, `scripts/announce.mjs`, `scripts/check-keyboard.mjs`: each finding goes
  through the one rule. The allowlists keep only our-code entries; theme-value entries move out of them.
- `bin/` gets `morpheme accessibility`; `theme/accessibility.json` is rewritten by it, in the new form (`score`, `checks`).
- `src/Library.tsx`: the Accessibility row with the `ScoreRing` and the checks; the store gallery's ring.
- `morpheme-apps`: `scripts/release-store.mjs` (`themeEntry`) sends `score` and `measured`; `morpheme-appstore` keeps and returns them.

## Tests

```
1. Material's score on its page
   Where: /editor/#appearance/themes/saturn (Material's page; from /editor/#appearance/themes, open Material), computer 1280, light
     and dark
   Do: scroll to the Accessibility row
   Expect: the row starts with the score ring showing the score in theme/accessibility.json of the pull request, green from 90,
     orange from 50, else red, the same ring as a page's SEO score; then "WCAG 2.2 AA" and "Measured with Morpheme 0.19.8."; no list of
     parts on the page
   Source: this spec, On the theme page

2. The checks behind the score
   Where: same
   Do: tap the Accessibility row; then press Tab to it and Enter
   Expect: the checks open as the SEO rating's check list, the ones not passed first, each with its part, its criterion and the
     measured value; it opens by keyboard too, and a screen reader names the ring "Accessibility score <n>"
   Source: this spec, On the theme page

3. The same in Danish
   Where: same, the editor's language Danish (/editor/#account)
   Expect: the row, the ring's name and the checks in Danish
   Source: this spec, On the theme page; skill site-editor-writing

4. A phone
   Where: same, phone 390
   Expect: the row, the ring and the checks fit; no sideways page scroll
   Source: this spec, On the theme page

5. The store's gallery
   Where: /editor/#appearance/themes, the store's themes, computer 1280 and phone 390 (on morpheme-staging, signed in, once a theme
     has been released with a score; a store release is the owner's word only, so until then this test waits and the unit test
     below stands for it)
   Expect: each theme released with a score shows its ring; one released before shows none
   Source: this spec, In the store's gallery

6. Nothing a person sees changes elsewhere
   Where: /, /blocks/cards/, /editor/#src/content/pages/about.md, computer 1280
   Expect: as on morpheme-demo (the change is in the checks)
   Source: this spec, What changes in the code
```

**Proved by the pull request, not by QA** (unit tests in `node --test`, named in the pull request; the PM reads them in CI):

- a theme value that a theme does not name is printed, not failed (target size), and a weak colour is printed and in no score, with a fixture theme;
- an our-code finding fails with every theme (a button with no name, a keyboard trap, a control with `outline: none` on focus);
- `morpheme accessibility` writes the measured file with every check and its `score` from `scoreOf`, and keeps an added reason;
  Material's committed file equals what it measures;
- a theme whose score is low (a fixture at 20) gives no failure;
- a finding the table does not place is treated as our code;
- the gallery draws a ring for a catalog entry with `score` and none for one without (a fixture catalog);
- morpheme-apps #49's case: Venus at its own values (44 px small button, 24 px leading space, 24 px dialog corners) gives no failure.

## Delivered with it

- The `CLAUDE.md` wording below; `specs/2026-11-21-theme-accessibility-statement-design.md` gets under its title: "Changed on 25 Nov
  2026: the checks classify a theme's values and never fail on them, and the theme page shows a score instead of a list
  (`specs/2026-11-25-themes-classified-design.md`)."
- `specs/2026-11-21-base-theme-notes.md` gets: "The base theme is hard-checked for every WCAG 2.2 AA finding, theme values included
  (owner, 25 Nov 2026)."
- A release note in both languages ("Each theme shows an accessibility score, measured by Morpheme, on its page and in the store"); the changeset the base allows.

## The skill `theme` (owner, 25 Nov 2026: "1 yes, 2 yes")

The rules for theme makers move into one new skill, `.claude/skills/theme/SKILL.md` (the text: `theme-SKILL.md`, sent with this spec):
the theme contract ("Hvad et tema må" from `morpheme-website/docs/rules.md`, in English and checked against `themeProblems`), its
tokens and class names, Material's exact M3 values, and section 5 of this spec. With it:

- `CLAUDE.md`'s skills table gets `| \`theme\` | you build, change or check a theme (Material, Venus, a store or a site's theme) |`.
- `.claude/skills/checks/SKILL.md`, where it describes `accessibility.json`: one line, "Theme values are classified, never failed; our
  code is a hard check on every theme (skill `theme`, section 5)."
- `.claude/skills/material-3/SKILL.md` line 39: "A theme's own look is the skill `site-editor-theme`" → "A theme's own look is the skill
  `theme`".
- `morpheme-apps/CLAUDE.md`, *Rules*: the first two bullets become "The theme contract, tokens and accessibility: the CMS's skill
  `theme` (`larsadolfsen/morpheme-cms`, `.claude/skills/theme/SKILL.md`)." (a pull request there, by the PM of the line).
- `morpheme-website`: *Hvad et tema må* in `docs/rules.md` and the skill `site-editor-theme` become a pointer to the CMS's skill `theme`
  (a pull request there). The site's own CLAUDE.md line about themes points there too.

## CLAUDE.md, *Accessibility: WCAG 2.2 AA*

Replace the section's two paragraphs with:

```
Only the **base theme** (0.22.3) adheres to **WCAG 2.2 level AA** (owner, 26 Nov 2026: "Base theme adheres to wcag. Not others."). Other themes are measured
and scored (the SEO score wheel, on their page and in the store), never failed; our code's behaviour (keyboard, a focus ring drawn at all, names, roles, states and status
messages) is checked on every theme (owner, 25 Nov 2026). Where Material 3 and WCAG differ, **Material 3 wins** (owner, 21 Nov 2026: "we follow MD3 even if it does not comply
with accessibility"). This replaces the aim of 19 Nov 2026 for the sites and the editor, and the rule of 21 Nov 2026 that the page and post editor always meets WCAG 2.2 AA
(skill `material-3`, rule 6). The rules: skill `theme`, section 5.
```

## Score changes

- **Material, 26 Nov 2026 (0.19.8, touch-target fix):** 95 (19 of 20, after #1264) became 100 (20 of 20). The chip part measured 21 px (the removable input chip's own button, "Selected"
  on `/ui/`) and is now 40 px; the checkbox went from 28 to 49 px and the radio button from 36 to 48 px (the pixel counts are the scan's smallest click area, so a part in a
  group is its size plus half the gap on each side).
