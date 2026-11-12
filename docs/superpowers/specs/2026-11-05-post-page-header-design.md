# Post page: richer header, lead paragraph and related-post cards

Status: approved by the owner on 2026-11-05 (brainstorm in the side session "post header").
Scope: the standard theme Material in `@morphemecms/cms`. Other themes inherit it.

## Goal

A blog post gets a fuller header: the author's role, tags in the byline and share buttons.
The first paragraph becomes a lead. The featured image moves below the lead.
Related posts become cards under the post.
The theme designs the header. Everything under it stays free content. No page forces content.

References: the Airbnb newsroom post (byline, share row, "Related stories" cards) and the Google blog post (author
with job title). The look is Material's own, not a copy of either.

## The post page, top to bottom

| # | Part | Content | Source |
|---|---|---|---|
| 1 | Back link | "← Blog" (as today) | `siteT.theme.blog` |
| 2 | Title | The post's title (as today) | front matter `title` |
| 3 | Author | Round image (when the site has one), name, role under the name | `site.portrait`, `site.name`, `site.role` (Company › Contact) |
| 4 | Byline | `date · reading time · Tag, Tag` — each tag links to `/blog/kategori/<id>/` | front matter `date`, body, `categories` filtered by `isBlogCategory` |
| 5 | Share row | Icon buttons: Facebook, X, LinkedIn, Pinterest, copy link | `src/data/social.json` |
| 6 | Lead | The first paragraph of the text, in the body-large type | the post's text |
| 7 | Featured image | Wide, rounded (as today), now after the lead | front matter `image` |
| 8 | Rest of the text | Free content | the post's text |
| 9 | After-every-post block | As today, when the site sets one | `site.postEnd` |
| 10 | Related posts | Heading and up to 3 cards in a row | the other posts |

Layout: all parts left-aligned in the reading column (layout "A" in the brainstorm). No divider under the header.

### Rules

- Byline: show only blog categories. With no blog category, the byline ends after the reading time.
- The tag chips at the bottom of the post are removed. The tags appear only in the byline.
- Share row: show only the buttons switched on. All off: no share row.
- Pinterest needs an image: show it only when the post has a share image (`shareImage`, else `image`, else the
  first image in the text, as `Base.astro` picks the og:image).
- Each social button is a plain link to the network's share page, opened in a new tab (`rel="noopener"`). No
  third-party script, no tracker.
- Copy link: copies the post's canonical address to the clipboard and shows the theme's Snackbar with "Link copied".
- Lead: the text has a lead when its first element is a `<p>` with text. A paragraph with only an image is not a lead.
  A heading, a block or a list first: no lead.
- No lead: the featured image stays above the text, as today.
- No featured image: the rest of the text follows the lead with the normal paragraph space.
- Related posts: most shared categories first, then newest, at most 3 (the rule in `PostLayout.astro` today). No
  related post: no section.
- Related card: rounded image, title, `date · reading time`. Built from the theme's `ui/Card.tsx`, `Img` and
  `PostMeta`. Without an image: a card with only the text. 3 columns on a computer, 1 on a phone.
- The related list in the footer column (slot `footer-column`) is removed. The footer shows its normal column.

### Share addresses

| Button id | Address |
|---|---|
| `facebook` | `https://www.facebook.com/sharer/sharer.php?u=<url>` |
| `x` | `https://x.com/intent/post?url=<url>&text=<title>` |
| `linkedin` | `https://www.linkedin.com/sharing/share-offsite/?url=<url>` |
| `pinterest` | `https://pinterest.com/pin/create/button/?url=<url>&media=<image>&description=<title>` |
| `copy-link` | no address: a button |

`<url>`, `<title>` and `<image>` are absolute and URI-encoded (`encodeURIComponent`).

## Settings: Company › Social media

A new company part, next to Contact and Payment, edited in the existing company form (`CompanyForm.tsx`).
No new screen code.

### Data model: `src/data/social.json`

One flat object. Each key is a unique id. A profile's id is its network. A share button's id is `share` + its button.

```json
{
  "facebook": "",
  "instagram": "",
  "linkedin": "",
  "x": "",
  "youtube": "",
  "tiktok": "",
  "pinterest": "",
  "shareFacebook": true,
  "shareX": true,
  "shareLinkedin": true,
  "sharePinterest": true,
  "shareCopyLink": true
}
```

| Field | Type | Rule |
|---|---|---|
| `facebook` … `pinterest` | string | Optional. Empty or an `https://` address. |
| `shareFacebook` … `shareCopyLink` | boolean | Optional. Missing means `true`. |

A site without the file (an existing site after the update) works: all five buttons on, no profiles.
The site reads the file with `import.meta.glob`, so a missing file is not a build error.

Normalized form (pure function, see Units):

```ts
type ProfileId = 'facebook' | 'instagram' | 'linkedin' | 'x' | 'youtube' | 'tiktok' | 'pinterest';
type ShareId = 'facebook' | 'x' | 'linkedin' | 'pinterest' | 'copy-link';
type Social = {
  profiles: { id: ProfileId; url: string }[]; // only filled ones, in the order above
  share: ShareId[]; // only switched on, in the order above
};
```

### Where the profiles go

The profile addresses go into the structured data: `sameAs` on the business (`site/schema.ts`, `business`), only when
at least one is filled. Showing them as icons in the footer is a separate, later task.

## Units

