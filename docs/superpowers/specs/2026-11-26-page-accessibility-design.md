# An Accessibility section in the page and post forms

Architect, 26 Nov 2026; revised the same day after three EGM reviews (the second and third by a separate review session; its report is
`docs/superpowers/reviews/2026-11-26-page-accessibility-design.md`). Line: **0.19.9**, a version of its own. Status: **approved by the
owner, 26 Nov 2026**, with the answers below. Built after 0.19.8 is released, by the PM the owner starts with `/pm 0.19.9`.

## The decision (owner, 26 Nov 2026)

- The owner asked "Should we Add an accessibility section to blogs and pages?". The Architect proposed a rating like the SEO rating,
  scored in the same wheel, and the owner said yes.
- Not in the lists (answer "1 no" to "show it in the lists?"): the Pages and Posts lists and `#seo/rating` show the SEO score only.
- Its own version, not part of 0.19.8 ("Or give it is often number", read as: give it its own version number). This replaces "0.19.7 and
  0.19.8 are the last patch releases" in `plans/2026-11-22-one-release-per-line.md`.
- Cards get a *Decorative image* switch ("agree add switch"), so a card's image is described or marked decorative, never assumed
  decorative.
- An image counts as described when it has its own alt text **or the Library's text** ("Yes", to: should the ratings use the Library's
  text for an image that has none of its own, as the site does?).
- A post's *Image at the top* counts in the image check ("yes").
- A post always shows the section, with a short note when nothing applies ("yes").

## The problem

Today nothing in the editor tells a writer that a page has an image without alt text, a link with no text, a video without a title or
a table without a header row. The SEO rating covers some of it, for search engines. This section shows the writer what makes the page
harder to use with a screen reader, and how to fix it.

## What the writer sees

A section **Accessibility** in the form of every page and every post: the collections the SEO rating covers (`isRated`,
`src/SeoScores.tsx`), edited in `EntryForm.tsx`, the front page and the blog page among them. Folded like the others, right after
*Search engines* and before *Social media*; in the *Sections* list in the same place, wherever the form shows that list; *Danger* stays
last.

It holds the editor's `CheckList` (`src/ui.tsx:3055`) titled *Accessibility rating*, the same part as the SEO rating, with its score
wheel and the checks not passed first, each with its fix. When no check applies (a post with no image, link, heading, video or table),
it holds the editor's `EmptyNote` (`src/ui.tsx:2892`) with *Nothing to check yet* instead, never a wheel (`scoreOf([])` would show 100).

The score is `scoreOf` from `lib/score.mjs`, the SEO rating's function as it is: every check that applies weighs the same, the score
is passed ÷ applicable, rounded, green from 90, orange from 50, else red.

The rating is advice, never a failure: nothing stops a save or a publish, and no check of the repository fails on a page's score.

Checks 1, 2 and 4 appear in both the SEO rating and this one, and one fix moves both scores. That is intended (one rule, shown twice).

## The checks

Only what the writer controls in the form, read from the saved text and fields.

