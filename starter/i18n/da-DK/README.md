# Et site med Morpheme CMS

Hjemmesiden er bygget med [Astro](https://astro.build), kører på [Cloudflare](https://www.cloudflare.com) og rettes i
editoren på `/editor/`: sider, indlæg, billeder og indstillinger. Hvert gem er ét commit i dette repo, og Cloudflare
bygger og udgiver sitet af sig selv bagefter.

Editoren, standardtemaet *Material* og sitets Worker er pakken [`@morphemecms/cms`](https://www.npmjs.com/package/@morphemecms/cms)
(MIT). Det, der er sitets eget, står her:

- `src/site/config.ts`: sitets navn, domæne, sprog og GitHub-repo; resten er pakkens standard (`defineSite`).
- `src/site/worker.js`: det, Workeren har fra sitet.
- Hemmeligheden `GITHUB_PUBLISH_TOKEN` (`npx wrangler secret put GITHUB_PUBLISH_TOKEN`) lader Workeren skrive til sitets GitHub-repo, også når den opdaterer CMS'et. Tokenet skal have **Contents: Read and write** og **Checks: Read**.
- Hemmeligheden `MORPHEME_STORE_KEY` (`npx wrangler secret put MORPHEME_STORE_KEY`) forbinder sitet til Morpheme-butikken; uden den har *Appstore* kun sitets egne apps og temaer.
- Hemmeligheden `MCP_VAULT_KEY` (`npx wrangler secret put MCP_VAULT_KEY`, en lang tilfældig tekst) slår *Assistenter* til under *Indstillinger*: en assistent som Claude kan så forbinde til sitets adresse `/mcp` og læse sitet. Workeren gemmer den forbindende persons GitHub-token, forseglet med denne hemmelighed, i samme D1-database som samtykkelogget.
- `src/content/`: siderne og indlæggene, `src/data/`: sitets indstillinger, `public/`: billeder, logo og ikoner.
- `src/themes/` og `src/apps/`: temaer og apps fra appbutikken, når der er installeret nogen.

## Udvikling

```bash
npm install
```

```bash
npm run dev
```

`npm run check` kører tjekkene (formatering, typer, indholdet efter editorens regler, editoren og Workeren), før hver
push. Cloudflare bygger med `npx morpheme ci-build`: alle tjekkene, eller kun editorens egne, når kun indhold er ændret
siden det live site; og `npm run build` bygger sitet i `dist/`.