| Unit | Kind | Does |
|---|---|---|
| `lib/lead.mjs` | pure | `splitLead(html: string): { lead: string; rest: string }` — `lead` is `''` when the text has none. Used by the site and the editor's preview. |
| `site/social.mjs` | pure | `socialOf(raw: Record<string, unknown> \| undefined): Social`; `shareLinks({ url, title, image? }, share: ShareId[]): { id: ShareId; href?: string }[]`; `sameAsOf(profiles): string[]` |
| `site/site.ts` | wiring | Reads `src/data/social.json` and exposes `site.social: Social`. |
| `defaults/company.ts` | data | Adds the part `{ id: 'sociale-medier', file: 'src/data/social.json', fields: socialFields }`. |
| `defaults/collections.ts` | data | `socialFields`: 7 string fields with the https pattern, 5 boolean fields. |
| `theme/components/PostHeader.astro` | UI | Back link, title, `PostAuthor`, `PostMeta` with tags, `ShareRow`. |
| `theme/components/PostAuthor.astro` | UI | Image, name, role. |
| `theme/components/PostMeta.tsx` | UI | Gets an optional `tags: { label: string; href: string }[]`; drawn after the reading time. Other users of `PostMeta` pass nothing and are unchanged. |
| `theme/components/ShareRow.astro` | UI | The share buttons (`ui/IconButton.tsx`) and the copy-link script with `ui/Snackbar.tsx`. |
| `theme/components/PostCard.tsx` | UI | One related-post card. |
| `theme/components/RelatedPosts.astro` | UI | Heading and the grid of `PostCard`. |
| `theme/layouts/PostLayout.astro` | composition | Puts the parts in the order above; splits the text with `splitLead`. |
| `src/pagePreview.tsx` | editor | Splits the draft's text with `splitLead` and puts the lead before the featured image, as the site does. |

### The editor's preview

`PostLayout.astro` marks the lead with `data-editor="lead"`, as it marks `heading`, `image` and `text` today.
The preview fills the lead and the text from the draft with `splitLead`. When the draft has no lead, the preview
removes the lead element; when the built page has none and the draft has one, the preview adds it before the image.
The preview shows the same order as the site.

## Texts (both dictionaries, `src/i18n/en-US` and `src/i18n/da-DK`)

| Key | en-US |
|---|---|
| `theme.shareOn(network)` | `Share on ${network}` (button name for screen readers) |
| `theme.share` | `Share` (name of the share row) |
| `theme.copyLink` | `Copy link` |
| `theme.linkCopied` | `Link copied` |
| `theme.relatedPosts` | exists: `Related posts` |
| company part label | `Social media` |
| field labels and hints | one per profile ("Facebook page", …) and per switch ("Share on Facebook", …) |

The network names (Facebook, X, LinkedIn, Pinterest) are not translated.

## Icons

The share row draws `facebook-logo`, `x-logo`, `linkedin-logo`, `pinterest-logo` and `link-simple` (Phosphor names).
Add them to the system packs with `npm run icons`. Packs without brand icons (Material Symbols, Lucide) take them
from Material Design Icons, as `scripts/icon-packs.mjs` does for other missing icons. `check:screens` finds a missing
icon on the built pages.

## Other themes: replace parts by file

A theme chooses how the post looks part by part. It uses the theme system that exists today (`@theme`: the theme in
use's file, else Material's). There is no new setting.

- `PostLayout.astro` only composes. It imports every part as `@theme/components/<Part>`, never by a relative path.
- A theme restyles a part with its own CSS tokens, or ships a file with the same name to redesign that part.
- The replaceable parts:

| File | Part |
|---|---|
| `components/PostHeader.astro` | Back link, title, author, byline and share row together |
| `components/PostAuthor.astro` | Image, name, role |
| `components/PostMeta.tsx` | Date, reading time, tags |
| `components/ShareRow.astro` | Share buttons and copy link |
| `components/PostCard.tsx` | One related-post card |
| `components/RelatedPosts.astro` | The related-posts section |
| `layouts/PostLayout.astro` | The whole page (as today) |

- Add these files to `THEME_FILES` (`site/theme.mjs`). Then the check confirms Material has each one, and the list
  documents what a theme may replace.
- A theme without its own files (Venus today) inherits all of this, styled by its CSS tokens. `check:themes` covers this.
- The data stays in the layout: a part gets its data as props (`Post`, `Social`, `PostView`), so a theme's part needs no
  data code.

## Starter and demo

- `starter/src/data/social.json`: the file above (all switches on, no profiles).
- The demo gets the same file. Its posts start with a paragraph, so the demo shows the lead and the image under it.

## Tests

| Unit | Test cases |
|---|---|
| `splitLead` | text paragraph first → lead and rest; heading first → no lead; image-only paragraph first → no lead; block `<div data-block>` first → no lead; leading whitespace ignored; empty text → no lead, empty rest; one paragraph only → lead and empty rest |
| `socialOf` | `undefined` → no profiles, all 5 share ids; empty strings dropped; `shareX: false` → no `x`; order fixed |
| `shareLinks` | address and title encoded; Pinterest left out without an image; `copy-link` has no `href` |
| `sameAsOf` | no profiles → `[]`; filled ones in order |

Checked by hand (thin UI wiring): the demo build on a phone and a computer width, in Material and Venus. Copy link copies
and shows the Snackbar. Each share button opens the right address. The editor's preview of a post shows the lead before
the image. A post without tags, without an image and without related posts looks right.

## Release

One changeset, minor: "Richer blog post page: author role, tags and share buttons in the header, a lead paragraph, and
related-post cards; new Company › Social media settings." Released when the owner writes `/release` and approves it on
npm. Then shown on the demo.

## Out of scope

- Profile icons in the footer or header.
- Several authors per post.
- Breadcrumb trail.
