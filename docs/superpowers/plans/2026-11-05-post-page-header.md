# Post page header Implementation Plan

Status: done. Checked against the code on 2026-11-10.

> **For agentic workers:** In Interstellar the orchestrator never writes code. Each task names its worker (Ollama
> runner or Sonnet agent). Steps use checkbox (`- [ ]`) syntax for tracking. The plan gives interfaces and test cases,
> not code.

**Goal:** A blog post page with a richer header, a lead paragraph, the featured picture after the lead and related-post
cards, plus the settings part Company › Social media.

**Spec:** `docs/superpowers/specs/2026-11-05-post-page-header-design.md`. Read it first.

**Architecture:** Pure functions hold the logic (`lib/lead.mjs`, `site/social.mjs`). They have unit tests. Astro and
React parts only draw. `PostLayout.astro` only composes and imports each part as `@theme/components/<Part>`.

**Tech Stack:** Astro, React (TSX), TypeScript, `node --test`, Tailwind classes and the theme's tokens.

## Global Constraints

- Work on the branch `feat/post-page-header`. The worktree is `C:\Users\adolf\Documents\Interstellar\.worktrees\cms-post-header`.
- Every source file starts with a 2–3 line header comment: what it does, what it exposes, key dependencies.
- One part per file. A UI element is its own component in its own file.
- A CSS value used twice becomes a token. Use the theme's existing tokens and type classes (`type-body-large`, `type-body-medium`, `text-muted`, `rounded-(--theme-picture-radius)`).
- Code comments in English. User texts go in `src/i18n/en-US/*.ts` and `src/i18n/da-DK/*.ts`.
- Field labels in `defaults/` follow the file's current form (Danish strings, as `'Kontakt'`). The English-source batches move them later.
- Every part of the post page is imported as `@theme/components/<Part>` or `@theme/ui/<Part>`. Never use a relative path between theme parts.
- No third-party script. Share buttons are plain links with `target="_blank" rel="noopener"`.
- Format with Prettier: `npx prettier --write <files>`.
- Unit tests: `node --test lib/lead.test.mjs site/social.test.mjs`.
- Full check: `npx prettier --check .` and `npm run build` (the demo build; it checks the content by the editor's rules).

## File map

| Path | Task | Responsibility |
|---|---|---|
| `lib/lead.mjs`, `lib/lead.test.mjs` | 1 | `splitLead(html)` |
| `site/social.mjs`, `site/social.test.mjs` | 2 | `socialOf`, `shareLinks`, `sameAsOf` |
| `site/site.ts`, `site/schema.ts`, `starter/src/data/social.json` | 3 | `site.social`, `sameAs` |
| `defaults/company.ts`, `defaults/collections.ts` | 4 | Company › Social media part |
| `theme/components/ShareRow.astro`, `theme/ui/copyLink.script.ts`, `src/i18n/*/theme.ts`, `icons/*` | 5 | Share row and copy link |
| `theme/components/PostAuthor.astro`, `theme/components/PostMeta.tsx`, `theme/components/PostHeader.astro` | 6 | The header |
| `theme/components/PostCard.tsx`, `theme/components/RelatedPosts.astro` | 7 | Related-post cards |
| `theme/layouts/PostLayout.astro`, `site/theme.mjs` | 8 | Composition, lead, order, `THEME_FILES` |
| `src/pagePreview.tsx` | 9 | The editor's preview of the lead |
| `.changeset/*.md` | 10 | Release note |

## Order and workers

| Task | Worker | Needs |
|---|---|---|
| 1 | Ollama runner | — |
| 2 | Ollama runner | — |
| 3 | Ollama runner | 2 |
| 4 | Sonnet agent (editor rules) | — |
| 5 | Sonnet agent (theme UI, icons) | 2 |
| 6 | Sonnet agent (theme UI) | 5 |
| 7 | Ollama runner | — |
| 8 | Sonnet agent (theme layout) | 1, 3, 6, 7 |
| 9 | Sonnet agent (editor preview) | 1, 8 |
| 10 | Orchestrator | 1–9 |

Tasks 1, 2, 4 and 7 can run at the same time. The runner takes one task at a time.

---

### Task 1: `splitLead`

**Files:**
- Create: `lib/lead.mjs`
- Test: `lib/lead.test.mjs`

**Interfaces:**
- Produces: `export function splitLead(html: string): { lead: string; rest: string }` (JSDoc types in `.mjs`).

**Rules:**
- `lead` is the outer HTML of the first element when it is a `<p>` with text. Else `lead` is `''`.
- A `<p>` with only an `<img>` or `<picture>` (and whitespace) has no text. It is not a lead.
- `rest` is the HTML after the lead, with its leading whitespace removed. With no lead, `rest` is the full `html`.
- Leading whitespace and HTML comments before the first element are ignored.
- Use string and regular-expression work only. No DOM, no dependency. The function runs in Node and in a browser.

- [ ] **Step 1:** Write the tests in `lib/lead.test.mjs` (style of `site/storeTheme.test.mjs`: `node:test`, `node:assert/strict`).

| Test | Input | Expected |
|---|---|---|
| text paragraph first | `<p>Hello <a href="/x">you</a>.</p>\n<h2>Next</h2>` | `{ lead: '<p>Hello <a href="/x">you</a>.</p>', rest: '<h2>Next</h2>' }` |
| heading first | `<h2>Title</h2><p>Text</p>` | `{ lead: '', rest: '<h2>Title</h2><p>Text</p>' }` |
| picture-only paragraph first | `<p><img src="/a.webp" alt=""></p><p>Text</p>` | `{ lead: '', rest: <same input> }` |
| block first | `<div data-block="points" data-props="{}"></div><p>Text</p>` | `{ lead: '', rest: <same input> }` |
| leading whitespace | `\n  <p>Hi</p><p>More</p>` | `{ lead: '<p>Hi</p>', rest: '<p>More</p>' }` |
| empty text | `''` | `{ lead: '', rest: '' }` |
| one paragraph only | `<p>Only</p>` | `{ lead: '<p>Only</p>', rest: '' }` |
| paragraph with attributes | `<p class="x">Hi</p><p>B</p>` | `{ lead: '<p class="x">Hi</p>', rest: '<p>B</p>' }` |
| list first | `<ul><li>A</li></ul>` | `{ lead: '', rest: '<ul><li>A</li></ul>' }` |

- [ ] **Step 2:** Run `node --test lib/lead.test.mjs`. Expected: FAIL (module not found).
- [ ] **Step 3:** Write `lib/lead.mjs` with the header comment.
- [ ] **Step 4:** Run `node --test lib/lead.test.mjs`. Expected: all pass.
- [ ] **Step 5:** Commit `lib/lead.mjs lib/lead.test.mjs`. Message: `Split a post's text into its lead and the rest`.

Runner check: `node --test lib/lead.test.mjs`

---

### Task 2: `socialOf`, `shareLinks`, `sameAsOf`

**Files:**
- Create: `site/social.mjs`
- Test: `site/social.test.mjs`

**Interfaces:**
- Produces (JSDoc types in `.mjs`):

```ts
export const PROFILE_IDS: readonly ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok', 'pinterest'];
export const SHARE_IDS: readonly ['facebook', 'x', 'linkedin', 'pinterest', 'copy-link'];
type ProfileId = (typeof PROFILE_IDS)[number];
type ShareId = (typeof SHARE_IDS)[number];
type Social = { profiles: { id: ProfileId; url: string }[]; share: ShareId[] };
export function socialOf(raw: Record<string, unknown> | undefined): Social;
export function shareLinks(post: { url: string; title: string; picture?: string }, share: ShareId[]): { id: ShareId; href?: string }[];
export function sameAsOf(profiles: Social['profiles']): string[];
```

**Rules:**
- `socialOf`: a profile is kept when its value is a non-empty string after `trim()`. Profiles follow `PROFILE_IDS` order.
- `socialOf`: the switch key of a share id is `share` + its id in PascalCase: `shareFacebook`, `shareX`, `shareLinkedin`, `sharePinterest`, `shareCopyLink`. A missing switch, or any value other than `false`, means on. Share ids follow `SHARE_IDS` order.
- `shareLinks`: one item per id in `share`, in that order. Addresses as the spec's table "Share addresses". Encode each value with `encodeURIComponent`.
- `shareLinks`: leave out `pinterest` when `picture` is missing or empty. `copy-link` has no `href`.
- `sameAsOf`: the `url` of each profile, in order.

- [ ] **Step 1:** Write the tests in `site/social.test.mjs`.

| Test | Call | Expected |
|---|---|---|
| no file | `socialOf(undefined)` | `{ profiles: [], share: ['facebook', 'x', 'linkedin', 'pinterest', 'copy-link'] }` |
| empty profiles dropped | `socialOf({ facebook: '', x: '  ', linkedin: 'https://linkedin.com/in/a' })` | `profiles: [{ id: 'linkedin', url: 'https://linkedin.com/in/a' }]` |
| profile order fixed | `socialOf({ pinterest: 'https://p', facebook: 'https://f' })` | `profiles` ids `['facebook', 'pinterest']` |
| switch off | `socialOf({ shareX: false })` | `share: ['facebook', 'linkedin', 'pinterest', 'copy-link']` |
| all off | `socialOf({ shareFacebook: false, shareX: false, shareLinkedin: false, sharePinterest: false, shareCopyLink: false })` | `share: []` |
| encoded | `shareLinks({ url: 'https://a.dk/b c/', title: 'Hi & bye' }, ['x'])` | `[{ id: 'x', href: 'https://x.com/intent/post?url=https%3A%2F%2Fa.dk%2Fb%20c%2F&text=Hi%20%26%20bye' }]` |
| facebook | `shareLinks({ url: 'https://a.dk/p/', title: 'T' }, ['facebook'])` | `href: 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fa.dk%2Fp%2F'` |
| linkedin | same post, `['linkedin']` | `href: 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fa.dk%2Fp%2F'` |
| pinterest with picture | `{ url: 'https://a.dk/p/', title: 'T', picture: 'https://a.dk/i.webp' }`, `['pinterest']` | `href: 'https://pinterest.com/pin/create/button/?url=https%3A%2F%2Fa.dk%2Fp%2F&media=https%3A%2F%2Fa.dk%2Fi.webp&description=T'` |
| pinterest without picture | `{ url: 'https://a.dk/p/', title: 'T' }`, `['pinterest', 'copy-link']` | `[{ id: 'copy-link' }]` |
| sameAs none | `sameAsOf([])` | `[]` |
| sameAs order | `sameAsOf([{ id: 'facebook', url: 'https://f' }, { id: 'x', url: 'https://x' }])` | `['https://f', 'https://x']` |

- [ ] **Step 2:** Run `node --test site/social.test.mjs`. Expected: FAIL (module not found).
- [ ] **Step 3:** Write `site/social.mjs` with the header comment.
- [ ] **Step 4:** Run `node --test site/social.test.mjs`. Expected: all pass.
- [ ] **Step 5:** Commit both files. Message: `Read the social settings and make the share addresses`.

Runner check: `node --test site/social.test.mjs`

---

### Task 3: Social data on the site and in the structured data

**Files:**
- Create: `starter/src/data/social.json`
- Modify: `site/site.ts` (the `site` object and the header comment)
- Modify: `site/schema.ts` (`business`)

**Interfaces:**
- Consumes: `socialOf`, `sameAsOf`, type `Social` from `site/social.mjs` (Task 2).
- Produces: `site.social: Social`.

**Steps:**

- [ ] **Step 1:** Create `starter/src/data/social.json` with the JSON in the spec section "Data model". Seven empty strings, five `true`. The demo is laid over the starter, so it uses this file too.
- [ ] **Step 2:** In `site/site.ts`, read the file with `import.meta.glob('/src/data/social.json', { eager: true, import: 'default' })`. A missing file gives `undefined`. Do not use a static `import`: an older site has no such file.
- [ ] **Step 3:** Add `social: socialOf(<the file or undefined>)` to `site`, with a JSDoc line: `/** Profiles and share buttons (Company › Social media, social.json); all buttons on without the file. */`.
- [ ] **Step 4:** In `site/schema.ts`, add `sameAs: sameAsOf(site.social.profiles)` to `business` only when the list is not empty (spread, as `founder` is added today).
- [ ] **Step 5:** Update the header comment of `site/site.ts`: name `social.json`.
- [ ] **Step 6:** Run `npx prettier --check site/site.ts site/schema.ts starter/src/data/social.json`. Expected: pass.
- [ ] **Step 7:** Run `npm run build`. Expected: exit 0.
- [ ] **Step 8:** Commit the three files. Message: `Read the social settings on the site and link the profiles in the structured data`.

Runner check: `npx prettier --check site/site.ts site/schema.ts starter/src/data/social.json && npm run build`

---

### Task 4: Company › Social media in the editor

**Files:**
- Modify: `defaults/collections.ts` (add `socialFields` after `contactFields`)
- Modify: `defaults/company.ts` (add the part; update the header comment)

**Interfaces:**
- Produces: `export const socialFields: Field[]` in `defaults/collections.ts`.
- Produces: the part `{ id: 'sociale-medier', label: 'Sociale medier', icon: ShareNetwork, file: 'src/data/social.json', fields: socialFields }` in `companyParts`, after `kontakt`.

**Rules:**
- Seven fields of type `string`, names `facebook`, `instagram`, `linkedin`, `x`, `youtube`, `tiktok`, `pinterest`. Not required. `pattern: ['^$|^https://\\S+$', 'Skriv en adresse, der begynder med https://']`.
- Labels: `Facebook`, `Instagram`, `LinkedIn`, `X`, `YouTube`, `TikTok`, `Pinterest`. Hint on the first: `Adressen på sitets profil. Vises i Googles data om virksomheden.`
- Five fields of type `boolean`, names `shareFacebook`, `shareX`, `shareLinkedin`, `sharePinterest`, `shareCopyLink`. Labels `Del på Facebook`, `Del på X`, `Del på LinkedIn`, `Del på Pinterest`, `Kopiér link`. Hint on `sharePinterest`: `Vises kun, når indlægget har et billede.`
- An empty profile field saves as `''`. A missing switch reads as on (Task 2). Confirm the form shows a missing boolean as on. If the form shows it as off, give the boolean fields a default of `true` in the way `defaults/collections.ts` does for other booleans; report what you used.
- `ShareNetwork` is imported from `@phosphor-icons/react`, as the other part icons.

**Steps:**

- [ ] **Step 1:** Add `socialFields`. Add the part.
- [ ] **Step 2:** Run `npx prettier --check defaults/collections.ts defaults/company.ts`. Expected: pass.
- [ ] **Step 3:** Run `npm run build`. Expected: exit 0.
- [ ] **Step 4:** Open the built demo's editor (`npx wrangler dev` or the branch's Cloudflare Preview). Go to Company › Social media. Confirm the 12 fields show. Confirm a bad address shows the pattern message. Report the result; login does not work on a Preview, so a local `wrangler dev` is the check.
- [ ] **Step 5:** Commit both files. Message: `Add Company > Social media to the editor`.

