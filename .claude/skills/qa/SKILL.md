---
name: qa
description: Use when the PM makes a session the QA tester of one pull request, or of a whole version before its release - "/qa", "QA session", "test the Preview", "test this pull request". The QA session runs the pull request's written test list on its Preview (the demo's editor and site) and reports pass or fail per test to the PM. It never codes, pushes or merges. Also says how a test list is written, for the Architect's specs and the developer's pull requests.
---

# QA

Announce "Using qa". Owner, 25 Nov 2026: every change is tested on its Preview after the push and before the merge, by a QA session
that did not build it, from a written list of what to test. A QA session tests; it never fixes and never guesses what to test.

## 1. The flow

1. **Spec.** The Architect writes the spec with its section **Tests** (section 2), before anyone builds.
2. **Pull request.** The developer copies the spec's tests into the pull request's section **How to test**, adds a test for anything it
   built that the spec has none for, and pushes when the PM says "your slot". A single fix without a spec writes its own list.
3. **Preview.** Cloudflare builds the pull request's Preview and writes its address on the pull request.
4. **QA.** The PM starts a QA session (section 3) with the pull request, its Preview address and its **How to test**. The PM does not
   start QA on a pull request without that section: it sends the pull request back to the developer for it.
5. **Report.** QA runs every test and reports to the PM (section 6).
6. **Merge or back.** The PM merges only after a report with no `fail` on the pull request's current head. A `fail` goes back to the
   developer; after the fix is pushed, QA runs again on the new Preview, the whole list.
7. **Version.** Before the PM tells the owner a version is ready to release, one QA session runs the tests of every pull request in the
   version, plus the smoke test, on the Release PR's Preview.

## 2. Writing a test list

A test list is the only thing QA tests. Write it so a person who has never seen the change can run it without asking.

- One numbered test per thing a person can see. Never "check that Cards work": one test per claim.
- Each test has four lines:
  - **Where:** the page or screen, as an address on the Preview (`/blocks/cards/`, `/editor/#src/content/pages/about.md`,
    `/editor/#settings`), and the width (phone 390, computer 1280, or both) and theme (light, dark, or both) when it matters.
  - **Do:** the steps, with the visible names of the buttons and fields (`Open the Text style menu, choose Label`).
  - **Expect:** what a person sees when it works, with numbers where the source gives numbers (`the card is 9:16 wide; gap 8 dp`).
  - **Source:** where the expectation comes from: the spec's section, or the M3 page's address and tab.
- A test for keyboard use says which keys (`Tab to the menu button, Enter opens it, Escape closes it, the focus ring shows`).
- A change nobody sees (a check, an import, a refactor) has no test; the pull request says `How to test: nothing visible`, and QA runs
  only the smoke test.

Example:

```
3. Label in the Text style menu
   Where: /editor/#src/content/pages/about.md, computer 1280, light
   Do: put the cursor in the heading "Our story", open Text style, choose Label
   Expect: the heading becomes a label with the same text; Text style shows Label as selected; Ctrl+Z gives the heading back
   Source: the spec's section 2 (docs/superpowers/specs/<date>-<name>.md)
```

## 3. Starting a QA session (the PM)

The PM starts one cloud session per pull request, on the Morpheme environment, with the repository at the pull request's head, and
this message: `Load the qa skill and test pull request #<n> (head <sha>) on <Preview address>. Its How to test is in the pull request.
Report to me with send_message, session_id <the PM's own session id>.` The PM always gives its session id: `@parent` is not certain to
reach a session that is not a standing one. For a version: `… test version <x.y.z> on <Release PR's Preview address>: the How to test of pull requests #a, #b, ….`

## 4. Rules for the QA session

1. **Never code.** No edits, commits, pushes, merges, GitHub comments or approvals. Read the repository only to understand a test.
2. **Only the list.** Run every test of the list, in order, and nothing else beyond the smoke test (section 5). Where the pull
   request claims something the list does not test, report it as `not on the list`; never invent a test for it.
3. **The real Preview.** Never a local build, never `morpheme-demo`, and never staging, except in a version QA for a test whose Where
   names `morpheme-staging` (a change that only a real site can show, such as a CMS update; owner, 25 Nov 2026). Those run after the
   version is staged on `next`, and the PM starts them. `/editor/version.json` names the commit the
   Preview runs: it must be the pull request's head; if not, wait for Cloudflare's new Preview or tell the PM.
