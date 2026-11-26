# Reviews: An Accessibility section in the page and post forms

The reviews of `docs/superpowers/specs/2026-11-26-page-accessibility-design.md` (0.19.9), 26 Nov 2026. The first EGM review ran in the
Architect's session and shaped revision 2. The three below were run by a separate review session (skill `architect`, section 6), each
against `feature/0.19.8`. Their stage reports stay in that session's checkout; the consolidated reports follow in full.

## Adopted and not adopted

- **Revision 2 review** (3 blockers, 11 majors, 16 nits, 3 owner questions): all adopted in revision 3, except nit 16 (HTML `<a>` around
  an `<img alt>`), declined and recorded under _Limits_. The three owner questions went to the owner, who said yes to each; the answers
  are in the spec's _The decision_.
- **Revision 3 review** (4 majors, 9 nits): all adopted in revision 4.
- **Revision 4 review** (3 nits): all adopted in revision 5. Nit 2 took the first fix offered: `a11yChecks` drops the `input.h1` branch,
  so check 2 applies on every page and never on a post. Nit 3 adds the check that both ratings fail again after _Change image_.

## EGM consolidated review: 0.19.9 Accessibility spec (revision 2)

FeatureRange 1..142, DetailedRange 143..228 (Tests + Changes; the spec has no "Implementation Plan" heading). Failed reviewers: none. I re-checked B1, B2, B3, M1, M2, M4 and the Stage 8 rulings in the code myself.

Checked and found as the spec says: `scoreOf` and test 2's arithmetic (2/7 → 29, red); `images()` counts every Cards image as missing today (src/seoImages.ts:113-115); `altUseOk`; `h1s`/`links`/`vague`; `seoInputOf`; the eleven `t.forms.seoRating` keys; `seoNear`/`textNear`/`useInView`; the Video "Video" fallback (src/standard/video/view.ts:34); Table `header` on by default (src/standard/table/view.ts:13); `headingChoices`; `.mo-has-image::before`; `register()`/`virtualFile`. Moving `h1s`/`links`/`LINK`/`A` into seoImages.ts keeps it free of i18n, and nothing outside seo.ts imports them.

**Your question, line 65 "as the image block's":** it names the right field. That is `decorative` (`type: 'boolean'`, `toggle`) in BlockDialog's `IMAGE` (src/BlockDialog.tsx:211-233). But the code has no "image block": its comment calls it "an image in the text" (BlockDialog.tsx:205-209), and the spec says the same on lines 62, 64 and 140. Suggest "as for an image in the text", which also passes check:language.

### BLOCKERS

**B1. A post's section can never appear (spec 51-52 vs 119-122).** Six of the eight reviewers found this.

- A post with no checks has no section, so it has no box and `a11yNear` never becomes true.
- `onText` returns early while no rating is near (src/EntryForm.tsx:609-614), so the body is not re-read and the memo keeps `[]`.
- `useInView` attaches its observer once, with deps `[box, margin]` (src/ui.tsx:3266-3277), so a box that mounts later is never observed.
- `sections` is built only from sections that have fields, via `has()` (EntryForm.tsx:368-387). Accessibility has none, and the spec never says how it joins.
- Line 24 ("every page and every post") contradicts line 51.
  Fix: always draw the section on posts, with one line such as "Nothing to check yet" instead of the wheel (`scoreOf([])` would print 100, lib/score.mjs:4). The box then exists from the first render. Name the exact `sections` entry and where the JSX goes.

**B2. The card's toolbar Alt text path throws away `decorative` (src/MarkdownEditor.tsx:2228-2286, `cardImageTools`).**

- `put({ image: chosen, alt: text.decorative ? '' : … })` (≈2263) and `put({ alt: text.decorative ? '' : … })` (≈2282) never write `decorative`.
- _Remove_ writes `put({ image: '', alt: '' })` and leaves `decorative` set.
- At medium width and up, `openAlt` goes to the Alt text field, which is hidden while the switch is on.
- MarkdownEditor.tsx is not in _Changes_, and test 5 at 390 would fail.
  Fix: add MarkdownEditor.tsx to _Changes_. Write `decorative` in both `put`s, clear it on Remove, and say whether Change image keeps it.

