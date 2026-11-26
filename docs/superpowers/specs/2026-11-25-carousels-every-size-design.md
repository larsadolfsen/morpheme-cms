# Carousels on every screen size

Architect, 25 Nov 2026. Line: **0.19.8** (owner, 25 Nov 2026; `plans/2026-11-25-0-19-8.md`, task 14). Status: **approved by the owner on 25 Nov
2026** ("3 yes"; open point 1: "no the editor decides").

Owner, 25 Nov 2026: "for 0.19.8 we need more images in carrousels and they need to adapt to screensices. I think the hero carrousel is
misunderstood, but it is difficult with only 2images to see."

## What Material 3 prints (read with Playwright on 25 Nov 2026)

Pages read: `https://m3.material.io/components/carousel/overview`, `…/specs`, `…/guidelines`, `…/accessibility`, and
`https://m3.material.io/foundations/layout/applying-layout/window-size-classes`.

- Overview: carousels "Contain visual items like images or video, along with optional label text". "Hero carousels swipe through one item
  at a time. Multi-browse carousels scroll through many items at once." Research: "Participants expected around 10 items in a carousel
  that scrolled multiple items at once."
- Guidelines, *Adaptive design*: "As the carousel container size increases, so do the number of carousel items visible at a time. At
  compact breakpoints, carousels can comfortably show up to three carousel items at once. At larger breakpoints, more carousel items are
  added and scale in size. Full-screen carousels only ever show one item at once."
- Guidelines, *Usage*: Multi-browse "Browsing many visual items at once (like photos)"; Uncontained "Highly-customized or text-heavy
  carousels, stacked imaged and text, traditional carousel behavior"; Hero "Spotlighting very large visual items (like a movie or
  featured app)"; Full-screen "Vertically-scrolling video or image feeds, immersive experiences". "Carousel items must be fully visible
  on-screen (except for the uncontained layout)."
- Guidelines, *Hero*: "It highlights one large image to focus on, while providing a sneak peek of what's next. On larger screens, more
  large items are visible. Use snap-scrolling so users can easily cycle through items one at a time." "A hero carousel at a compact
  breakpoint should show one large item and one small item." *Multi-browse*: "On larger screens, more large and medium items are
  visible." "At compact breakpoints, only show up to three carousel items if they have text."
- Guidelines, *Full-screen*: "It only works in portrait orientation in compact and medium breakpoints. Don't use this layout in
  landscape orientation."
- Guidelines, *Item text*: "Carousel items are primarily visual. Item text is optional and should be brief. If your carousel items
  require a lot of text, consider using the uncontained layout … or use a series of cards instead." "Avoid exceeding two lines of text in
  carousel items at compact breakpoints unless the background is simple, like a single color."
- Specs: hero "shows at least one large item and one small item"; center-aligned hero "at least one large item and two small items";
  multi-browse "at least one large, medium, and small carousel item"; small items 40–56 dp; every layout "Alignment: Vertically
  centered" (full-screen: "Centered"); padding 16 dp leading (and trailing for multi-browse and hero), 8 dp top and bottom, 8 dp between
  items (full-screen 16 dp), corners 28 dp.
- Accessibility: "On vertically-scrolling pages, carousels require an accessible way to view all the items without horizontally
  scrolling … Material recommends adding a Show all button below the carousel". Tab puts focus on the first item, then "Tab or Arrows"
  move between items, "Space or Enter" activates, "use the up and down arrow keys to leave the carousel"; the item's label reads "the
  current item in focus and the total number of items". Reduced motion: "the parallax effect should be removed and carousel items should
  no longer expand as they come into view. All items are the same size."
- Breakpoints: compact under 600 dp, medium 600–839, expanded 840–1199, large 1200–1599, extra-large 1600 and up.

## What we do now (read on `origin/main`, 25 Nov 2026)

