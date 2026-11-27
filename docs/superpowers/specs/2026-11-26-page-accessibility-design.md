# An Accessibility section in the page and post forms

Architect, 26 Nov 2026. Line: **0.22 Page accessibility** (was 0.19.9; owner, 27 Nov 2026), a version of its own (owner, 26 Nov 2026: "Or give it is often number"). Status: **approved by
the owner, 26 Nov 2026** ("Yes rewrite"). Built after 0.19.8 is released, by the PM the owner starts with `/pm 0.19.9`; it builds on
0.19.8's task 17 (`specs/2026-11-25-themes-classified-design.md`, `lib/accessibility.mjs`).

## The decision (owner, 26 Nov 2026)

- "Should we Add an accessibility section to blogs and pages?" The Architect proposed a rating like the SEO rating, scored in the same
  wheel; the owner said yes.
- Not in the lists ("1 no"): the Pages and Posts lists and `#seo/rating` show the SEO score only.
- Its own version, not part of 0.19.8 ("Or give it is often number").

## What the writer sees

A section **Accessibility** in the form of every page and every blog post, folded like the others, right after *Search engines* (in the
form and in its *Sections* list; *Danger* stays last). At its top the theme's `CheckList` titled *Accessibility rating*, the same part
as the SEO rating: its score wheel (`scoreOf`, green from 90, orange from 50, else red), the checks not passed first, each with its fix.
Nothing else is in the section. A page with no check that applies (an empty text) shows no rating, as the SEO section does.

The rating is advice to the writer, never a failure: nothing stops a save or a publish, and no check of the repository fails on a page's
score.

## The checks

Only what the writer controls in the form, and only what the editor can tell from the saved text. Each check says which WCAG 2.2
criterion it serves (in `lib/accessibility.mjs`, `PAGE_CHECKS`, next to task 17's `PARTS`), so one list names the criteria everywhere.

| # | Check | Passes when | WCAG | Shared with SEO |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Images have a text | every image in the text, in a section's background and in the blocks is decorative (marked so) or has an alternative text of its own or its Library text (`altUseOk`, `src/seoImages.ts`) | 1.1.1 | yes: the same `images()` and `altUseOk` |
| 2 | One main heading | a page's text has exactly one H1 (a post's is its title, so the check is left out for posts) | 1.3.1, 2.4.6 | yes: `h1s()` |
| 3 | Headings in order | no heading skips a level downwards (an H2 then an H4); blocks' headings count as H2 (0.19.8 task 5) | 1.3.1 | no (new) |
| 4 | Links say where they lead | no link's text is only a vague phrase (`vague()`, `src/vagueLink.ts`) | 2.4.4 | yes: `links()` and `vague()` |
| 5 | Links have a text | no link has an empty text (`[](…)`, `<a>` with nothing in it); an image link counts its image's text | 2.4.4, 4.1.2 | no (new) |
| 6 | Videos have a title | every Video block has a `title` (it names the embedded player; M3 *Alt text*, read 26 Nov 2026: "Think of a heading or title you might give it, and that’s likely your alt text") | 4.1.2 | no (new) |
| 7 | Tables have a header row | every Table block has `header` on | 1.3.1 | no (new) |

Left out, on purpose:

- **Captions** (1.2.2): a video is a YouTube or Vimeo embed, whose captions are the provider's; the editor cannot see them. Not a check (owner, 26 Nov 2026: "Video start out"; M3 *Alt text*: "Long-form video content uses video description to narrate the visual elements of a video, so it doesn’t need alt text").
- **Text on images** (owner, 26 Nov 2026: "what does md3 say about overlay on images or media. Follow that"): M3 Cards, Guidelines,
  read with Playwright 26 Nov 2026: "Add a translucent scrim or bounding shape beneath the text or icon to help ensure proper contrast."
  Material already does this: a section's text on its background image sits on a solid panel (`theme/styles/blocks/text-section.css`,
  `.mo-has-image::before`). It is the theme's drawing, never the writer's, so it is not a page check.
- **Contrast and sizes**: the theme's, classified on the theme's page (task 17); never a page's check.
- **Language of parts, reading order, focus**: the editor cannot tell them from the text, or our code owns them (task 17's hard checks).

Checks 3 to 7 appear only when the page has something they test (a heading below H1, a link, a video, a table), as the SEO rating shows
its image and link checks only when there are some.

**Cards' images.** `images()` still counts every Cards image as missing ("A Cards block's images have no description field yet"); Cards
has had an `alt` field since 0.19.7. Fixed here, in the one rule: a card's image is judged by `altUseOk` with its own `alt` and its
Library text, so the SEO rating changes with it (owner, 26 Nov 2026: "Fix how is okay"). A release note line says so.

## One rule, shown twice

The SEO rating and the Accessibility rating never judge the same thing two ways. `src/seo.ts` and the new `src/accessibility.ts` call
the same functions (`images`, `altUseOk`, `h1s`, `links`, `vague`); a check's _text_ belongs to its rating (`t.forms.seoRating`,
`t.forms.a11yRating`), its _rule_ to one function. The new rules (headings in order, empty links, videos, tables) are pure functions in
`src/seoImages.ts`'s style (no i18n), so `node --test` runs them.