| # | Check (pass text) | Applies when | Passes when | WCAG 2.2 | Shared with SEO |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | *All images have an alt text* | the page has an image | every counted image (below) is described by `resolveAlt` (`src/imageAlt.mjs`): its own text, else the Library's text; or it is decorative, by its own mark or the Library's | 1.1.1 | yes: `countedImages()`, `altUseOk` |
| 2 | *The text has one main heading* | always, on a page; never on a post (its title is its H1) | the text has exactly one H1 | best practice (1.3.1); no criterion requires it | yes: `h1s()` |
| 3 | *The headings are in order* | the text has a heading below its H1 (a post: any heading) | no heading in the text is more than one level below the heading before it; a page's first is its H1, a post's title counts as the level 1 before its first heading | best practice (1.3.1) | no (new) |
| 4 | *The links have descriptive text* | the text has a link | no link's text is only a vague phrase (`vague()`, `src/seo.ts:163`) | 2.4.4 | yes: `links()`, `vague()` |
| 5 | *Every link has text* | the text has a link | no link has an empty text; a Markdown image link counts its image's alt text | 2.4.4, 4.1.2 | no (new) |
| 6 | *The video has a title* | the page has a Video block | every Video block has a `title` that is not blank | best practice (WCAG technique H64: a frame's title describes it); the site's fallback "Video" (`src/standard/video/view.ts:34`) already gives the player a name (4.1.2) | no (new) |
| 7 | *The table has a header row* | the page has a Table block | every Table block has `header` on (a table without the prop has it on, its default, `src/standard/table/view.ts:13`) | 1.3.1 | no (new) |

**The counted images** (check 1 and the SEO rating's image check, one function, `countedImages`, *One rule, shown twice*): the images of the text, a section's background
image, the Markdown images in blocks, Cards images, and a post's *Image at the top* (`image`, `imageAlt`, `imageDecorative`;
`EntryForm.tsx:98`). A section's background image has no decorative switch (`src/SectionSettings.tsx`); it is described by its own
text or the Library's, and its Alt text hint asks for a description (*Texts*; see *Limits*).

**Blocks** for checks 6 and 7: every Video and Table block, also one inside another block, as `images()` finds blocks (`blocksIn(p, true)`).

**Headings** for check 3: the ATX lines of the text (`#` to `######`, up to three spaces before), outside fenced code (`outsideCode`), as
`h1s()` reads them. A block's line is HTML, so headings in a block's props are not read (see *Limits*).

Check 3 reports the first skip only, as check 4 reports the first vague link. The editor offers H1 (once), H2 and H3
(`lib/heading-levels.mjs`, `headingChoices`), so a skip comes from a Subheading before any Heading or from Markdown that was pasted or
imported.

### Cards' images

Today `images()` counts every Cards image as missing (`src/seoImages.ts:113-115`), although Cards has had its own `alt` field since 0.17.0.
Fixed here (owner: "Fix how is okay", approving the fix):

- **The switch.** A card whose media is an image gets the field *Decorative image* in its media sheet (since #1271 a card's only sheet: built from `inline.media`,
  `src/MarkdownEditor.tsx:2118-2122`, and opened by tapping the card's image or the bar's _Alt text_), the same field as for an image in the
  text (`IMAGE`, `src/BlockDialog.tsx:211-233`: `t.blocks.picture.decorative`, its toggle and its hint "Screen readers skip the image."),
  a `boolean` field with `toggle`, `only: { field: 'media', is: ['image'] }`. It goes in the card's `inline.media` list
  (`src/standard/cards/index.tsx:29`) right before `alt`, or the sheet does not draw it. _Alt text_ gets
  `only: { field: 'media', is: ['image'], and: { field: 'decorative', is: ['', 'false'] } }`, so it shows only while the switch is off
  (`inUse`, `src/check.ts`, reads the card's own field first, then the block's). `LinkCardProps` (`src/standard/cards/view.ts:69`) gains
  `decorative?: boolean`. Stored as `true` while on, and absent while off; read everywhere through one helper,
  `cardDecorative(card)` in `src/seoImages.ts` (`true` or `'true'`).
- **The card's toolbar** (`cardImageTools`, `src/MarkdownEditor.tsx:2228-2286`): _Alt text_ below medium passes the card's
  `decorative` to the alt text sheet and writes back both: `put({ alt: text.decorative ? '' : text.alt.trim(), decorative: text.decorative || undefined })`;
  from medium, `openAlt` reaches _Decorative image_ when it is on (`reachField(t.blocks.picture.decorative)`), else _Alt text_.
  `reachField` (`src/BlockDialog.tsx:75-87`) finds a field's `<label>` by its whole text and then the element its `htmlFor` names; a
  switch is one `<label>` with no `htmlFor` whose text includes its hint (`theme/ui/Switch.tsx`), so `reachField` gains a second way: a
  `<label>` whose `.mo-setting-row__label` text is the name, and then the `input` inside it.
  _Change image_ writes `decorative` from the sheet the same way (a new image starts off). _Remove_ clears it:
  `put({ image: '', alt: '', decorative: undefined })`.
- **The site.** A decorative card draws `alt=""` and never the Library's text (`imageOfCard`, `cards/view.ts:91`). Otherwise as today:
  its own alt text, else the Library's, else `alt=""`. The comment at `cards/view.ts:75` ("none: the image is decorative") becomes "none:
  the Library's text, else none".
- **The ratings.** A card is described when it is decorative, has its own alt text, or its image has the Library's text. Today every
  Cards image counts as missing, so no score drops: cards with any of these now pass, in both ratings.

### Left out, on purpose

- **Captions** (1.2.2): a video is a YouTube or Vimeo embed, whose captions are the provider's; the editor cannot see them (owner, 26 Nov
  2026: "Video start out", read as: captions are left out; M3 _Alt text_: "Long-form video content uses video description to narrate
  the visual elements of a video, so it doesn’t need alt text").
- **Text over images** (owner, 26 Nov 2026: "what does md3 say about overlay on images or media. Follow that"): M3 Cards, Guidelines,
  read with Playwright 26 Nov 2026: "Add a translucent scrim or bounding shape beneath the text or icon to help ensure proper contrast."
  Material does this: a section's text on its background image sits on a solid panel (`theme/styles/blocks/text-section.css`,
  `.mo-has-image::before`). It is the theme's drawing, not the writer's.
