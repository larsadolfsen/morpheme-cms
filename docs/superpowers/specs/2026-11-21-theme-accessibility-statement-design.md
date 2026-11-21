# A theme's accessibility statement (design)

Status: **design, 21 November 2026.** Owner: "What I suggest is that we instead state on the theme page what it complies with", then "yes".
Version 0.19.5 (roadmap, *0.19.5 Material 3 tokens*). The store's part waits for its next release.

## The decision

- A theme may fall short of WCAG 2.2 AA. Its page in the editor says what it meets and where it falls short, so a site owner sees it
  before choosing the theme.
- Material follows Material 3 exactly on the site, including where M3 falls short of WCAG: the 60% placeholder, the Outlined card's
  `outline-variant` edge and the edges in a coloured section (`docs/material-deviations.md` 4, O1, O2 go). Its statement names them.
- The editor's own workspace still meets WCAG 2.2 AA. The checks still run on every theme; a shortfall a theme's statement names is the
  only thing they let through.

## Measured, not declared

The statement is written by the checks, never by hand, so no theme can claim more than it does.

1. **The theme's shortfalls.** A theme lists what it falls short on in `accessibility.json` next to its `theme.json`
   (`theme/accessibility.json` for Material):

   ```json
   {
     "standard": "WCAG 2.2 AA",
     "fallsShort": [
       { "criterion": "1.4.3", "part": "placeholder", "why": "Material 3: a placeholder is 60% of its on-colour" },
       { "criterion": "1.4.11", "part": "outlined-card-edge", "why": "Material 3: the Outlined card's edge is outline-variant" },
       { "criterion": "1.4.11", "part": "section-edges", "why": "Material 3: edges in a coloured section are outline" }
     ]
   }
   ```

   No file, or an empty `fallsShort`, means the theme meets the standard.
2. **The checks keep it honest.** `check:contrast`, `check:screens`, `check:a11y` and `check:announce` let a failure through only when the
   theme in use names its criterion and part there. A failure the file does not name stops the check, as now. An entry that no longer
   fails stops it too ("remove it from accessibility.json"), so the list is never longer than the truth.
3. **Every theme.** `check:themes` runs these with each installed theme, so each theme's file is checked against that theme.
   `morpheme-apps` runs the same checks on its themes before a release.

## On the theme page

The editor shows the statement on the theme's page (*Library › Themes*, the installed theme and the store's list of themes), as one row:

- **Meets:** "Accessibility: meets WCAG 2.2 AA, the level the European Accessibility Act asks for."
- **Falls short:** "Accessibility: falls short of WCAG 2.2 AA", with the shortfalls listed under it by part, each with its criterion
  ("Placeholder text contrast (1.4.3)").
- **Always,** one short line: "Your own colours and images are not part of this."

Texts in `src/i18n/en-US/` first, then `da-DK/` (skill `site-editor-writing`); the parts are the theme's UI parts (`ListItem`). A theme with
no statement yet (a store theme released before 0.19.5) shows "Accessibility: not checked".

## The store (later)

The store's entry for a theme carries the same statement, taken from the released files, so the store list shows it before an install.
That is a change in `morpheme-appstore` and `morpheme-apps`' release, in the store's next release, not in 0.19.5.

## Batches

In `feature/0.19.5-m3-tokens`, with batch 9 (the recorded deviations), which removes 4, O1 and O2 and writes Material's file:

1. `accessibility.json`, the checks reading it (pass a named shortfall, fail an unnamed one or a stale entry), and Material's file.
2. The row on the theme page, its texts in both languages, and a release note line (skill `release-notes`).
