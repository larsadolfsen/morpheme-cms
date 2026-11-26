# Themes are classified, not tested, for accessibility

Architect, 25 Nov 2026. Line: **0.19.8** (owner, 25 Nov 2026; `plans/2026-11-25-0-19-8.md`, task 17). Status: **draft, waiting for the
owner's yes.** Replaces the gate of `specs/2026-11-21-theme-accessibility-statement-design.md` (*The checks keep it honest*); its file
format and its row on the theme page stay.

## The decision (owner, 25 Nov 2026)

- "We agreed upon not testing themes for wcag etc, but classify instead."
- Not even the page and post editor is held to WCAG 2.2 AA by a hard check: "No, because this may run on the site theme."
- "it stays a hard check for our base theme when we implement it" (the base theme of `specs/2026-11-21-base-theme-notes.md`, 0.22.3).
- The split, proposed by the Architect, approved by the owner ("1 yes, 2 yes"):
  - **A theme's values are classified, never failed:** contrast, sizes, target sizes, corners, spacing, the focus ring's colour. That
    is design. What the checks measure becomes the theme's statement on its page.
  - **Our code's behaviour is a hard check on every theme:** keyboard use, a focus ring at all, names for screen readers, roles and
    states. No theme can change these, so a failure is a CMS bug whatever the theme.
  - **The statement is measured, never hand-written,** so it never claims more than the theme does.

Why: on 25 Nov 2026 a CMS check measured Venus against Material's values, and Venus was changed to pass it (morpheme-apps #49, three
commits reverted on the owner's word: "Venus must look like venus"). A theme's look is the theme maker's; the site owner sees on the
theme's page what it meets, and chooses.

## The two kinds of finding

Every accessibility finding of `check:contrast`, `check:a11y`, `check:announce`, `check:keyboard` and the `check:screens` units is one
of two kinds. `lib/accessibility.mjs` holds the list, by WCAG criterion and, for axe-core, by rule id, so one rule decides everywhere.

| Kind | WCAG criteria (2.2 AA) | axe-core rules | What happens |
| --- | --- | --- | --- |
| **Theme value** | 1.4.3 Contrast (minimum), 1.4.11 Non-text contrast (edges, icons, the focus ring's colour), 2.5.8 Target size (minimum), 1.4.12 Text spacing, 1.4.4 Resize text, 1.4.10 Reflow | `color-contrast`, `target-size`, `link-in-text-block` | measured, classified into the theme's statement, printed; never a failure |
| **Our code** | 1.1.1, 1.3.1, 2.1.1 Keyboard, 2.1.2 No keyboard trap, 2.4.3 Focus order, 2.4.7 Focus visible (a ring is drawn at all), 2.4.11 Focus not obscured, 2.4.6, 3.3.1, 3.3.2, 4.1.2 Name, role, value, 4.1.3 Status messages | every other rule | a failure, as today, on every theme; its allowlist (`a11y-allowlist.json`, `keyboard-allowlist.json`, `announce-allowlist.json`) only shrinks |

- A finding the table does not place is **our code** until the Architect places it (so nothing slips through as a theme value by
  accident). The pull request lists each check it touched and the kind it gave each finding.
- 1.4.10 and 1.4.4 are theme values only where the theme's sizes cause them (a theme's spacing token); a page that scrolls sideways
  because of our markup is our code. The unit says which, from what it measured.
- **2.4.7 is split:** our code must draw a focus ring on keyboard focus with every theme (a hard check: an outline or ring is present
  and not `none` or transparent); its colour against what is behind it is a theme value (1.4.11).
- **The base theme**, when it is built (0.22.3), runs every finding as a hard check: nothing is classified for it. Its id is written
  in `lib/accessibility.mjs` when it lands; until then no theme is hard-checked for theme values.

## The statement

1. **Measured.** One command, `morpheme accessibility [<theme>]`, runs the measuring checks with the theme and writes its
   `accessibility.json`: `{ "standard": "WCAG 2.2 AA", "measured": "<CMS version>", "fallsShort": [ { criterion, part, why } ] }`.
   `why` is what was measured, in one sentence with the numbers (`"Outlined card edge 1.6:1 on the surface, under 3:1"`). A person may
   add a reason after it (`"…; Material 3's outline-variant as printed"`); the command keeps an added reason while the finding stays.
2. **Never a failure.** The checks no longer stop on a theme value, named or not, and no longer call an entry stale. They print what they
   found and, if the theme's file differs from it, one line: `accessibility.json is not what was measured: run morpheme accessibility`.
3. **Where it is written.**
   - Material: CI's `static` job runs the command for `theme/` and fails only if the committed file differs (the file is a measured
     result kept in the repository, like a snapshot, not a WCAG gate). The developer runs the command and commits the file.
   - A store theme: `morpheme-apps`' `npm run release` runs the command before it sends the theme, so the released statement is the
     measured one. `npm run check` there prints the classification and never fails on it.
   - A site's own theme (`src/themes/<id>/`): `check:themes` prints the classification; the site's editor shows "Accessibility: not
     checked" until its file is written by the command.