- **Headings a block draws** (`BlockHead.tsx` h2, `Panel.tsx`, `StepList.tsx` h3): the theme's drawing, like contrast. Check 3 reads the
  text's headings only.
- **Contrast, text sizes and target sizes**: the theme's, classified on the theme's page (0.19.8 task 17).
- **Language of parts, reading order, focus**: the editor cannot tell them from the text (language, reading order), or the code owns
  them (focus; task 17's hard checks).

### Limits

- **Images not counted yet**, as in the SEO rating today: Image grid's picked images, Testimonials' photos, the Video thumbnail and
  List rows' images.
- **Videos** counted by check 6 are Video blocks only: a video in a card or written in the text is not.
- **Headings** inside a block's props, and setext headings (a line of `===` or `---` under text), are not read by check 3. The editor
  writes neither.
- **Links**: an HTML `<a>` around an `<img alt>`, and a link named only by `aria-label`, read as links with no text (check 5).
- **Hidden blocks count** ("Hide on page"), as in the SEO rating.
- **A section's background image** has no _Decorative image_ switch: a background that is only decoration counts as not described
  until it has a text. Its hint no longer says to leave it empty (_Texts_). A switch for it is a change to section settings, for the
  owner to decide separately.
- **Other collections** and the `DataForm.tsx` screens get no Accessibility section. DataForm's SEO rating (`DataForm.tsx:222`) does
  get `library` (it already has `libraryAltOf`, `DataForm.tsx:21, 118`), so the SEO rating reads the Library's text wherever it shows.

### Not chosen

- **Folding the checks into the SEO rating**: the owner approved a section of its own.
- **axe-core on the live preview**: it adds several hundred KB to the editor's bundle, the preview is not always mounted, it judges the
  theme's drawing rather than the writer's text, and it would judge the shared checks differently from the SEO rating.
- **A gate on publish**: the rating is advice; the Architect's proposal, which the owner approved, has none.
- **Offering H3 only after an H2** in the heading menu (`headingChoices`), which would prevent most skips: a change to the text editor,
  for the owner to decide separately.

## One rule, shown twice

The two ratings never judge the same thing two ways: they call the same functions, and a check's text belongs to its rating.

- **Images** (`src/seoImages.ts`, pure, no i18n): `images(body)` returns each image's `src` as well as its `alt` and `decorative`.
  `altUseOk(use, base?)` takes the Library's record (`AltBase`, `src/imageAlt.mjs`) as `base` and is `resolveAlt(use, base).from !== 'none'`.
  `cardDecorative(card)` is new. The comment that Cards images have no description field goes.
  `countedImages(body, top?)` is new: the one list of counted images, `images(body)` and, when `top.image` is set, a post's _Image at
  the top_ as `{ src: top.image, alt: top.imageAlt, decorative: top.imageDecorative }`. The SEO rating's image check
  (`src/seo.ts:237-240`) and `a11yChecks` both call it, never `images()` and the top image apart.
- **Links and headings, moved** from `src/seo.ts` into `src/seoImages.ts`: `h1s()`, `links()`, the `H1`, `LINK` and `A` patterns. `H1` is
  exported, as `h1First` in `seo.ts` uses it; `seo.ts` imports the moved functions and re-exports `h1s` and `links`. The file's header
  comment changes from images alone to "the pure rules both ratings share".
- **The new rules** in a new pure file, `src/a11yChecks.ts` (no i18n): `headingLevelsOf(body)` (the levels of the text's headings, as
  above), `untitledVideos(body)` and `headerlessTables(body)` (how many blocks fail), and `a11yChecks(input, vagueList)`: for each check
  that applies, its number, whether it passed, and its count or values (the first skip's `{ from, to }`, the first vague link's text), in
  the table's order. Check 4 is `isVague(text, vagueList)` from `src/vagueLink.ts`, which loads without `./i18n`; `a11yRating` passes
  `vagueLinksOf(siteLocale)`, so nothing in `a11yChecks.ts` imports `./i18n` and `node --test` loads it. Check 5 is
  `links(body).filter((text) => !text)`. Check 2 applies as in `seoRating` (`src/seo.ts:189-191`): not on a post, and not on a page with
  its own H1 field (`input.h1`).
- **The heading rule** `skippedHeadings(levels)` in `lib/heading-levels.mjs`, beside `headingChoices`: the first skip in a list of levels
  as `{ from, to }`, or none. A post, or a page with its own H1 field, passes `[1, ...headingLevelsOf(body)]`, its title first; a page passes
  `headingLevelsOf(body)`.
- **The input.** `SeoInput` (`src/seo.ts:14`) gains `image`, `imageAlt` and `imageDecorative` (a post's _Image at the top_, which
  `seoInputOf` reads from the values) and `library?: (src: string) => AltBase | undefined`, all optional, so `DataForm.tsx:222` keeps
  compiling and only adds `library`. `seoInputOf(values, body, post, relations, library?)` (`src/seo.ts:43`) gains the fifth parameter;
  `fileRating(text, post, relations, library?)` passes it on. The form passes its `libraryAlt` (`EntryForm.tsx:283`), and both rating
  memos add `libraryAlt` to their dependencies. In `SeoScores.tsx` the module-level `rate(collection, file, relations)` (`:48`) gains
  `library` and passes it to `fileRating`; the list makes it once in a `useMemo` from `recordsIn(env.files, config.fileRecords)` and
  `libraryAltOf`, with the imports `EntryForm.tsx:13, 36, 37` has (`config` from `@site/editor`, `recordsIn` from `./fileRecords.mjs`,
  `libraryAltOf` from `./imageAlt.mjs`). `Library.tsx:1324` does the same.
- **The rating** in `src/accessibility.ts`: `a11yRating(input): SeoCheck[]`, which turns `a11yChecks(input)` into the texts below. It
  takes the same `seoInputOf(values, body, post, env.relations)` the form already makes, with `library`.
- **Each rule's WCAG criterion** is written in a one-line comment on the rule, as in the table above.

**Kept up to date.** The SEO rating is recomputed only while _Search engines_ is near the screen, and the text is read from the editor
only while _Search engines_ or _Social media_ is (`EntryForm.tsx:406-424`: `seoNear`, `textNear`). The Accessibility section is always
there (pages and posts), so it gets its own box from the first render, `a11yNear = useInView(a11yBox, '200px')`; `textNear` becomes
`seoNear || shareNear || a11yNear`; and `a11yRating` has its own memo that keeps its last value while the section is far, as `rating`
does (`EntryForm.tsx:615-620`). The `sections` list (`EntryForm.tsx:378`) gets `{ id: 'accessibility', label: t.forms.accessibility }`
after `seo` when `isRated(collection)` (`SeoScores.tsx:56`; `EntryForm` draws every Markdown collection), without `has()`: the section
has no fields; the section's JSX has the same condition. The `Section` type gains `'accessibility'` between
`'seo'` and `'share'`, and the JSX of the section goes between those two sections'.

## Texts (en-US first; da-DK after, by `site-editor-writing`)

The editor names heading levels as the writer sees them (`src/i18n/en-US/text.ts:9-11`): level 1 is the _main heading_ (a post's: the
_title_), 2 a _Heading_, 3 a _Subheading_, a deeper one a _level N heading_. The texts that name levels take the level numbers and
`post`, and each language file builds its whole sentence from them with a helper of its own, so each language sets its own articles and
capitals; no name is passed from one text into another.

`t.forms.accessibility`: `Accessibility` (beside `t.forms.seo` and `t.forms.share`). The reused checks read their texts from
`t.forms.seoRating` (`allAlt`, `noAlt`, `fixAlt`, `oneH1`, `noH1`, `manyH1`, `fixNoH1`, `fixManyH1`, `goodLinks`, `vagueLink`,
`fixLink`); nothing is copied. `t.forms.a11yRating` holds the new ones:

- `title`: `Accessibility rating`; `nothing`: `Nothing to check yet`
- `headingsInOrder`: `The headings are in order`; `skippedHeading(from, to, post)`: for example "A Subheading comes after the main
  heading, so a level is skipped", "A level 4 heading comes after a Heading, so a level is skipped"; `fixSkippedHeading(level, post)`,
  with `level` = `from` + 1: for example "Make it a Heading, or add a Heading before it."
- `linkTexts(n)`: `n === 1 ? 'The link has text' : 'Every link has text'`; `emptyLink(n)`: `${n} ${n === 1 ? 'link has' : 'links have'} no text`;
  `fixEmptyLink`: `Write what each link leads to.`
- `videoTitles(n)`: `n === 1 ? 'The video has a title' : 'The videos have a title'`; `noVideoTitle(n)`:
  `${n} ${n === 1 ? 'video has' : 'videos have'} no title`; `fixVideoTitle`: `Write a title under each video.`
- `tableHeaders(n)`: `n === 1 ? 'The table has a header row' : 'The tables have a header row'`; `noTableHeader(n)`:
  `${n} ${n === 1 ? 'table has' : 'tables have'} no header row`; `fixTableHeader`: `Turn on Header row in the table's settings.`

`fixAlt` changes so it holds for every counted image, a section's background too: `Describe each image in its Alt text field, or turn on
Decorative image where there is one.` (the SEO rating shows the same text). Danish for all of them by the writing skill; a missing key
fails `check:types` (the `Messages` type), and Danish outside the language files fails `check:language`.

`text.sectionImageAltHint` (`src/i18n/en-US/text.ts:65`) changes from "Leave it empty for an image that is only decoration." to the
image block's hint, "Describe the image in a few words, for people who can’t see it." (`blocks.picture.altHint`), and its Danish with it.

## Tests

The pages with faults are not added to the demo's content, whose own accessibility checks they would fail. Each test that needs one makes
a new page in the demo's editor and does not save it. Tests 1 to 8 run on the pull request's Preview (skill `qa`); test 9 runs on `morpheme-staging`,
by the version QA. Checks are named by the texts on screen. Every image of the demo has a Library text, so a test that needs an image
without one uploads a new image.

```
1. The section is there
   Where: the demo's editor, a page's form, 1280 and 390, Material
   Do:    open the form; at 1280 look at the Sections list
   Expect: Accessibility right after Search engines and before Social media, folded; at 1280 in the Sections list in the same
          place; Danger last
   Source: this spec, What the writer sees

2. The score and the checks
   Where: the demo's editor, a new page, 1280, Material
   Do:    type a Main heading, then a Subheading (no Heading before it); upload a new image and add it without alt text; type a link with the text "click here"; add a Video block with
          the address https://www.youtube.com/watch?v=aqz-KE-bpKQ and no title, and a Table block with Header row off; open
          Accessibility
   Expect: seven checks, two passed ("The text has one main heading", "The link has text"), the wheel 29, red; the five not
          passed first: "1 image has no alt text", "A Subheading comes after the main heading, so a level is skipped",
          "The link "click here" doesn’t say where it leads", "1 video has no title", "1 table has no header row", each with
          its fix
   Source: The checks

3. Fixing raises it
   Where: the page of test 2
   Do:    give the image alt text, make the Subheading a Heading, change the link's text to "See the prices", type the
          video's title, turn the header row on
   Expect: 100, green, with no reload; then open Search engines: "All images have an alt text" and "The link has a
          descriptive text" pass there too
   Source: One rule, shown twice

4. A post
   Where: the demo's editor, a new post, 1280
   Do:    open Accessibility at once; then set a newly uploaded image as Image at the top, with no alt text, and type a link
   Expect: first "Nothing to check yet" and no wheel; then "1 image has no alt text" and the link checks, and no "main
          heading" check; turning on the top image's Decorative image passes the image check
   Source: The checks; The decision

5. A card's image
   Where: the demo's editor, a new page with one Cards block whose media is Image and one card with a newly uploaded
          image and no alt text, 1280 and 390
   Do:    open Accessibility; tap the card's image to open its media sheet (at 390 through the toolbar's Alt text), turn on
          Decorative image; close it and select the toolbar's Alt text again; then Change image to another new image
   Expect: before: "1 image has no alt text" in both ratings; the switch hides Alt text; after: "All images have an alt
          text" in both; the toolbar's Alt text puts the focus on Decorative image at 1280 and shows it on at 390; the
          changed image starts with the switch off
   Source: Cards' images

