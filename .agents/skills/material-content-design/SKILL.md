---
name: material-content-design
description: >-
  Google Material Design 3 (M3) Content Design and Global Writing guidelines
  (https://m3.material.io/foundations/content-design/global-writing/word-choice).
  Ensures clear, concise, localized, English-first UX writing and vocabulary across CMS UI, documentation, and agent responses.
---

# Material Design 3 (M3) Content Design: Global Writing & Word Choice

Denne skill implementerer de officielle standarder for **Material Design 3 (M3) Content Design & Global Writing** (jf. `https://m3.material.io/foundations/content-design/global-writing/word-choice`).

## Grundprincipper (English First & Global Localization)

1. **English First som kildesprog:**
   - Engelsk (`en-US`) skrives altid først som det primære referencesprog i UI-komponenter, dataskemaer, tekster og dokumentation.
   - Alle andre sprog (f.eks. dansk `da-DK`) oversætter direkte fra den engelske grundform.

2. **Korte og enkle sætninger (Short, Simple Sentences):**
   - Del lange sætninger op i korte, præcise instruktioner.
   - Brug aktiv form (Active Voice).
   - Husk at oversatte sprog ofte fylder op til 1.5× mere end engelsk; hold tekster kompakte.

3. **Præcist ordvalg (Word Choice):**
   - **Brug universelle begreber:** Undgå lokale metaforer, slang eller jargon.
   - **Undgå forkortelser:** Skriv ord helt ud (fx "Postcode and city", ikke "P.C.").
   - **Tydelige stedord:** Undgå tvetydige pronominer som "it", "this" eller "that" uden direkte reference til elementet.
   - **Funktionel konsistens:** Brug veldefinerede M3-termer (fx `Enabled` frem for `Activated` ved funktions-toggles; `Draft`, `Published`, `Scheduled` ved statusser).

4. **Klarhed og tone i UI:**
   - **Direkte og hjælpsom:** Sig hvad brugeren skal gøre, eller hvad handlingen bevirker.
   - **Ingen overflødige høflighedsfraser:** Undgå indlejret "venligst / please" i standardfelter og knapper; handlingen skal være selvforklarende.
   - **Validering & fejlmeddelelser:** Formuler altid fejl som en løsning (fx "Enter a valid email address", ikke "Email is invalid").

---

## Tjekliste for Tekster og Felter i interstellar-cms

Hver gang nye felter, blokke, hints eller beskeder tilføjes i `defaults/`, `src/` eller `@site/texts`:
- [ ] Engelsk tekst (`en-US`) er defineret og skrevet først.
- [ ] Knaptekster og handlinger starter med et aktivt verbum (fx `Add tag`, `Edit page`, `Save`).
- [ ] Toggles og switches bruger standardiserede tilstande (`Enabled` / `Disabled`, `On` / `Off`).
- [ ] Hints forklarer brugerfordelen kort og entydigt uden tvetydigheder.
- [ ] Danske tekster (`da-DK`) er 100% afstemt med de engelske M3-termer.