`src/accessibility.ts` exposes `a11yRating(input): Check[]`, built from the same `seoInputOf(values, body, post, env.relations)` the
form already makes, and memoised the same way (`EntryForm.tsx`, `rating`).

## Texts (en-US first; da-DK after, by `site-editor-writing`)

`t.forms.sections.accessibility`: `Accessibility`. `t.forms.a11yRating`:

- `title`: `Accessibility rating`
- `allAlt` / `noAlt(n)`: the SEO rating's texts, reused by reference, not copied.
- `oneH1` / `noH1` / `manyH1(n)`: the same.
- `headingsInOrder`: `The headings are in order`; `skippedHeading(from, to)`: `A level ${to} heading follows a level ${from} heading`;
  fix: `Use the next level down, or the same level`.
- `goodLinks` / `vagueLink(text)`: the SEO rating's.
- `emptyLink(n)`: `${n} ${n === 1 ? 'link has' : 'links have'} no text`; fix: `Give each link a text that says where it leads`.
- `videoTitles` / `noVideoTitle(n)`: `The videos have a title` / `${n} ${n === 1 ? 'video has' : 'videos have'} no title`; fix:
  `Add a title in the video's settings`.
- `tableHeaders` / `noTableHeader(n)`: `The tables have a header row` / `${n} ${n === 1 ? 'table has' : 'tables have'} no header row`;
  fix: `Turn on Header row in the table's settings`.

Danish: `Tilgængelighed`, `Tilgængelighedsvurdering`, then each text by the writing skill. `check:language` and `check:content` hold it.

## Tests

1. **The section is there.** Where: the demo, a page's form, phone and computer. Do: open the form. Expect: _Accessibility_ right after
   _Search engines_, folded; in the _Sections_ list in the same place; _Danger_ last. Source: this spec, _What the writer sees_.
2. **The score and the checks.** Where: the demo, a page with one H1, an image without a text, an H2 then an H4, a link "click here",
   a Video without a title and a Table with _Header row_ off. Do: open _Accessibility_. Expect: seven checks, two passed (one main
   heading; links have a text), so the wheel shows 29, red; the five checks not passed first, each with its fix. Source: _The checks_.
3. **Fixing raises it.** Same page. Do: add the image's text, make the H4 an H3, retitle the link, add the video's title, turn the
   header row on. Expect: 100, green, with no reload; the SEO rating's image and link checks pass at the same moment. Source: _One rule,
   shown twice_.
4. **A post.** Where: a blog post. Expect: no main-heading check (its title is its H1); the others as for a page. Source: _The checks_.
5. **Not in lists.** Where: Pages, Posts, `#seo/rating`. Expect: only the SEO score, as in 0.19.8. Source: owner, "1 no".
6. **Danish.** Where: the editor in Danish. Expect: every text of the section in Danish. Source: _Texts_.
7. **Nothing blocks.** Where: the page of test 2, scored 29. Do: save and publish. Expect: both work, with no question. Source: _What the writer sees_.

Unit tests (`node --test`): each new rule on its own (headings in order with blocks as H2, an H1 then H3, an empty link, an image link
with and without a text, a video with and without a title, a table with `header` on and off and a table without the prop, which is on
by default); `a11yRating` leaves checks 3 to 7 out when nothing applies; the Cards image fix in `images()` (own `alt`, Library text,
decorative, none); `seoRating` and `a11yRating` agree on the shared checks for one fixture.

## Release note

"Pages and posts have an Accessibility section: a score and the things to fix, such as images without a text or headings out of order."
And the Cards line: "The SEO rating counts a card's image text."

## Changes

- `lib/accessibility.mjs`: `PAGE_CHECKS` (id and WCAG criteria of each check above).
- `src/seoImages.ts`: `headingLevels`, `emptyLinks`, the Cards fix in `images()`.
- `src/accessibility.ts`: `a11yRating`.
- `src/EntryForm.tsx`: the `accessibility` section after `seo`; `Section` gains it.
- `src/i18n/en-US/forms.ts`, `src/i18n/da-DK/forms.ts`: the texts.
- `scripts/screens/forms.mjs`: a unit for the section (test 2's page), phone and computer.
- `demo/`: the page of test 2 is not added to the demo's content; the screens unit makes it in its own fixture.
- Release notes, changeset (the line's version, `changesets`).