---

### Task 5: Share row and copy link

**Files:**
- Create: `theme/components/ShareRow.astro`
- Create: `theme/ui/copyLink.script.ts`
- Modify: `src/i18n/en-US/theme.ts`, `src/i18n/da-DK/theme.ts`
- Modify: `icons/*/` (generated by `npm run icons`)

**Interfaces:**
- Consumes: `shareLinks`, type `ShareId` (Task 2); `ui/IconButton.tsx` (`iconButtonClass` for Astro); `@morphemecms/cms/lib/snackbar` (`snackbar({ text })`).
- Produces: `ShareRow.astro` with props `{ url: string; title: string; picture?: string; share: ShareId[] }`. It draws nothing when `shareLinks` gives an empty list.
- Produces: texts `siteT.theme.share`, `siteT.theme.shareOn(network: string)`, `siteT.theme.copyLink`, `siteT.theme.linkCopied`.

**Rules:**
- The row is a `<div role="group" aria-label={siteT.theme.share}>` with the buttons in a line, gap as `PostMeta`'s.
- Social buttons: links with the icon button classes (`iconButtonClass('standard')`), `aria-label={siteT.theme.shareOn('Facebook')}` and so on, `target="_blank" rel="noopener"`.
- Icons (Phosphor names): `facebook-logo`, `x-logo`, `linkedin-logo`, `pinterest-logo`, `link-simple`.
- Copy link: a `<button type="button" data-copy-link={url}>` with the icon button classes and `aria-label={siteT.theme.copyLink}`, and `data-copied={siteT.theme.linkCopied}`.
- `theme/ui/copyLink.script.ts`: default export function. It finds `[data-copy-link]` buttons. On click it writes `data-copy-link` with `navigator.clipboard.writeText` and calls `snackbar({ text: <data-copied> })`. Without such buttons it does nothing. `site/blockScripts.ts` picks it up as `ui/copyLink`; confirm Base.astro runs it on a post page.
- Texts:

| Key | en-US | da-DK |
|---|---|---|
| `share` | `Share` | `Del` |
| `shareOn` | `` (network) => `Share on ${network}` `` | `` (network) => `Del på ${network}` `` |
| `copyLink` | `Copy link` | `Kopiér link` |
| `linkCopied` | `Link copied` | `Linket er kopieret` |

- After the icons are in use, run `npm run icons`. Packs without brand icons take them from Material Design Icons (`MATERIAL_DESIGN_ICONS` in `site/icons.mjs`). Add the map entries there when the script reports a missing icon.

**Steps:**

- [ ] **Step 1:** Add the texts to both dictionaries.
- [ ] **Step 2:** Create `ShareRow.astro` and `copyLink.script.ts`.
- [ ] **Step 3:** Use `ShareRow` once in `theme/layouts/PostLayout.astro` under the byline, so the icons are in use: `<ShareRow url={site.url + postPath(post)} title={title} picture={picture} share={site.social.share} />`. `picture` is `post.data.shareImage || post.data.image || firstImage(post.body)`, made absolute with `site.url` when it starts with `/`; `undefined` when none. Task 6 moves it into `PostHeader.astro`.
- [ ] **Step 4:** Run `npm run icons`. Confirm each system pack in `icons/` has the five icons.
- [ ] **Step 5:** Run `npx prettier --check .` and `npm run build`. Expected: pass, exit 0.
- [ ] **Step 6:** Commit in two commits. First: the icons (`icons/`, `site/icons.mjs` when changed), message `Add the share icons to the icon packs`. Second: the rest, message `Add share buttons to the blog post`.