1. **Phones only.** The Cards block's carousel is a phone setting (`phone: carousel`, hint "Swipeable cards on a phone. Larger screens show
   them together."). From 600 px `theme/styles/cards.css` turns the carousel into the stacked grid (`@media (width >= 37.5rem)`), so no
   layout is ever seen on a tablet or a computer, and *Show all* shows only below 600 px.
2. **The hero is not a hero.** `carouselLayout.ts` starts with "As many large ones as there are items, side by side, when they all fit",
   so with few cards the hero shows them all at one size, with no small item. M3 prints at least one large and one small item, always.
3. **Text cards in image layouts.** Every layout is offered for every card, also cards with only an icon and text. The demo's five
   carousel groups (`/blocks/cards/`) have 3 to 5 cards each, all icon and text, no image. With no images on the demo, the hero and multi-browse are hard to judge.
4. **Multi-aspect items are top-aligned** (`align-items: flex-start`), where M3 prints vertically centred (QA of 0.19.7, fail 1). From
   600 px they fall back to the grid, where a 9:16 card is about 1060 px tall.

The theme's `Carousel` (`theme/ui/Carousel.tsx`, `carouselLayout.ts`) already counts items by the carousel's own width (container
queries: one item and a peek, two on a tablet, three on a computer for uncontained; more large items for hero and multi-browse). What
stops it adapting is the block's phone-only rule.

## The design

1. **A carousel at every width.** The Cards block's `phone: carousel` means a carousel on every screen size. The stored name and value
   stay (no migration); the field's label and options change to say so: label **Display**, options **Grid** and **Carousel**, hint
   "Cards side by side, or swiped sideways on every screen size." (texts and Danish by `site-editor-writing`, which may improve the
   words). The `@media (width >= 37.5rem)` fallback to the grid goes for the carousel. A site that chose the carousel sees it on
   computers too after the update; the release note says so.
2. **Adapts by the carousel's width**, as M3's *Adaptive design* prints, with the theme's existing container queries and
   `carouselLayout.ts`:
   - uncontained and multi-aspect: as many items as fit, the next one cut off at the edge;
   - multi-browse: large items, then a medium and a small one, more large and medium ones as the carousel widens (the large width from
     `--mo-comp-carousel-large-item-width`);
   - hero: one large item and one small one below 600 dp; more large items as it widens, **always followed by one small item** (two
     for center-aligned: one on each side). Never all items at one size: with only two cards, one large and one small. Snap-scrolling,
     one item at a time.
   - full-screen: one item, edge to edge, below 840 dp in portrait. From 840 dp, and in landscape, it draws as the hero layout (M3:
     "Don't use this layout in landscape orientation"); the stored choice stays.
3. **The editor decides the layout.** Every layout stays offered for every card, also cards with only an icon and text (owner, 25 Nov
   2026: "no the editor decides"). The person in the editor chooses; nothing is hidden or changed by the block's media, and a stored
   layout is drawn as stored. The demo shows each image layout with images (Demo, below), so the layouts can be judged.
4. **Vertically centred.** Items sit vertically centred in the row in every layout (M3 Specs), multi-aspect included; this also closes
   QA 0.19.7's fail 1 (`plans/2026-11-25-0-19-8.md`, 15a, goes into this pull request). A card's text under its image stays as it is.
5. **Show all at every width.** The *Show all* button under the carousel (not under full-screen) shows on every screen size, since
   every page with a carousel scrolls vertically (M3 Accessibility). It opens the stacked cards in place, as it does on a phone today.
6. **Keyboard and screen readers** as M3 Accessibility prints: Tab lands on the first item (never the container), Tab or the arrow keys
   move between items, Space or Enter activates, up and down arrows leave the carousel; each item's label says "<n> of <total>". The
   theme's `Carousel` already names items (`slideOf`); the pull request checks the keys and fixes what differs.
7. **Reduced motion** (`prefers-reduced-motion: reduce`): items do not grow or shrink as they pass; all are the same size, and the row
   reaches the window's edges (hero: the small item partly shown), as M3 prints.
