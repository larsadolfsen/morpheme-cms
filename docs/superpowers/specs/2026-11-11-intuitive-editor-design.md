# A more intuitive editor (0.17)

> **Status:** draft of 11 November 2026, written against `main` at `5249b12` (`@morphemecms/cms` 0.15.x). Nothing here is
> built or decided. **0.16 comes first** (`docs/superpowers/plans/2026-11-11-release-0-16.md`); this spec plans work for
> 0.17 and marks what touches the same screens as 0.16.

## Goal

A new site owner can make a page, write a post, add a picture, publish and schedule without help, and always knows what
state their work is in.

## What was looked at

- **Code and texts:** `src/i18n/en-US/` (`common`, `app`, `library`, `forms`, `parts`, `media`, `text`, `blocks`,
  `blockSettings`, `history`, `dashboard`, `apps`, `advanced`, `preview`), `defaults/collections.ts` (the Status field),
  `defaults/editor.ts` (the menu and Settings), `src/Library.tsx`, `src/FormFrame.tsx`, `src/EntryForm.tsx`,
  `src/StartFab.tsx`, `src/DashboardGrid.tsx`, `src/dashboard.mjs`, `src/widgets/unfinished.tsx`, `src/MainMenu.tsx`.
- **Specs and plans:** the other specs in this folder, and the 0.16 plan, `2026-11-11-mcp-design.md` and
  `2026-11-11-store-sections-design.md`.
- **Judged against:** `CLAUDE.md` section 6 (Material 3 content design: short, active, universal terms, canonical
  states) and the pointer skill `word-choice`. Its target, `site-editor-writing`, is in `morpheme-website`, which this
  session cannot read, so the writing rules are checked only against `CLAUDE.md`.
- **Not done:** the screens were not built or opened (`npm run build`, `check:screens`), so no screenshot was taken. Every
  finding below comes from reading code and texts, and a finding about how a screen *looks* needs a check on the real screen
  before its pull request. No user research exists, and none is claimed: "likely to hesitate" is the author's judgement
  from the texts and flows.

## Findings, ranked by how many owners they affect

Rank 1 affects every owner at their first save; rank 5 only owners who reach developer screens.

### 1. "Save" is "publish", and the editor never says so

- **Evidence:** the Status field has `Draft`, `Hidden`, `Published`, `Scheduled` (`defaults/collections.ts`, `status()`),
  but the button is `Save` / `Save changes` (`common.ts`). A saved page with status Published is live after the build,
  and the message is `… You’ll get a message when the website is updated.` (`common.saved`). A new page has no status
  hint on the screen; `parts.publishedHint` and `draftHint` exist as fields' hints only. The top-bar line says
  `Last changed …` / `Not saved yet` (`app.lastSaved`, `notSavedYet`), which describes the file, not the site.
- **Likely hesitation:** "Did Save publish it?" and "Is my draft safe?". `Published` is also the default for a new page,
  so a half-written page can go live on the first Save.
- **Fix:** (a) name the state in the save bar and top bar: `Published · Last changed today at 1:42 PM`, `Draft · Not on
  the website`, `Scheduled Nov 20 at 8:00 AM`; (b) a new page and post starts as **Draft** (the owner decides; see Q1);
  (c) when the status is Published, label the button `Save and publish`, and `Save draft` otherwise (see Q2); (d) the
  message after a save says what changed *and* whether it is live: `Saved. The page is on the website in 1–2 minutes.`

### 2. The four statuses are not self-explanatory, and "Hidden" is the odd one out

- **Evidence:** `Hidden` hint: `Not shown on the blog or in Google, but can be opened at its address.` (`collections.ts`
  line 386; for a page, line 417). `Draft` hint: `Not shown on the website.`, though a draft is not at its address either.
  The Status field is a narrow select above the title (`EntryForm.tsx`, `STATUS`), the hints show only inside the open
  menu. `Scheduled` has a required `Time` field with the hint `Published at most an hour after.`, which reads as a bug,
  not as the build's delay. CLAUDE.md section 6 lists `Draft`, `Published`, `Scheduled`, `Hidden` as the canonical
  states, so the words are right; the explanation is what is missing.
