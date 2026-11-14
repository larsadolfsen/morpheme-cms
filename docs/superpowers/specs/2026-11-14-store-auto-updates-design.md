# Theme and app updates without anyone signed in

Status: spec for the owner's decision (14 Nov 2026). Plan: `docs/superpowers/plans/2026-11-14-store-auto-updates-plan.md`.

## The decision and the problem

Owner, 14 Nov 2026: "We need to be able to push theme and app updates without user involvement." Asked which updates a
site should take by itself, the owner chose **all updates**.

Today a site gets a new theme or app version in two ways, and both need a person:

- **Update** on the theme's or app's page, signed in (`themeChanges` / `appChanges` in `src/store.ts`, one commit through
  the site's Worker).
- `autoUpdate` in `src/AppList.tsx`: runs only while the editor is open and signed in, only for apps (not themes), and
  skips a `breaking` version and an app whose files the site changed.

That is why Venus 1.3.1 sat unused on Sara's site: nobody could sign in. The CMS itself already updates without a person
(`worker/cms-update.js`: hourly cron, one commit, a watch on the build, an undo). This spec gives themes and apps the same
path and reuses it.

Not read: `2026-11-04-store-connection-design.md` in `morpheme-appstore` (adding that repository was refused in this
session). The store side below is built from what this repository shows of it (`worker/store.js`,
`worker/store-connection.js`: `GET /store/catalog?app=&theme=`, `GET /store/files/<oid>`, `POST/DELETE /store/connect`).
Each store claim is marked **verify** where the appstore PR must check it against the real code first.

## 1. How a site learns about a version, and how it applies it

**Recommendation: the site's Worker polls the store on a Cloudflare cron. The store does not push.**

Why polling:

- One direction only. The site's key goes from the Worker to the store. A push needs a public endpoint on every site that
  the store can call, a second secret to sign it, and the store knowing each site's address (sites run on `workers.dev`, on
  their own domain and on the customer's own Cloudflare account). All of that is new attack surface.
- A missed push is lost. A poll that fails is simply done again at the next tick, and a site that was off for a week
  catches up on its own.
- It is what the CMS update already does (`checkForUpdate`, cron `7 * * * *` in `starter/wrangler.jsonc`), so the
  scheduling, the KV state and the tests have a model.
- The cost is a delay of up to an hour. That is fine for this; a **Check now** button in the editor covers the impatient.
  A push can be added later as only a nudge ("check now") without changing anything else.

Flow, each hour (`worker/store-update.js`, called from `scheduled` in `worker/index.js`, next to `checkForUpdate`):

1. Needs `GITHUB_PUBLISH_TOKEN`, the KV binding `PUSH` and a store key (`storeKey(env)`). Without the token or the key the
   Worker does nothing and the editor keeps today's behaviour.
2. Read what the site has: the installed apps (`config.apps.installed`), each app's and theme's folder and its
   `store.json` (`recordIn`). Only things installed from the store are touched.
3. Ask the store for the catalog with `If-None-Match`. The store answers 304 when nothing changed, which is most hours.
   The request carries `?app=<APP_API>&theme=<THEME_API>` as now, so the store only offers versions this site's CMS runs.
4. For each installed item with `newer(catalog.version, record.version)`: decide (sections 2 and 5), and if it goes on,
   build the commit.
5. The commit is the same one the Update button writes. The Worker calls `themeChanges` / `appChanges` and
   `cookieChanges` with the files from the store, each file checked against its blob id (`blobId`, as `readFile` in
   `src/store.ts` does). Nothing writes `store.json` or the catalog by hand.
6. Saved with `commitFiles(env, head, …)`, which refuses when the branch moved (an editor save came first). The item is
   then tried again at the next tick. The message is the same as the Update button's (`siteT.apps.commit.update`,
   `siteT.library.themeCommits.update`), in the site's language.
7. State goes in KV (`store:update`), never in module memory (the rule *Worker: no pending I/O promise in module memory*).

