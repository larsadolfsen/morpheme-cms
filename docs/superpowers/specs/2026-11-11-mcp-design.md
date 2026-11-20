# MCP: Claude works on the site, and connectors reach other services

> **Status:** draft of 11 November 2026, written against `main` at `57b7591` (`@morphemecms/cms` 0.14.2). Nothing here is
> built, and **development starts in 0.16**, not before (the owner's decision of 11 November 2026). Until then this spec is
> only for deciding: the plan is written when 0.16 begins, and the decisions marked **Owner** under "Open questions" need
> the owner's answer before that.

## Goal

The Model Context Protocol (MCP) is the open protocol with which an AI assistant calls tools on a server. This spec uses
it in two directions, which share one piece of the Worker:

- **A. Morpheme as an MCP server.** An owner connects Claude, or another MCP client, to their site. The assistant reads
  the site and drafts changes; the owner decides what is published.
- **B. Connectors as MCP clients.** An app that connects the site to another service (a _connector_) can declare an MCP
  server of that service. The site's Worker calls its tools, so the owner can connect the service once and the app can use
  what the service offers, instead of the owner copying ids and keys by hand.

Both live in the site's Worker (`worker/`), which already holds the sign-in, the commit path to GitHub and the site's
key to the store. Neither runs in a visitor's browser.

## Non-goals

- No MCP in the visitor's browser. The site stays static; the embeds and tags of Calendly, Mailchimp, Google Analytics,
  Google Ads and Google Tag Manager stay as they are.
- No change to the contract 4 sandbox. Hooks and `after-build.ts` still have no network.
- No release, tag or version step. Only the owner releases `@morphemecms/cms`.
- No change to the store's sections or categories. They are in `2026-11-11-store-sections-design.md`; this spec only needs
  the store to carry the `mcp` field (part B).
- No assistant inside the editor. Part A is for assistants outside it; an assistant in the editor would be a part B client.

## Decisions

| #   | Decision                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | One MCP endpoint on the editor's address, `POST /mcp`, using the Streamable HTTP transport. The Worker routes it like `/api/...`, behind the same address check as the editor (`EDITOR_HOST`).                                     |
| 2   | An assistant signs in with OAuth 2.1 (authorization code with PKCE). The Worker is the authorization server and sends the person through the existing GitHub sign-in. The assistant never sees a GitHub token.                    |
| 3   | What an assistant may do is what GitHub says the signed-in person may do in the site's repository (`access` in `worker/session.js`), checked on every call. A person who loses access loses the assistant's access with it.        |
| 4   | Writes create or change content as **Draft**. Publishing is a separate tool and is **off** until the owner switches on "Allow publishing" for that connection.                                                                   |
| 5   | Every write goes through the same validation as the editor's save and the same commit path, so the result passes `check:editor`. A commit names the person and carries a trailer that says it came from an assistant.            |
| 6   | The owner sees each connected assistant in the editor, with its last use and a Disconnect button, and a log of what it changed.                                                                                                   |
| 7   | An app declares an MCP server with a new field `mcp` in `app.json`. This is contract 5 (`APP_API` in `lib/contracts.mjs`): contract 4 fails on unknown keys, so the field cannot be added to it.                                  |
| 8   | The Worker makes the calls of part B, with credentials kept per site. A credential never reaches the browser, the repository or the store.                                                                                         |
| 9   | An app can call only the tools it lists in `mcp.tools`, at the host it declares. The store shows the host and the tools before install, as it shows `csp` and `reads`.                                                           |
| 10  | The results of a part B call are data for the app. They are never given to a language model by the CMS.                                                                                                                            |

## A. Morpheme as an MCP server

### What the owner sees

- Under "Settings", a new section **Assistants** (Danish label: Assistenter) with a short text, the address to give the
  assistant (`https://<editor address>/mcp`), the list of connected assistants and, for each, the switch **Allow
  publishing** (Danish: Tillad udgivelse) and the button **Disconnect** (Danish: Afbryd).
- When an assistant connects, the person sees the Worker's own consent page: the assistant's name, what it may do ("Read
  your pages and posts, save drafts") and, if publishing is on, that too. Allow or Cancel.
- Under each assistant, the last changes it made, each linking to the page it changed.

### Sign-in and access

| Step              | Detail                                                                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery         | `GET /.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server` on the editor's address, as the MCP authorization specification asks. Confirm the current revision of that specification when building. |
| Registration      | Built against MCP **2025-11-25** (2025-06-18 and 2025-03-26 clients are still answered). An assistant uses the address of its Client ID Metadata Document as `client_id` (the Worker fetches it: https, no redirects, 8 KB, 5 s; `client_id` must match the address) or registers itself (dynamic client registration); the Worker keeps the client's name and redirect address. A redirect address that is not `https` (or a local loopback address) is refused. |
| Authorization     | `/oauth/mcp/authorize` shows the consent page and, if there is no editor session, sends the person through `worker/oauth.js` first.                                                                                       |
| Token             | `/oauth/mcp/token` gives a short-lived access token and a refresh token. Both are opaque and made by the Worker. Only a hash of each is stored.                                                                          |
| Each call         | The Worker looks up the token, finds the person, and asks `access` (cached ten minutes, as today) whether they may still edit. No access, no call.                                                                       |

The GitHub token the Worker needs to write for the person is kept by the Worker, in D1 next to the store key
(`worker/store-connection.js`), encrypted with a Worker secret. It is never in the assistant's token. Disconnecting an
assistant deletes its tokens; if it was the person's last connection, the Worker also deletes the stored GitHub token.
See open question 2.

### Tools

Names are in English and short. Each returns text the assistant can read and, where it helps, structured data.

| Tool               | Kind  | What it does                                                                                                                              |
| ------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `site_info`        | read  | The site's name, languages, theme, and the build's state (`/api/status`'s data).                                                          |
| `list_content`     | read  | Pages and posts with address, title, status and language. Filters: kind, status, text.                                                    |
| `read_content`     | read  | One page or post: its fields and blocks, in the editor's own form (`lib/blocks.mjs`).                                                     |
| `list_apps`        | read  | The installed apps with version and whether they are on. Their secrets are never included.                                                |
| `read_app_settings`| read  | One app's settings, without any field the app marks as secret.                                                                            |
| `save_draft`       | write | Creates a page or post, or changes one. The result is always status Draft. A published page that is changed stays published until the owner decides (see below). |
| `publish_content`  | write | Sets Published or Scheduled. Refused unless "Allow publishing" is on. Asks for `confirm: true`.                                           |

A published page is not changed in place by `save_draft`. The tool saves the change as a new Draft of that page, and
`publish_content` replaces the published page with it. The mechanism is the editor's own; the first plan batch checks how
the editor holds a draft of a published page today and uses that, and if there is none, this tool is read-only for
published pages until there is.

First version: no delete, no file upload, no change to `app settings`, no theme change. Each is a later tool, with its own
decision.

### Safety

- **Content is data.** A page can contain text that reads like an instruction. The assistant is the owner's; the CMS only
  limits what it can do with that text: drafts only, no publishing by default, one commit per change, a log.
- **Limits.** Each call is limited in size and time, and each connection in calls per minute (Workers rate limiting, or a
  counter in D1). A connection over its limit gets a tool error that says when to try again.
- **No new Worker place.** `/mcp` is core code in `worker/`, like `/api/github/`. It is not an app's `worker.js`.
- **Worker rule.** No pending I/O promise in module memory (`AGENTS.md` section 4): the code keeps only finished values.

## B. Connectors as MCP clients

### What the owner sees

- An app that declares `mcp` shows, on its page and in the store, **Connects to `<host>`** (Danish: Forbinder til) and
  the tools it uses, in plain words from the app's own texts.
- Its page has **Connect** (Danish: Forbind). The owner signs in to the service there. The app page then shows
  **Connected** and **Disconnect**.
- Where the app uses a tool, it says so on its settings: for example a list picker that is filled from the service.

### The `mcp` field

In `app.json`, contract 5:

```json
{
  "api": 5,
  "mcp": {
    "server": "https://mcp.example.com/mcp",
    "auth": "oauth",
    "tools": ["lists", "subscribe"]
  }
}
```

| Key      | Type                          | Required | Meaning                                                                                                   |
| -------- | ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `server` | https URL                     | yes      | The service's MCP server. The host is what the store shows and what the Worker may call.                  |
| `auth`   | `"oauth"`, `"token"`, `"none"` | yes      | How the owner connects. `oauth`: the service's OAuth sign-in. `token`: the owner pastes a token into the editor. `none`: a public server. |
| `tools`  | string[]                      | yes      | The tools the app may call. The Worker refuses any other.                                                  |

Rules, checked by `appManifest.mjs` like the other fields:

- `server` is `https` and has a host; no port, no user info, no IP address.
- Each tool name is listed once and matches `^[a-z0-9_-]+$`.
- `auth: "token"` needs a setting field of the same name in `settings.fields`, marked secret, so the editor has a place to
  take the token and the check can see it is not written to `values`.
- An app with `mcp` and no `tools` is a problem, not an empty list.
- Only a connector may declare `mcp`: the app's `role` is `connector` (`2026-11-11-store-sections-design.md`). A plugin that
  declares it is a problem.

`APP_API` becomes 5. Apps written to contract 4 keep working; the editor reads both. The plan decides how long contract 4 stays accepted.

### Where an app uses a tool

The first version has one use, which needs no app code in the Worker and therefore works for third-party apps:

- **A field filled from a tool.** A settings field of type `choice` may say `"options": { "from": { "tool": "lists",
  "label": "name", "value": "id" } }`. When the owner opens the settings, the editor asks the Worker, the Worker calls the
  tool, and the field shows the result. The chosen value is stored in the app's settings like any other.

A first-party app (publisher with `full` access to the `worker` place, see "Places" in `docs/app-contract.md`) may also call
a listed tool from its own `worker.js` with a helper given to it. A third-party `worker` place stays "not used yet".

### Credentials

- Kept in D1, per site and per app, in the same database as the store key, encrypted with the Worker secret from part A.
- OAuth tokens are refreshed by the Worker. A refresh that fails marks the connection **Needs sign-in** on the app page.
- Disconnect deletes them at once. Uninstalling an app deletes them too.
- Not in the repository, the store, the build output or any response to the browser. The editor can only see whether a
  connection exists.

### Safety

- The Worker calls only `server`'s host and only a listed tool. Redirects are not followed to another host.
- A call has a time limit (10 seconds) and a size limit on its result (256 KB). Both are errors, not truncations.
- The result goes to the editor's field or to a first-party `worker.js`. It does not go into the build, the repository or a
  page unless the app's own code, with its own review, puts it there.
- The store's rule stays: an app has only `peerDependencies` and no scripts at install. A connection is made by the owner
  after install, never by the install.

## Which of our apps

None of Calendly, Mailchimp, Google Analytics, Google Ads and Google Tag Manager changes in the first version. They load
embeds and tags in the visitor's browser, which MCP does not replace. A candidate for a later version is an app whose
service has a remote MCP server and whose settings today need an id the owner copies by hand.

### Finding (2026-11-11)

Read from the vendors' own documentation on 2026-11-11, with no vendor contacted and no account made. **Verified** means
the vendor's page (or, for Google, its GitHub README) says it, at the link. **Unverified** means it was not read from a
vendor page: `mandrillapp.com` and `developers.google.com` could not be reached.

| App | Official remote MCP server? | URL, transport, auth | Tools (names) |
| :-- | :-- | :-- | :-- |
| Calendly | **Yes, hosted by Calendly**, self-hosting not supported. Verified: <https://developer.calendly.com/calendly-mcp-server> | `https://mcp.calendly.com`. Auth: OAuth 2.1 code flow with PKCE (S256) and dynamic client registration (RFC 7591); scopes `mcp:scheduling:read` and `mcp:scheduling:write`; no static client ids and no personal access tokens. Verified, same page. The page does not name the transport (streamable HTTP or SSE): unverified. | 38, verified: <https://developer.calendly.com/docs/mcp/supported-tools>. Reads include `event_types-list_event_types`, `event_types-get_event_type`, `event_types-list_event_type_available_times`, `meetings-list_events`, `meetings-get_event`, `meetings-list_event_invitees`, `availability-list_user_availability_schedules`, `availability-list_user_busy_times`, `users-get_current_user`, `organizations-get_organization`, `organizations-list_organization_memberships`, `locations-list_user_meeting_locations`; writes include `event_types-create_event_type`, `event_types-update_event_type`, `meetings-create_invitee`, `meetings-cancel_event`, `scheduling_links-create_single_use_scheduling_link`, `shares-create_share`, `organizations-create_organization_invitation`; also routing forms (Teams plan), Notetaker (plan), `list_calendly_skills`, `load_calendly_skill` |
| Mailchimp (Marketing) | **No server for an account.** Its only MCP server searches the documentation: "This searches documentation, not your Mailchimp account." Verified: <https://mailchimp.com/developer/marketing/build/ai-tools/mcp-server> | `https://mailchimp.com/developer/_mcp/server`, `http` transport, no credential. Verified, same page. | The page names no tools; it is a docs search. |
| Mailchimp Transactional (Mandrill) | Unverified: `mandrillapp.com` was not reachable. | Unverified | Unverified |
| Google Analytics | Server in Google's `googleanalytics` GitHub org, but self-hosted only; no Google-hosted URL. Verified: <https://github.com/googleanalytics/google-analytics-mcp> | Local `stdio` via `pipx`; or self-hosted `--transport http`, with a built-in OAuth 2.1 server (dynamic client registrations kept in memory) or Google OAuth through an agent framework. The README does not say "streamable HTTP". | `get_account_summaries`, `get_property_details`, `list_google_ads_links`, `list_property_annotations`, `list_key_events`, `run_report`, `run_funnel_report`, `run_conversions_report`, `get_custom_dimensions_and_metrics`, `run_realtime_report`; with `--allow-write`: `create_property_annotation`, `create_custom_dimension`, `create_key_event` |
| Google Ads | Same: self-hosted only. Verified: <https://github.com/googleads/google-ads-mcp> | Local `stdio`; or self-hosted `streamable-http` with FastMCP's OAuth proxy and your own OAuth client id and secret. | `search`, `get_resource_metadata`, `list_accessible_customers`, `create_asset`, `upload_video_asset`, `manage_labels`, `manage_label_associations` |
| Google Tag Manager | None found from Google. Only community servers. Google's own docs were not reachable, so "none" is unconfirmed. | n/a | n/a |

The Google READMEs do not say "official". Neither Google server is a hosted service a site owner can connect to: each owner
would have to run it, which does not fit a connector.

**Recommendation.** Calendly is the pilot connector for part B. It is the only candidate with a vendor-hosted server for
the owner's own account, and its tools fill the fields that today take a pasted id: `event_types-list_event_types` for an
event type, `users-get_current_user` for the user. Two things the design must allow, both from Calendly's page: the sign-in
is OAuth with dynamic client registration only (the Worker registers itself as a client; there is no pasted key), and the
scopes are `read` and `write`, and the page says MCP needs both for full access, so a Calendly connection can write, and the "Allow publishing" switch does not cover
it. Still to check when batch 4 starts: the transport, which the page does not name. Mailchimp is not a candidate: the
Marketing API has no MCP server for an account, so `lists` cannot be filled from a tool. Mandrill is unconfirmed. The Google
servers and Tag Manager are not candidates.

## Batches

Each is its own pull request. The names are for the plan; the plan splits them further.

1. **Server, read-only.** `/mcp`, discovery, registration, consent page, tokens, `site_info`, `list_content`,
   `read_content`, `list_apps`, `read_app_settings`; the **Assistants** section with Connect and Disconnect.
2. **Server, writes.** `save_draft`, `publish_content`, the "Allow publishing" switch, the log, rate limits.
3. **Contract 5.** `APP_API` 5, the `mcp` field and its checks in `appManifest.mjs`, the credential store, `Connect` on the
   app page, the field filled from a tool.
4. **Pilot and store.** One connector with an MCP server, `morpheme-appstore` carrying `mcp` in its catalog and showing
   the host and tools, and `morpheme-apps` releasing the pilot.

Tests per batch: the unit tests of `lib/` and `worker/` (`npm test`), a Worker test for the sign-in and the access
check with a fake GitHub, the rule in `scripts/pending-shared.test.mjs`, and a fixture MCP server for batch 3 and 4.
`npm run check` passes before each pull request.

Changesets: these are new features for the owner, but the batches are built in 0.16, and `CLAUDE.md` today allows only
`patch` or an empty changeset once `0.15.0` is released. The owner sets the changeset levels for 0.16 when it begins and
updates that rule then; this spec does not choose them. This spec's own pull request changes only docs and has an empty
changeset.

## MCP revisions

The owner decided (2026-11-11): the read-only server (batch 1) speaks **2025-11-25** now and **2026-07-28** later.
Research date 2026-11-11. V = verified from a primary source (link), U = unverified.

### What clients support for remote servers

| Client                           | 2025-11-25 | 2026-07-28                                            | Status |
| -------------------------------- | ---------- | ----------------------------------------------------- | ------ |
| Claude Code                      | U (likely) | Yes, on its "v2 runtime" (MCP SDK 2.0); asks servers first, others get v1 behaviour. Default runtime: U | V: [docs](https://code.claude.com/docs/en/mcp), "MCP client runtimes" (first 100k characters read) |
| Claude apps (claude.ai, Desktop) | U          | U (no revision named in the connector docs)           | U: [docs](https://claude.com/docs/connectors/custom/remote-mcp.md) |
| ChatGPT (developer mode)         | U          | U (no revision named)                                 | U: [docs](https://developers.openai.com/api/docs/guides/developer-mode), page not read |
| Cursor                           | Yes (opens with `initialize`) | No; reply "No timeline at the moment!" | Forum report only, not a changelog: [thread](https://forum.cursor.com/t/mcp-client-cannot-connect-to-modern-only-2026-07-28-streamable-http-servers-legacy-initialize-rejected/172536) |
| VS Code (Copilot)                | U          | U (no primary source)                                 | U |
| MCP TypeScript SDK 1.x (1.32.2)  | Yes (also 2025-06-18, 2025-03-26, 2024-11-05) | No | V: npm tarball `SUPPORTED_PROTOCOL_VERSIONS` |
| MCP TypeScript SDK 2.x (2.4.0)   | Yes (`LATEST_PROTOCOL_VERSION`) | Per release notes yes, though the constant lists no 2026-07-28; how is U | V/U: [releases](https://github.com/modelcontextprotocol/typescript-sdk/releases) |

The spec's own announcement says the TypeScript, Python, Go and C# SDKs speak 2026-07-28:
[blog](https://blog.modelcontextprotocol.io/posts/2026-07-28/) (V, but only as read by a summarising tool). Only Claude
Code has a first-party document confirming use of 2026-07-28 against remote servers. Third-party compatibility pages
(Zuplo) contradict themselves and are not used.

### What one `/mcp` endpoint must do to serve both

All V, from the [2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog), the
[Streamable HTTP page](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http.md) and
the [versioning page](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning.md). The spec calls this a
"dual-era" server, and allows serving both eras on the same endpoint.

- **Choose the era per request, not per connection.** A legacy client opens with `initialize` and may send `Mcp-Session-Id`.
  A modern client sends, on every POST, an `MCP-Protocol-Version` header and `params._meta` with
  `io.modelcontextprotocol/protocolVersion` and `.../clientCapabilities` (no handshake, no session).
- **Legacy path (2025-11-25):** `initialize` / `notifications/initialized`, optional session id, as today. A legacy client has no
  fall-forward, so a modern-only server fails it: the legacy path must stay.
- **Modern path:** implement `server/discover` (MUST); reject a missing `_meta` field with `-32602` (HTTP 400); header and
  `_meta` mismatch is `-32020`; an unsupported version is `-32022` with `data.supported`; add `resultType` to every result,
  `ttlMs` and `cacheScope` to list/read results, and `Mcp-Method`/`Mcp-Name` headers are expected on requests. Return
  resource-not-found as `-32602`, not `-32002`.
- **No server-initiated requests** on the modern path (sampling, elicitation and roots are gone; they use `input_required`).
  Our read-only tools need none. The legacy path need not use them either.
- Modern clients try a modern request first and, on a 400 without a recognised modern error body, fall back to `initialize`
  (cached per origin), so the 400 body on a failed modern request must be the spec's error shape.
- **Authorization:** 2026-07-28 moves OAuth towards Client ID Metadata Documents (DCR deprecated) and clients must validate
  `iss` (RFC 9207). Our Worker already is the authorization server, so keep DCR for legacy clients and add `iss` to the
  authorization response and a metadata-document client lookup in the later batch. The authorization pages were not read in
  full (U).

### Recommendation

1. **Batch 1 builds 2025-11-25 only**, but with the dispatch in one place: a function that reads the request and returns
   `legacy` or `modern`, and tools that return plain data, so the result shape is added by the transport layer. A modern
   request gets the spec's `-32022` error with `supported: ["2025-11-25"]` (valid per spec, and lets dual-era clients fall back).
2. **Build the 2026-07-28 batch when** (a) Claude apps or ChatGPT document support (today only Claude Code does, behind its
   v2 runtime, and Cursor does not), or (b) the owner wants Claude Code on 2026-07-28 sooner. Until then it gives sites nothing:
   every client that supports it also still speaks 2025-11-25, which we keep.
3. **How:** a separate batch after batch 1 that adds `server/discover`, the modern headers and `_meta`, the result fields and
   the authorization changes above on the same `/mcp` route, with Worker tests for one legacy and one modern client against
   both, and a test that a legacy client still works. It needs no change to the tools. Check the TypeScript SDK 2.x for how
   it binds a modern revision before hand-writing it; the Worker is a plain `fetch` handler, so decide then whether to use it.
4. Recheck the table (the U rows) before starting that batch.

## Open questions

1. **Owner: the sign-in.** The spec proposes OAuth with the Worker as authorization server and GitHub as the identity. The
   alternative is a personal access token the owner makes in the editor and pastes into the assistant: simpler, but a long-lived
   secret in the assistant's settings and no consent page. Recommendation: OAuth.
2. **Owner: keeping the GitHub token.** To write for the person without their browser, the Worker must keep a GitHub token
   server side. The proposal is D1, encrypted with a new Worker secret (`MCP_VAULT_KEY`), deleted on disconnect. The
   alternative is for assistants to have no write tools in the first version. Recommendation: the proposal, writes in batch 2
   after the owner has seen batch 1.
3. **Owner: publishing.** Default off per connection, as decision 4. The alternative is no publishing by an assistant at all.
4. **Owner: the contract.** A new `mcp` field means contract 5 (decision 7). The alternative is to relax "unknown keys fail" for
   one named optional key, which is smaller but weakens a rule the store relies on. Recommendation: contract 5.
5. **The store's sections.** Decided by the owner: Themes, Connectors and Plugins, in `2026-11-11-store-sections-design.md`.
   `mcp` belongs to connectors, and both specs share contract 5.
6. **Draft of a published page.** Whether the editor already holds a draft beside a published page (see "Tools"). Found by
   reading `lib/status.mjs` and the editor's save path in batch 2; if there is none, writes to published pages are left out
   until there is.
7. **MCP revisions.** Decided: 2025-11-25 now, 2026-07-28 later. See "MCP revisions" for the clients, the dual-era rules and
   when to build the second batch. The plan still names the authorization revision built against.
