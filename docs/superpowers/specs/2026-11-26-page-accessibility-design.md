# An Accessibility section in the page and post forms

Architect, 26 Nov 2026; revised the same day after an EGM review. Line:
**0.19.9**, a version of its own. Status: **approved by the owner, 26 Nov 2026**; the revision is approved too ("2 good"). Built after
0.19.8 is released, by the PM the owner starts with `/pm 0.19.9`.

## The decision (owner, 26 Nov 2026)

- The owner asked "Should we Add an accessibility section to blogs and pages?". The Architect proposed a rating like the SEO rating,
  scored in the same wheel, and the owner said yes.
- Not in the lists (answer "1 no" to "show it in the lists?"): the Pages and Posts lists and `#seo/rating` show the SEO score only.
- Its own version, not part of 0.19.8 ("Or give it is often number", read as: give it its own version number).
- Cards get a *Decorative image* switch (owner, 26 Nov 2026: "agree add switch"), so a card's image is either described or marked
  decorative, never assumed decorative.

## The problem

Today nothing in the editor tells a writer that a page has an image without alt text, a link with no text, a video without a title or
a table without a header row. The SEO rating covers some of it, for search engines. This section shows the writer what makes the page
harder to use with a screen reader, and how to fix it.

## What the writer sees

A section **Accessibility** in the form of every page and every post (`EntryForm.tsx`, the `pages` and `blog` collections), folded
like the others, right after *Search engines*; in the *Sections* list (large screens and wider) in the same place; *Danger* stays last.
It holds one thing: the theme's `CheckList` titled *Accessibility rating*, the same part as the SEO rating, with its score wheel and
the checks not passed first, each with its fix.

The score is `scoreOf` from `lib/score.mjs`, the SEO rating's function as it is: every check that applies weighs the same, the score is
passed ÷ applicable, rounded, green from 90, orange from 50, else red.

The rating is advice, never a failure: nothing stops a save or a publish, and no check of the repository fails on a page's score.

Checks 1, 2 and 4 appear in both the SEO rating and this one, and one fix moves both scores. That is intended (one rule, shown twice):
do not remove the doubles.

## The checks

Only what the writer controls in the form, read from the saved text.