8. **The editor draws the same** through the same `View.tsx` and `Carousel`, at the editor's width.
9. **Other carousels.** The Testimonials slider and the editor's own carousels (`ImageCarousel` in `src/ui.tsx`: the theme store, an
   app's page, the library) use the same `Carousel`; they are checked for no change, not redesigned.

## The demo

- `/blocks/cards/` gets one group per layout (uncontained, multi-browse, hero, center-aligned hero, full-screen, multi-aspect), each with
  **8 to 10 image cards** (M3's research: around 10 items), short titles (one or two lines), made-up words. The icon-and-text carousel
  stays as one uncontained group.
- The images are photographs from Unsplash under the Unsplash licence, made smaller and saved as WebP in
  `demo/public/images/uploads/2026/10/`, each listed in `demo/README.md` with its Unsplash address, as the demo's images are today. No
  person's face that could be a customer, and nothing of any customer's content (CLAUDE.md).

## Before building

1. Download access: the session checks that `images.unsplash.com` is reachable; if not, it asks the PM, who asks the Architect for the
   environment change.
2. The session reads the four Carousel pages again with Playwright (skill `material-3`) and takes screenshots of the hero and
   multi-browse images at compact and expanded widths, to compare item counts. Where the pages differ from this spec, M3 wins and the
   pull request says so.

## Components

`Carousel` (existing), `Card` (existing), `Button` (existing, text, *Show all*). No new part.

## Tests

The Preview is the pull request's (`qa` skill). The demo page is `/blocks/cards/`; its editor page is
`/editor/#src/content/pages/blocks-cards.md`.

```
1. Every carousel group has 8 to 10 images
   Where: /blocks/cards/, phone 390
   Do: count the items of each carousel group except the icon group
   Expect: 8 to 10 items each, every one with an image; titles at most two lines
   Source: this spec, The demo; M3 Carousel, Overview (Research: "around 10 items")

2. Hero on a phone
   Where: /blocks/cards/, the hero group, phone 390
   Do: measure the items in view (getBoundingClientRect); swipe once to the left
   Expect: one large item and one small item 40 to 56 px wide; 16 px padding at both ends, 8 px between; after the swipe it rests on
     the next item as the large one (one item per swipe)
   Source: M3 Carousel, Guidelines, Hero ("one large item and one small item"); Specs, Hero

3. Hero on a computer
   Where: same group, widths 840, 1280 and 1600
   Do: count the large and small items in view
   Expect: still a carousel; more large items as the width grows, and always exactly one small item after them; never all items at
     one size
   Source: M3 Carousel, Guidelines, Hero ("On larger screens, more large items are visible"); Specs ("at least one large item and one
     small item")

4. Center-aligned hero
   Where: the center-aligned hero group, widths 390 and 1280
   Expect: one small item on each side of the large item(s), 40 to 56 px each
   Source: M3 Carousel, Specs, Center-aligned hero

5. Multi-browse adapts
   Where: the multi-browse group, widths 390, 840 and 1280
   Do: count large, medium and small items
   Expect: at least one large, one medium and one small at each width; more large and medium items at 840 and 1280 than at 390
   Source: M3 Carousel, Guidelines, Multi-browse and Adaptive design

6. Uncontained and multi-aspect adapt
   Where: the uncontained and the multi-aspect groups, widths 390, 840 and 1280
   Expect: a carousel at every width, more items in view as it widens, the last one cut off at the edge; no grid
   Source: this spec, design 1 and 2

7. Multi-aspect items are vertically centred
   Where: the multi-aspect group, phone 390 and computer 1280
   Do: measure each item's top and bottom in the row
   Expect: equal space above and below each item; widths follow the aspect (9:16 to 16:9), 16 px leading padding, 8 px gap, 8 px top and
     bottom, 28 px corners
   Source: M3 Carousel, Specs, Uncontained multi-aspect ratio ("Alignment: Vertically centered")

8. Full-screen
   Where: the full-screen group, phone 390 × 844 (portrait), then 844 × 390 (landscape), then 1280
   Expect: portrait: one item edge to edge, snapping one at a time; landscape and 1280: drawn as the hero layout
   Source: M3 Carousel, Guidelines, Full-screen ("Don't use this layout in landscape orientation")

9. Resizing
   Where: the hero group
   Do: resize the window from 1280 to 390 and back without a reload
   Expect: the layout follows the width; no item overlaps another or is cut except the one at the edge
   Source: this spec, design 2

10. Show all at every width
   Where: the hero group, widths 390 and 1280
   Do: press Show all; press it again
   Expect: the button is under the carousel at both widths; it shows all cards stacked, then the carousel again (Show fewer); the
     full-screen group has no Show all
   Source: M3 Carousel, Accessibility ("Show all button below the carousel"); this spec, design 5

11. Every layout for every card
   Where: /editor/#src/content/pages/blocks-cards.md, the icon carousel group, computer 1280
   Do: open Block settings, open the carousel layout choice; choose Hero; then set Media to Image and back to Icon
   Expect: all layouts are offered with icons and with images; the chosen Hero stays chosen and draws as a hero after each change
   Source: this spec, design 3 (owner, 25 Nov 2026: "no the editor decides")

12. The Display setting
   Where: same, any Cards block
   Do: open Block settings
   Expect: a field "Display" with Grid and Carousel; with Carousel the layout choice shows under it; the hint says carousels show on
     every screen size; in Danish the editor shows the Danish words
   Source: this spec, design 1

13. Keyboard
   Where: /blocks/cards/, the hero group, computer 1280
   Do: Tab into the carousel; press Right arrow twice; Tab; Space on a card with a page; then Down arrow
   Expect: the first Tab lands on the first item (not the container); arrows and Tab move item by item, scrolling it into view; Space
     opens the card's page; Down leaves the carousel to Show all; the focus ring shows throughout; a screen reader name says
     "<n> of <total>"
   Source: M3 Carousel, Accessibility (Initial focus, Keyboard navigation, Labeling elements)

14. Reduced motion
   Where: the multi-browse and hero groups, computer 1280, with prefers-reduced-motion: reduce (Playwright reducedMotion)
   Expect: all items the same size, none growing or shrinking while scrolling; the row reaches the edges
   Source: M3 Carousel, Accessibility, Reduced motion

15. The editor draws the same
   Where: /editor/#src/content/pages/blocks-cards.md, widths 390 and 1280
   Expect: each carousel group looks as on the site at the same width (item counts and sizes)
   Source: this spec, design 8

16. Other carousels unchanged
   Where: /blocks/testimonials/ and /editor/#appearance/themes, computer 1280
   Expect: they look and work as on morpheme-demo
   Source: this spec, design 9
```

## Delivered with it

- The changes in `theme/blocks/cards/LinkCards.tsx`, `theme/styles/cards.css`, `theme/ui/carouselLayout.ts`, `src/standard/cards/`
  (field, `only`, `layoutOf`) and the texts in both languages.
- A screens unit for the hero (one large and one small at 390, more large and one small at 1280) and for the layouts offered with icons.
- The demo's new groups and images; `demo/README.md` lists the images.
- `specs/2026-11-25-cards-multi-aspect-design.md`, section 5, gets: "Changed on 25 Nov 2026: the carousel shows on every screen size and
  its items are vertically centred (`specs/2026-11-25-carousels-every-size-design.md`)."
- Before and after screenshots at 390 and 1280; a release note in both languages ("Card carousels now show on every screen size");
  the changeset the base allows.

## Decided

1. Design 3: every layout stays offered for any card; the person in the editor decides (owner, 25 Nov 2026: "no the editor decides").
