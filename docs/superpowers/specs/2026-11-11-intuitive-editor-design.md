# A more intuitive editor (0.17)

> **Status:** draft of 11 November 2026, written against `main` at `5249b12` (`@morphemecms/cms` 0.15.x). Nothing here is
> built or decided. **0.16 comes first** (`docs/superpowers/plans/2026-11-11-release-0-16.md`); this spec plans work for
> 0.17 and marks what touches the same screens as 0.16.

## Goal

A new site owner can make a page, write a post, add a picture, publish and schedule without help, and always knows what
state their work is in.

## Owner decisions on text and headings (11 November 2026)

The owner's comments, in their words, with how this spec reads them. Where the reading is a guess it is marked and
repeated as a question below.

1. **Keep the current format: text and blocks.** The page stays one text with blocks in it. No new editor model.
2. **Add "Body large" and "Label" to the text styles.** Read as: two new entries in the text-style menu `T`
   (`text.kind`, `text.paragraph` … in `MarkdownEditor.tsx`), next to Heading, Subheading and Normal text. _(Confirmed by the owner: `T` is that menu; `Label` is the small line above a heading, which blocks call `eyebrow` today.)_
3. **Remove all regular headings and text from blocks.** Read as: a block keeps only what is its own (rows, pictures,
   buttons, links), and the heading, subheading, label and intro text come from the text around it, in the text styles
   of decision 2. See finding 10.
4. **An H2 section is a dotted line across the editor, not a box.** Today an H2 with its text is a coloured section with
   `Section settings` (colour: None, Surface, Tint, Primary; `text.sectionColors`). The editor shows a dotted divider
   across the full width at each H2; the colour choice stays in `Section settings`, behind the divider's button.
5. **The editor opens with H1 selected.** A new page opens with the cursor in the H1 line, empty, ready to type the title
   (today `firstHeadingHint` explains it after the fact). It replaces the first-run text hint of finding 6.

