# Saved for the next version

A plain list the owner and the PM keep of work that is saved for the next version (not 0.17). One entry per item: what, why, where to look.

## 1. Regular sites update the CMS once a day, at night

- **Decision:** Owner, 14 Nov 2026: "write it in a todo file and save for next edition".
- **What happens today:** The site's Worker checks npm for a new `@morphemecms/cms` every hour. `checkForUpdate` in `worker/cms-update.js` runs on the hourly cron `7 * * * *` (`starter/wrangler.jsonc`, called from `scheduled` in `worker/index.js`). It reads the site's `package.json` and lock file, asks npm for the `latest` tag, and when a newer version may be taken it commits the new version and then watches the build.
- **What it would change to:** One check a day, in a quiet night hour in the site's own time zone (for example about 03:00), instead of every hour.
- **Why:** Regular sites do not need a new version within the hour, and a night update disturbs nobody.
- **No setting:** The owner decided that the CMS version app needs no setting for how often. The default for regular sites is once a day at night.
- **Staging stays as it is:** Staging follows npm's `next` tag and rebuilds when a new `next` is approved (see the fix in PR #605, `.github/workflows/staging-follows-next.yml`). It does not use the daily check.
- **Where to look:** `worker/cms-update.js` (`checkForUpdate`), `worker/index.js` (`scheduled`), `starter/wrangler.jsonc` (`triggers.crons`), and the site's time zone in its config (`@site/config`).

## 2. The CMS version app has Danish texts on an English screen

- **Decision:** Owner, 14 Nov 2026: "write it in a todo file and save for next edition".
- **What is wrong:** The CMS version app (the app on a site's Apps screen that chooses whether staging builds with the published or the next version of Morpheme CMS) shows only Danish texts on an English screen:
  - its description: "Vælger, om staging bygges med den udgivne eller den næste version af Morpheme CMS."
  - the select with the choices (shows "Næste")
  - the hint: "Gælder fra næste build, et par minutter efter du har gemt."
- **Rule:** English first. `en-US` is the source language and Danish (`da-DK`) is the translation.
- **The fix:** Write the app's texts in English, and keep the Danish as the `da-DK` translation.
- **Where to look:** Not in this repository (a search for the Danish texts finds nothing here). The app belongs to the staging site, repository `larsadolfsen/morpheme-staging`, probably `src/apps/cms-version/`. Check how other apps keep their `en-US` and `da-DK` texts and follow that. The PM or the session that takes this must confirm the exact files in `morpheme-staging`.
