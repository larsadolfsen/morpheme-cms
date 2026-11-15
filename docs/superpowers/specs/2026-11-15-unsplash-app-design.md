# The Unsplash app (0.23, spec 5)

> **Status:** design for the owner's review, 15 November 2026 (a planning session: nothing is built). Release plan and
> the owner's decisions: `docs/superpowers/plans/2026-11-15-app-platform-0-23.md` (cited as **D1** to **D35**). The CMS
> side it builds on is built: `2026-11-11-media-providers.md`. Claims marked **verify** are checked before their batch.
>
> **Where Unsplash's rules differ from what is built or assumed** (read first):
>
> 1. **`utm_source` is Morpheme's app name, not the site's name.** The built declaration sends `utm_source={site}`.
>    Unsplash asks for the name of the registered application, and the application is Morpheme's (D4). This spec uses a
>    fixed `utm_source` (**verify** the exact registered name).
> 2. **The credit needs two links**, to the photographer's profile and to Unsplash. The saved record has one (`url`).
>    This spec adds `sourceUrl`.
> 3. **Unsplash officially supports only `w`, `h`, `crop`, `fit`, `fm`, `auto=format`, `q` and `dpr`.** The focal-point
>    parameters (`fp-x`, `fp-y`, `fp-z`) that D26's crop needs are imgix's, "not officially supported". D26 stands; the
>    fallback is below.
> 4. **help.unsplash.com could not be read from this session** (outside its network). The quotes are from
>    `unsplash.com/documentation` and `unsplash.com/api-terms`; the rest is **verify**. Otherwise D4, D14, D26 and D32
>    match: hotlinking, download tracking and credit to photographer and Unsplash are all required.

## Goal

The owner picks a photo from Unsplash in the image sheet with no key and no setup. The photo stays on Unsplash's servers,
is cut as the owner chose, carries its credit on the site where nobody can remove it, and the site keeps working when the
app is removed.

## What the guidelines require (quoted)

| Rule | Source | Words |
| --- | --- | --- |
| Hotlink | Documentation, *Hotlinking*; API terms §6 | "we require the image URLs returned by the API to be directly used or embedded in your applications"; "you must directly use or embed the related image URLs returned by the API in your Developer Apps." |
| Track downloads | Documentation, *Track a photo download* | "you need to trigger a GET request to this endpoint every time your application performs a download of a photo." (`links.download_location`) |
| Keep `ixid` | Documentation, *Dynamically resizable images* | "All resizing and manipulations of image URLs must keep this parameter" |
| Other imgix parameters | same | "The other parameters offered by Imgix can be used, but we don't officially support them and may remove support for them at any time in the future." |
| Attribution | API terms §9; Documentation | "your Developer App must attribute Unsplash, the Unsplash photographer", with a link to the photographer's profile; "All applications must follow the API Guidelines, including properly providing attribution for the photographer and Unsplash." |
| Credentials | API terms §2 | "You may not share your Credentials with any third party." |
| Rate limit | Documentation | Demo: "rate-limited to 50 requests per hour"; production: raised (the page read gave 1 000 per hour; other sources say 5 000, **verify**). Only JSON requests count, image requests do not. |
| Termination | API terms §19 | "you will immediately stop and thereafter desist from using all APIs." |
| Wording and UTM | API guidelines (help center, **verify**) | "Photo by <name> on Unsplash", both links with `?utm_source=<app name>&utm_medium=referral`; the app must not use Unsplash's name or logo as its own name, nor replicate Unsplash's core experience. |

Morpheme holds the key and the sites are users of Morpheme's application, so the key is never shared (§2): it stays in
the store's secrets.

## What exists today

