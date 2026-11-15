# Going live (version 1): three ways to run a site

> **Status:** a plan for the owner's review, 15 November 2026. It is a planning session, so nothing here is built. It
> refines roadmap item **0.24 Platform** (`plans/2026-11-14-roadmap-0-18-to-0-24.md`, which says "all of these need a design
> here") and `morpheme-website/docs/platform.md` ("hos os" and "hos kunden"). It uses the Stripe set-up from
> `morpheme-appstore` `specs/2026-11-15-paid-items-design.md`.
>
> **Goal:** a site goes live in one of three ways, with the same CMS package and the same site files:
>
> 1. **Hosted by Morpheme:** one click on the Morpheme site, paid monthly through Stripe, running on the owner's Cloudflare
>    account with **Cloudflare Artifacts** as the site's git storage.
> 2. **On the customer's own Cloudflare account:** with GitHub (today's path, made hands-free) or with Artifacts.
> 3. **Self-hosted or on a European cloud:** no Cloudflare at all.

## What exists today (the starting point)

GitHub plays four roles in a site today, and each one has to be replaceable for stages 1 and 3:

| Role | Where | Cloudflare- or GitHub-specific |
| --- | --- | --- |
| **Storage.** Every save is a commit. | `worker/files.js` (`filesOf`, `save` via GraphQL `createCommitOnBranch`), `worker/github.js` (`commitFiles`), `worker/editor-github.js` (the `/api/github/*` proxy), `src/github.ts` (about 47 editor modules import it) | GitHub GraphQL and REST |
| **Login and rights.** | `worker/oauth.js` (GitHub App OAuth), `worker/session.js` (`accessOf`, `mayEdit` read GitHub's `permissions`) | GitHub |
| **Build trigger.** | A push starts Workers Builds through Cloudflare's GitHub integration; `npx morpheme ci-build` builds | GitHub and Workers Builds |
| **Build status.** | `worker/cms-update.js` reads GitHub check-runs from `cloudflare-workers-and-pages`, and reverts a failed CMS update; `worker/push.js` polls `/editor/version.json` | GitHub |

The site Worker also uses `ASSETS`, KV (`NOT_FOUND`, `PUSH`), D1 (`CONSENT`: the store key, MCP vault, consent log), an optional
R2 (`FILES`, git cache and autosave drafts), crons (`7 * * * *`, `* * * * *`) and, with Cookiescanner, Browser Rendering.

There is **no storage interface**. The nearest seam is `filesOf()` in `worker/files.js`. The Deploy button
(`starter/`) works, but the customer still creates a GitHub App, a personal `GITHUB_PUBLISH_TOKEN`, the R2 bucket and its
token, the domain and `EDITOR_HOST` by hand. That breaks the platform's own rule: no keys typed or copied by hand.

## The shared foundation (built once, before stage 1)

All three stages need the same refactor. It is the biggest single piece of work, and it should come first.

1. **A site backend interface** in the Worker, with GitHub as the first implementation and no behaviour change:
   - `files`: `head`, `read`, `list`, `history`, `save(changes, message)`, `revert`.
   - `auth`: who is signed in and what they may do (`read`, `edit`, `admin`).
   - `build`: `trigger()` and `status(commit)`, so `cms-update.js` and `push.js` stop reading GitHub check-runs.
   - `src/github.ts` becomes `src/files.ts`, a client of the Worker's neutral `/api/files/*`. The old `/api/github/*` routes
     stay as aliases for one version line.
2. **Bindings behind small adapters** (`kv`, `sql`, `blob`, `cron`), so stage 3 can swap them. On Cloudflare they stay thin
   wrappers with no cost.
3. **Media out of git (optional for v1, needed later).** Sara's site already has 16 MB of images in `public/`, and new
   Artifacts repositories have a 1 GB limit, history included. `specs/2026-11-11-media-providers.md` is the natural place
   for "images in R2". For v1, a size warning in the editor at 500 MB is enough.

## Stage 1: hosted by Morpheme (one click, monthly through Stripe)

### What the customer does

1. On morpheme's site: **Create a site**, then choose a name and a theme.
2. Sign in with an email (magic link) and add a passkey. There is no GitHub account.
3. Pay a monthly subscription in **Stripe Checkout**.
4. A minute later the editor opens at `https://<name>.<hosting domain>/editor/`. Later they can add their own domain
   in the editor.

### How it works

| Part | Choice | Why |
| --- | --- | --- |
| **Storage** | One **Artifacts** repo per site in one namespace, `sites`, created with jurisdiction **`eu`**. A new site is a **fork** of a `starter` repo imported into Artifacts. | Forking from a baseline is native and costs no GitHub. EU storage fits the customers. |
| **Writing a save** | The Worker builds the commit with `isomorphic-git` against the repo's remote and a short-lived write token minted by the `ARTIFACTS` binding. The binding itself can read files, history and objects, but **cannot write files**. | The only documented way to write from a Worker. **Spike first:** the cost of a push from a Worker for a 100-file save. |
| **Login** | **Morpheme accounts** (email magic link and passkeys) on the platform Worker. A site trusts a signed session, with the roles `owner` and `editor`. Email goes out through Cloudflare Email Service. | Roadmap 0.24 and paid-items already need "owner accounts". The open question in `platform.md` ("login uden GitHub") is answered here. |
| **Compute** | **v1: one ordinary Worker per site** on the owner's account, the same shape as today (CMS Worker plus `ASSETS`). **Later: Workers for Platforms** (one dispatch namespace, a dispatch Worker on `*.<hosting domain>`, $25 per month, 1,000 scripts included, then $0.02 each). | The ordinary Worker needs almost no new code and connects to Workers Builds from Artifacts directly. An account allows a few hundred Workers. Move to Workers for Platforms before that, or when apps' own Workers must be isolated per tenant. |
| **Build** | **v1: Workers Builds connected to the Artifacts repo** (documented: "Continue with Artifacts"). **Later: our own pipeline**: an Artifacts `push` event, a Queue, a Workflow, a Container that runs `morpheme ci-build`, then a deploy through the API. | Workers Builds allows **6 concurrent builds per account** with a 20-minute timeout, and today's build takes 3 min 41 s (about 1 min 45 s after 0.26). That is about 100 to 200 builds an hour for every hosted site together. That is enough for launch, but not for growth. |
| **Per-site data** | D1 and KV per site at launch (D1 allows thousands of databases; KV allows 1,000 namespaces by default). Later, shared tables keyed by site id. | It keeps today's code unchanged. |
| **Domains** | Default `<name>.<hosting domain>` (a Worker custom domain). Own domains through **Cloudflare for SaaS custom hostnames** on the hosting zone. | Customers keep their DNS where it is: they add a CNAME and the certificate is issued for them. |
| **Store** | The site gets its store key when it is created (`POST /store/connect` from the platform), so "Connect to Morpheme" is never needed. | It follows the existing `connect-to-morpheme` design. |
| **CMS updates** | The platform updates hosted sites itself: commit `package.json` to each repo in waves (canary sites first) and read build status through `build.status()`. | It replaces the hourly per-site npm poll and the GitHub check-run watch. |
| **Billing** | A **Hosting** product in Stripe (monthly, Stripe Tax, Customer Portal) on the same Stripe account and webhook as paid items. The webhook starts the provisioning Workflow. | Reusing the set-up means one Stripe integration to keep. |
| **Not paid** | After a grace period, the editor becomes read-only. Some days later the site goes offline. Nothing is deleted for N months, and **Export** always works (decision 6). | It is the same rule as paid items: a pause never deletes data. |

### Provisioning (one Cloudflare Workflow, about one minute)

`checkout.session.completed` → create the account and site row → fork the `starter` repo in Artifacts → create D1 and KV → create
the Worker and connect Workers Builds to the repo → set the custom domain → mint the store key → first build → email "your site is live".
Every step can be retried, and a failed step leaves a row the owner can see in the platform's admin.

### Cost per hosted site (rough, to set the price)

- Artifacts: each save is about 1 push and 1 clone. With 5 saves a day that is about 300 operations a month, under the
  10,000 included operations until about 30 sites, then $0.15 per 1,000. Storage is $0.50 per GB a month after the first GB.
  This comes to a few cents per site.
- **Workers Builds dominates the cost.** 5 saves a day at 1 min 45 s is about 260 build minutes a month per site.
  6,000 minutes are included (about 23 sites), then $0.005 a minute, about **$1.30 per site a month**. At 20 saves a day it
  is about $5. Batching saves made close together into one build, and the 0.26 content lane, matter more here than
  anything else.
- Workers requests, D1 and KV are small for brochure sites. Requests for static assets are free.
- **A monthly price of €10 or more covers it with margin.** The owner sets the real price (decision 5).

### Risks

- **Artifacts is in open beta.** Its billing began in November 2026, and the 1 GB limit per repo arrived without
  much notice. Mitigation: the backend interface keeps GitHub working, and **Export** (a `git clone` URL plus a zip of
  media and D1) is part of v1 from the start.
- **Can Workers Builds be connected through the API?** `platform.md` asks this too. If it cannot, provisioning skips Workers
  Builds and uses the own pipeline from day one. **Check this first.**
- Writing commits from a Worker with `isomorphic-git` has to fit the CPU and memory limits for large saves (the spike above).

## Stage 2: on the customer's own Cloudflare account

There are two variants. Both run the same Worker as stage 1, only on the customer's account.

| | **2a: GitHub (default)** | **2b: Artifacts** |
| --- | --- | --- |
| Start | The **Deploy to Cloudflare** button (it works today) | `npx morpheme create` (it uses `wrangler login` on the customer's machine, so no key is copied) |
| Cloudflare plan | Workers **Free** works | Workers **Paid** ($5 a month) is required for Artifacts |
| Why | The button supports only GitHub and GitLab, not Artifacts. Developers expect GitHub, and it is free. | Everything stays in Cloudflare, and the EU jurisdiction is available. It is the same backend as stage 1. |
| Left by hand today | GitHub App, `GITHUB_PUBLISH_TOKEN`, R2 bucket and token, `EDITOR_HOST` | — |
| Made hands-free by | **One GitHub App per site through the manifest flow** (already in 0.24): the first visit to `/editor/` creates the app and stores its keys in D1, and the installation token replaces `GITHUB_PUBLISH_TOKEN`. R2 is created by the Deploy button's resource provisioning. | The CLI creates the namespace, repo, D1, KV and the Workers Build. |

- **Login:** GitHub login stays for 2a. A site on its own account can also choose to trust Morpheme accounts (decision 4).
- **Moving from stage 1 to stage 2 ("Take my site with me"):** from the editor, push the Artifacts repo to a new GitHub repo or
  into the customer's own Artifacts, copy D1 and media, then end the hosting subscription. This is the same Export as in stage 1
  plus a guided import. It is a strong selling point: no lock-in.
- **The store and paid items** work as today: the site connects to the store with a site key and pays for items through Stripe.

## Stage 3: self-hosted or on a European cloud

The site Worker is the only part tied to Cloudflare. The foundation's adapters make it portable.

| Cloudflare part | Portable replacement |
| --- | --- |
| Workers runtime | Node 22 server (the same handler through a small `fetch` adapter, such as Hono's Node server), or `workerd` for exact parity |
| `ASSETS` | Static `dist/` served by Caddy (or the Node server) |
| D1 and KV | SQLite (one file per site) |
| R2 | Any S3-compatible store (Scaleway, Hetzner, OVH, or Garage/MinIO on the same machine) |
| Crons | The server's own scheduler |
| Git storage | A bare repo on disk (`isomorphic-git` or `git`), or Forgejo/Codeberg (EU, non-profit) |
| Build | `morpheme ci-build` on the same machine after each save, then an atomic swap of `dist/` |
| Browser Rendering (Cookiescanner) | Playwright in the container |
| Email | SMTP |

- **Deliverable: one Docker image, `morpheme/server`,** plus a `compose.yaml` that runs on any EU VPS (Hetzner, Scaleway, OVH,
  UpCloud) with one command. A one-click template on one EU host comes later.
- **A managed European platform** like Cloudflare (Bunny.net, Scaleway Serverless) is a later target. It needs its own
  evaluation, because their edge runtimes differ from Workers.
- **Note for the sales story:** stage 1 with EU jurisdiction (Artifacts `eu`, R2 `eu`) already keeps data in the EU. It is
  not sovereign (Cloudflare is a US company). Stage 3 is the answer for customers who need sovereignty.

## Order of work and versions

| Step | Contents | Proposed version |
| --- | --- | --- |
| 0 | Spikes: Workers Builds connected through the API; an `isomorphic-git` push from a Worker; a fork of an Artifacts repo per site | before 0.24 |
| 1 | Foundation: backend interface (GitHub first, no change for sites), neutral `/api/files/*`, `build.status()` | 0.24 |
| 2 | Morpheme accounts (email, passkey) and the Artifacts backend | 0.24 |
| 3 | Platform: Create a site, Stripe Hosting, provisioning Workflow, domains, Export | 0.24 and 0.25 (Stripe is shared with paid items) |
| 4 | Stage 2a hands-free: GitHub App per site through the manifest flow; Deploy button with R2 | 0.24 |
| 5 | **1.0:** stage 1 and stage 2a live, and Sara's site moved onto the final shape | 1.0 |
| 6 | Stage 2b (`npx morpheme create` with Artifacts), "Take my site with me" | 1.x |
| 7 | Stage 3: adapters for Node, the Docker image, docs | 1.x or 2.0 |
| 8 | Scale: Workers for Platforms and the own build pipeline | when hosted sites pass about 150 |

## Decisions for the owner

1. **Is 1.0 stage 1 plus stage 2a,** with 2b and 3 after 1.0? (Proposed: yes.) The owner's standing rule says
   `@morphemecms/cms` stays below `1.0.0` (skill `changesets`), so going to 1.0 lifts that rule. Only the owner can decide that.
2. **Hosting domain** for default addresses (`<name>.<domain>`). It must be a zone on the owner's account with Cloudflare for SaaS.
3. **Compute at launch:** one ordinary Worker per site (proposed), or Workers for Platforms from day one?
4. **Login:** Morpheme accounts (email and passkey) for hosted sites (proposed). Do sites in stage 2 keep GitHub login only,
   or may they trust Morpheme accounts too?
5. **Price** of hosting per month, and whether a yearly price comes too (paid items have both).
6. **Not paid:** how long the grace period lasts, how long the site stays online read-only, and how long data is kept.
7. **Where the platform lives:** `morpheme-appstore` (as `repositories.md` says: "later Opret site"), or a new private
   `morpheme-platform` repo?
8. **Accepting a beta:** launch stage 1 on Artifacts while it is in beta (with Export as the safety net), or keep hosted
   sites on GitHub repos in the owner's organisation until Artifacts is generally available?

## Sources

- Artifacts: <https://developers.cloudflare.com/artifacts/> (limits: 1 GB per repo created after 29 September 2026, 1 TB per
  account; pricing: Workers Paid, 10,000 operations and 1 GB included, then $0.15 per 1,000 operations and $0.50 per GB-month;
  jurisdictions `eu`/`us`; the binding reads but does not write files, see `examples/isomorphic-git/`).
- Workers Builds from Artifacts: <https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/artifacts-integration/>;
  limits: <https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/> (6 concurrent builds, 6,000 minutes, then $0.005 a minute).
- Build on push with Workflows: <https://developers.cloudflare.com/artifacts/guides/build-and-deploy-on-push/>.
- Deploy buttons support only GitHub and GitLab: <https://developers.cloudflare.com/workers/platform/deploy-buttons/>.
- Workers for Platforms pricing and hostname routing:
  <https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/reference/pricing/>,
  <https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/configuration/hostname-routing/>.
