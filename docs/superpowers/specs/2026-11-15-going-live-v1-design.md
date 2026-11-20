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

## Decisions taken (owner, 15 November 2026)

1. **1.0 is stage 1 only:** the hosted service. Stages 2 and 3 come after 1.0.
2. **Hosted sites use Artifacts only.** There is no GitHub fallback for hosted sites.
3. **EU storage only for customers in EU countries.** A site's Artifacts namespace (and its R2 and D1) is chosen from the
   customer's country at sign-up: `sites-eu` (jurisdiction `eu`) for EU countries, `sites` (no jurisdiction) for everyone
   else. A namespace's jurisdiction cannot change later, so a customer who moves region gets a new repo (an export and an import).
4. **Workers for Platforms from launch** (changed from one ordinary Worker per site, because a free plan means many sites).
   One dispatch namespace holds every site's Worker, and a dispatch Worker on `*.<sites domain>` routes to it.
5. **Login with Google and Microsoft** through OAuth in the platform Worker, the same pattern as today's GitHub login.
   Morpheme stores no passwords and sends no login emails. Cloudflare Access was considered and left out, because it
   charges per user who signs in (it is made for a company's own staff, not for customers).
6. **Not paid:** 14 days of grace, then the editor is read-only and the site stays online for 30 days, then the site goes
   offline. Data is kept for 12 months, and **Export** always works.
7. **Releasing stage 1 is `@morphemecms/cms` 1.0.0.** This lifts the standing "below 1.0.0" rule when stage 1 ships. Only
   the owner releases it.
8. **The platform lives in `morpheme-appstore`** (Create a site, accounts, billing, provisioning), as `repositories.md`
   plans. There is one private Worker and one Stripe webhook for both the store and hosting.
9. **`getmorpheme.com` is Morpheme's own domain:** marketing, sign-in, the store and billing. Customer sites get a
   **separate sites domain** (name still open, to be bought; for example `morpheme.site` or `morpheme.page`), the way GitHub uses `github.io` and
   Netlify uses `netlify.app`. A flagged customer site then cannot hurt `getmorpheme.com`, customer sites (which run
   third-party app code) can never reach Morpheme's cookies, and the sites domain goes on the Public Suffix List so browsers
   treat each site as its own site. The same zone is the Cloudflare for SaaS target for customers' own domains.
   `workers.dev` addresses are for internal testing only: they carry the account's name and change if it is renamed.
   `morpheme.dev` (also on the owner's account) is the site for developers: docs and the guides for making themes and apps.
10. **A free plan to reach many sites first.** It is the full editor on `<name>.<sites domain>`, with these limits:
    - **No own domain.** Connecting a domain is the reason to upgrade.
    - **A build limit.** Saves made close together build once, with at most about 10 builds a day. Autosave drafts never
      build, so editing stays free.
    - **A small "Made with Morpheme" badge**, which paid plans remove.
    - **Unused sites sleep.** After 6 months without a sign-in, the owner gets an email warning, then the site goes offline.
      After 12 months it is deleted, with Export available until then.
    - **Abuse controls.** Google or Microsoft sign-in, Turnstile on _Create a site_, a limit of sites per account, and a
      _Report this site_ link. The sites domain must be on the Public Suffix List before the free plan opens.
    - The paid plan adds an own domain, more builds, no badge, and paid themes and apps from the store.

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
2. Sign in with Google or Microsoft. There is no GitHub account and no password.
3. Pay a monthly subscription in **Stripe Checkout**.
4. A minute later the editor opens at `https://<name>.<sites domain>/editor/`. Later they can add their own domain
   in the editor.

### How it works

| Part | Choice | Why |
| --- | --- | --- |
| **Storage** | One **Artifacts** repo per site, in `sites-eu` (jurisdiction `eu`) for customers in EU countries and in `sites` for everyone else (decision 3). A new site is a **fork** of a `starter` repo imported into each namespace. | Forking from a baseline is native and costs no GitHub. |
| **Writing a save** | The Worker builds the commit with `isomorphic-git` against the repo's remote and a short-lived write token minted by the `ARTIFACTS` binding. The binding itself can read files, history and objects, but **cannot write files**. | The only documented way to write from a Worker. **Spike first:** the cost of a push from a Worker for a 100-file save. |
| **Login** | **Morpheme accounts** signed in with **Google or Microsoft** (OAuth and OpenID Connect) on the platform Worker (decision 5). A site trusts a signed session from the platform, with the roles `owner` and `editor`. An owner invites an editor by email address; the editor signs in with Google or Microsoft on that address. | Roadmap 0.24 and paid-items already need "owner accounts". The open question in `platform.md` ("login uden GitHub") is answered here. No passwords and no login emails are kept by Morpheme. |
| **Compute** | **Workers for Platforms** (decision 4): every site is a user Worker (the CMS Worker plus its static assets) in one dispatch namespace, `sites`. A dispatch Worker on `*.<sites domain>` and on customers' own hostnames looks up the site by hostname and calls its Worker. $25 a month, 1,000 sites included, then $0.02 per site a month. | An ordinary account allows only a few hundred Workers, which a free plan passes quickly. User Workers run in untrusted mode, apart from each other, which suits sites that run third-party app code. |
| **Build** | **Our own pipeline from launch:** an Artifacts `push` event goes to a Queue, which starts a Workflow. The Workflow waits briefly to batch saves made close together, checks the plan's build limit, runs `morpheme ci-build` in a Container, then uploads the result to the site's user Worker through the Workers for Platforms API. This follows Cloudflare's documented "build and deploy on push" guide. | Workers Builds deploys ordinary Workers and allows only **6 concurrent builds per account** (today's build takes 3 min 41 s, about 1 min 45 s after 0.26). The own pipeline controls batching, plan limits and concurrency itself. |
| **Per-site data** | One D1 database per site, bound to its user Worker. What the site keeps in KV today (`NOT_FOUND`, `PUSH`) moves into that D1, or into one KV namespace per site while there are fewer than 1,000 sites. | Separate databases keep one site's data away from another site's app code. **Check** the D1 limit on databases per account before launch. |
| **Domains** | Default `<name>.<sites domain>` (a Worker custom domain; decision 9). Own domains through **Cloudflare for SaaS custom hostnames** on the sites domain's zone. | Customers keep their DNS where it is: they add a CNAME and the certificate is issued for them. |
| **Store** | The site gets its store key when it is created (`POST /store/connect` from the platform), so "Connect to Morpheme" is never needed. | It follows the existing `connect-to-morpheme` design. |
| **CMS updates** | The platform updates hosted sites itself: commit `package.json` to each repo in waves (canary sites first) and read build status through `build.status()`. | It replaces the hourly per-site npm poll and the GitHub check-run watch. |
| **Billing** | A **Hosting** product in Stripe (monthly, Stripe Tax, Customer Portal) on the same Stripe account and webhook as paid items. The webhook starts the provisioning Workflow. | Reusing the set-up means one Stripe integration to keep. |
| **Not paid** | 14 days as normal, then the editor is read-only and the site stays online for 30 days, then the site goes offline. Nothing is deleted for 12 months, and **Export** always works (decision 6). | It is the same rule as paid items: a pause never deletes data. |

### Provisioning (one Cloudflare Workflow, about one minute)

_Create a site_ (free) or `checkout.session.completed` (paid) → create the account and site row → fork the `starter` repo in
Artifacts → create the site's D1 → mint the store key → first build through the pipeline, uploaded as the site's user Worker in
the dispatch namespace → map `<name>.<sites domain>` to it → email "your site is live". Upgrading to paid later adds the own
domain (a Cloudflare for SaaS custom hostname) and lifts the build limit.
Every step can be retried, and a failed step leaves a row the owner can see in the platform's admin.

### Cost per hosted site (rough, to set the price)

- Artifacts: each save is about 1 push and 1 clone. With 5 saves a day that is about 300 operations a month, under the
  10,000 included operations until about 30 sites, then $0.15 per 1,000. Storage is $0.50 per GB a month after the first GB.
  This comes to a few cents per site.
- **Builds dominate the cost.** 5 builds a day at 1 min 45 s is about 260 build minutes a month per site. On Containers
  that is roughly $1 per site a month (about the same as Workers Builds at $0.005 a minute). Batching saves made close
  together into one build, the free plan's daily limit, and the 0.26 content lane matter more here than anything else.
  Most free sites build far less than 5 times a day.
- Workers for Platforms: $25 a month for the first 1,000 sites, then $0.02 per site.
- Workers requests, D1 and KV are small for brochure sites. Requests for static assets are free.
- **A paid price of €10 or more a month covers it with margin.** The price is still open (decision 10 puts reaching many sites first).

### Risks

- **Artifacts is in open beta.** Its billing began in November 2026, and the 1 GB limit per repo arrived without
  much notice. Hosted sites have no GitHub fallback (decision 2). Mitigation: **Export** (a `git clone` URL plus a zip of
  media and D1) is part of 1.0 from the start, and the backend interface keeps a move to another git host possible.
- **The own build pipeline is new work before launch:** Workflows, Containers and uploads into Workers for Platforms.
  The spike checks a full build of the demo site in a Container, and an upload with static assets into a dispatch namespace.
- **Free sites attract abuse.** The controls in decision 10 have to be ready before the free plan opens.
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
| 0 | Spikes: a build of the demo in a Container, deployed into a dispatch namespace with its static assets; an `isomorphic-git` push from a Worker; a fork of an Artifacts repo per site | before 0.24 |
| 1 | Foundation: backend interface (GitHub first, no change for sites), neutral `/api/files/*`, `build.status()` | 0.24 |
| 2 | Morpheme accounts (Google and Microsoft sign-in) and the Artifacts backend | 0.24 |
| 3 | Platform: Create a site, the free and paid plans, Stripe Hosting, the build pipeline, provisioning Workflow, domains, Export, abuse controls | 0.24 and 0.25 (Stripe is shared with paid items) |
| 4 | **1.0:** stage 1 live (decision 1) | 1.0 |
| 5 | Stage 2a hands-free: GitHub App per site through the manifest flow; Deploy button with R2 | 1.x |
| 6 | Stage 2b (`npx morpheme create` with Artifacts), "Take my site with me" | 1.x |
| 7 | Stage 3: adapters for Node, the Docker image, docs | 1.x or 2.0 |
| 8 | Scale: shared data keyed by site id, more build concurrency | when hosted sites pass a few thousand |

## Decisions still open

1. **The name of the sites domain** (decision 9). It is a new domain to buy, apart from `getmorpheme.com` and
   `morpheme.dev`.
2. **Price** of the paid plan, monthly and yearly.
3. **Stage 2 login (after 1.0):** do sites on their own account keep GitHub login only, or may they also use Morpheme accounts?

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