**B3. Test 5 cannot pass as written.** demo/src/content/pages/blocks-cards.md has about 26 card images with no alt text of their own. Turning on the switch for one card leaves the check failing, so "after: passed in both" fails. Fix: use a new unsaved page with one Cards block and one image card, or expect the missing count to drop by one.

### MAJORS

**M1. The switch will not show in the card's sheet.** The sheet draws only the names in `inline.media` (src/standard/cards/index.tsx:28, read at src/MarkdownEditor.tsx:2118-2121). Without `decorative` in that list, `settingsFields` also puts the whole items list back in Block settings (src/BlockDialog.tsx:476-488). Fix: add `decorative` to `inline.media` before `alt`; give `alt` the `only` condition (with `and:` beside the existing image condition, index.tsx:148,157); extend `LinkCardProps`; say how it is stored (`true` or `'true'`) and read it the same way in `images()` and `imageOfCard`.

**M2. No score drops; the spec and its release note say the opposite (spec 69-70, 226).** Every Cards image already counts as missing today (seoImages.ts:113-115). The only change is that cards with their own alt text (or the switch on) now pass. Fix: rewrite 69-70 and the release note to "cards with their own alt text now count as described". The comment at cards/view.ts:75 ("none: the image is decorative") becomes stale and must change too.

**M3. A Library-described image counts as missing while the editor shows that text in use (spec 68-69, 89-90).**

- The card's Alt text field shows the Library's text greyed, with "Using the image's text" (src/fields.tsx:374-381).
- The site draws that text, and the codebase has one rule for it: own text, else the Library's, else none (src/imageAlt.mjs).
- So in an accessibility rating this is a false 1.1.1 failure, on the demo's own Cards page among others.
- This is your choice, not an owner decision. A Library text is a description, so "never assumed decorative" still holds.
- Stage 8 rejects a form-only fix, which would give one page two SEO scores (src/seo.ts:41-42).
  Fix: either Library-aware in both the form and the lists (`images()` returns `src`, and the ratings take an optional lookup; the form already has `libraryAlt`, EntryForm.tsx:281-283), or keep the deferral and state it under _Not chosen_ with the reason. Owner question 1.

**M4. Line 95 is wrong.** The front page and the blog page are ordinary pages edited in EntryForm.tsx (defaults/standardPages.ts:1-13), not DataForm fixed pages, so they would get the section. Fix: drop them from that line, or say how EntryForm excludes them.

**M5. Test 2 asks for an H4 the editor does not offer** (lib/heading-levels.mjs:21-25: H1, then H2/H3). Fix: use H1 then H3. The expected score stays 29, and test 3 becomes "make the H3 an H2".

**M6. Check 3's texts use words the writer never sees (spec 131-132).** The editor calls the levels Main heading, Heading and Subheading (src/i18n/en-US/text.ts:9-11; MarkdownEditor.tsx:3337-3339), and `fixNoH1`/`fixManyH1` already use those names (forms.ts:77-78). Fix: name the headings, e.g. "A Subheading comes before any Heading" / "Make it a Heading, or add a Heading before it".

**M7. `fixAlt` (spec 140) names a control some counted images lack, and drops how to reach the field.**

- A section's background image is counted but can never be decorative (seoImages.ts:101,109), and section settings have no switch (src/SectionSettings.tsx:57).
- The old text said how to reach the field: "Tap each image, select Edit" (forms.ts:86).
  Fix: one text that holds for every counted image, e.g. "Give each image alt text, or mark it decorative where you can."

**M8. The test list.**

- Line 146 says test 7 runs on staging; the staging test is test 8.
- Test 7 reuses test 2's unsaved page, which a QA reset clears. After test 3 nothing fails, so no fail texts show, and the page has no Cards block for the switch.
- The tests name checks by the table's titles, not the texts on screen (forms.ts:48, 71-72).
- The Video needs a URL to be added.
- Test 8 on staging is outside what the qa skill allows outside a version QA.
  Fix: make test 7 a fresh page with one fault of each kind and a card, then check in Danish before fixing; use the on-screen texts; give the Video a URL.

**M9. Release notes and versioning break the skills.**