**One item at a time.** One commit per theme or app, the next only after the previous build is checked. Three updates are
three commits over some minutes. The cost is a little time. The gain: a failed build names its cause, and an undo takes
back exactly one version.

**What the Worker needs from the editor's code.** `themeChanges`, `appChanges`, `newer`, `breaking`, `notesSince`,
`recordIn`, `changedFiles` and `cookieChanges` live in `src/store.ts` and `src/cookieList.ts`, next to React and i18n
imports. They move to a plain module in `lib/` (`lib/storeUpdate.mjs`), and `src/store.ts` re-exports them. The editor's
behaviour does not change and there is one implementation. A test runs both paths on the same input.

**A limit to design for.** A scheduled run has a cap on subrequests (50 on Cloudflare's Free plan; much higher on Paid). A
theme folder has many files, and each file is one request. So the Worker fetches only files whose blob id differs from the
site's (`folderChanges` already leaves the others alone), and the store gets one batch endpoint (**verify**: it may exist
already) that returns the changed files in one answer. Without it, a big theme would stop at the cap and be retried every
hour. The first PR measures this on Venus.

## 2. What "all updates" means for a version that breaks something

The owner's decision stands: **every version is taken, a major too.** Said plainly, case by case:

| Case | What happens |
| :--- | :--- |
| Patch or minor | Applied. |
| Major (`breaking`: first number higher) | **Applied**, in its own commit, with a build check and a way back. The notice says *Major* and shows the release note. It is not skipped and not held. The change from today: `breaking` no longer stops an update. It becomes a label. |
| Needs a contract the site's CMS does not run (`api` above `APP_API` / `THEME_API`) | The store does not offer it to that site (the catalog is filtered by the contract). The site stays on the working version: **never applied, never lost.** The store also lists it as `unavailable` (id, version, the contract it needs), so the update history says "Venus 1.4.0 waits for a newer CMS" instead of saying nothing. The CMS updates itself every hour, so the site catches up: first the CMS builds, and only then does the Worker run the new contract and the store offers the version. |
| The version's build fails | The Worker undoes it (section 3). The version is marked *failed on this site* and not tried again every hour; the next version is tried. |
| The site changed files in the theme's or app's folder (`changedFiles`) | An update would write over them. **Held, and said so** in the notice and the history. (The Update button asks first; nobody can ask here.) Open decision 3. |
| An app version that asks for more permission | Held until the owner decides (section 5). Open decision 1. |

**What a major can break that a build cannot see.** A build catches what stops building. It does not catch a block that
renders differently, a setting that means something else, or a list that disappeared. The checks of section 3 are a net,
not a guarantee. This is the real risk of "all updates", and the reason for decisions 1 and 2.

**The rules change.** `Appbutikken` in `morpheme-website/docs/rules.md` says a major "is not updated on its own
(`breaking` in `store.ts`)", and that a new contract is never a major because "a site with the new editor would be left on a
version that does not fit". The second sentence still holds in spirit (a contract change is still a patch or minor), but
the first is reversed by the owner's decision and must be rewritten, in the same change as the code.

## 3. Safety

**Checks before and after the commit**

- *Before:* every file is checked against its blob id; the entry must be valid (`validApp`, `validTheme`); the contract
  must be one the CMS runs; an item whose version equals the recorded one but whose files differ is **not** applied and is
  logged as `changed after release` (see immutability).
- *The build:* the commit lands on the site's branch and Cloudflare builds it. A failed Cloudflare build leaves the
  previous deployment live, so visitors never see a broken build. The branch, though, now has a bad commit, and the next
  editor save would build on top of it. That is why the Worker undoes it.
- *Watch:* each minute `watchUpdate` already reads the commit's check run (`checkOf`) and steps `watchStep`: success is
  done; failure or twenty minutes without success is an undo. The store updates reuse both, with their own KV record
  (`store:update`), so a CMS update and a store update never run at once (one slot).
- *The undo:* a commit that restores the item's folder (and `apps.json`, and the cookie list) to the parent commit's
  content. Not a rewrite of history.

