# Interstellar CMS

An editor for websites built with [Astro](https://astro.build) and run on [Cloudflare](https://www.cloudflare.com): the
site's owner edits pages, posts, pictures and settings in the browser at `/editor/`, and every save is one commit on
GitHub. MIT licensed, see [LICENSE](LICENSE).

`@interstellarcms/cms` is the editor, the site's pages and its Astro setup (`siteConfig()` in `astro.mjs`), the
standard theme *Saturn* (`theme/`), the site's Worker (`worker/`) and the `interstellar` command (`bin/`). A site
gives it its settings (`src/site/`), its content (`src/content/`, `src/data/`), its themes (`src/themes/`) and its
apps (`src/apps/`).

Releases are published to npm from GitHub Actions (`.github/workflows/publish.yml`, with npm's trusted publishing)
when a release is made on GitHub with the tag `v<version>`.

The rest of this file is in Danish, the language the CMS is made in.

## Editoren

Editoren til et site bygget med Astro, på `/editor/`, uden noget bestemt site skrevet ind. Et site giver den sine samlinger og felter, sine regler og sine egne blokke; kunden retter indholdet, og hvert gem er ét commit på GitHub.

Hele vejledningen står i `docs/editor.md` i sitets repo. Her er kun det, et site skal have for at bruge pakken.

## Indhold

- `src/`: skærmene, felterne, gem, blokkenes ramme (`blocks.ts`) og registret (`registry.tsx`), reglerne (`check.ts`, `checkSite.ts`) og standardblokkenes kontrakt (`standard/<type>/`: felter, regler, faste tekster, lister og det, de viser: `view.ts` og `load.ts`; deres udseende og CSS er temaets, se nedenfor), og `standard/view.tsx`, `BlockSite.astro` og `sites.ts`, der tegner alle blokke på sitet med deres `View.tsx`.
- `lib/`: det, både editoren og sitet bruger: blokkenes format i teksten (`blocks.mjs`), beskæringen af billeder (`crop.mjs`), en kort tekst med fed og links (`inline.ts`), beskedens *Vis indtil* (`notice.mjs`), en sides og et indlægs status og de planlagte (`status.mjs`, `scheduled.mjs`) og videoerne fra YouTube og Vimeo (`video.mjs`, `video-id.mjs`).
- `site/`: det, sitets sider og temaerne læser sitet med (indholdet, dataenes læsere, billederne, de strukturerede data, temaerne og ikonpakkerne), med sitet som `@site/…` og dets data som `@data/…`.
- `worker/`: sitets Worker, den samme for alle sites (`index.js` er dens `main`): login, det, editoren spørger GitHub om, kopien i R2, samtykkerne, adresserne, der ikke findes, de planlagte, notifikationerne og appenes del.

## Det, sitet skal have

- **`src/site/`**, som pakken tager som `@site`, og kun derfra:
  - `@site/editor`: `collections`, `groups`, `lists`, `icons`, `siteName`, `companyParts`, `blockParts`, `relationsOf`, `usedBy`, `usesOf`, `countsOf`, `whatIsAt`, `testimonialsOf`, `siteOf`, `fixedPages`, `everyFixedPage`, `Texts`, `sectionLooks`, `headingLooks` og `config`, og typerne `Props` og `SiteData`.
  - `@site/config`: sitets navn, domæne, GitHub-repo og mapper.
  - `@site/worker` (til Workeren): `apps`, `contact`, `moved`, `standard`, `oldAddresses` (sitets videresendelser fra gamle adresser, `{ ids, paths }`) og appenes del af Workeren (`appWorkers`, `appTexts`).
- **Aliaset `@site`** for `src/site/`: i Vite (`resolve.alias` i `aliases()` (`site/theme.mjs`, brugt af `astro.mjs`), og i `packages/editor/scripts/check-content.mjs`, der indlæser reglerne med Vite) og i TypeScript (`paths` i `tsconfig.json`); til Workeren `@site/config` og `@site/worker` i `alias` i `wrangler.jsonc`, med `main` sat til pakkens `worker/index.js`.
- **Sitets egne blokke** i appenes `blocks/<type>/` (`src/apps/<app>/blocks/<type>/`), hver med `index.tsx` (`defineBlock` fra `@interstellarcms/cms/src/blocks`), `view.ts` og `load.ts` (det, blokken viser, i editoren og på sitet) og `View.tsx` (tegningen, begge steder). Pakken finder dem selv.
- **Et standardtema**, som alle sitets temaer bygger på, med standardblokkenes udseende (`blocks/<type>/View.tsx`, én tegning til sitet og editoren), som pakken får gennem `@site/sites` og `@site/blocks` (dette site: `packages/editor/theme/`, `src/site/sites.ts` og `src/site/blocks.ts`).
- **Siderne** er pakkens (`pages/`, sat ind af `siteConfig()` i `astro.mjs`): sitets sider, bloggen, 404, `/ny/` og editoren (siden, der viser `src/App.tsx`, manifestet, `version.json` og billederne, sitets egen kode bruger). Sitets `astro.config.mjs` er kun `export default await siteConfig()`, og `src/content.config.ts` henter samlingerne fra `site/content.config`.
- **Standardblokkenes stil:** `blocks.css` i standardtemaet (dette site: `packages/editor/theme/styles/blocks.css`), importeret i hvert temas CSS, og variablerne `--block-*` sat til temaets farver og former.
- **Kommandoen `interstellar`** (`bin/interstellar.mjs`, pakkens `scripts/`), kørt fra sitets rod i dets `package.json`: `images` (billedernes mindre størrelser og videoernes stillbilleder, før `dev` og `build`), `after-build` (det, Workeren og editoren læser i `dist/`), `check:content` (indholdet efter editorens regler), `check:editor` (siderne kommer tilbage uændret), `check:worker`, `check:screens`, `check:themes`, `compare-html`, `app-workers`, `app-screenshots`, `theme-screenshots` og `editor-icons`.
- **Layoutene til sider og blogindlæg** markerer med `data-editor`, hvad *Forhåndsvis* sætter ind (`src/pagePreview.tsx`): `heading`, `image`, `text` og evt. `end` med `data-editor-block` (en blok, der slutter teksten, står dér).
- **Afhængighederne** i `peerDependencies`: Astro, React, Milkdown, Phosphor, yaml og det, der laver Markdown i *Forhåndsvis* (unified, remark og rehype), og det, kommandoerne bruger (Vite, esbuild, sharp, Wrangler, og til tjekkene i en browser Playwright og jsdom).
