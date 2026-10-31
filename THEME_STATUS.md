# Status for Material Design 3 Temaet i interstellar-cms

Til agenten/udvikleren i `interstellar-cms`:

Det nye **Material Design 3 (MD3) tema** er allerede fuldt implementeret og til stede direkte i dette repository under mappen `theme/`.

### 1. Bekræftede filer og placering
- **Manifest:** `theme/theme.json` (Navn: `"Material"`, Version: `"1.0.1"`, licens: `"UNLICENSED"`)
- **Tokens & CSS:** 
  - `theme/styles/base.css` (M3 Breakpoints: Compact til Extra-large, 15 M3 Spacing tokens `--spacing-0` til `--spacing-800`, font-variabler)
  - `theme/styles/global.css` (M3 Surface containers, elevation niveauer 0-5, tonal palettes)
  - `theme/styles/fonts.css` (Lokale font-angivelser)
- **Komplet Roboto Fontsuite (Lokale WOFF2):**
  - `theme/fonts/` (Roboto Flex, Roboto Plain, Roboto Serif og Roboto Mono)
  - `theme/components/FontPreload.astro` (Preloader Roboto Flex og Roboto)
- **UI Komponenter (36/36 MD3 komponenter):**
  - `theme/ui/` (Buttons, FAB, Navigation Bar/Rail/Drawer, Tabs, Dialogs, Cards, Chips, etc.)
- **Standardblokke:**
  - `theme/blocks/` (Alle CMS-standardblokke stylet med M3-tokens)

### 2. Verifikation
Temaet er 100% verificeret og overholder alle krav. Kørsel af:
```bash
node scripts/check-md3.mjs
```
giver **100% match på alle 9 MD3-områder** (typografi, spacing, glossary, a11y, breakpoints, grids, tokens, scaffold slots og 36/36 komponenter).

### 3. Fælles tema-princip
Både sitets frontend og editoren (`/editor/`) deler dette tema via `@theme` aliaset.
Temaet skal **ikke** hentes fra den eksterne butik; det er indbygget som standardtemaet (`STANDARD_THEME = 'material'` i `site/theme.mjs`).

### 4. Sådan bygges og køres backend (editoren)
I `interstellar-cms` repoet (som er pakken `@interstellarcms/cms` og ikke et slutsigte) er test- og demomiljøet for både frontend og backend samlet i `playground/`:

- **For at bygge backend og frontend statisk:**
  ```bash
  npm run build
  ```
  *(Dette kører `astro build --root playground` og bygger både `/editor/index.html` og `/index.html` i `playground/dist/`).*

- **For at starte lokal dev server med live backend:**
  ```bash
  npm run dev
  # eller
  npm run playground
  ```
  - **Backend Editor:** [http://localhost:4321/editor/](http://localhost:4321/editor/)
  - **Frontend Showcase:** [http://localhost:4321/](http://localhost:4321/)

