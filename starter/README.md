# Et site med Interstellar CMS

Hjemmesiden er bygget med [Astro](https://astro.build), kører på [Cloudflare](https://www.cloudflare.com) og rettes i
editoren på `/editor/`: sider, indlæg, billeder og indstillinger. Hvert gem er ét commit i dette repo, og Cloudflare
bygger og udgiver sitet af sig selv bagefter.

Editoren, standardtemaet *Material* og sitets Worker er pakken [`@interstellarcms/cms`](https://www.npmjs.com/package/@interstellarcms/cms)
(MIT). Det, der er sitets eget, står her:

- `src/site/config.ts`: sitets navn, domæne, sprog og GitHub-repo; resten er pakkens standard (`defineSite`).
- `src/site/worker.js`: det, Workeren har fra sitet.
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
push og før hver bygning på Cloudflare, og `npm run build` bygger sitet i `dist/`.