---

### Task 6: The header parts

**Files:**
- Create: `theme/components/PostAuthor.astro`
- Create: `theme/components/PostHeader.astro`
- Modify: `theme/components/PostMeta.tsx`

**Interfaces:**
- Consumes: `ShareRow.astro` (Task 5); `site.social` (Task 3); `PostView` (`theme/components/posts.ts`).
- Produces: `PostAuthor.astro` props `{ name: string; role?: string; portrait?: string }`. Picture `size-11 rounded-full`, as in `PostLayout.astro` today; name `font-medium`; role in `type-body-medium text-muted`.
- Produces: `PostMeta.tsx` gets `tags?: { label: string; href: string }[]`. With tags: after the reading time, a `·` and the tags as links (`hover:text-accent`, underlined), separated by `, `. Without tags: as today.
- Produces: `PostHeader.astro` props `{ title: string; post: PostView; tags: { label: string; href: string }[]; share: { url: string; title: string; picture?: string; share: ShareId[] } }`. It draws, in order: the back link (as today), the `<h1 data-editor="heading" class="theme-title mt-3">`, `PostAuthor`, `PostMeta` with the tags, `ShareRow`. Layout A of the spec: all left-aligned.
- `PostHeader.astro` reads the author from `site` (`site.name`, `site.role`, `site.portrait`), and nothing else.