4. **Parts.** `PARTS` in `lib/accessibility.mjs` grows to every part a theme value can be measured on (text, placeholder, outlined
   card edge, section edges, icon, control edge, focus ring colour, target size …), each with its criterion and its label for the theme
   page. A part is added in the pull request that first measures it, as today.

## On the theme page

The row of `specs/2026-11-21-theme-accessibility-statement-design.md` stays: "Accessibility: meets WCAG 2.2 AA, …" or "Accessibility:
falls short of WCAG 2.2 AA" with the parts under it, each with its criterion. One change: under the parts, one line "Measured with
Morpheme <version>." (the file's `measured`). New labels in `src/i18n/en-US/library.ts` first (`themeA11y…`, drawn in `src/Library.tsx`), then `da-DK/` (skill `site-editor-writing`).

## What changes in the code (read on `origin/main`, 25 Nov 2026)

- `lib/accessibility.mjs`: the two kinds; `judgeShortfalls` classifies a theme value and fails only our code; the stale rule goes.
- `scripts/screens/support/statement.mjs` (`shortfall`): classifies, never adds a problem.
- `scripts/screens/inline-blocks.mjs`: the 24 px target size for a theme other than Material (0.19.7) becomes a 2.5.8 finding, not a
  problem. Material's exact M3 values (`isMaterialTheme()`) stay a hard check: that is M3 fidelity, not WCAG, and only for Material.
- `scripts/check-contrast.mjs`, `scripts/check-a11y.mjs`, `scripts/announce.mjs`, `scripts/check-keyboard.mjs`: each finding goes
  through the one rule. The allowlists keep only our-code entries; theme-value entries move out of them.
- `bin/` gets `morpheme accessibility`; `theme/accessibility.json` is rewritten by it.

## Tests

```
1. Material's statement on its page
   Where: /editor/#appearance/themes/saturn (Material's page; from /editor/#appearance/themes, open Material), computer 1280, light
   Do: scroll to the Accessibility row
   Expect: the Accessibility row says "falls short of WCAG 2.2 AA" and lists each part with its criterion, the same parts as
     theme/accessibility.json in the pull request; under them "Measured with Morpheme 0.19.8."
   Source: this spec, On the theme page

2. The same in Danish
   Where: same, the editor's language Danish (/editor/#account)
   Expect: the row and the parts in Danish
   Source: this spec, On the theme page; skill site-editor-writing

3. A phone
   Where: same, phone 390
   Expect: the row and its parts fit; no sideways page scroll
   Source: this spec, On the theme page

4. Nothing a person sees changes elsewhere
   Where: /, /blocks/cards/, /editor/#src/content/pages/about.md, computer 1280
   Expect: as on morpheme-demo (the change is in the checks)
   Source: this spec, What changes in the code
```

**Proved by the pull request, not by QA** (unit tests in `node --test`, named in the pull request; the PM reads them in CI):

- a theme value that a theme does not name is printed, not failed (contrast, target size), with a fixture theme;
- an our-code finding fails with every theme (a button with no name, a keyboard trap, a control with `outline: none` on focus);
- `morpheme accessibility` writes the measured file and keeps an added reason; Material's committed file equals what it measures;
- a finding the table does not place is treated as our code;
- morpheme-apps #49's case: Venus at its own values (44 px small button, 24 px leading space, 24 px dialog corners) gives no failure.

## Delivered with it

- The `CLAUDE.md` wording below; `specs/2026-11-21-theme-accessibility-statement-design.md` gets under its title: "Changed on 25 Nov
  2026: the checks classify a theme's values and never fail on them (`specs/2026-11-25-themes-classified-design.md`)."
- `specs/2026-11-21-base-theme-notes.md` gets: "The base theme is hard-checked for every WCAG 2.2 AA finding, theme values included
  (owner, 25 Nov 2026)."
- A release note in both languages ("The theme page says what each theme meets, measured by Morpheme"); the changeset the base allows.

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
Owner, 19 Nov 2026: the sites the CMS builds and the editor aim at **WCAG 2.2 level AA**. Where Material 3 and WCAG differ, **Material 3
wins** (owner, 21 Nov 2026: "we follow MD3 even if it does not comply with accessibility").

Themes are classified, not tested (owner, 25 Nov 2026), the page and post editor included, as it may run on the site's theme: a theme's
values are measured and written into its statement, never failed; our code's behaviour (keyboard, a focus ring, names, roles and states)
is a hard check on every theme; the base theme (0.22.3) is hard-checked on everything. The rules: skill `theme`, section 5.
```
