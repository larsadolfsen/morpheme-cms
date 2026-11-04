---
'@morphemecms/cms': minor
---

Themes and apps are installed from the Morpheme store, through the site's Worker (`/api/store/`); set the secret `MORPHEME_STORE_KEY` to connect a site. `store` in `src/site/config.ts` is gone, and a store theme may import CSS only from `@morphemecms/cms` and its own files.
