# Interstellars demo

Et opdigtet site om Interstellar selv, på amerikansk engelsk (`locale: 'en-US'`), som temaernes billeder tages af
(`scripts/theme-screenshots.mjs`), så et tema aldrig vises med et rigtigt sites indhold. Det er starteren (`starter/`)
med denne mappe lagt ovenpå (`scripts/demo-site.mjs`), så her står kun det, der er anderledes: sider og blogindlæg
(`src/content/`, starterens egne sider kommer ikke med), de datafiler, demoen ændrer (`src/data/`), `src/site/config.ts`
og `colors.ts`, og logoet, ikonerne og billederne (`public/`). Kontaktoplysningerne er opdigtede, og udtalelserne på
*Blocks* er mærket som eksempler.

`npx interstellar check:demo` bygger demoen med standardtemaet og tjekker den. Se *Temaer › Demoen* i `docs/editor.md`.

## Billeder

Billederne `editor-*.webp` i `public/images/uploads/2026/10/` er skærmbilleder af editoren med demoens eget indhold, sat
på en baggrund i demoens farver. Fotografierne er fra [Unsplash](https://unsplash.com) under
[Unsplash-licensen](https://unsplash.com/license), gjort mindre og gemt som WebP:

| Fil | Billedet hos Unsplash |
| --- | --- |
| `saturn.webp` | https://images.unsplash.com/photo-1614732414444-096e5f1122d5 |
| `earth-from-space.webp` | https://images.unsplash.com/photo-1446776811953-b23d57bd21aa |
| `moon.webp` | https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45 |
| `andromeda.webp` | https://images.unsplash.com/photo-1543722530-d2c3201371e7 |

Logoet (`public/logo.svg`, og `public/favicon.svg` med ikonerne, `npx interstellar editor-icons` skrev dem) er tegnet til
demoen. Farverne er Material 3's skema af en rolig blå, `#425E92` (*tonal spot*).
