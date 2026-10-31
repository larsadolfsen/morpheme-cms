---
name: word-choice
description: >-
  Google Material Design 3 (M3) Word Choice guidelines for UI text and global writing
  (https://m3.material.io/foundations/content-design/global-writing/word-choice).
  Covers concise phrasing, universal terms, active voice, and standard M3 UI vocabulary.
---

# Material Design 3: Global Writing & Word Choice

Denne skill implementerer de officielle Google Material Design 3 (M3) retningslinjer for **Content Design: Global Writing & Word Choice** (jf. [M3 Word Choice](https://m3.material.io/foundations/content-design/global-writing/word-choice)).

## 1. M3 Grundprincipper for Ordvalg

1. **Brug universelle eksempler og forklar lokale referencer:**
   - Vælg eksempler og formater, der fungerer globalt.
   - Hvis en lokal reference er nødvendig (f.eks. CVR, MobilePay), skal den altid ledsages af en hjælpetekst eller beskrivelse, der sætter den i kontekst for internationale brugere og oversættere.

2. **Korte og enkle sætninger (Short, Simple Sentences):**
   - Skriv i aktiv form (Active Voice).
   - Del komplekse instruktioner op i korte, præcise sætninger.
   - Tag højde for tekstekspansion: Mange sprog udvider sig med op til 1.5× i forhold til engelsk.

3. **Undgå forkortelser (Avoid Abbreviations):**
   - Skriv ord helt ud. Forkortelser mangler kontekst for skærmlæsere og oversættes sjældent korrekt.
   - *Eksempel:* Brug "Postcode and town" eller "Postal code", ikke "P.C.".

4. **Tydeliggør stedord (Clarify Pronouns & Demonstratives):**
   - Undgå uklare stedord som "it", "this" eller "that" uden direkte kobling til det specifikke element.
   - *Eksempel:* "Remove tag from blog post first" i stedet for "Remove it from it first".

5. **Undgå idiomer, slang og overflødige høflighedsfraser:**
   - Undlad kulturelt betingede udtryk, metaforer og slang, som ikke kan oversættes bogstaveligt.
   - Undlad høflighedsfraser som "Please / Venligst" i UI-prompts; handlingen skal være direkte og handlingsorienteret.

6. **Reducer teknisk jargon og tvetydighed:**
   - Brug letforståeligt hverdagssprog frem for system-interne fagtermer.
   - Undgå ord, der kan misforstås både som navneord og udsagnsord i isolerede UI-strenge.

---

## 2. Kanonisk M3 Terminologi i CMS-Editoren

| Kontekst | M3 Term (en-US) | Dansk (da-DK) | Undgå / Forældet |
| :--- | :--- | :--- | :--- |
| **Funktions-toggle** | `Enabled` / `Disabled` | `Aktiveret` / `Deaktiveret` | `Activated`, `On/Off state` |
| **Switch-tilstand** | `On` / `Off` | `Til` / `Fra` | `Yes/No`, `True/False` |
| **Status: Kladde** | `Draft` | `Kladde` | `Unpublished`, `Working` |
| **Status: Udgivet** | `Published` | `Udgivet` | `Live`, `Active` |
| **Status: Planlagt** | `Scheduled` | `Planlagt` | `Pending`, `Delayed` |
| **Status: Skjult** | `Hidden` | `Skjult` | `Invisible`, `Unlisted` |
| **Handlingsknapper** | `Add tag`, `Edit page`, `Save` | `Tilføj tag`, `Rediger side`, `Gem` | Passive former ("Saving...") |
| **Fejlmeddelelser** | "Enter a valid email address" | "Skriv en gyldig e-mailadresse" | "Email is invalid" |

---

## 3. Verifikation

Før nye UI-tekster, felter eller beskrivelser tilføjes i editoren eller temaet:
- Følg M3 ordvalgstabellen for entydige og handlingsorienterede betegnelser.
- Sørg for at den engelske referenceform er kort og fri for idiomer.
- Verificér med `npm run check:md3` og `npm run test:editor`.
