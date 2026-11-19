---
'@morphemecms/cms': patch
---

The text style `prose` is now `mo-prose` and its opt-out `not-prose` is `mo-is-not-prose`, in the theme, the editor and the demo. The update to 0.19.0 and `npx morpheme migrate` rewrite both names in a site's pages. A theme or an app that styles or writes `prose` or `not-prose` uses the new names (`docs/tailwind-migration.md`).