6. The Library's text
   Where: the demo's editor, 1280
   Do:    in the Library give an image a description (Alt text); on a new page add that image with no alt text of its own;
          open Accessibility and Search engines
   Expect: "All images have an alt text" in both ratings
   Source: The decision; One rule, shown twice

7. Not in lists
   Where: the demo's editor, Pages, Posts and #seo/rating, 1280
   Do:    open each
   Expect: only the SEO score, as in 0.19.8; no accessibility score anywhere
   Source: The decision

8. Danish
   Where: the demo's editor in Danish, a new page made as in test 2, with also the card of test 5; then a new post
   Do:    open Accessibility before fixing anything; open the card's media sheet; then open Accessibility on the new post
   Expect: the section's name, its title, the five checks not passed with their fixes, the two passed, and the card's
          switch, in Danish; on the post, Nothing to check yet in Danish
   Source: Texts

9. Nothing blocks
   Where: morpheme-staging, a new page with test 2's faults, scored below 50 (version QA)
   Do:    save, then publish; then delete the page
   Expect: save and publish work, and no dialog appears
   Source: What the writer sees
```

Unit tests (`node --test`):

- `src/seoImages.test.mjs`: `images()` with Cards: own alt text (passes), `decorative` on as `true` and as `'true'` (passes), neither
  (missing), the Library's text only (passes with `base`, missing without); `altUseOk` with a Library record marked decorative (passes);
  `images()` returns each image's `src`. The old test that a Cards image always counts as missing changes with it, and the `base` tests
  take an `AltBase`. `countedImages`: a body alone; a post's top image with alt text, decorative, and with neither. Check 5: an
  empty link; a Markdown image link with and without alt text.
- `lib/heading-levels.test.mjs`: `skippedHeadings`: `[1, 2, 3]` (none); `[1, 3]` (1 → 3); `[2, 4]` (2 → 4); two skips (the first only);
  `[]` (none).
- A new `src/a11yChecks.test.mjs` (it passes the en-US vague list): `headingLevelsOf` (ATX levels, a heading in fenced code not read, a block's line not read);
  `untitledVideos` (a title, none, only spaces, a Video inside another block); `headerlessTables` (`header` on, off, no prop); and
  `a11yChecks`: a page with test 2's faults (the seven checks, two passed, in the table's order); a post (no check 2; its title before
  its first heading; its top image counted); a post with nothing (no checks); the Library's text passing an image.

The screens unit (`scripts/screens/forms.mjs`, in `register()`, at 390×844 and 1280×900) makes test 2's page as a `virtualFile`, unfolds
Accessibility and checks the section's place, its seven items and, after the wheel's count-up, its 29. A unit in
`scripts/screens/cards.mjs` checks that a decorative card is drawn with `alt=""` although its image has a Library text. Keyboard flow
D (`scripts/keyboard-flows.mjs:233-238`) walks Search engines, Social media and History; Accessibility goes between the first two.

## Changes

- Modify `src/seoImages.ts`: `images()` with `src`, Cards' `decorative` and own alt text, `altUseOk(use, base?)`, `cardDecorative`,
  `countedImages`; `h1s`,
  `links`, `H1`, `LINK`, `A` moved in; its header comment.
- Create `src/a11yChecks.ts`: `headingLevelsOf`, `untitledVideos`, `headerlessTables`, `a11yChecks`.
- Create `src/accessibility.ts`: `a11yRating`.
- Modify `src/seo.ts`: imports and re-exports the moved functions; `SeoInput` and `seoInputOf` with the post's top image and `library`;
  `fileRating` takes `library`; the image check calls `countedImages` and passes `base`. Nothing else changes in what it rates.
- Modify `lib/heading-levels.mjs`: `skippedHeadings`.
- Modify `src/EntryForm.tsx`: the `Section` type, the `sections` entry, the section and its box, `a11yNear`, `textNear` and the memo;
  `library` into `seoInputOf`.
- Modify `src/SeoScores.tsx`, `src/Library.tsx` and `src/DataForm.tsx`: the Library's records into the SEO rating.
- Modify `src/BlockDialog.tsx`: `reachField` finds a switch.
- Modify `src/standard/cards/index.tsx`, `src/standard/cards/view.ts` and `src/MarkdownEditor.tsx`: the `decorative` field, its place in
  `inline.media`, Alt text's condition, `LinkCardProps`, `imageOfCard` and its comment, and the toolbar's tools.
- Modify `src/i18n/en-US/forms.ts` and `src/i18n/da-DK/forms.ts`: the texts above and `fixAlt`; `src/i18n/en-US/text.ts` and
  `src/i18n/da-DK/text.ts`: `sectionImageAltHint`.
- Modify `src/seoImages.test.mjs`, `lib/heading-levels.test.mjs`, `scripts/screens/forms.mjs`, `scripts/screens/cards.mjs` and
  `scripts/keyboard-flows.mjs`; create
  `src/a11yChecks.test.mjs`.
- The version: the feature `feature/0.19.9-accessibility`, cut from `main` after 0.19.8 is released (skill `pm`); its one pull request sets
  `version` 0.19.9 in `package.json`, `package-lock.json` and, with `node scripts/starter.mjs`, `starter/package.json` (skill
  `changesets`).
- Three `patch` changesets, as a note's id is its changeset's file name (skill `release-notes`; skill `changesets`):
  `accessibility-section` (a paragraph, `feature`: the Accessibility section), `cards-decorative-image` (a paragraph, `feature`:
  Cards' _Decorative image_) and `seo-rating-library-text` (a line, `improvement`: the SEO rating counts an image's Library text and a
  post's top image, and no longer counts every Cards image as missing).

One pull request.