**Steps:**

- [ ] **Step 1:** Create `PostAuthor.astro`. Change `PostMeta.tsx`. Create `PostHeader.astro`. Import parts as `@theme/components/<Part>`.
- [ ] **Step 2:** Use `PostHeader` in `PostLayout.astro` in place of today's `<header>` content. Pass the blog categories as tags: `{ label: categoryName(c), href: `/blog/kategori/${c}/` }`.
- [ ] **Step 3:** Remove the chips at the bottom of `PostLayout.astro` (the `<footer>` with `Chip`).
- [ ] **Step 4:** Run `npx prettier --check .` and `npm run build`. Expected: pass, exit 0.
- [ ] **Step 5:** Commit. Message: `Show the author's role and the tags in the post header`.

---

### Task 7: Related-post cards

**Files:**
- Create: `theme/components/PostCard.tsx`
- Create: `theme/components/RelatedPosts.astro`

**Interfaces:**
- Consumes: `PostView` (`theme/components/posts.ts`), `ui/Card.tsx` (`Card`, `kind`, `href`), `Img` (`theme/components/Img.tsx`), `PostMeta` (`theme/components/PostMeta.tsx`), `siteT.theme.relatedPosts`.
- Produces: `PostCard.tsx`: `export default function PostCard({ post }: { post: PostView })`. A `Card` with `href={post.href}`, `as="article"`. Inside: the picture (when `post.image`) with `aspect-[4/3] w-full object-cover rounded-(--theme-picture-radius)`, `alt={post.imageAlt ?? ''}`, `sizes="(min-width: 768px) 33vw, 100vw"`; then the title in `type-title-medium`; then `PostMeta` with `post`.
- Produces: `RelatedPosts.astro`: props `{ posts: PostView[] }`. Nothing when the list is empty. Else a `<section aria-labelledby>` in the page width (`Container.astro`) with an `<h2>` `siteT.theme.relatedPosts` in `type-headline-small`, and a `<ul>` grid: 1 column, 3 columns from `md`. Each `<li>` holds one `PostCard`.