- **CMS (built):** `mediaProviders` in `app.json` (contract 5, `role: "connector"`), validated by `lib/mediaProviders.mjs`.
  `worker/media-providers.js` makes every call (`search`, `image`, `track`) to hosts in the app's `csp`, with the owner's
  key sealed in D1 (`key: true`, shown to the editor as `needsKey`). `src/MediaProviderPicker.tsx` draws the tab;
  `src/Media.tsx` `pickFrom` fetches the bytes through the Worker, saves them as an upload (`prepareImage`, WebP, 2000 px),
  calls `track`, and the save writes `credit: { name, url, source }` into `src/data/files/<id>.json` (`creditChanges`,
  `src/fileRecords.mjs`; `withCredit`, `src/fileTags.mjs`).
- **Site drawing:** `scripts/responsive-images.mjs` makes 160 to 1200 px WebP copies of `public/images/uploads/` and
  `src/data/image-manifest.json`; `responsive(src)` and `rehypeResponsiveImages` (`site/images.mjs`) add `srcset`;
  `theme/components/Img.astro` and `Img.tsx` draw it; `imageOf` (`src/standard/load.ts`) gives blocks the same. A crop is
  `#format=2:3&crop=x,y,w,h` after the address and is done in CSS (`cropStyle`, `lib/crop.mjs`). `shareImage` uses the
  build's 1200 × 630 JPEG. The theme draws a credit's name only in the Image grid (`view.show.credit`).
- **CSP:** `lib/csp.mjs` adds the origin of every `<img>` in a built page to that page's `img-src` (`pageOrigins`), and the
  active apps' `csp.json` to every page. The editor's page gets the image origins of all built pages.
- **Store:** `morpheme-appstore/src/unsplash.js`, routed at `/api/unsplash/*` (`src/index.js`). `whoIs` takes
  `Authorization: Bearer <site key or owner token>` and compares SHA-256 hashes; a miss is 401. Routes: `GET /photos`
  (`page`, `per_page` ≤ 30, `order_by` latest/popular/oldest; `cf.cacheTtl` 600 s), `GET /search` (`query` required,
  `orientation`, `order_by`; 300 s), `POST /track-download` (`{ downloadLocation }`, `https://api.unsplash.com` only,
  not cached), `GET /status`. It sends `Client-ID ${UNSPLASH_ACCESS_KEY}`, `Accept-Version: v1`, forwards the
  `x-ratelimit-*` headers, and answers with CORS `*`. There is **no per-site limit**.
- **Found while reading (fix in batch 1 or 3):**
  - `hostsOf` reads `csp["connect-src"]`/`["img-src"]`, but `csp.json` and `morpheme-apps` (`app-csp.test.mjs`) use the
    kinds `connect`/`img`.
  - One `results` path serves both requests, but Unsplash's `/photos` answers a bare list (`results: ""`) and `/search`
    an object (`results`).
  - The store runs on `workers.dev`, where Cloudflare's cache may not apply, so `cf.cacheTtl` may cache nothing
    (**verify**).
  - `lib/contracts.mjs` in this checkout says `APP_API = 5`; contract 6 is on the 0.19 line.

## Design

### 1. The store-key provider (D4)

A provider declares `"auth": "store"` instead of `"key": true` (the two cannot be combined). Its request URLs start with
`store:/api/`. The site's Worker:

- resolves `store:` to `env.MORPHEME_STORE_URL ?? STORE_URL` and adds `Authorization: Bearer <storeKey(env)>`
  (`worker/store-connection.js`). The key goes only to the store, never to the browser or the app; the declaration may not
  name an `Authorization` header;
- lists the provider as `{ needsStore: true, connected: <the site has a store key> }` in `GET /api/media-providers`. Without
  a key the tab says *Connect to Morpheme to search Unsplash* with the existing *Connect to Morpheme* button. A 401 from the
  store reads the same;
- for `track`, POSTs `{ downloadLocation }` to the declaration's `track.url` (`store:/api/unsplash/track-download`). The
  tracking URL from the answer must be on the provider's `apiHosts`. That list is checked by the Worker and never written
  into a page's CSP;
- treats a 429 from the store as *Unsplash has had too many searches this hour. Try again later.*

A store-key provider needs no `connect` host in `csp`, because the browser never calls Unsplash's API.

### 2. Hotlinked images (D26)

The declaration gets `"hotlink": true`. Then:

