# Morpheme's demo

A made-up site about Morpheme itself, in American English (`locale: 'en-US'`), which the themes' images are taken of
(`scripts/theme-screenshots.mjs`), so a theme is never shown with a real site's content. It is the starter (`starter/`)
with this folder laid on top (`scripts/demo-site.mjs`), so only what is different is here: pages and blog posts
(`src/content/`, the starter's own pages do not come along), the data files the demo changes (`src/data/`), `src/site/config.ts`
and `colors.ts`, and the logo, the icons and the images (`public/`). The contact details are made up, and the testimonials on
*Blocks* are marked as examples.

`npx morpheme check:demo` builds the demo with the default theme and checks it. See *Themes › The demo* in `docs/editor.md`.

## Images

The images `editor-*.webp` in `public/images/uploads/2026/10/` are screenshots of the editor with the demo's own content, put
on a background in the demo's colors. The photographs are from [Unsplash](https://unsplash.com) under the
[Unsplash license](https://unsplash.com/license), made smaller and saved as WebP:

| File | The image at Unsplash |
| --- | --- |
| `saturn.webp` | https://images.unsplash.com/photo-1614732414444-096e5f1122d5 |
| `earth-from-space.webp` | https://images.unsplash.com/photo-1446776811953-b23d57bd21aa |
| `moon.webp` | https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45 |
| `andromeda.webp` | https://images.unsplash.com/photo-1543722530-d2c3201371e7 |
| `quiraing.webp` | Edition 0.10 (Quiraing), photo by Johnny Briggs: https://unsplash.com/photos/a-scenic-view-of-a-mountain-range-with-a-winding-road-in-the-foreground-_tw49ov0oyc |
| `matterhorn.webp` | Edition 0.12 (Matterhorn), photo by Gabriel Garcia Marengo: https://unsplash.com/photos/snow-capped-mountain-with-sea-of-clouds-qJvpykJ5SKs |
| `lake-louise.webp` | Edition 0.13 (Lake Louise), photo by Roberto Nickson: https://unsplash.com/photos/calm-mountain-lake-reflecting-snowy-peaks-vZ1JAXUO3-0 |
| `braies.webp` | Edition 0.14 (Braies), photo by Pietro De Grandi: https://images.unsplash.com/photo-1501785888041-af3ef285b470 |
| `passo-giau.webp` | Edition 0.15 (Passo Giau), photo by Sarmat Batagov: https://unsplash.com/photos/rocky-mountain-peak-in-golden-light--v3uBhw5J78 |
| `seljalandsfoss.webp` | Edition 0.18 (Iceland), photo by Robert Lukeman: https://unsplash.com/photos/waterfalls-at-daytime-zNN6ubHmruI |
| `maya-bakery.webp` | https://unsplash.com/photos/woman-in-white-crew-neck-shirt-smiling-IF9TK5Uy-KI, photo by Jake Nackos |

The logo (`public/logo.svg`, and `public/favicon.svg` with the icons, which `npx morpheme editor-icons` wrote) is drawn for
the demo. The colors are Material 3's scheme of a blue, `#006397` (*tonal spot*).