| # | Check | Applies when | Passes when | WCAG 2.2 | Shared with SEO |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Images have alt text | the page has an image | every image counted by `images()` (in the text, a section's background image, Markdown images in blocks, Cards images) is marked decorative or has its own alt text (`altUseOk`, without the Library) | 1.1.1 | yes: `images()`, `altUseOk` |
| 2 | One main heading | always, on a page; never on a post (its title is its H1) | the text has exactly one H1 | best practice (1.3.1); no criterion requires it | yes: `h1s()` |
| 3 | Headings in order | the text has a heading below H1 | no heading in the text is more than one level below the heading before it; level 1 is the page's H1, or a post's title | best practice (1.3.1) | no (new) |
| 4 | Links say where they lead | the text has a link | no link's text is only a vague phrase (`vague()`, `src/seo.ts`) | 2.4.4 | yes: `links()`, `vague()` |
| 5 | Links have text | the text has a link | no link has an empty text; a Markdown image link counts its image's alt text | 2.4.4, 4.1.2 | no (new) |
| 6 | Videos have a title | the page has a Video block | every Video block has a `title` that is not blank | best practice (WCAG technique H64: a frame's title describes it); the site's fallback "Video" already gives the player a name (4.1.2) | no (new) |
| 7 | Tables have a header row | the page has a Table block | every Table block has `header` on (a table without the prop has it on, its default) | 1.3.1 | no (new) |

A page always has check 2, so it always shows a rating. A post with nothing to test has no checks: its form leaves the section out, and
the *Sections* list with it, until something applies.

Check 3 reports the first skip only, as check 4 reports the first vague link. The editor offers H1 (once), H2 and H3, so a skip comes
from an H3 before any H2 or from Markdown that was pasted or imported.

### Cards' images

Today `images()` counts every Cards image as missing ("A Cards block's images have no description field yet", its comment). Cards has
had an `alt` field since 0.19.7. Fixed here (owner: "Fix how is okay", approving the fix):

- **The switch.** A card whose media is an image gets the field *Decorative image* in its sheet, the same field as an image in the text
  (`t.blocks.picture.decorative`, its toggle `On`/`Off` and its hint "Screen readers skip the image."), stored as the card's
  `decorative` prop. *Alt text* shows only while the switch is off, as for an image in the text (`BlockDialog.tsx`, `IMAGE`).
  Components: existing (the form's `boolean` field with `toggle`, as the image block's).
- **The site.** A decorative card draws `alt=""` and never the Library's text. Otherwise as today: its own alt text, else the Library's,
  else `alt=""`.
- **The rating.** A card passes check 1 (and the SEO rating's image check) when it is decorative or has its own alt text. A card with
  neither counts as missing, also when the Library has a text for its image (see *Limits*). Existing cards have no switch set, so a card
  without its own alt text now shows as missing in both ratings; the release note says so.

### Left out, on purpose

- **Captions** (1.2.2): a video is a YouTube or Vimeo embed, whose captions are the provider's; the editor cannot see them (owner, 26 Nov
  2026: "Video start out", read as: captions are left out; M3 *Alt text*: "Long-form video content uses video description to narrate
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

- **The Library's text is not read** by either rating, in the form or in the lists (`fileRating` has no Library records). A Library-aware
  rating for every image is a change of its own.
- **Images not counted yet**, as in the SEO rating today: Image grid's picked images, Testimonials' photos, the Video thumbnail and
  List rows' images.
- **Hidden blocks count** ("Hide on page"), as in the SEO rating.
- **Markdown only**: an HTML `<a>` around an `<img alt>` reads as a link with no text.
- **Fixed pages** (`DataForm.tsx`: the front page, the blog page) and other collections get no Accessibility section.

### Not chosen

- **Folding the checks into the SEO rating**: the owner wants a section of its own.
- **axe-core on the live preview**: a large bundle in the editor, the preview is not always mounted, it judges the theme's drawing
  rather than the writer's text, and it would judge shared checks differently from the SEO rating.
- **A gate on publish**: the owner wants advice only.
- **Offering H3 only after an H2** in the heading menu (`headingChoices`), which would prevent most skips: a change to the text editor,
  for the owner to decide separately.

## One rule, shown twice

The two ratings never judge the same thing two ways: they call the same functions, and a check's text belongs to its rating.

- **Pure rules** in `src/seoImages.ts` (no i18n, so `node --test` loads it): `images()` and `altUseOk` as today, plus `h1s()`, `links()`
  and the `LINK` and `A` patterns, moved from `src/seo.ts` (which re-exports them), and two new rules: `untitledVideos(body)` and
  `headerlessTables(body)`, each counting the blocks that fail. Check 5 is `links(body).filter((text) => !text)`.
- **The heading rule** `skippedHeadings(body, start)` in `lib/heading-levels.mjs`, next to `headingChoices`: the first skip as
  `{ from, to }`, or none. `start` is 1 (a page's H1 or a post's title).
- **The rating**: `src/accessibility.ts`, `a11yRating(input): SeoCheck[]`, from the same `seoInputOf(values, body, post, env.relations)`
  the form already makes. It calls `vague()` from `src/seo.ts` for check 4.
- **Each rule's WCAG criterion** is written in a one-line comment on the rule, as in the table above.

**Kept up to date.** The SEO rating is recomputed only while *Search engines* is near the screen, and the text is read from the editor
only while *Search engines* or *Social media* is (`EntryForm.tsx`: `seoNear`, `textNear`). The Accessibility section gets its own box
and `a11yNear = useInView(a11yBox, '200px')`, `textNear` becomes `seoNear || shareNear || a11yNear`, and `a11yRating` has its own memo
that keeps its last value while the section is far, as `rating` does.

## Texts (en-US first; da-DK after, by `site-editor-writing`)

`t.forms.accessibility`: `Accessibility` (beside `t.forms.seo` and `t.forms.share`). The reused checks read their texts from
`t.forms.seoRating` (`allAlt`, `noAlt`, `fixAlt`, `oneH1`, `noH1`, `manyH1`, `fixNoH1`, `fixManyH1`, `goodLinks`, `vagueLink`,
`fixLink`); nothing is copied. `t.forms.a11yRating` holds the new ones:

- `title`: `Accessibility rating`
- `headingsInOrder`: `The headings are in order`; `skippedHeading(from, to)`: `A level ${to} heading follows a level ${from} heading`;
  `fixSkippedHeading`: `Use the next level down, or the same level`
- `linkTexts`: `Every link has text`; `emptyLink(n)`: `${n} ${n === 1 ? 'link has' : 'links have'} no text`; `fixEmptyLink`:
  `Give each link text that says where it leads`
- `videoTitles`: `The videos have a title`; `noVideoTitle(n)`: `${n} ${n === 1 ? 'video has' : 'videos have'} no title`;
  `fixVideoTitle`: `Type a title under each video`
- `tableHeaders`: `The tables have a header row`; `noTableHeader(n)`: `${n} ${n === 1 ? 'table has' : 'tables have'} no header row`;
  `fixTableHeader`: `Turn on Header row in the table's settings`

`fixAlt` changes to fit a card as well as an image in the text: `Describe each image in its Alt text field, or turn on Decorative image.`
(the SEO rating shows the same text). Danish for all of them by the writing skill. `check:language` and `check:content` enforce it.

## Tests

The page with faults is not added to the demo's content, whose own accessibility checks it would fail. Tests 2 and 3 use a new page the
tester types in the demo's editor and does not save; test 7 runs on staging, where saving works.

```
1. The section is there
   Where: the demo's editor, a page's form, 1280 and 390, Material
   Do:    open the form; at 1280 open the Sections list
   Expect: Accessibility right after Search engines, folded; at 1280 in the Sections list in the same place; Danger last
   Source: this spec, What the writer sees

2. The score and the checks
   Where: the demo's editor, a new page, 1280, Material
   Do:    type one H1, an image without alt text, an H2 and then an H4, a link "click here" and no other image or link; add a Video
          without a title and a Table with Header row off; open Accessibility
   Expect: seven checks, two passed (One main heading; Every link has text), the wheel 29, red; the five not passed first, each
          with its fix
   Source: The checks

3. Fixing raises it
   Where: the page of test 2
   Do:    give the image alt text, make the H4 an H3, change the link's text, type the video's title, turn the header row on
   Expect: 100, green, with no reload; then open Search engines: its image and link checks pass
   Source: One rule, shown twice

4. A post
   Where: the demo's editor, a post with an image and a link, 1280
   Do:    open Accessibility
   Expect: no One main heading check; the image and link checks as for a page
   Source: The checks

5. A card's image
   Where: the demo's editor, a page with a Cards block of images, 1280 and 390
   Do:    open a card without alt text; then turn on Decorative image
   Expect: before: Images have alt text not passed in both ratings; the switch hides Alt text; after: passed in both
   Source: Cards' images

6. Not in lists
   Where: the demo's editor, Pages, Posts and #seo/rating, 1280
   Do:    open each
   Expect: only the SEO score, as in 0.19.8
   Source: The decision

7. Danish
   Where: the demo's editor in Danish, the page of test 2
   Do:    open Accessibility
   Expect: every text of the section and of the card's switch in Danish
   Source: Texts

8. Nothing blocks
   Where: staging, a page scored below 50
   Do:    save, then publish
   Expect: both work, and no dialog appears
   Source: What the writer sees
```

Unit tests (`node --test`, in `src/seoImages.test.mjs` and `lib/heading-levels.test.mjs`):

- `images()` with Cards: own alt text (passes), `decorative` on (passes), neither (missing), a Library text only (missing). The old test
  that a Cards image always counts as missing changes with it.
- `skippedHeadings`: H1 then H2 then H3 (none); H1 then H3 (1 → 3); H2 then H4 with start 1 (2 → 4); two skips (the first only).
- Check 5: an empty link; a Markdown image link with and without alt text.
- `untitledVideos`: a title, none, only spaces.
- `headerlessTables`: `header` on, off, and no prop (on).

The screens unit (`scripts/screens/forms.mjs`, in `register()`, at 390×844 and 1280×900) makes test 2's page as a `virtualFile` and
checks the section's place, that it is folded, its seven items and the wheel's 29.

## Changes

- Modify `src/seoImages.ts`: `h1s`, `links`, `LINK`, `A` moved in; `untitledVideos`, `headerlessTables`; Cards in `images()` reads
  `decorative` and the own alt text.
- Modify `src/seo.ts`: re-exports the moved functions; no change to what it rates.
- Modify `lib/heading-levels.mjs`: `skippedHeadings`.
- Create `src/accessibility.ts`: `a11yRating`.
- Modify `src/EntryForm.tsx`: the `Section` type gains `'accessibility'` between `'seo'` and `'share'`; the section, its box, `a11yNear`,
  `textNear` and the memo.
- Modify `src/standard/cards/index.tsx` and `src/standard/cards/view.ts`: the `decorative` field, and `alt=""` without the Library text
  when it is on.
- Modify `src/i18n/en-US/forms.ts` and `src/i18n/da-DK/forms.ts`: the texts above and `fixAlt`.
- Modify `src/seoImages.test.mjs`, `lib/heading-levels.test.mjs` and `scripts/screens/forms.mjs`.
- `package.json` `version` 0.19.9 with `starter/package.json` (skill `changesets`), the changeset, and the release notes (skill
  `release-notes`: a paragraph for the section, `feature`; a line for Cards' switch and the changed image score, `improvement`).

One pull request.
