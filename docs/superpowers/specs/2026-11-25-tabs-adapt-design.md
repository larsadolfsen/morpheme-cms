# The tab bar adapts on a computer

Architect, 25 Nov 2026. Line: **0.19.8** (owner, 25 Nov 2026; `plans/2026-11-25-0-19-8.md`, task 16). Status: **approved by the owner on 25 Nov
2026** ("3 yes"; the group's alignment: "follow md3").

Owner, 25 Nov 2026, with a screenshot of *Business > Colors* about 2000 px wide: "on desktop the tab bar should adapt."

## What the screenshot shows

The three tabs under the top app bar (*Generator*, *Light mode*, *Dark mode*) each take a third of the window: about 650 px each, with
the active indicator about 650 px long under *Light mode*. The page's content (the breadcrumb *Business > Colors*) starts at about
600 px, in the screen's centred column. The tabs and the content do not line up, and the indicator is far longer than its label.

## What Material 3 prints (read with Playwright on 25 Nov 2026)

Pages read: `https://m3.material.io/components/tabs/overview`, `…/specs`, `…/guidelines`, `…/accessibility`, and
`https://m3.material.io/foundations/layout/applying-layout/window-size-classes`.

- Guidelines, *Responsive layout*: "For fixed tabs, the maximum width for each tab should be determined by the width of the widest tab.
  The group of tabs should use a fluid margin and align to the center or leading edge of the body region." "Avoid using more than four
  tabs at once."
- Guidelines, *Container*: "The container should always extend the full width of the window and be divided into equal sections, one for
  each tab. The container is defined by a divider on the bottom edge to separate it from the content below."
- Guidelines, *Label*: scrollable tabs: "the first visible tab should be offset by 52dp from the left side … The width of each tab is
  defined by the length of its text label."
- Specs, *Measurements*: "Tabs are divided into equal sections"; height 48 dp (label only) or 64 dp (icon and label); divider 1 dp;
  primary active indicator 3 dp high, "inset 2dp on each side", fully rounded top corners, minimum 24 dp.
- Accessibility: arrows move between tabs, Space or Enter activates; targets at least 48 × 48 CSS px; no density by default.
- Breakpoints: compact under 600 dp, medium 600–839, expanded 840–1199, large 1200–1599, extra-large 1600 and up.

How we read the two container sentences together: on a phone the tabs divide the window into equal sections; where the window is wider
than the tabs need, each tab stops at the widest tab's width, the divider still runs the full width of the window, and the group sits
in the body region. M3 does not print the widest tab's padding in text; the theme's `--mo-comp-tabs-padding` (16 dp each side) stays.

## What we do now (read on `origin/main`, 25 Nov 2026)

`TabRow` in `src/ui.tsx` draws the theme's `Tabs` (`theme/ui/Tabs.tsx`, `theme/styles/ui/tabs.css`) with `scrollable={false}`
(`.mo-tabs.mo-is-fixed`), so the tabs always share the whole row. Every editor screen with `tabs` on `Screen` or `FormFrame` does the
same, and so does a site's fixed tab row.

## The design

1. **One rule, in the theme.** Fixed tabs (`.mo-tabs.mo-is-fixed`) are all as wide as the widest tab (its label, icon and the theme's
   padding), and never wider. Below that width they share the row equally, as now, so a phone keeps equal sections. No screen sets a tab
   width of its own (CLAUDE.md: no screen-specific variant).
2. **The divider runs the full width** of the row's container (the top app bar or the block), as now.
3. **The group sits in the body region.** In the editor's screens the group is aligned to the **leading edge of the screen's content
   column**, so the first tab starts where the breadcrumb and the content start. A site's fixed tab row aligns to the leading edge of
   its block. (Owner, 25 Nov 2026: "follow md3". M3 prints "align to the center or leading edge of the body region"; both follow it, and the
   leading edge keeps the tabs over the content they control and matches the breadcrumb.)
4. **The indicator** stays under its tab's label as M3 prints it (inset 2 dp each side, at least 24 dp), so it shortens with the tab.
5. **Scrollable tabs** (`scrollable`) are unchanged: each tab as wide as its label, the row swiped sideways when it does not fit.
   Where the editor has five or more tabs on one row, the pull request lists them (M3: "Avoid using more than four tabs at once") and
   the PM brings them to the Architect; they are not changed here.
6. **Every screen.** The pull request lists every screen with a tab row (`tabs` on `Screen` and `FormFrame`, `TabRow` elsewhere) and
   checks each at 390, 1280 and 2000.

## Components

`Tabs` / `TabRow` (existing, fixed in the theme with the owner's approval of this spec), `TopAppBar` (existing). No new part.

## Tests

```
1. A wide window
   Where: /editor/#company/colors (later #style/color), widths 1280, 1600 and 2000, light and dark
   Do: measure each tab (getBoundingClientRect), the indicator, the divider and the content column's left edge (the breadcrumb)
   Expect: all tabs the same width, equal to the widest tab's label, icon and 16 px padding each side, never wider; the first tab's
     left edge equals the content column's left edge; the divider runs the full width of the top app bar; the indicator is under the
     open tab's label only, inset 2 px each side
   Source: M3 Tabs, Guidelines, Responsive layout and Container; Specs, Measurements

2. A phone
   Where: same, width 390
   Expect: the tabs share the row in equal sections as before; no tab cut off; no sideways page scroll
   Source: M3 Tabs, Specs ("Tabs are divided into equal sections")

3. A tablet
   Where: same, width 840
   Expect: equal sections while the row is narrower than the tabs need at their widest-tab width; from there the rule of test 1
   Source: this spec, design 1

4. Every tabbed screen
   Where: every screen the pull request lists, width 1600
   Expect: the rule of test 1 on each, with the tabs starting at that screen's content column
   Source: this spec, design 6

5. Scrollable tabs unchanged
   Where: a scrollable tab row the pull request names (for example the theme parts gallery, /editor/#developer/parts/ui)
   Expect: as on morpheme-demo
   Source: this spec, design 5

6. Keyboard and targets
   Where: /editor/#company/colors, computer 1280
   Do: Tab to the tabs; Right arrow, Left arrow, Home, End
   Expect: the tab changes with each key, the indicator moves, the focus ring shows; each tab at least 48 × 48 px
   Source: M3 Tabs, Accessibility

7. A site's tab row
   Where: a site page with a fixed tab row, if the demo has one (the pull request names it, or says there is none), 390 and 1280
   Expect: the rule of tests 1 and 2, aligned to the block's leading edge
   Source: this spec, design 3
```

## Delivered with it

- The change in `theme/styles/ui/tabs.css` (and `TabRow` only if it needs a class); a screens unit at 390 and 2000 on one tabbed screen.
- Before and after screenshots at 390, 1280 and 2000; a release note in both languages ("Tabs fit their labels on wide screens"); the
  changeset the base allows.