- **The picker** shows thumbnails straight from `images.unsplash.com`; the Worker's `/image` route refuses a hotlink
  provider. `pickFrom` downloads nothing and skips `prepareImage`. It returns the image's `urls.raw` address (with its
  `ixid`) as the `src`, calls `track`, and adds the pick to the pending list (`useUploads`, `src/images.ts`), so the save
  writes its record.
- **The record** (`src/data/files/<id>.json`, keyed by that `src`, written by `creditChanges`, extended):

```json
{
  "src": "https://images.unsplash.com/photo-1501…?ixid=M3w…",
  "categories": [], "removed": [],
  "credit": { "name": "Jane Doe", "url": "https://unsplash.com/@jane?utm_source=morpheme&utm_medium=referral",
              "source": "Unsplash", "sourceUrl": "https://unsplash.com/?utm_source=morpheme&utm_medium=referral" },
  "hotlink": { "provider": "unsplash", "id": "Abc123xyz", "width": 4000, "height": 6000 }
}
```

  `hotlink` tells the site and the editor to draw the image from its host, at its real size, with no copy. A record with
  `hotlink` is never empty, so tag changes keep it (as `credit` today).
- **The address in the page** is that `src`, with the crop after it as today (`#format=3:2&crop=x,y,w,h`).
- **Drawing on the site**, in a new pure `lib/hotlink.mjs` used by `responsive`, `rehypeResponsiveImages`, `imageOf` and
  `shareImage`:
  - `srcset` from the record's `width`, at 480, 800, 1200, 1600 and 2000 px (none wider than the original), each
    `&w=<n>&q=75&auto=format`. `src` is the 1200 px one; `width`/`height` come from the record. `ixid` is kept.
  - With a crop: `&h=<w ÷ format>&fit=crop&crop=focalpoint&fp-x=<centre x>&fp-y=<centre y>`, and `&fp-z=<100 ÷ crop
    width>` when the owner zoomed in. The `<img>` has the format's `aspect-ratio` and no CSS crop box. Fallback if
    `fp-*` fails verification: the CSS crop of today over a `w`-only `srcset` (only supported parameters).
  - The shared image (og:image): `&w=1200&h=630&fit=crop&fm=jpg&q=80` with the same focal point.
  - The page's image list (its `PHOTO` pattern) and `firstImage` also match hotlinked addresses.
    `scripts/responsive-images.mjs` only walks `public/images/uploads/`, so it does no work for them.
- **CSP:** the app's `csp.json` is `{ "img": ["https://images.unsplash.com"] }`. `pageOrigins` adds the host to every
  page that shows one. The editor's policy also gets the `img` hosts of active apps with a hotlink provider, so an image
  inserted since the last build shows in the preview.

### 3. The credit (D32)

- **Text:** "Photo by <name> on Unsplash". <name> links to `credit.url` and "Unsplash" to `credit.sourceUrl`, both with
  `utm_source=morpheme&utm_medium=referral` and `rel="noopener"`. The site's language comes from `@site/texts`
  (`photoCredit`, with Danish in `defaults/i18n/da-DK/`). The editor already has `library.photoBy`.
- **Who draws it:** a new theme UI part `PhotoCredit` (`theme/ui/PhotoCredit.tsx`, class `photo-credit` in
  `theme/styles/ui.css`). It is a small label on a scrim at the image's bottom end, using the theme's tokens. It sits over
  the image, so it also works for backgrounds (Hero) and crops. Material's `Img.astro`, `Img.tsx` and
  `rehypeResponsiveImages` draw it for every image whose record has `hotlink`. Blocks that draw `<img>` themselves (Hero,
  Cards, Person, Image grid, lightbox) use `Img` or put `PhotoCredit` beside it. The Image grid's `show.credit` line stays
  as an extra.
- **Every theme:** themes build on Material and draw images through its parts. `check:themes` builds the demo with a
  fixture Unsplash image in every standard block and fails on a hotlinked `<img>` without a visible `.photo-credit` link
  (computed style, not hidden). `themeProblems` gets the rule. No setting turns it off. Load the skill `material-3` before
  building the part: M3 has no credit component, so the label-small type and scrim are a recorded deviation.