- **Fix:** keep the four words. Show the chosen status's hint under the field. Rename the hint of Hidden to `Not listed.
  Anyone with the link can open it.` and of Time to `The website updates within an hour of this time.` Add the
  state to the Unfinished card's rows (already there) and to every list row (a badge for Draft, Hidden, Scheduled).

### 3. The start screen shows four cards that are empty or quiet on a new site

- **Evidence:** the default dashboard is `cms:continue`, `cms:unfinished`, `cms:blog-rhythm`, `cms:status`
  (`dashboard.mjs`, `DEFAULT_WIDGETS`). On a new site `Continue` says `The pages and posts you edit show up here.`,
  `Unfinished` renders nothing (`unfinished.tsx`: `if (!rows.length && !editing) return null`), `Blog rhythm` offers
  `Write your first post`. The only visible action is the round `Create` FAB (`StartFab.tsx`, `library.createNew`) whose
  menu is `New page` / `New blog post`. There is no sentence that says what to do first.
- **Likely hesitation:** an owner opens the editor and sees mostly empty cards and a lone plus button.
- **Fix:** a first-run card at the top while the site has no page or post of its own: three rows (`Write a page`,
  `Write a blog post`, `Add a picture`, each a link), which goes away on its own and can be dismissed. `Create` stays.
  Plain text above the cards names the site and its state (`Your website is live` / `Updating…`), using `StartStatus`.

### 4. Words that only a developer knows, in the owner's path

- **Evidence (all in `src/i18n/en-US/` or `defaults/`):**
  - `Heading (H1)` in the toolbar (`text.pageHeading`), `The heading (H1) isn’t at the top of the text`, `Canonical URL`,
    `noindex` (`forms.seoRating.*`, `collections.ts` `noindex`/`canonical`): HTML terms in a form for owners.
  - `Block templates` (`common.parts.blocks`) and `Block settings` are two rows under one menu section `Blocks`
    (`defaults/editor.ts`); `Dynamic lists` (`common.parts.lists`) sits under Content next to `Promotion`s, `Tags`, `Files`.
  - Developer-only screens are one tap away on Settings: `Developer`, `Parts`, `Caching and builds`
    (`common.parts.*`), with `R2`, `Workers Paid plan`, `Cloudflare`, `GITHUB_PUBLISH_TOKEN` (`advanced.ts`, `cms.ts`).
  - `Business` holds `CVR number` (`parts.ts`), a Danish register number in the English source (`CLAUDE.md` section 6: no
    local abbreviations).
- **Fix:** keep HTML names in brackets only where the SEO check needs them (`Main heading`, `Page title`), rename
  `noindex` to `Hide from search engines` (already the label; drop the bracket), move `Developer` under a collapsed
  `Advanced` row, and rename `CVR number` to `Company registration number` with the country's name in its hint.
  Whether `Dynamic lists` and `Block templates` can be renamed needs the owner (Q4).

### 5. Two places to do the same thing: the menu and Settings, and two theme stores

- **Evidence:** the main menu has five sections (`Dashboard`, `Content`, `Business`, `Blocks`, `Apps`; `groups` in
  `defaults/editor.ts`). `Logo and icon` is under `Business` (and its text says Appearance in places); `Header`/`Footer`
  are under Settings › Appearance. The theme store is `Appearance › Theme store` (`common.parts.themeStore`) *and* the
  Appstore under `Apps` (`appstore`). An owner looking for "change how my site looks" has `Business` (logo),
  `Settings › Appearance` (colours, theme, header) and `Blocks`.
- **Fix:** one rule for the menu: *what the site says* (Content, Business), *how it looks* (Appearance, moved out of
  Settings into the menu), *what it can do* (Blocks, Apps). Move `Logo and icon` to Appearance. Keep the cog for the
  account, notifications, privacy and Morpheme. **Touches 0.16** (Appstore sections, Settings › Assistants): decide the
  menu once, after 0.16, or 0.17 moves rows that 0.16 just placed (Q3).

### 6. Blocks: where they are, and what the sheet does

- **Evidence:** a block is added from `Insert` in the text toolbar (`text.insert`, `blocks.insert`) and found by search
  (`blocks.searchInsert`); nothing on an empty page says blocks exist, only `Write text here…` (`text.typeHere`).
  A block's card has `Hide on the page` / `Hidden on the page` (`text.hideOnPage`) — a fifth meaning of "hidden", unrelated
  to the status `Hidden`. The side sheet (`2026-11-05-block-side-sheet-design.md`) saves with the page, but its own close
  asks `You have changes that aren’t saved. Do you want to keep them?` (`app.unsavedSheet`), which reads as "saved to the site".
- **Fix:** an empty page shows a one-line hint under the text: `Type text, or tap Insert to add a block.` (the hint is
  `firstHeadingHint` today and goes away after a few opens). Rename the card action to `Don’t show on the page` or, better,
  keep `Hide` and rename the status `Hidden` to `Unlisted` in one pass (Q5). Sheet close: `Keep your changes in the page?` with
  `Keep` / `Discard`.

### 7. Pictures: upload and alt text

- **Evidence:** `Choose picture` (`forms.pickImage`), `Choose a picture` / `Upload a new picture` (`media.pick`,
  `uploadNew`), the section is called `Files` (`common.parts.media`). `Alt text`'s hint is `For screen readers and search
  engines.` (`blocks.picture.altHint`); the fix text under the SEO check is `Tap each picture, choose Edit, and write an alt
  text.` (`seoRating.fixAlt`). `Decorative picture` has an On/Off switch and the hint `Screen readers skip the picture.`
- **Likely hesitation:** `Alt text` is unknown to most owners; the SEO score nags about it before they know what it is.
- **Fix:** hint: `Describe the picture in a few words, for people who can’t see it.` Rename `Files` to `Pictures and files`
  or `Media` (Q4). Show the alt field right after a picture is chosen, not behind Edit.

### 8. Feedback after Save: the build is invisible

- **Evidence:** the save message promises a notification (`common.saved`); the first Save asks the browser for
  permission (`notificationData.ts` `askToNotify`) with no text of the editor's own before the browser's prompt. The
  start screen's `Last published …` / `Publish time unknown` (`library.lastPublished`, `publishUnknown`) is the only
  persistent signal; a failed update says `Restore the previous version under Earlier versions.` (`app.siteNotUpdated`).
- **Fix:** a small `Updating the website…` chip in the top bar from Save until the build finishes (the data is there:
  `siteUpdated` notifies when done), then `Live`. A sentence before the browser's permission prompt: `Get a message when
  your changes are live?` Rename `Earlier versions` to `History` only if the owner agrees (the word is clear; low priority).

### 9. Settings and apps: depth and state words

- **Evidence:** `Settings` is five rows (`appearance`, `developer`, `licenses`, `morpheme`, `privacy`) A–Z, so `Appearance`
  is as far from the menu as `Licenses`. `Apps` and `Appstore` are two rows in one section. `Enabled`/`Disabled` and
  `On`/`Off` are both used (`blockSettings.active`, `.on`; `library.on`), as `CLAUDE.md` allows; `Themes` shows `In use` and
  `Changing to it` (`library.themeInUse`, `themeNext`) — `Changing to it` is unclear without a subject.
- **Fix:** `Changing to this theme`; sort Settings by use, not A–Z; show the installed count on `Apps`.
  **Touches 0.16:** Settings › Assistants, the three Appstore sections.

## Batches

Each is one pull request into `main` (or `0.16` where marked), with a release note (`release-notes` skill) and, until
0.15.1 is out, only a `patch` or empty changeset. Texts change in en-US first, then `da-DK`.

| Batch | Contents (findings) | Screens touched | Touches 0.16? | Owner decision |
| ----- | ------------------- | --------------- | ------------- | -------------- |
| A | **Status made clear:** status in the top/save bar, hints under the field, list badges, save message (1, 2) | `FormFrame`, `EntryForm`, lists, `collections.ts` | no | Q1, Q2 |
| B | **Plain words:** SEO terms, `CVR number`, hints, `Changing to this theme`, alt-text hint (4, 7, 9 wording) | i18n only, `collections.ts` | no | none |
| C | **First run:** start card, status sentence, empty-page hint, browser-permission sentence (3, 6 hint, 8) | `Library`, `DashboardGrid`, `widgets/`, `EntryForm`, `notificationData` | no | none |
| D | **Build feedback:** the `Updating…` chip until live (8) | top bar, `deploy.ts` | no | none |
| E | **Menu and Settings regroup:** Appearance into the menu, Developer under Advanced, Logo and icon moved (5, 4, 9) | `MainMenu`, `defaults/editor.ts`, Settings | **yes**: Appstore, Settings › Assistants | Q3, Q4 |
| F | **Blocks and pictures flow:** alt after pick, rename `Hide on the page`, sheet-close wording (6, 7) | `BlockDialog`, `Media`, `MarkdownEditor` | no | Q5 |

Order: B and C first (no decision, no overlap). A after Q1 and Q2. D any time. **E waits for 0.16**: merge it into `0.16`
or after it, never before the Appstore and Assistants rows exist. F after A, so the status word is settled.

## Open questions for the owner

1. **New pages and posts start as Draft?** Recommended: yes (nothing goes live by accident); the form then needs `Publish`
   as an obvious step. Alternative: stay Published.
2. **Button labels follow the status (`Save and publish` / `Save draft`)?** Recommended: yes. Alternative: keep `Save`, show
   the status only beside it.
3. **Regroup the menu (Appearance out of Settings) in 0.17?** Recommended: yes, after 0.16, in one pass. Alternative: leave the menu.
4. **May we rename `Dynamic lists`, `Block templates`, `Files` (and `Business`)?** Recommended: yes, but only when the screens
   have been opened and checked; the Danish names change with them.
5. **Rename the status `Hidden` to `Unlisted`?** Recommended: yes (the words `Hidden on the page` and `Hide from search engines`
   then mean something else). Changes the stored `unlisted` label only, not the value in files.