- The Cards switch is a new setting, so release-notes/SKILL.md:20-23 makes it a **paragraph** with `feature`, never a line. Changes to one feature share a note (:49-50).
- `package-lock.json` is missing from _Changes_ (the 0.19.8 bump changed it).
- The changeset level and the base branch (feature/0.19.9 from main?) are not stated.
- 0.19.9 contradicts plans/2026-11-22-one-release-per-line.md:52 ("0.19.7 and 0.19.8 are the last patch releases"). The owner decided otherwise (spec line 12), so the spec should say it supersedes that line.

**M10. The heading rule's placement and spec.**

- lib/heading-levels.mjs is pure over level arrays, while the fence-aware parsing (`outsideCode`) lives in src/seoImages.ts.
- `lib/` must not import `.ts` (scripts/shipped-no-ts-imports.test.mjs).
- `start` is always 1.
- No parsing rule is given (ATX only? setext? top level only, not inside block lines?).
  Fix: `skippedHeadings(levels)` in lib/heading-levels.mjs plus `headingLevelsOf(body)` in seoImages.ts, with the parsing rule stated. Drop `start`, or say what else uses it.

**M11. The rating has no automated test.** `a11yRating` pulls in i18n, so `node --test` cannot load it. The post rules, the check order, the empty result and "decorative draws `alt=""` despite a Library text" are untested. Fix: a pure `a11yChecks(input)` (ok flags and counts) in a no-i18n file with unit tests, plus a check in scripts/screens/cards.mjs for the decorative card's `alt=""`.

### NITS

1. `CheckList` is the editor's component (src/ui.tsx:3055), not "the theme's" (line 26).
2. Cards has had its `alt` field since 0.17.0 (CHANGELOG.md:433), not 0.19.7 (line 60).
3. Line 141: a missing Danish key in src/i18n is caught by the `Messages` type (`check:types`), not `check:content` (which checks defaults/i18n).
4. The four new fix texts lack the full stop every existing one has (forms.ts:77-87).
5. The pass texts don't change with the count ("The videos have a title" for one video); `goodLinks(n)` (forms.ts:73) shows the way.
6. `fixEmptyLink` reads oddly and uses a different verb from `fixLink`; "Type" vs "Write" is inconsistent.
7. The `H1` pattern must stay importable by seo.ts for `h1First` (seo.ts:113,124): export it from seoImages.ts, and say seo.ts imports the moved functions as well as re-exporting them. `LINK`/`A` need not be exported.
8. Moving `h1s` is optional churn; only `links`/`LINK`/`A` are needed for check 5's tests. Putting the video and table rules in a file whose header is about images also widens it; adjust the header.
9. `headerlessTables` should cite src/standard/table/view.ts:13 for the default, so the two don't drift.
10. The screens unit must unfold the section and wait out the wheel's 1.2 s count-up before reading 29.
11. Add Accessibility to the keyboard-flows flow D if that flow lists the form's sections.
12. Name the demo post for test 4, and confirm it has an image and a link.
13. Say whether checks 6 and 7 scan nested blocks, as `images()` does. Add to _Limits_: videos written in the text or in a card, headings inside blocks, and `aria-label` links.
14. A post's top image (`imageAlt`/`imageDecorative`, EntryForm.tsx:98) is not counted and not listed under _Limits_ (owner question 2).
15. "Large screens and wider", "doubles", "large bundle", and the _Not chosen_ bullets credited to the owner have no breakpoint, size, date or quote.
16. Check 5 and HTML `<a><img alt></a>` could be handled in a few lines with the existing `A` and `ALT` patterns (src/seo.ts:154, seoImages.ts:66); optional.

Rejected after Stage 8: "the SEO rating's H1 check judges posts differently" (it already skips posts, src/seo.ts:190-193); "blank link texts slip through" (`plain()` collapses whitespace). Also rejected as bloat: a Risks section, per-block image contracts.

### QUESTIONS FOR THE OWNER

1. Should both ratings, in the form and in the lists, use the Library's text for an image that has none of its own, as the site does? Scores only rise. If not, the demo's Cards page shows about 26 images as missing whose text the site does draw.
2. Should a post's top image count in the image check? Some posts' scores could drop.
3. Is it fine to always show the Accessibility section on posts, with "Nothing to check yet" when nothing applies? The other way, a post's section appears only once something applies, needs extra machinery (fix to B1).

If you send a further revision, I'll review only the changes the same way.

## EGM re-review r3: 0.19.9 Accessibility spec (PR #1275, head c8fd3025)

