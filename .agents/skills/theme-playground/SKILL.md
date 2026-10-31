---
name: theme-playground
description: >-
  Vejledning og automatisk runbook til at verificere, bygge, køre og teste
  den lokale demo af både frontend (MD3 Material showcase) og backend (CMS-editoren App.tsx med alle 55 ruter) i interstellar-cms.
---

# Material Design 3 Theme Playground & Editor Setup

Denne skill instruerer AI-agenter i, hvordan man **automatisk verificerer, bygger, starter og rute-tester** den lokale demo af både **frontend** (Google Material Design 3 / *Material*) og **backend** (den rigtige CMS-editor `src/App.tsx`) i `interstellar-cms`.

## Roller og Samarbejdsmodel
Følg altid rollerne defineret i `AGENTS.md`:
- **Senior Architect (AI / Antigravity)**: Systemoverblik, snitflader, arkitektur, kvalitetstjek og opgavespecifikation.
- **Developer (Ollama lokalt via `qwen2.5-coder:14b`)**: Udfører tung kodegenerering, boilerplate og komponentudkast.

---

## ⚡ Automatisk Afvikling for Agenter

### 1. Start Demoen (`npm run demo`)
Når denne skill aktiveres eller brugeren beder om at køre demoen, **skal agenten afvikle run-scriptet**:

```bash
npm run demo
# eller: node .agents/skills/theme-playground/scripts/run-demo.mjs
```

> [!IMPORTANT]
> **Vigtigt for AI-agenter (`run_command`):**
> Da Astro dev-serveren er en vedvarende proces, skal kommandoen altid startes med `IsDaemon: true` og `WaitMsBeforeAsync: 8000` (medmindre port 4321 allerede er aktiv).
> Hvis `IsDaemon` udelades, afslutter proces-runneren subshell-sessionen, hvilket medfører at Astro lukkes ned af Windows Job Object (`ERR_CONNECTION_REFUSED`).

Scriptet udfører automatisk:
1. **MD3 Compliance-tjek**: Kører `npm run check:md3` og sikrer 100% overholdelse af M3-standarder (tokens, typografi, scaffold, komponenter).
2. **Server-kontrol**: Undersøger om Astro Playground allerede kører på port `4321`. Hvis den allerede kører, verificeres den og scriptet afslutter hurtigt. Hvis den ikke kører, startes den i forgrunden, så `IsDaemon`-runneren holder den aktiv.
3. **HTTP-validering**: Bekræfter at både frontend (`/`) og backend (`/editor/`) svarer med `HTTP 200 OK`.
4. **URL-præsentation**: Viser de to links direkte til brugeren.

### 2. Automatisk Test af Alle Editor-Sider (`npm run test:editor`)
Når demo-serveren kører på port 4321, kan samtlige **55 ruter og underskærme** i editoren verificeres med Playwright:

```bash
npm run test:editor
# eller: node .agents/skills/theme-playground/scripts/check-editor-pages.mjs
```

Dette script:
- Tester automatisk alle hash-ruter i CMS-editoren (Start, Konto, Indstillinger, Udseende, Blokke, Filer, Lister, JSON-enkeltfiler, Opret nyt, Markdown-editor mv.).
- Detekterer eventuelle React unhandled exceptions (`pageerror`), hydration-mismatches, 500-fejl eller blanke sider (`bodyTextLength === 0`).
- Giver en samlet statusrapport (100% PASS).

---

## 1. Demoens Arkitektur (`playground/`)

Test- og udviklingsmiljøet er isoleret i `playground/` for at sikre, at CMS-kernen og temaet altid testes uafhængigt af produktionssites:

```text
playground/
├── astro.config.mjs         # Konfiguration med @tailwindcss/vite, @astrojs/react, client:interact og localEditorMiddleware
├── src/
│   ├── pages/
│   │   ├── index.astro      # Frontend Demo: MD3 Material showcase og layout
│   │   └── editor/
│   │       └── index.astro  # Backend Demo: Den rigtige CMS-editor (src/App.tsx)
│   ├── site/                # Lokale @site/* moduler (config, colors, collections, consent, editor, sitedata mv.)
│   └── data/                # Lokale @data/* JSON-filer (theme, colors, blocks, standard-pages mv.)
```

