# Performance baseline (15 Nov 2026)

First measured numbers for "tested for speed", taken on the demo build on branch `0.18` (the audit items P2 and P3 in
`docs/superpowers/specs/2026-11-15-modern-web-guidance-audit.md` were rated low without data; this is the data).

## Method

Run `scripts/measure-speed.mjs` (not in the package, not in `npm run check` or CI; command in the skill `checks`):

```
npm run build
cd .morpheme/demo/site && node ../../../scripts/measure-speed.mjs --runs 3
```

- Chromium (Playwright), served from the built demo `.morpheme/demo/site/dist`. The editor is answered from the files in
  this repository (no sign-in; nothing is saved), as in `check:screens`.
- **mobile**: 375 px wide, touch, CPU slowed 4x (`Emulation.setCPUThrottlingRate`), a mid-range phone. **desktop**: 1280 px,
  no slowing. The network is not throttled (local), so LCP shows the CPU's share, not the network's.
- Each scenario runs 3 times in a fresh browser context; the table shows the median.
- For the editor, the load numbers include the editor's first load and then opening the screen (`/editor/`, then the hash).
- **LCP**, **CLS**, **TBT** (sum of each long task's time over 50 ms from first contentful paint), **long tasks** (over
  50 ms: count and longest) and **LoAF** (longest long animation frame) come from `PerformanceObserver` in the page.
- **INP** of an interaction is the longest event duration (input to next paint, Event Timing) of one scripted
  interaction with real input; over **200 ms** is poor. The number in brackets is the longest long task during it.
- The many-blocks page below was the demo's Blocks page, one page of 36 blocks. The demo's Blocks are one page for each component now
  (`/blocks/<name>/`), and `measure-speed.mjs` measures the Lists page (12 blocks): a run after that is not comparable to the numbers here.
- Limits: one machine, a simulated phone, the numbers vary between runs (TBT of the many-blocks page was 1.5 to 2.3 s on
  mobile in three full runs), so only differences well over 20% mean something. Compare runs on the same machine.
  Scroll is wheel scroll; it has no INP, so only its long tasks count. The Library and the start screen on a computer have
  no menu button (the navigation is always open); marked n/a.

## Results

### Mobile (375 px, CPU 4x)

| Scenario | LCP ms | CLS | TBT ms | Long tasks | Longest ms | LoAF ms | Interactions: INP ms (longest task ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| site: home | 368 | 0 | 0 | 0 | 0 | 196 | open menu: 40 (175); scroll: 16 (0) |
| site: blocks page | 432 | 0 | 568 | 3 | 494 | 504 | open menu: 112 (371); scroll: 0 (86) |
| site: blog | 484 | 0 | 0 | 0 | 0 | 219 | scroll: 0 (0) |
| site: about | 312 | 0 | 1 | 1 | 51 | 203 | scroll: 0 (0) |
| editor: start screen | 2032 | 0.05 | 298 | 2 | 249 | 494 | open menu: 168 (159); search view: 152 (124) |
| editor: page list | 976 | 0 | 281 | 2 | 255 | 486 | scroll: 0 (0); search view: 152 (105) |
| editor: page with many blocks | 3816 | 0 | 2342 | 5 | 1515 | 1685 | scroll: 0 (148); **type in a field: 600 (573)**; **open a sheet: 768 (706)**; **open menu: 520 (423)** |
| editor: Library | 2260 | 0 | 290 | 2 | 246 | 479 | scroll: 0 (0) |
| editor: search view | 2136 | 0.05 | 306 | 3 | 269 | 569 | open search view: 128 (86); type in the search field: 144 (96) |

### Desktop (1280 px)

| Scenario | LCP ms | CLS | TBT ms | Long tasks | Longest ms | LoAF ms | Interactions: INP ms (longest task ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| site: home | 136 | 0 | 0 | 0 | 0 | 62 | open menu: 16 (0); scroll: 0 (0) |
| site: blocks page | 176 | 0 | 0 | 0 | 0 | 124 | open menu: 16 (0); scroll: 0 (0) |
| site: blog | 164 | 0 | 0 | 0 | 0 | 71 | scroll: 0 (0) |
| site: about | 120 | 0 | 0 | 0 | 0 | 70 | scroll: 0 (0) |
| editor: start screen | 880 | 0 | 11 | 1 | 61 | 108 | search view: 24 (0) |
| editor: page list | 356 | 0 | 24 | 1 | 74 | 112 | scroll: 0 (0); search view: 48 (0) |
| editor: page with many blocks | 1100 | 0 | 217 | 2 | 267 | 305 | scroll: 0 (0); type in a field: 112 (80); **open a sheet: 216 (198)**; open menu: 88 (71) |
| editor: Library | 788 | 0 | 19 | 1 | 69 | 107 | scroll: 0 (0) |
| editor: search view | 932 | 0 | 9 | 1 | 59 | 117 | open search view: 24 (0); type in the search field: 40 (0) |

(The "editor: search view" row is from a second run of that scenario alone, because its typing step failed in the full
run until the script was fixed.)

## What the numbers say

- **The site is fast.** On the phone profile the home, blog and about pages have LCP 310 to 490 ms, CLS 0, and no long
  task over 55 ms. Only the Blocks page (every block on one page) has a load long task (about 500 ms) and a 371 ms long
  task when the menu opens. On a computer no site page has a long task. A "tested for speed" claim holds for the site's
  normal pages; the Blocks page is a test page with every block, not a normal page.
- **The editor is fast on a computer and on simple screens**: the start screen, page list, Library and search view have
  no long task over 270 ms on the phone profile, and INP under 200 ms (152 ms at most), except as below.
- **Real problems, all in the editor's page with many blocks (`blocks.md`, 36 blocks) on the phone profile**:
  1. Load: long tasks of 1.1 to 1.5 s and TBT 1.5 to 2.3 s while the page opens.
  2. Typing in the page: INP 600 ms (long task 573 ms per keystroke).
  3. Opening the insert-block sheet: INP 768 ms (long task 706 ms).
  4. Opening the overflow menu: INP 520 ms (long task 423 ms).
  On a computer only opening the sheet is at the limit (216 ms).
  These are over the line of 50 ms (long task) and 200 ms (INP), so step 2 of the task applies to them.
- Why is not yet known: every interaction on that page costs 400 to 700 ms of one task, so the cost is likely the work
  done for all 36 blocks on each state change, not a loop that `scheduler.yield()` could cut up. The next step is a
  profile of that page before any fix.

## How to repeat

`node ../../../scripts/measure-speed.mjs --runs 3 --json result.json` in `.morpheme/demo/site`; `--profile mobile`,
`--only "many blocks"`. Write the new numbers under a new date in this file when a fix changes them.
