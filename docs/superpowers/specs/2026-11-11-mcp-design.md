# MCP: Claude works on the site, and connectors reach other services

> **Status:** draft of 11 November 2026, written against `main` at `57b7591` (`@morphemecms/cms` 0.14.2). Nothing here is
> built. The decisions marked **Owner** under "Open questions" need the owner's answer before the plan is written.

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
| Registration      | The assistant registers itself (dynamic client registration); the Worker keeps the client's name and redirect address. A client with a redirect address that is not `https` (or a local loopback address) is refused.     |
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
service has a remote MCP server and whose settings today need an id the owner copies by hand. Whether Mailchimp or Calendly
offer one has not been checked and is the first task of the pilot batch.

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

Changesets: these are new features for the owner, so `minor`, which `main` allows while it is at `0.14.x` and the change
lands in `0.15.0`. After `0.15.0` is released only `patch` or an empty changeset is allowed (`CLAUDE.md`), so if the batches
are not merged before then, the owner decides how to ship them. This spec's own pull request changes only docs and has an empty
changeset.

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
7. **MCP revisions.** The authorization part of the protocol has changed between revisions. The plan names the revision
   built against and the Worker tests a client of that revision.