### Vite Aliases i `playground/astro.config.mjs`
- `@theme` $\rightarrow$ `theme/` (Google Material Design 3 tokens, UI-komponenter og blocks)
- `@site` $\rightarrow$ `playground/src/site/` (sitets kontrakt)
- `@data` $\rightarrow$ `playground/src/data/` (sitets indholds- og indstillingsdata)
- `@interstellarcms/cms` $\rightarrow$ repo-roden (`.`)

---

## 2. Arkitektur for Mock Middleware i `playground/astro.config.mjs`

Da editoren afvikles isoleret i playground uden en aktiv Cloudflare Worker eller GitHub OAuth server, håndterer `localEditorMiddleware()` i `playground/astro.config.mjs` alle nødvendige backend-kald:

| Endpoint | Formål | Mock Svar |
| :--- | :--- | :--- |
| `/api/github/graphql` | Henter filer og mock-bruger via GraphQL | `{ data: { viewer: { login: 'local-admin', ... }, repository } }` |
| `/api/github/files`, `/texts`, `/commit` | Lokalt fil-system mock | Læser og skriver direkte i `playground/` |
| `/editor/version.json` | Tjekker om editoren er opdateret | `{ version: 'dev' }` |
| `/editor/sw.js` | ServiceWorker til offline/notifikationer | No-op service worker (`self.skipWaiting()`) |
| `/api/consent` | Viser samtykker under `#privatliv/samtykker` | `{ consents: [] }` |
| `/api/not-found` | Viser 404-fejl under `#seo/videresendelser` | `{ missing: [] }` |
| `/editor/licenses.json` | Viser licenser for temaer og pakker | `{ works: [], owners: [] }` |
| `/api/r2` | Håndterer R2 backup kontrol | `{ bound: false, bucket: 'ready' }` |

---

## 3. Sitets Kontrakt (`@site/editor` & `@site/config`)

Når nye felter, skærme eller lister tilføjes, skal følgende regler altid overholdes for at undgå hvide skærme eller React-nedbrud:

1. **Paritet mellem `settings` og skærme:**
   - Hvert id i `settings: string[]` i `editor.ts` skal have en matchende `PartScreen` i `partScreens` (f.eks. `privacy` for `privatliv`), eller være et reserveret top-level id (`udseende`, `apps`, `seo` osv.).
   - Mangler en definition, vil `partOf()` slå op i `collections`, og hvis den ikke findes der, returneres et fallback-objekt i stedet for at kaste en ubehandlet `TypeError`.
2. **`Part.fields` er påkrævet for formularer:**
   - Enhver `Part` under `appearance` (f.eks. `standardsider`) eller `companyParts` skal have defineret et `fields`-array (fx via `standardPageFieldsOf(...)`).
3. **Lister og standardblokke (`config.lists`):**
   - Standardblokkene *Cookies* og *Udtalelser* slår deres id op via `config.lists`.
   - `config.lists` skal altid definere `cookies: 'cookies'` og `testimonials: 'udtalelser'`, samt have `cookieList: 'src/data/cookie-list'`.
4. **HTML5 Nesting i React komponenter:**
   - Komponenter må aldrig indlejre `<div>`, `<p>` eller `<ol>` inde i en `<p>` tag (fx i `<Notice>`), da dette udløser React hydration-fejl og advarsler.

---

## 4. Test- og Verifikationskommandoer

| Kommando | Beskrivelse |
| :--- | :--- |
| `npm run check:md3` | Kører den fulde Material Design 3 validering (tokens, typografi, spacing, scaffold slots og 36/36 komponenter). |
| `npm run demo` | Starter lokal Astro server i playground på port `4321` med MD3 validering og links til frontend og editor. |
| `npm run test:editor` | Tester automatisk samtlige 55 ruter i CMS-editoren med Playwright og rapporterer pass/fail. |
| `npx astro build --root playground` | Verificerer at det statiske Astro build kompilerer uden fejl. |