**A way back to the previous version**

- Automatic: the undo above.
- By hand: **Go back to 1.3.0** on the theme's or app's page. It restores the item's folder from the git parent of the update
  commit (the history line stores that commit). This needs no call to the store and is exact. Afterwards that one version
  is skipped (decision 7), and the next version is taken as usual.

**Immutability of released versions.** The website rules already say a published version is never lowered and never reused
for other content. Make it enforced, not agreed:

- The store refuses to release an `id@version` that exists with different content (**verify**: possibly true already) and
  files are addressed by blob id.
- The release script in `morpheme-apps` refuses the same.
- The Worker refuses an entry that contradicts what the site has recorded for that version.
- The store can mark a version **withdrawn**. A withdrawn version is not offered. If a site has it, the history says so and
  the owner decides (no automatic revert: the owner may be fine with it).

**Audit line.** Two records:

- The git history is the permanent one: every update is a commit with a message that names the item and both versions,
  and a trailer line `Store update: venus 1.3.0 → 1.3.1`.
- KV `store:log` (the last 200 entries, newest first): `at`, kind (`theme` / `app`), `id`, name, `from`, `to`, `major`,
  `commit`, `result` (`applied`, `built`, `undone`, `held`, `waiting for CMS`), a short `reason`, and the release note
  text between the two versions (`notesSince`). Shown in the editor (section 4). It never holds a key or a header.

**The key.** `MORPHEME_STORE_KEY` (or the key from *Connect to Morpheme*) is read only by the Worker (`storeKey`). The cron
runs in the Worker; the editor never calls the store and gets only the log (`GET /api/store/updates`, behind the login
check). A key the store refuses (401/403) from the button is forgotten as `handleStore` does today, and the history says
*the site is no longer connected to the store*. The key is never put in a commit, the log or a notification.

## 4. What the owner sees

- **A notice** in the editor when a site's update has happened since the owner last looked: **"Venus updated to 1.3.1"**
  (`kind: 'updates'`, the existing notification type; its turn-off switch under *Account › Notifications* keeps working),
  with a link **What's new** to the item's page. A major says **"Venus updated to 2.0.0 (major)"**. A held or undone one
  says so ("Venus 2.0.0 was not installed: the site did not build"). If *On the phone* is on, the Worker also sends it
  as Web Push (`notifyAll`, type `updates`) like `tell` does for the CMS.
- **A history** on the theme's or app's page: what updated, when, from what to what, the result and *Go back*. It uses the
  existing list parts (`Group`, `ListItem`) and no new component; if the owner wants a new kind of screen, its design reads
  the real m3.material.io pages first (skill `material-3`).
- **The release note.** Each store version already carries `releaseNotes` (shown today before the Update). Now the owner
  gets it without asking, so it becomes required: the release script refuses a new version without a note for it, and a
  major's note must say what changes and what to do.
- The editor's own `autoUpdate` on open is **removed** where the Worker does the work. Two actors would double-commit. It stays
  as the fallback for a site without the token or the KV binding.

## 5. Apps that ask for more

An update can change what an app may do. The pieces are in the folder and in the store entry: `csp` / `csp.json` hosts
(`loads`, `sends`), `needs` (`pages`, `server` = `worker.js`, `build` = `build.mjs`, `changes` = hooks, `widgets`,
`places`: sandboxed or full access, `reads`), `role` and `mcp`, `cookies` and `consent`, and `adds` (blocks, lists, kinds).
`needsOf` already computes `needs`; the installed folder gives the old one.

Define **wider** as any of: a host added to `loads` or `sends`; `server`, `build`, `pages`, `widgets`, a hook or a read
added; a place going from sandboxed to full access; `plugin` becoming `connector`; a new `mcp` server or tool; a new cookie.
One function `widened(old, new)` returns the list. Roadmap 0.22 already wants "an app's permissions shown before install"; the
same function serves both, so it is written once.