### 4. The app (`morpheme-apps/apps/unsplash/`, contract 7, D5)

```json
{
  "api": 7, "role": "connector", "label": "Unsplash", "publisher": "Morpheme", "license": "MIT", "icon": "Camera",
  "category": "media", "version": "1.0.0",
  "hint": "Free photos from Unsplash in the image picker.",
  "description": "Search Unsplash's free photos in the image picker and add them to your pages. The photos stay on Unsplash, and each one shows who took it.",
  "csp": { "img": ["https://images.unsplash.com"] },
  "mediaProviders": [{
    "id": "unsplash", "label": "Unsplash", "icon": "Camera", "auth": "store", "hotlink": true, "perPage": 24,
    "search": { "url": "store:/api/unsplash/search?query={query}&page={page}&per_page={perPage}", "results": "results" },
    "browse": { "url": "store:/api/unsplash/photos?order_by=popular&page={page}&per_page={perPage}", "results": "" },
    "track": { "url": "store:/api/unsplash/track-download" },
    "apiHosts": ["api.unsplash.com"], "totalPages": "total_pages",
    "map": { "id": "id", "thumb": "urls.small", "url": "urls.raw", "width": "width", "height": "height",
             "alt": "alt_description", "creditName": "user.name", "creditUrl": "user.links.html",
             "downloadTrackingUrl": "links.download_location" },
    "creditParams": { "utm_source": "morpheme", "utm_medium": "referral" },
    "source": { "label": "Unsplash", "url": "https://unsplash.com/" }
  }]
}
```

- No `worker.js`, no `editor.ts`, no hooks: data and texts only, plus `csp.json` equal to `csp`, `texts.json` and
  screenshots. Label, hint and description language follows the other apps in `morpheme-apps` (**verify**).
- Contract 7 adds to `mediaProviders`: `auth`, `hotlink`, `apiHosts`, `track`, `source`, `results` per request, and the
  `store:` URLs (allowed only with `auth: "store"`, path under `/api/`). `mediaProviderProblems` and `manifestProblems`
  check them. A contract-5 provider (`key: true`) works as before.

### 5. Removed, turned off or paused (D14)

- The picker's Unsplash chip goes away; *Your images*, the built-in, stays. No key or table to forget.
- **Photos already on pages keep working.** They are plain hotlinked addresses that need no key and no API call. Their
  credit is drawn from the record, whether or not the app is installed. `pageOrigins` keeps their host in each page's CSP.
  Nothing is rewritten or deleted, and the owner can still crop, describe or remove them.
- If Unsplash ends Morpheme's API access (§19), the store's routes answer 503 and the tab says Unsplash is unavailable.
  Whether hotlinked photos may stay after a termination is **verify** (the terms speak of the APIs, not served images).

### 6. Plans and limits

- **Every plan.** The CMS's own `worker/media-providers.js` makes the calls, no app code runs, so no Workers Paid (D1, D12).
- **Shared limit.** All sites share Morpheme's hourly limit; image requests do not count. In the store:
  - search and browse answers are cached by their normalised URL for 1 hour in KV (the store already has KV), so
    popular browse pages cost one call per hour for all sites;
  - a per-site limit of 50 uncached calls per hour (a D1 counter per site and hour); over it, a 429 with
    `retry-after`;
  - when Unsplash reports `x-ratelimit-remaining: 0`, every site gets 429 until the hour turns;
  - `track-download` is never cached and has its own per-site limit of 100 per hour.
- The store drops CORS on `/api/unsplash/*`: the site key is never in a browser (**verify** that no browser caller remains).

## What the owner sees

- **Site owner:** installs Unsplash from the store. The image sheet gets an *Unsplash* chip beside *Your images*, with
  popular photos and a search box. A tap adds the photo; the save is as fast as any save, with nothing uploaded. On the
  site, each such photo carries "Photo by … on Unsplash". Without *Connect to Morpheme*, the tab offers that button.