4. **Seen, not assumed.** A test is `pass` only when you saw the expected result; `fail` when you saw something else; `blocked` when
   you could not run it (say why: a step that does not exist, a page that does not open, an unclear test). Measure numbers in the
   browser (`getBoundingClientRect`, `getComputedStyle`), never by eye. Where the source is an M3 page, read it with Playwright
   (skill `material-3`, *Reading the real pages*) before you compare. Where the page prints the value only in an image or a token
   table (a focus ring's thickness and offset, a menu's elevation), take a screenshot of that part of the page and read it, or read
   the Specs tab's token table. If the value is not there either, compare with the test's Source (the spec, the CHANGELOG) and say in
   a `NOTE` that M3 does not print it in text.
5. **No page errors.** A page error in the console during a test makes that test `fail`, with the error.
6. **Live samples only.** The theme parts gallery (`/editor/#developer/parts/ui`) shows static "drawn" samples beside the live ones.
   Test the live ones. A static sample that takes the focus but ignores keys is a `NOTE`, not a `fail`.

## 5. Opening the Preview

The demo's editor opens without sign-in: a service worker in the browser answers the Worker's calls and keeps saves in the browser
(`scripts/demo-editor.mjs`, `scripts/demo-editor-sw.js`). It switches itself off in an automated browser unless the page sets
`window.demoEditorProof = true` before it loads, so always:

```js
const { chromium } = require('playwright'); // NODE_PATH=$(npm root -g) if require fails; never `playwright install`
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'en-US', colorScheme: 'light' });
await ctx.addInitScript(() => (window.demoEditorProof = true));
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${preview}/editor/`, { waitUntil: 'load' });
// The first visit installs the service worker, which reloads the page by itself once. Never reload it yourself (the two reloads
// collide: net::ERR_ABORTED). Wait until the worker answers, then let its own reload finish.
const deadline = Date.now() + 30000;
for (;;) {
  try {
    await page.waitForLoadState('load');
    const ok = await page.evaluate(() => fetch('/api/github/head').then((r) => r.ok, () => false));
    if (ok) break;
  } catch {} // the page's own reload replaced it: try again
  if (Date.now() > deadline) throw new Error('the demo editor did not start');
  await page.waitForTimeout(500);
}
await page.waitForTimeout(2000);
await page.waitForLoadState('load');
```

- "Log in with GitHub" means the service worker did not take over: open `${preview}/editor/?demo-reset` once and open the editor again.
  Still the login: report every test `blocked` (the Preview's editor does not open) and stop.
- Phone: a new context with `{ width: 390, height: 844 }`; dark: `colorScheme: 'dark'`.
- Saves: Ctrl+S (or Save) goes to the service worker and stays after a reload. Start each test from a clean editor:
  `${preview}/editor/?demo-reset`.
- Screenshots: one for every `fail`, in your scratchpad, named `<test number>-<width>-<theme>.png`.

**Where things are** (the demo editor, 25 Nov 2026; a place that has moved is a `NOTE`):

| What | Where |
| --- | --- |
| Start screen (dashboard) | `/editor/` |
| A page | `/editor/#src/content/pages/<file>.md` (the demo's files: `home`, `about`, `contact`, `blocks-<name>` …) |
| Pages and Blog lists | `/editor/#list/pages`, `/editor/#list/blog` |
| A block's settings | click a field inside the block, then *Block settings* in the block's action row |
| The text toolbar | Alt+F10 from the text |
| Theme parts gallery (menus, fields, pickers, scroll field …) | `/editor/#developer/parts/ui` (live samples only, rule 6) |
| The editor's own parts, block parts | `/editor/#developer/parts/editor`, `/editor/#developer/parts/blocks` |
| Appearance, icon packs, motion, colours | `/editor/#appearance`, `#appearance/icon-packs`, `#appearance/motion`, `#company/colors` |
| Account (the editor's language, density) | `/editor/#account` |
| Apps | `/editor/#apps` (the demo has no app installed: a test that needs one is `blocked`) |
| The site's block pages | `/blocks/`, `/blocks/<name>/` |

**Smoke test** (every run, after the list): the dashboard opens; `/editor/#src/content/pages/about.md` opens, a typed word saves with
Ctrl+S and is still there after a reload; the block menu opens; the site's `/` and the changed block's `/blocks/<name>/` render
without page errors.

## 6. The report

One message to the PM (`send_message` with the session id the PM gave in the brief), short:

```
QA #<n> (head <sha>) on <Preview> (cms <version.json's cms>): <n> pass, <n> fail, <n> blocked, <n> not on the list.
FAIL 3. <test name>: got <what you saw> instead of <Expect> (<width>, <theme>). Screenshot: <path>
BLOCKED 5. <test name>: <why>
NOT ON THE LIST: <claim from the pull request>
NOTE: <something seen that no test claims, or a place in the map that moved>
PASS: 1, 2, 4
Smoke test: pass (or what failed)
```