6. **Edit blocks inline; the panel holds settings only.** A block is drawn as the site shows it and its text is typed in place (a list row's top and bottom line). Settings (icon, picture, link) are in the side panel on desktop, open all the time while the cursor is in the block, and on a phone in a bottom sheet opened with the `Edit` button in the same menu as the text tools. Clicking out returns the block to its live look; an unset icon takes no space. There is no `+` under the rows: the floating menu has `Add above` and `Add below` for the active row.
   This replaces `2026-11-05-block-side-sheet-design.md` for block fields. _(Scope read as block fields only; short pickers such
   as page, link and colour stay sheets until the owner says otherwise.)_

7. **More WYSIWYG than today.** What the owner types is drawn as the site draws it, as far as it can be. See finding 15, and
   question 6 for how it fits decision 4.

8. **Lists are based on Material 3's two list types: Standard and Segmented.** The base list block has exactly these two
   designs (`theme/ui/List.tsx` already has both, `ListKind`). Other row blocks (Cards, Points, Steps and the rest) are
   decided against this base in finding 13. _(Read from the owner's "MD3 has two types, this is our base".)_

9. **Three list blocks in `Insert`, ready-made and built on the base:** **List** (an optional icon or picture on the left;
   a row with a link gets an arrow by itself), **Segmented list**, and **FAQ list** (rows that expand). The owner picks
   one; there is no version to choose afterwards. This replaces the idea of one `Rows` block with a design choice.
10. **A segmented list can end with an optional text button** (for example `See all` or `Book a time`), under the last row.
    _(Owner, 11 November: yes for the Segmented list and the FAQ list. Read as: not on the plain List.)_
    The page in the owner's screenshot is an expanding list in one rounded card with dividers and chevrons, with a text
    button wanted under it.

11. **Lists can show the content of dynamic lists.** A list block can take its rows from a dynamic list instead of typed
    rows, and show them in its list style (finding 16).
12. **The owner can create new lists.** A new list has fields the owner picks: an icon, a title, a body text (and, as the
    owner's example, tags). The list blocks pull on these. Which entries show on which page is decided by tags.
    Not a database builder (owner, 11 November): the owner picks a few fixed fields, for example an icon and two text
    fields, adds items to the list, and a list block on a page shows some of them, for example 3 or 4, chosen by the tags
    set on the items. _(Owner confirmed: tag filter and fixed fields.)_

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
- **Fix:** once the owner's decision 5 (the editor opens on H1) is built, an empty page still shows a one-line hint under the text: `Type text, or tap Insert to add a block.` (the hint is
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

### 10. Blocks repeat the text editor's own tools

- **Evidence:** nine standard blocks (Cards, Points with icon, Steps, Testimonials, Questions and answers, Blog posts,
  Expandable list, Price cards, Checklist) start with the same `headFields` (`src/standard/head.ts`): `Label`
  (`eyebrow`, max 30), `Heading`, `Subheading`. Their rows have again `Heading` and `Text` (`blocks.list`, `blocks.points`,
  `blocks.steps`: `title: 'Heading'`, `text: 'Text'`). So an owner meets `Heading` as an H2 in the text, as a block's
  head and as a row's heading, three places with three meanings, and the block sheet (`BlockDialog.tsx`) opens with the
  least interesting fields first.
- **Why (owner):** a block's heading can be written like any text, so putting it in the block only adds complexity.
- **Fix:** per decision 3, drop `headFields` from the nine blocks. The block is drawn after the H2 and the text above it
  (`BlockHead.tsx` is then not needed in the theme); the label above the heading becomes the `Label` style. The rows keep
  their own title and text, since a row is data, not page text (owner, 11 November: only the blocks' heads go). A migration moves each existing `eyebrow`, `heading` and
  `intro` into the text above the block, so no page loses content; `check:editor` must show each page the same.

### 11. Text styles: Body large, Label, and the dotted section line

- **Evidence:** the toolbar has `Heading (H1)` (pages only), `Heading`, `Subheading`, `Normal text`, lists and quote
  (`text.ts`). A section is an H2 and what follows (`sectionSettings`); its colour is a box on the site and in the editor.
- **Fix:** decisions 2 and 4. `Body large` is Material 3's body-large role for an intro paragraph; `Label` the
  label-large role. Both are text styles stored in the markdown (the format of `text-colors.mjs` and `section-marker.mjs`
  shows how), and the theme draws them from its tokens, as the shared-theme principle in `CLAUDE.md` requires. In the editor an
  H2 starts with a dotted line across the text column, the colour box is shown only on the site.

### 12. Block cards in the text

- **Evidence:** a block is a card in the text with `Edit` (`text.ts`), `Hide on the page` / `Hidden on the page`; its fields
  open in the side sheet from expanded and a modal sheet below (`BlockDialog.tsx`, `2026-11-05-block-side-sheet-design.md`),
  ending with `Save` (`Insert` for a new block) and `Cancel`, plus `Remove` for a card already in the text. A sheet that is
  closed changed asks `Do you want to keep them?` (`app.unsavedSheet`).
- **Likely hesitation:** `Save` in the sheet is not `Save` of the page: the sheet's button keeps the change in the form, the
  page's button writes to the site, both are called Save. The card's `Edit` is one tap more than tapping the card.
- **Fix:** superseded by finding 14 (inline editing), which removes the sheet for block fields. If it is not built, the fallback is: the sheet's confirm button reads `Done` (an edited block) or `Add block` (a new one), and the page's stays `Save`.
  The whole card opens the sheet (keep `Edit` as the accessible name). With decision 3 most blocks have only their rows, so
  the sheet is shorter and can open at its full height on a phone.
  The picker's `Insert` list keeps its search, order and group filter (`BlockDialog.tsx`), but shows a one-line hint and a
  small picture per block, which `Preview` (`ui.tsx`) already draws.

### 13. Many blocks are the same list in a different design

- **Evidence:** the standard blocks in `Insert` are Banner, Buttons, Cards, Checklist, Expandable list, Links, List,
  Notice, Points with icon, Price cards, Questions and answers, Steps, Testimonials, Video, Blog posts and Cookies
  (`src/standard/`, `blocks.ts` texts). Seven of them are rows of the same few fields:
  - **Cards, List, Points with icon, Steps, Links, Checklist:** each is a list of rows with a `Heading` and a `Text`
    (Checklist: only `Text`), most with an `Icon` and an optional `Page` link. Their hints are near-synonyms
    (`Cards with links to other pages`, `Rows under each other with a heading and a text`, `Points with an icon, a heading,
    and a text`, `Numbered steps with heading and text`, `Points with a check mark before them`). Cards even has a
    `Design` (Text, Icon, Picture) and List a `Design` (Standard, Segmented), so a design choice already exists inside two of them.
  - **Questions and answers, Expandable list:** both are rows that expand; one has `Question`/`Answer`, the other `Heading`/`Text`/`Page`.
  - **Testimonials, Blog posts:** both are lists filled from the site's content (tags, selected, all).
- **Likely hesitation:** the picker is one flat A–Z list (`BlockDialog.tsx`: order A–Z, Z–A or by group, where "group" means
  the standard blocks or an app), so an owner who wants "a few boxes with an icon" must open Cards, Points with icon and List
  to see which fits.
- **Fix, in two steps:**
  1. **Group in the picker (no model change).** Under `Insert`, standard blocks get headings by what they do:
     `Rows and cards` (Cards, List, Points with icon, Steps, Checklist, Links), `Questions` (Questions and answers,
     Expandable list), `From your content` (Testimonials, Blog posts), `Prices`, `Banner and buttons` (Banner, Buttons,
     Notice, Video), `Other`. Each block keeps its picture and hint; hints say how it differs from its neighbours
     (`Numbered`, `With a check mark`, `With a picture`). Apps keep their own groups.
  2. **Build on the base (owner decision 8).** The list block has the two M3 types, Standard and Segmented, and starts as
     Standard. The other designs are either variants of it or separate blocks; which is open (question 6). Older text:
  Owner decision 9 settles the shape: three ready-made blocks, List, Segmented list and FAQ list. **Steps is a special block (owner,
  11 November) and stays as it is, not folded into List.** **Links fold into List (owner,
  11 November):** a row with a link gets the arrow; the group headings of today's Links block are lost unless a row can be
  a small heading (to decide when it is built). **Not covered yet:** the Expandable list's page link. Cards, Price cards,
  Testimonials and Blog posts stay as they are. Older text:
  3. **Merge the rows (model change, owner's call).** One block `Rows` with a `Design` choice: Cards, List, Points, Steps,
     Checklist, Links; and one `Questions` block with a `Display` choice (open, or expanding). A migration maps each
     existing block to its design, so no page changes look or content. Fewer blocks to choose from, one set of row fields to
     learn and one block sheet. The cost: a theme draws each design today (`theme/blocks/*`), so the merge touches every theme
     and the demo, and `check:themes` must pass.

### 14. Edit a block inline

- **Evidence:** block fields open in a modal side sheet below `medium` and a standard side sheet from it
  (`sheetPlacement.mjs`, `BlockDialog.tsx`); the page is narrowed beside it (`[data-side-panel]`, `.editor-side-sheet` in
  `editor.css`). The sheet has its own `Save`/`Insert`/`Cancel`/`Remove` and its own unsaved question (`app.unsavedSheet`),
  a second save model beside the page's (finding 12). The owner chose the side sheet on 5 November
  (`2026-11-05-block-side-sheet-design.md`) after full-screen fields, and on 11 November chose inline editing.
- **Design:** tapping a block's card folds its fields out under the card, in the text, with the card's own header (name of the
  block, Remove, Hide on the page, Move up/down) above and the rest of the text pushed down. Only one block is open at a
  time; opening another folds the first. There is no `Save`, `Cancel` or `Insert` of its own: a change is part of the page's
  form and is saved with the page's `Save`, and `Undo` in the text toolbar undoes it. A new block is added where the cursor is
  from `Insert` (the picker, still a sheet) and arrives open with its required fields marked.
- **Owner's final shape (11 November):** supersedes the fold-out below. Text is typed in the drawn block; the side panel (desktop, always open while the block is active) or the bottom sheet (phone, `Edit` button in the text menu) holds only settings. The panel must keep the page's single save model (no `Save` or `Cancel` of its own).
- **Active row:** a new list is added selected, with its first row active. Only the active row shows its empty fields (icon or picture slot, top line, bottom line, link), so the owner sees what can be filled in. The other rows show their live look. When the owner clicks out, empty fields disappear.
- **Menu for a selected list:** while a list is selected, the floating menu shows `Add above` and `Add below` (and on a phone `Edit`). They add an empty row next to the active row, which becomes active. There is no `+` under the rows. Rows are sorted with `Move up` and `Move down` in the same menu, and on desktop also with a drag handle on the active row's left edge. On a phone the four row actions (`Add above`, `Add below`, `Move up`, `Move down`) sit under one `Row` menu beside `Edit`. `Add above`, `Add below`, `Move up` and `Move down` show only when the active row has content. While the list has no content, the menu shows a dynamic icon instead, which opens the panel on the dynamic settings (`Rows from`, tag filter, `How many`). Once a row has content the icon is gone: a list is typed by hand or pulled from a dynamic list, never both. A dynamic list drops the row actions and shows `Edit list` and a way back to typing rows by hand.
- **One pattern for all blocks:** the list is the first case, not the exception. Every block is drawn as the site shows it, its text is typed in place, the floating text menu shows that block's actions while it is selected (a list: `Add above`, `Add below`, `Edit` on a phone), and its settings sit in the side panel on desktop or the bottom sheet on a phone. This replaces today's block cards and sheets. Open: whether the menu swaps its text tools for the block's actions or adds them.
- **Rows:** a row is a nested fold-out inside the open block (heading, text, icon, page), with drag handles or Move up and down,
  and `Add row` at the end. This is where finding 13's single row model pays off: one row editor for all designs.
- **Preview:** the card shows the block as the site draws it (`Preview`) above or beside its fields, so the owner sees the
  change while typing. Beside only when the text column is wide enough; below it above.
- **Design rules (UX and Material Design 3):**
  1. A list pulled from a dynamic list shows its state on the block (`From Services · tag home · 3 items`) with `Edit list`, because its rows cannot be edited in place.
  2. The dynamic icon is a shortcut. The panel always shows `Rows from`, and switching to dynamic drops typed rows, so it asks first or offers `Undo`.
  3. Icon buttons have a tooltip and an accessible label (M3 icon button). Touch targets are 48 dp or larger, and the floating menu (M3 floating toolbar) never overflows above the keyboard: the row actions fold into one `Row` menu on a phone.
  4. `Enter` in the bottom line adds a row below.
  5. The layout stays stable when the active row changes: fixed line heights, and the empty slots appear with a short transition.
  6. Only a completely empty row is dropped when the list is deselected (an icon or a link counts as content), and `Undo` brings it back.
  7. Below `medium` the settings use the modal bottom sheet and from `medium` the standard side sheet, as today. A selected row and the focused item use M3 state layers and the focus ring.
  8. A row follows the M3 list item: leading icon or picture, headline (top line), supporting text (bottom line), trailing arrow when the row has a link. The pill and the panel are reachable by keyboard, and the active row is announced to screen readers. `Move up` and `Move down` are the keyboard alternative to the drag handle.
- **Cost and risk:** the editor loses the page-stays-usable side panel and gains long fold-outs for blocks with many rows. The
  fields are the editor's own (`fields.tsx`) and need no change; `BlockDialog.tsx`'s picker, section settings and
  `sheetPlacement.mjs` stay for their own steps. Needs a check on a phone at 375 px (keyboard, scroll to the open block) which
  this spec could not make.
- **Not changed:** the pickers (page, link, colour, country code), Preview, Earlier versions, Notifications and widget
  settings keep their sheets. Whether they follow is a later decision.

### 15. How close the editor is to the site, and what is missing

- **Evidence, what is already drawn as the site draws it:** a block is a card with the block as the site draws it
  (`MarkdownEditor.tsx`, "A block in the text as a card"); a section's colour is a box in the text (`editor.css`
  `[data-section-color]`, with readable prose colours); heading and text looks follow the theme (`looks`, `sectionLooks`,
  `headingLooks`); the editor uses the theme's fonts and tokens (the shared theme principle in `CLAUDE.md`).
- **Evidence, what is not:**
  - A page's **title, status, template, tags, short description, top picture** and a post's **date** are fields in a form
    section (`forms.sections`: `Content`, `Page settings`/`Post settings`, `STATUS`/`FIRST` in `EntryForm.tsx`), not on the
    page. The page's title and its H1 are kept together (`titleH1.mjs`), but are two things on two places for a page.
  - The **page frame** (header, menu, footer, the side column and the page's width by template) is not around the text;
    `Preview` shows it in a separate sheet at chosen window sizes (`preview.ts`, `pagePreview.tsx`).
  - **Fields of blocks** are a form beside the card (today a sheet, decision 6 inline), so what is typed and what is drawn are two views.
  - Decision 4 draws an H2 as a dotted line in the editor, which is less like the site than the coloured box is today.
- **Fix, in three steps:**
  1. **The top of the page is the page.** The editor's top area draws the page's head the way the theme does: the H1 (the
     title), the top picture (tap to change), and for a post its date and tags as chips. `Status` stays in the top bar.
     `Page settings` keeps the rest (address, template, Google, share).
  2. **Inline block editing with the block drawn above its fields** (finding 14): the owner edits fields right beneath the
     block as it looks, and where the block's text is plain (a row's heading and text) it is edited on the drawn block itself,
     not in a field.
  3. **The page frame around the text, switched on or off.** A `Show the website around the text` toggle in the top bar
     draws the header and footer in place, and the page's width and side column. It is off on a phone. It replaces the use of
     `Preview` for layout, which stays for the real page.
- **Cost:** step 1 changes the first thing every owner sees in the form and touches the `title`/H1 link; step 3 draws the
  site's header and footer inside the editor, which the theme's `editor/previews.tsx` already does for the header and footer
  screens. The demo and every theme must show the same page (`check:themes`, `check:demo`).

### 16. Lists that pull from dynamic lists, and lists the owner creates

- **Evidence, today:** the `Dynamic lists` screen (`#lists`) lists what `listsShown` in `src/site.ts` returns: the site's own
  (`site.lists`, empty by default in `defaults/editor.ts`), the standard blocks' (`standardLists`: Testimonials, prices) and the
  apps' (`listsOf`, from an app's `lists.ts`). All three are **defined in code**, with their fields. An owner cannot make
  a list. `Tags` (`src/data/categories`, `collections.ts`) already exist and pages, posts and testimonials point to them
  (`relation` with `to: 'categories'`); Testimonials already has `Which testimonials` (All, Buttons with tags, With tags, Marked
  "Show on the front page", Selected). So filtering by tag exists for one block; the list blocks of finding 13 have only typed rows.
- **Design, part A, a list block can use a list:** each of List, Segmented list and FAQ list gets a choice `Rows from`: `Typed
  here` (today) or one of the site's lists. With a list chosen, the block maps the list's fields to the row: icon to the icon,
  title to the heading, body text to the text, a link to the arrow. `Which rows`: all, those with chosen tags, or selected by
  hand (the same choices as `Which testimonials`), and `How many` (all, or a number such as 3 or 4, in the list's order). The same list can be shown on many pages with different tags; one place
  to edit the text.
- **Design, part B, the owner creates lists:** `Dynamic lists` gets `New list`. The owner names it and chooses its fields from
  a fixed set, each optional: `Icon`, `Title` (always), `Body text`, `Picture`, `Link`, `Tags`. The entries are files
  like the other lists' (`src/data/<list>/<slug>.json`); the list's definition is a small file beside them, read by the editor and the build. This
  is **new**: today a list's fields live in code, so the editor must learn collections whose fields come from a file.
  A list the owner made cannot have a field the fixed set lacks (no free field types), so check:content and the build stay
  simple. Deleting a list asks first, and refuses while a block uses it (as `blockSettings.stillOn` does).
- **Tags:** the lists use the same `Tags` as pages and posts, with the same `Create a tag` shortcut, so one tag can mean
  the same on a page, a post and a list entry. Pages show a list's entries by tag; the tag is the owner's way to say "this
  entry belongs on this page".
- **Touches 0.16:** the `Dynamic lists` screen and the app lists (`lists.ts`, contract 4 and 5) are in the same files as
  0.16's store sections (roles). App lists stay as they are and appear in `Rows from` like the owner's. Build after 0.16.
- **Cost and risk:** this is the largest change of the spec: a new kind of stored definition, a screen to make lists, a data
  migration path (none needed for existing lists), and block rendering that reads entries at build time (the site is built from
  files, so the entries must be there when the block is drawn, as testimonials are). The block's preview in the editor needs the
  entries, as `siteOf` in `sitedata.ts` gives them for the others. Needs a design of the `New list` screen before a plan.

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
| G | **Text and blocks:** `Body large` and `Label` styles, dotted H2 line, editor opens on H1, blocks lose their head fields with a migration, sheet buttons (10, 11, 12) | `MarkdownEditor`, `BlockDialog`, `standard/*`, `theme/blocks/*`, `lib/section-marker.mjs` | no | none |
| H | **Group similar blocks:** step 1 of finding 13, headings in the `Insert` picker and sharper hints (13) | `BlockDialog`, `blocks.ts` texts, `da-DK` | no | none |
| I | **Merge the row blocks:** step 2 of finding 13, with a migration (13) | `standard/*`, `theme/blocks/*`, every theme | no | Q6 |
| J | **Inline block editing:** fields fold out in the text, no sheet for block fields, one open at a time (14) | `MarkdownEditor`, `BlockDialog`, `sheetPlacement.mjs`, `editor.css` | no | none |
| K | **WYSIWYG page:** the page head drawn in place (step 1), then the frame toggle (step 3) (15) | `EntryForm`, `MarkdownEditor`, `titleH1.mjs`, `Screen`, theme `editor/previews.tsx` | no | Q7 |
| L | **Lists from lists:** `Rows from` on the three list blocks, tags filter, then `New list` with the fixed field set (16) | `standard/list*`, `Library` (`Lists`), `site.ts`, `lib/` (list definitions), build | **yes**: `Dynamic lists`, app lists | none |
| F | **Blocks and pictures flow:** alt after pick, rename `Hide on the page`, sheet-close wording (6, 7) | `BlockDialog`, `Media`, `MarkdownEditor` | no | Q5 |

Order: B and C first (no decision, no overlap). A after Q1 and Q2. D any time. **E waits for 0.16**: merge it into `0.16`
or after it, never before the Appstore and Assistants rows exist. F after A, so the status word is settled. J replaces the sheet buttons of G (finding 12): build G without them and J after G and I, because it uses the single row editor. K step 1 goes with G (the H1 start, the same top of the text); step 3 last. L after 0.16 and after the list blocks of H and I exist; split part A (a block reads an existing list) from part B (`New list`), A first. H can go with B and C (no decision). I only after G, since both change the same block files and the same migration, and after the owner has seen H. G is the largest: split it at its tasks (text styles and the dotted line; the H1 start; the head fields with their migration; the sheet buttons), the migration last and only after the owner has seen the text styles. It changes what every theme draws, so `check:themes` and `check:demo` must pass.

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
6. **Only group the similar blocks in the picker, or also merge them into fewer blocks (`Rows`, `Questions`)?** Recommended:
   group first (batch H), look at it, then decide on the merge (batch I). The merge is larger and changes every theme.
7. **Draw the page head (title, top picture, date, tags) in the text, and an optional frame with the site's header and footer?**
   Recommended: yes to the head (step 1) now, and the frame (step 3) after the owner has seen step 1.
8. **Decision 4 (dotted line instead of a box) against decision 7 (more like the site):** keep the colour box for a coloured
   section as the site draws it, and use the dotted line only to mark where a section starts (sections with no colour, and
   as a boundary marker above each)? Recommended: yes. Alternative: dotted line only, and the colour shown on the site only.
