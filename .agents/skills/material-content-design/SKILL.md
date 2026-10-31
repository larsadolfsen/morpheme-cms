---
name: material-content-design
description: >-
  Google Material Design 3 (M3) Content Design and Global Writing guidelines
  (https://m3.material.io/foundations/content-design/global-writing/word-choice).
  Ensures clear, concise, localized, English-first UX writing and vocabulary across CMS UI, documentation, and agent responses.
---

# Material Design 3 (M3) Content Design: Global Writing & Word Choice

Denne skill implementerer de officielle retningslinjer for **Material Design 3 (M3) Content Design & Global Writing** (jf. [M3 Global Writing Word Choice](https://m3.material.io/foundations/content-design/global-writing/word-choice)).

## 1. Hovedregel: English First

1. **Engelsk (`en-US`) er altid kildesprog og skrives først:**
   - Alle nye skemaer, felter, hints, blok-beskrivelser, UI-tekster, fejlmeddelelser og kode-kommentarer specificeres og skrives på engelsk (`en-US`) først.
   - Alle andre sprog (f.eks. dansk `da-DK`) fungerer som lokaliserende oversættelser (`translations`) af den engelske referenceform.
   - I agentsvar og teknisk dokumentation skrives der altid på engelsk først, efterfulgt af et dansk resumé, når der kommunikeres med brugeren på dansk.

2. **Fuld dækning i `defaults/texts.ts`:**
   - Ingen standard-strenge må mangle i `defaults/texts.ts`. Pakkens standardordbog danner altid det universelle fundament, som `@site/texts` eller apps kan bygge ovenpå.

---

## 2. Retningslinjer for Ordvalg (M3 Word Choice)

Overhold følgende seks kernekrav fra M3 ved formulering af UI-tekster:

### A. Brug universelle eksempler og forklar lokale referencer
- Brug eksempler og formater, der fungerer globalt.
- Hvis et lokalt format eller begreb er nødvendigt (f.eks. CVR-nummer, MobilePay), skal der altid medfølge en klar beskrivelse, så brugere og oversættere forstår konteksten.

### B. Korte og enkle sætninger (Short, Simple Sentences)
- Hold sætninger korte og præcise med aktiv form (Active Voice).
- Undgå komplekse indskudte sætninger.
- Vær opmærksom på tekstekspansion: Mange sprog fylder op til 1.5× mere end engelsk, når de oversættes.

### C. Undgå forkortelser (Avoid Abbreviations)
- Skriv ord helt ud. Forkortelser oversættes sjældent godt og mangler ofte kontekst for skærmlæsere.
- *Eksempel:* Skriv "Postcode and city" frem for "P.C.", og "Telephone number" eller "Phone number" frem for "Tel.".

### D. Tydeliggør stedord (Clarify Pronouns & Demonstratives)
- Undgå løse pronominer som "it", "this" eller "that" uden direkte reference, da køn og kasus i andre sprog kræver kendskab til det specifikke navneord.
- *Eksempel:* Skriv "Remove tag from post first" frem for "Remove it from it first".

### E. Undgå idiomer, slang og overflødig høflighed
- Undgå faste vendinger, metaforer og kulturelle udtryk, der ikke kan oversættes bogstaveligt.
- Undgå unødvendige høflighedsfraser som "Please / Venligst" i UI-prompts; gør handlingen direkte og selvforklarende.

### F. Reducer teknisk jargon og tvetydighed
- Brug enkle, letforståelige hverdagsord for tekniske begreber.
- Undgå ord, der kan misforstås både som navneord og udsagnsord i isolerede strenge.

---

## 3. Standardiseret CMS-Terminologi

| Kontekst | Foretrukket M3 Term (en-US) | Dansk Term (da-DK) | Undgå / Forkert |
| :--- | :--- | :--- | :--- |
| **Funktions-toggle** | `Enabled` / `Disabled` | `Aktiveret` / `Deaktiveret` | `Activated`, `On/Off state` |
| **Switch-værdier** | `On` / `Off` | `Til` / `Fra` | `Yes/No`, `True/False` |
| **Status: Kladde** | `Draft` | `Kladde` | `Unpublished`, `Working` |
| **Status: Udgivet** | `Published` | `Udgivet` | `Live`, `Active` |
| **Status: Planlagt** | `Scheduled` | `Planlagt` | `Pending`, `Delayed` |
| **Status: Skjult** | `Hidden` | `Skjult` | `Invisible`, `Unlisted` |
| **Handlinger** | `Add`, `Edit`, `Save`, `Delete` | `Tilføj`, `Rediger`, `Gem`, `Slet` | Passive former ("Saving...") |
| **Fejlmeddelelser** | "Enter a valid email address" | "Skriv en gyldig e-mailadresse" | "Email is invalid" |

---

## 4. Tjekliste for Agenter før Aflevering

Før ændringer i tekster, UI eller skemaer godkendes:
- [ ] Engelsk tekst (`en-US`) er defineret og skrevet først.
- [ ] Ordvalg følger M3-tabellen (fx `Enabled` frem for `Activated`).
- [ ] Alle nye felter i `defaults/` er registreret i `defaults/texts.ts`.
- [ ] Alle nye felter i playground er registreret i `playground/src/site/texts.ts` og `playground/worker.mjs`.
- [ ] `npm run check:md3` og `npm run test:editor` er kørt og bestået 100%.
