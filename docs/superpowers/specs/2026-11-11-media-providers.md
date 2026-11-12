# Media providers: an app adds a source to the picture picker

Status: this pull request (CMS side). The first app is Unsplash, in `morpheme-apps`.

## Why

The old Interstellar CMS had an Unsplash app. It was dropped when the CMS moved here (8533a13). It ran in the editor with
full access and used a central proxy that no longer exists. Contract 4 and 5 say an app's network access is limited to the
hosts in its `csp`, and `slots` (like `versionSwitch`) are `full` editor places for first-party apps only. A picker component
in `editor.ts` would run unsandboxed, with the owner's session, so it is the wrong shape for a source of pictures from the
internet.

## Design: data in `app.json`, requests by the Worker

An app declares `mediaProviders` in `app.json` (contract 5, `role: "connector"` only). It is data. The app ships no code for
this place, so it gets no access of its own.

- The **editor** draws the picker (`src/MediaProviderPicker.tsx`): a search, a grid, "Show more", and a field for the key.
  `src/Media.tsx` shows each installed, enabled app's provider as a chip beside "Your pictures" in the picture sheet
  (`useMediaPicker`).
- The **Worker** makes every request (`worker/media-providers.js`, `lib/mediaProviders.mjs`): the search, the picture bytes and
  the download tracking call. The browser calls only `/api/media-providers/<app>/<id>/…` on the site.
- **Hosts.** A request URL must be https, on a name host with no port, no user info and no placeholder in the host, and that
  host must be in the app's `csp` under `connect-src` (`mediaProviders` is refused by `npm run check:content` otherwise).
  Pictures must be on a host in `connect-src` or `img-src`. The Worker checks the host of every URL again at run time,
  also for URLs taken out of the provider's answer, follows no redirect, and times out after 10 s, 1 MB of JSON or 12 MB of
  picture. An answer entry with an address on another host is dropped.
- **The key.** The owner enters it once in the provider's tab (`needsKey`). The Worker seals it with `MCP_VAULT_KEY` in D1,
  as a connector's token (table `media_provider_keys`). It is never in the repository, never sent to the browser or the app,
  and goes only into the headers the declaration lists, to the API host (not to picture hosts). Saving and removing it needs
  the right to save the site. Uninstalling forgets it (`forgetProviderKeys`). *Deviation from the request:* the key is
  entered in the picker, not on the app's settings page, because a settings field is saved in the repository; a `secret`
  settings field is only supported for `mcp` tokens today.
- **Pictures** are fetched and shown through the Worker (`/image`), so the editor's own CSP needs no change.

### app.json

```json
{
  "api": 5,
  "role": "connector",
  "csp": { "connect-src": ["api.unsplash.com"], "img-src": ["images.unsplash.com"] },
  "mediaProviders": [
    {
      "id": "unsplash",
      "label": "Unsplash",
      "icon": "Camera",
      "key": true,
      "perPage": 24,
      "search": {
        "url": "https://api.unsplash.com/search/photos?query={query}&page={page}&per_page={perPage}",
        "headers": { "Authorization": "Client-ID {key}" }
      },
      "browse": {
        "url": "https://api.unsplash.com/photos?order_by=popular&page={page}&per_page={perPage}",
        "headers": { "Authorization": "Client-ID {key}" }
      },
      "results": "results",
      "totalPages": "total_pages",
      "map": {
        "id": "id", "thumb": "urls.small", "url": "urls.regular", "width": "width", "height": "height",
        "alt": "alt_description", "creditName": "user.name", "creditUrl": "user.links.html",
        "downloadTrackingUrl": "links.download_location"
      },
      "creditParams": { "utm_source": "{site}", "utm_medium": "referral" }
    }
  ]
}
```

| Key | Meaning |
|---|---|
| `id`, `label`, `icon` | The chip: lower case id, English label, Phosphor icon name. |
| `key` | `true` when the owner must enter a key; `{key}` may then be used in headers. |
| `search`, `browse` | `{ url, headers? }`. `browse` is used when the search box is empty; without it the search is used with an empty query. Placeholders: `{query}`, `{page}`, `{perPage}`, `{site}` (URLs, encoded), `{key}` (headers only). |
| `results`, `totalPages` | Dot paths into the JSON answer; `results: ""` when the answer is the list. |
| `map` | Dot paths of the parts of one entry (`MEDIA_FIELDS`). `id`, `thumb`, `url`, `width`, `height`, `alt`, `creditName`, `creditUrl` are required; `downloadTrackingUrl` is optional. |
| `creditParams` | Added to the credit link (Unsplash's `utm_source` and `utm_medium`); `{site}` is the site's name. |

The editor gets `{ url, thumb, width, height, alt, credit: { name, url }, downloadTrackingUrl? }` per picture
(`MediaItem`). An entry that lacks a part, or has an address off the listed hosts, is left out.

## Inserting a picture and its credit

The picture is fetched through the Worker, made ready like any chosen picture (`prepareImage`: at most 2000 px, WebP) and
saved with the page in the same commit. Its download tracking URL is called by the Worker when it is inserted (best effort,
never blocks the insert). The credit is saved in the picture's file record (`src/data/files/<id>.json`, the record
that holds its tags): `credit: { name, url, source }`, in the same commit (`creditChanges`). A record with a credit is never
empty, so it is not deleted with the tags; tag changes keep it. `source` is the provider's label ("Unsplash"), so the credit
reads "Photo by <name> on <source>" (`media.providers.credit`). Showing the credit on the public page is the theme's or
the app's job and is not part of this change; the data is there for it.

The picture's alt text is not saved: blocks keep alt text, and the picker only returns an address. `alt` from the provider
is the picture's accessible name in the grid.

## What the app side must implement (morpheme-apps, Unsplash)

1. `src/apps/unsplash/app.json` with `api: 5`, `role: "connector"`, the `csp` and `mediaProviders` above, `key: true`.
2. No `editor.ts`, no `worker.js`, no code: the app is data and texts only.
3. Unsplash rules: keep `creditParams`, keep `downloadTrackingUrl` in `map` (the Worker calls it on insert), and describe in
   `description` that the owner needs a free access key from unsplash.com/oauth/applications and enters it in the picker's
   Unsplash tab. Unsplash's production rate limit and their requirement to show the credit on the site apply to the owner.
4. Release notes, screenshots and the store entry as for any app.

## Tests

`lib/mediaProviders.test.mjs` (validation, request filling, mapping, host rules), `worker/media-providers.test.mjs`
(sign-in, key never returned, hosts re-checked, key only to the API host), `src/fileRecords.test.mjs` (credit in records).