- **Morpheme's owner, once, for production approval (D4):**
  1. At unsplash.com/oauth/applications, register the application "Morpheme" and accept the API terms. Its name must
     not contain "Unsplash".
  2. Set the store's secrets `UNSPLASH_ACCESS_KEY` and `UNSPLASH_APP_NAME=morpheme`.
  3. On `morpheme-staging`, in demo mode (50 per hour), insert photos and check the hotlinking, the credit links with
     UTM, and the download tracking (the photo's download count on Unsplash rises).
  4. *Apply for production* on the application's page, with screenshots of the picker and of a page with credits, and a
     short use-case text. Morpheme also needs a public privacy policy (terms §5).
  5. After approval, the limit rises. Until then, the app is not released to the store.

## Tests

- `lib/mediaProviders.test.mjs`: `auth: "store"` with and without `key`, `store:` URLs, an `Authorization` header refused,
  `hotlink`, `apiHosts`, per-request `results`, `csp` read by kind, a credit with `sourceUrl` and fixed `utm_source`.
- `worker/media-providers.test.mjs`: store key only to the store host; no key gives `needsStore`; 401 and 429 mapped;
  `track` goes to the store with `downloadLocation` on `apiHosts`; `/image` refused for a hotlink provider.
- `src/fileRecords.test.mjs`: the `hotlink` record is written, kept on tag changes, never empty.
- `lib/hotlink.test.mjs`: `srcset` widths capped at the original, `ixid` kept, focal point and zoom from a crop, share image.
- `site/images` and `lib/csp` tests: hotlinked `src` gets its `srcset` and the CSP host; the editor's policy gets it.
- `check:themes` and `check:screens`: the credit on every standard block, on every section colour, not hidden.
- Store `test/unit/unsplash.test.mjs`: cache hit and miss, per-site limit, global 429, no CORS, key never in a response.
- `morpheme-apps`: `npm run check` (manifest, sandbox), `app-csp.test.mjs`.

## Out of scope

- Hotlinked photos in *Your images* (the Library); they are found again by searching.
- Other providers with store keys (Pexels and the like), and a paid Unsplash plan.
- Saving `alt_description` as the base text (alt stays with the block); moving earlier uploaded photos to hotlinks.

## Verify before building

1. help.unsplash.com: the attribution wording, the UTM rule (`utm_source` is the app name), the naming rule, *Triggering a
   download* (insert counts as a download) and whether hotlinked photos may stay after a termination.
2. The production rate limit (1 000 or 5 000 per hour) and what the approval asks for.
3. `fp-x`, `fp-y` and `fp-z` with `fit=crop&crop=focalpoint` on `images.unsplash.com` give the owner's crop; else the
   CSS fallback.
4. `cf.cacheTtl` on the `workers.dev` store caches nothing; then use KV, as designed.
5. Whether `images.unsplash.com` sets cookies or needs a line in the site's privacy texts (the cookie banner, D11).
6. Contract 6 is on the line 0.23 builds on, so `api: 7` is the next contract.

## Batches

| Batch | Repo | What |
| --- | --- | --- |
| 1 | `morpheme-cms` | Contract 7's provider keys (`auth`, `hotlink`, `apiHosts`, `track`, `source`, per-request `results`, `csp` by kind); the Worker's store route and `needsStore`; the picker's hotlink path; the `hotlink` record and `sourceUrl`; the editor's CSP. Changeset and release note. |
| 2 | `morpheme-cms` | `lib/hotlink.mjs`, `site/images.mjs`, `Img`, rehype, share image; `PhotoCredit` in the theme; the `check:themes` rule. |
| 3 | `morpheme-appstore` | KV cache, per-site and global limits, no CORS on `/api/unsplash/*`, tests. |
| 4 | `morpheme-apps` | `apps/unsplash/` on contract 7, screenshots on staging; released only after production approval and the owner's yes. |

Verify items 1 to 3 run first, on `morpheme-staging` with a demo key, before batch 2 is built.