**What happens (owner decision to make, not guessed):** the version is held, the site stays on the working one, and the
notice says what it asks for ("Calendly 2.1.0 wants to send form data to api.example.com") with **Review and update**.
Why this is the one place "all updates" should bend: the owner agreed to the old list at install, a new host or cookie
changes what the site tells visitors (the cookie list and consent), and a new `sends` host receives visitors' form data.
Until the owner decides (open decision 1), the Worker holds. If the answer is *apply*, it is a one-word change.

A version that asks for the **same or less** is applied. Also by default: *settings* a new version adds take the defaults the
app declares, and the site's saved values and entries stay (as an update does today). A new block, list or kind an update adds
is **off until the owner turns it on**, as for an install (**verify** in the Worker PR that `appChanges` keeps this; if it
does not, it is a bug to fix first). `csp.json` is built into the page's Content-Security-Policy, so a host cannot be taken
in "off": that is why the whole version is held, not just the permission.

## 6. Plan and roadmap

PRs per repository are in the plan. In short:

| Repository | Work |
| :--- | :--- |
| `morpheme-cms` | Move the pure update code to `lib/` (no behaviour change). The Worker: poll, apply, watch, undo, log, `/api/store/updates`. The editor: notices, history, Go back, Check now, the setting, the removal of `autoUpdate` on open. |
| `morpheme-appstore` | ETag/304 on the catalog, the `unavailable` list, a batch file endpoint, withdrawn versions, immutability. (Not read here: verify first.) |
| `morpheme-apps` | The release script: note required, immutability, prints what a version asks for more. |
| `morpheme-website` | `Appbutikken` rules rewritten (the major rule), docs only. |

**Where it sits.** Roadmap 0.22 (*Store*) is the natural home, with `widened()` shared with "permissions shown before install". The
core (Worker applies, builds are checked, undo, log, notice) is small because `cms-update.js` is the model, and it fixes a
real blocked site now. **Recommendation:** pull that core forward into 0.18 (the `0.18` branch allows `minor`), and leave in
0.22 only what needs the store's bigger changes: `widened()` with the install page, withdrawn versions, the history screen's
polish. 0.23 (*App platform*) adds nothing here, except that "apps provide to apps" and storage add new `needs` keys that
`widened()` must learn.

**A release rule to add.** A CMS version that raises `THEME_API` or `APP_API` must not reach `latest` before the store has
a version of every store theme and app written to the new contract. Otherwise a site on auto-update takes the new CMS first and
has a theme that no longer fits. The rule goes in the `release` skill; it costs one check.

## Open decisions for the owner

Each with my recommendation, in plain words.

1. **An app version that asks for more permission** (a new host, a new cookie, more access): hold it until you say yes, or
   apply it like any other? *Recommendation: hold.* It is the one thing you agreed to at install. Until you answer, it holds.
2. **A major version, any delay?** You chose "all updates". Apply a major right away, or after it has been in the store for
   24 hours so a withdrawn release is caught? *Recommendation: 24 hours for a major only.* Patches and minors go at once.
3. **A theme or app the site changed by hand:** hold the update and say so, or write over the changes? *Recommendation: hold.*
   An overwrite loses work that no one can approve. Git keeps it, but only an expert finds it.
4. **When:** the core into 0.18 now, the rest in 0.22? *Recommendation: yes*, because of Sara's site.
5. **How often:** every hour (the CMS's own rhythm) with a *Check now* button? *Recommendation: yes.* A push from the store
   adds risk for a gain of minutes.
6. **Release notes required** for every new version (the release script refuses without), and a major's note must say what
   breaks? *Recommendation: yes.* People now read it without asking.
7. **After *Go back*:** skip only that version, or stop updating that item until you switch it on? *Recommendation: skip only
   that version.* A freeze is forgotten and the site falls behind again.
8. **Sites without the GitHub token or the KV binding** keep today's update on open. *Recommendation: yes, and show a line on
   the page that says what to add to update without signing in.*
9. **The rules text:** rewrite `Appbutikken` (a major is no longer held) in the same release. *Recommendation: yes*, so the
   rules and the code never disagree.