**Steps:**

- [ ] **Step 1:** Create both files with header comments.
- [ ] **Step 2:** Run `npx prettier --check theme/components/PostCard.tsx theme/components/RelatedPosts.astro`. Expected: pass.
- [ ] **Step 3:** Commit both files. Message: `Add related-post cards`.

Runner check: `npx prettier --check theme/components/PostCard.tsx theme/components/RelatedPosts.astro`

---

### Task 8: Compose the post page

**Files:**
- Modify: `theme/layouts/PostLayout.astro`
- Modify: `site/theme.mjs` (`THEME_FILES`)

**Interfaces:**
- Consumes: `splitLead` (Task 1), `site.social` (Task 3), `PostHeader.astro` (Task 6), `RelatedPosts.astro` (Task 7).
- Produces: the page order of the spec, table "The post page, top to bottom".

**Rules:**
- Render the post's text with `await Astro.slots.render('default')`. Split it with `splitLead`.
- With a lead: `<div data-editor="lead" class="prose mx-auto mt-10 max-w-3xl px-5 md:px-8 post-lead">` with the lead (`set:html`), then the featured picture block (`data-editor="image"`, as today), then `<div data-editor="text" class="prose …">` with the rest.
- Without a lead: no lead element; the picture, then the text, as today.
- `post-lead`: the first paragraph in the body-large type. Add the rule to the theme's CSS where `.prose` is styled, with the type token (`type-body-large` values), not a new size.
- After the text: `EndBlock` (as today), then `RelatedPosts` with the related posts (rule as today, mapped with `postViewOf`).
- Remove the `footer-column` fragment.
- Keep every `Base` prop as today.
- `site/theme.mjs`: add to `THEME_FILES`: `components/PostHeader.astro`, `components/PostAuthor.astro`, `components/PostMeta.tsx`, `components/ShareRow.astro`, `components/PostCard.tsx`, `components/RelatedPosts.astro`. Update the comment above it: a theme may replace each one.
- Update the header comment of `PostLayout.astro`: the order and `data-editor="lead"`.