Scope: `git diff aba2fcc5 c8fd3025` and what it touches, checked against origin/feature/0.19.8 at **0fa92d8** (it moved since r2, and now includes #1271, which removed the card's settings sheet).
There were two EGM reviewers, a design critic with zoom-out and a codebase-details reviewer with implementation readiness. I verified the surprising claims myself: N1, N2, N5, the flow D path, the `inline.media` line and the demo Library records.
Stage reports are in `.egm-review/0.19.9-r3/` (not committed).

**Verdict:** there are no blockers. The r2 blockers are fixed, and every major is fixed or answered except M11, which is partly fixed. r3 brings four new majors (N1, N2, N3, N5); each needs a small spec edit.

### Status of r2 findings

- B1 (post section never appears): **fixed**. The section is always shown, with _Nothing to check yet_ (spec:19, 34-36, 156-162). A folded body is only `hidden` (ui.tsx:2979), so the box is observed from the first render.
- B2 (toolbar drops `decorative`): **fixed** for the writes (spec:86-90). `put` drops `undefined` (MarkdownEditor.tsx:2238-2243). The focus step is new: see N2.
- B3 (test 5 on the demo's Cards page): **fixed**. Test 5 now uses a new page with one card (spec:231-232).
- M1 (`inline.media`, `only.and`, `LinkCardProps`, storage): **fixed** (spec:78-85). `Only.and` exists (schema.ts:22-30), and `inUse` reads the card's own field first. The line number is stale (nit a).
- M2 (no score drops): **fixed** (spec:94-95, 303-304).
- M3 (Library text): **answered** by the owner ("Yes", spec:16-17) and built into both ratings (spec:148-151). The exception is DataForm (nit c).
- M4 (front and blog pages): **fixed** (spec:29-30).
- M5 (H4 in test 2): **fixed**. The test now uses a Main heading, then a Subheading.
- M6 (heading words): **fixed** (spec:166-177). The capitalisation is still open: nit b.
- M7 (`fixAlt`): **fixed** (spec:185-186). See N5 for the section image.
- M8 (test list): **fixed**. Test 9's Where is still open: nit d.
- M9 (notes, package-lock, changeset, plan line 52): **fixed**. The plan line is updated in the same commit. The note ids are still open: nit f.
- M10 (heading rule placement and parsing): **fixed** (spec:66-67, 142-147).
- M11 (pure, tested `a11yChecks`): **partly fixed**. Check 4 is not pure: see N1.
- Nits 1-10 and 12-15: **fixed**.
- Nit 11 (keyboard flow): **still open**. The spec looks in `scripts/screens/`, but the flow is `scripts/keyboard-flows.mjs:233-238` (flow D), and it does list the sections. Nit g.
- Nit 16 (HTML `<a><img alt>`): **answered**. It is declined and recorded under _Limits_ (spec:119).
- Owner Q1-Q3: **answered** (spec:16-19).

I checked these and found them correct:

- test 2's arithmetic: 7 checks apply, 2 pass, round(2/7) = 29, red; test 3 then reaches 100;
- test 2's texts match `forms.ts`;
- `links()` gives `''` for an empty link and the alt text for an image link (the reviewer ran it);
- `fileRating` has only two callers, SeoScores.tsx:49 and Library.tsx:1324;
- moving `H1`, `LINK`, `A`, `h1s` and `links` breaks no importer;
- every other cited line is right at 0fa92d8;
- no owner decision is contradicted.

### 🔴 Blockers

None.

### 🟡 Majors

**N1. `a11yChecks` cannot be free of i18n while check 4 uses `vague()` (spec:142-145, 54).**

- `vague` is `isVague(text, vagueLinksOf(siteLocale))`, and `siteLocale` comes from `./i18n` (src/seo.ts:7, 163). So `src/a11yChecks.test.mjs` cannot load under `node --test`, and M11's fix fails.
- `src/vagueLink.ts:1-4` is built for exactly this: it loads without `./i18n`.
- Fix: `a11yChecks` imports `isVague`, and its input carries the vague list (or the locale). `a11yRating` passes `vagueLinksOf(siteLocale)`. Say so at spec:142-145.

**N2. `reachField(t.blocks.picture.decorative)` never finds the switch (spec:88).**

- `reachField` looks for a `<label>` whose text is exactly the name, then for the element named by its `htmlFor` (src/BlockDialog.tsx:75-87).
- The theme's Switch is one `<label>` with no `htmlFor`, and its text includes the hint (theme/ui/Switch.tsx:2).
- So from medium, _Alt text_ on a decorative card opens the sheet, the focus stays where it was, and nothing reports the miss.
- Fix: extend `reachField` to match a switch's label by its first line and focus its input. Add BlockDialog.tsx to _Changes_, and add "the focus lands on Decorative image" to test 5 at 1280.

**N3. "The same function" for the counted images is not true as written (spec:59-61, 289).**

- `images(body)` reads the body only. A post's _Image at the top_ lives in the values (EntryForm.tsx:98), so `seo.ts` and `a11yChecks` would each add it on their own. That is the drift _One rule, shown twice_ forbids.
- Fix: one helper in `src/seoImages.ts`, e.g. `countedImages(body, top?)`, that both ratings call. Name it in _One rule_ and in _Changes_.

**N5. A section image's own hint tells the writer to leave it empty, and the rating then fails it (spec:61-62, 185).**

- The section's Alt text hint is "Leave it empty for an image that is only decoration." (src/i18n/en-US/text.ts:65).
- `images()` treats a section image as never decorative (src/seoImages.ts:101, 109), and there is no switch.
- So a writer who follows the hint gets "1 image has no alt text". The new `fixAlt` ("where there is one") offers no way out.
- This already happens in the SEO rating, but the spec now shows it as a 1.1.1 failure.
- Fix: change that hint (en-US and da-DK `text.ts`, added to _Changes_) to ask for a description, or record it under _Limits_ with the reason.

### 🟢 Nits

a. After #1271 a card has no settings sheet (cards/index.tsx:23-25). Its only sheet is the **media sheet**, built from `inline.media` (MarkdownEditor.tsx:2118-2122) and opened from the image or from the bar's Alt text. Say "media sheet", and say how to open it, at spec:78 and in tests 5 and 8. Also, `inline.media` is now cards/index.tsx:**29**, not :28 (spec:81).

b. `headingName` must have a form that starts a sentence: "A Subheading comes after the main heading" and "Make it a Heading" (spec:166-177). Say whether it returns the article and who capitalises, in English and Danish.

c. DataForm.tsx:222 calls `seoRating` without `library`, although it has `libraryAltOf` (DataForm.tsx:21, 118). Make the new `SeoInput` fields optional and pass `library` there (add DataForm to _Changes_), or list it under _Limits_.

d. Test 9's Where must name `morpheme-staging` (qa skill). It should also say how the page scored below 50 is made, and that it is deleted afterwards.

e. Some expectations can't be seen:

- Test 5's "Remove clears it": after Remove the card has no image, so it has no image tools (MarkdownEditor.tsx:2234-2235). Check instead that a new image starts with the switch off.
- Test 8's "every text of the section": the pass texts and _Nothing to check yet_ never show on that page.
- Tests 4 and 5 need an image with no Library text, but all 13 demo uploads have one (demo/src/data/files/\*.json). Say "upload a new image" or "clear its text in the Library first", as test 2 does.

f. Three release notes from one changeset: both skills tie a note's id to the changeset's file name (release-notes/SKILL.md:28; changesets/SKILL.md:20). Use three changesets, or name the three ids.

g. Keyboard flow D (`scripts/keyboard-flows.mjs:233-238`) walks Search engines → Social media → History. Add Accessibility between the first two, and add the file to _Changes_. Drop the conditional sentence at spec:279-280.

h. Gate the `sections` entry on `isRated(collection)` (spec:160). EntryForm renders every Markdown collection (App.tsx:974, 992), and the spec says "for every page and post" without naming the condition.

i. Signatures an implementer must guess:

- how `library` reaches `seoInputOf`, and the memo deps;
- SeoScores' module-level `rate()` needs a new parameter, and the file does not import `config` yet;
- check 2 should mirror `seoRating`'s `ownH1` guard.

### Questions for the owner

None new. The three r2 questions are answered.

### Traceability

- Design critic and zoom-out (stage7_design_zoom_out.md):
  - N1 → N1
  - N2, N3 → nit a
  - N4 → nit b
  - N5 → nit c
  - N6 → nit d
  - N7 → nit e
  - N8 → nit f
  - N9 → nit h
- Codebase details and readiness (stage9_codebase_readiness.md):
  - N1 → N1
  - N2 → N2
  - N3 → N3
  - N4 → nit e, downgraded: a new upload also works
  - N5 → N5
  - N6 → nit a
  - N7 → nit g
  - N8 → nits b, h, i

## Re-review r4: 0.19.9 Accessibility spec (PR #1275, c8fd3025 → 0a9a3f80)

Scope: the r4 diff only, checked against origin/feature/0.19.8 at bca37aa. It moved again since r3, but neither of its two changed files is one the spec touches. I checked every new code reference myself.

**Verdict:** there are no blockers and no majors. Every r3 finding is fixed. Three new nits remain.

### Status of r3 findings

- N1 (`a11yChecks` loads i18n through `vague()`): **fixed**.
  - `a11yChecks(input, vagueList)` uses `isVague` from src/vagueLink.ts, which loads without `./i18n`.
  - `a11yRating` passes `vagueLinksOf(siteLocale)`, and the unit test passes the en-US list (spec:155-158, 304).
- N2 (`reachField` misses switches): **fixed**. `reachField` gains a match on `.mo-setting-row__label` and then focuses the input inside it (spec:90-92). The class exists (theme/ui/SettingRow.tsx:24), and Switch is a SettingRow (theme/ui/Switch.tsx:11, 37). BlockDialog.tsx is in _Changes_, and test 5 checks the focus at 1280.
- N3 (the "same function" claim): **fixed**. One `countedImages(body, top?)` in seoImages.ts is called by both the SEO image check (seo.ts:236-240) and `a11yChecks`. It is in the table, _One rule_, _Changes_ and the unit tests.
- N5 (the section image hint): **fixed**. `sectionImageAltHint` becomes `blocks.picture.altHint`'s text, which exists (src/i18n/en-US/blocks.ts:21). It is in _Texts_, _Limits_ and _Changes_, for en-US and da-DK.
- a (media sheet, :29): **fixed** (spec:78-82; tests 5 and 8).
- b (heading names and capitals): **fixed**. Each language builds the whole sentence from the level numbers (spec:186-198).
- c (DataForm `library`): **fixed**. The new `SeoInput` fields are optional, and DataForm.tsx:222 gets `library` (spec:125-129, 162-163, _Changes_).
- d (test 9 on morpheme-staging): **fixed**. The test makes a new page and deletes it afterwards.
- e (expectations that can't be seen): **fixed**.
  - The Remove step is replaced by "Change image starts off".
  - Test 8 now lists what shows, and adds a post for _Nothing to check yet_.
  - New uploads are used for images with no Library text (spec:217-218).
- f (note ids): **fixed**. There are three named `patch` changesets (spec:333-336).
- g (keyboard flow D): **fixed** (spec:315-316, _Changes_).
- h (gate on `isRated`): **fixed**. The `sections` entry and the JSX are both gated on it (SeoScores.tsx:56 is right).
- i (signatures): **fixed**.
  - `seoInputOf(…, library?)`, and the memo deps.
  - SeoScores `rate()` (:48) gains `library`; its imports are as at EntryForm.tsx:13, 36, 37 (verified).
  - Check 2 follows the `ownH1` guard.

### New nits

1. Two line numbers are off by one. `seoInputOf` is at src/seo.ts:42, not :43 (spec:162). The `ownH1` guard is at seo.ts:190-192, not :189-191 (spec:159).
2. The `input.h1` branch is dead in this feature.
   - `seoInputOf` never sets `h1` (seo.ts:42-60). Only DataForm's fixed pages have it, and they get no Accessibility section.
   - So "a page with its own H1 field" (spec:158-161) never happens in `a11yChecks`, and table row 3 ("Applies when") does not mention it.
   - Fix: drop the branch, or add it to row 3, so the table and the rule agree.
3. Test 5 changes the image, but never checks that the old image's switch does not carry over to the new one in the stored card. It only checks the switch in the sheet. Optional: add "the Accessibility check fails again with 1 image" after _Change image_.

### Owner questions

None.

(The report is in .egm-review/0.19.9-r4/ in my checkout. Nothing was pushed, commented or committed.)
