# Saved for the next version

A plain list the owner and the PM keep of work that is saved for the next version (not 0.17). One entry per item: what, why, where to look.

## 1. The CMS version app has Danish texts on an English screen

- **Decision:** Owner, 14 Nov 2026: "write it in a todo file and save for next edition".
- **What is wrong:** The CMS version app (the app on a site's Apps screen that chooses whether staging builds with the published or the next version of Morpheme CMS) shows only Danish texts on an English screen:
  - its description: "Vælger, om staging bygges med den udgivne eller den næste version af Morpheme CMS."
  - the select with the choices (shows "Næste")
  - the hint: "Gælder fra næste build, et par minutter efter du har gemt."
- **Rule:** English first. `en-US` is the source language and Danish (`da-DK`) is the translation.
- **The fix:** Write the app's texts in English, and keep the Danish as the `da-DK` translation.
- **Where to look:** Not in this repository (a search for the Danish texts finds nothing here). The app belongs to the staging site, repository `larsadolfsen/morpheme-staging`, probably `src/apps/cms-version/`. Check how other apps keep their `en-US` and `da-DK` texts and follow that. The PM or the session that takes this must confirm the exact files in `morpheme-staging`.
