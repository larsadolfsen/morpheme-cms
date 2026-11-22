# Close 0.18.x and move Sara's site (plan)

Status: owner asked for this plan, 19 November 2026; the line is closed (no 0.18.2: the text-bar fix #1040 rides out with 0.19.0).

State at 19 Nov 2026: `latest` is 0.18.1. `main` has #1019, #1035 (version set at feature start) and #1040 (text-bar fix). `feature/tailwind` (0.19.0, #1033) holds everything on `0.18` and waits for the gate and the owner. Several new versions will be released before Wednesday 25 Nov; the owner cannot sign in to Sara's Cloudflare until then.

## 1. Apps to the store (owner, any time)
1. The owner tells the local session "Release Venus theme and apps to store": "pin fixed, release".
2. The owner runs `npm run release -- venus calendly content-colors google-ads google-analytics gtm mailchimp mobilepay`. Never cookiescanner.
3. After it: reinstall Calendly on staging.

## 2. Sara's site (PR #21, held)
Risk: her skip key `cms:skip:0.18.1` holds only 0.18.1. Her Worker (0.16.0) reads skip keys by exact version, so any newer minor or patch released before Wednesday reaches her within about an hour.
- Sara's session reports what an early update does to her site and what PR #21 must target if she has moved on.
- The owner chooses before each release: (a) add `cms:skip:<version>` in her Cloudflare (needs his sign-in and explicit yes), or (b) accept the update.
- On Wednesday, after the apps release: PR #21 moves her to the then-current version and the released Venus. Run check:themes, check:screens and compare-html. The owner looks at her Preview and says yes; the PM merges.
- Last step (owner): remove her skip keys.

## 3. 0.18.2: none
No separate 0.18.2. The text-bar fix (#1040) rides out with 0.19.0; Release PR #1043 was closed unmerged (the bot may reopen it on a later push to `main`; leave it unmerged). The `check:worker` race (R2 tree written twice, harmless; about 10 lines in `files.js`, a per-request write-once) goes into 0.19.x.

## 4. Every release before Wednesday (rules unchanged)
Only the owner releases. The exact build must have run on staging first. The PM never merges a Release PR without the owner's explicit yes, never approves or publishes on npm, never tags by hand.

## 5. Clean-up (owner, after the line is closed)
- Delete the `0.18` branch (everything on it is in `feature/tailwind`).
- Set the demo's production branch (it shows the development branch).
- Revert #980 and delete `feature/demo-editor`; delete the merged `feature/cards-lists`; empty `feature/store-auto-updates`.
- Open items: 17 CodeQL alerts, `MORPHEME_LIVE_URL`, repo secret `STAGING_DEPLOY_HOOK` (PR #990).
- ~~Never delete `pr-screenshots/*` branches.~~ Replaced (owner, 21 Nov 2026): the old branches are deleted, and screenshots go into
  the one branch `screenshots` (skill `developer`).