**Steps:**

- [ ] **Step 1:** Change `PostLayout.astro` and `site/theme.mjs`.
- [ ] **Step 2:** Run `node --test lib/*.test.mjs site/*.test.mjs`. Expected: all pass.
- [ ] **Step 3:** Run `npx prettier --check .` and `npm run build`. Expected: pass, exit 0.
- [ ] **Step 4:** Open a built demo post (`.morpheme/demo/site/dist/`, served with `npx wrangler dev`). Confirm the order. Take a screenshot at 375 px and 1280 px width.
- [ ] **Step 5:** Commit. Message: `Put the lead before the featured picture and related posts under the post`.

---

### Task 9: The lead in the editor's preview

**Files:**
- Modify: `src/pagePreview.tsx` (`pageDocument`; the header comment)

**Interfaces:**
- Consumes: `splitLead` from `../lib/lead.mjs` (Task 1); `data-editor="lead"` (Task 8).

**Rules:**
- After the text HTML is made (blocks expanded, the end block taken out), split it with `splitLead`.
- With a lead: fill `[data-editor="lead"]` with it. When the page has no lead element, create one with the same classes as `PostLayout.astro` uses, before `[data-editor="image"]` (or before `[data-editor="text"]` when there is no picture). Fill `[data-editor="text"]` with the rest.
- Without a lead: remove `[data-editor="lead"]`. Fill `[data-editor="text"]` with the full text.
- Pages have no `data-editor="lead"` and their text often starts with a paragraph: split only when the page is a post. A post is a page whose built document has `[data-editor="lead"]`, or whose draft is a blog post (use what `PageDraft` already says; report what you used).
- Keep the behaviour for pages unchanged.

**Steps:**

- [ ] **Step 1:** Change `pageDocument`.
- [ ] **Step 2:** Run `npx prettier --check src/pagePreview.tsx` and `npm run build`. Expected: pass, exit 0.
- [ ] **Step 3:** In the local editor, open a demo post. Edit the first paragraph. Confirm the preview shows it larger, before the picture. Change the text to start with a heading. Confirm the picture moves above the text. Open a page. Confirm its preview is as before.
- [ ] **Step 4:** Commit. Message: `Show the post's lead before its picture in the editor's preview`.

---

### Task 10: Release note and final check (orchestrator)

- [ ] **Step 1:** Add `.changeset/post-page-header.md`, `minor`, with the note from the spec section "Release".
- [ ] **Step 2:** Run `node --test lib/*.test.mjs site/*.test.mjs`, `npx prettier --check .`, `npx changeset status --since=origin/main` and `npm run build`. Expected: all pass.
- [ ] **Step 3:** Do the hand checks of the spec section "Tests" on the branch's Cloudflare Preview: phone and computer width; copy link; each share button; a post without tags, without a picture, without related posts.
- [ ] **Step 4:** Venus: no command here (`check:themes` runs in `morpheme-website`). Confirm `morpheme-apps/themes/venus` has no file named in `THEME_FILES` beyond `theme.json` and `styles/global.css`. Look at the page on a Venus site after the release.
- [ ] **Step 5:** Commit the changeset. Open the PR. Merge per the standing go-ahead when the checks pass.
- [ ] **Step 6:** Tell the owner the release is ready for `/release` and the npm approval. After the release, confirm the demo shows the new post page.
