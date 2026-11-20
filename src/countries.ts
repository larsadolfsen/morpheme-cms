// The countries a phone number can be in, by their code (ISO 3166, "DK") and their country code
// ("+45"), for the sheet the code is picked in (PhoneField in ui.tsx) and for reading a number typed
// with its code (phoneParts in check.ts). Their names are the browser's own, in the editor's language
// (Intl.DisplayNames). Countries that share a code (+1: the USA, Canada and the islands with an area
// code of their own) have it each; the first with a code is the one shown for it until another is picked.
import { locale } from './i18n';

const list =
  'US1 CA1 AG1 AI1 AS1 BB1 BM1 BS1 DM1 DO1 GD1 GU1 JM1 KN1 KY1 LC1 MP1 MS1 PR1 SX1 TC1 TT1 VC1 VG1 VI1 RU7 KZ7 ' +
  'EG20 ZA27 GR30 NL31 BE32 FR33 ES34 HU36 IT39 VA39 RO40 CH41 AT43 GB44 GG44 IM44 JE44 DK45 SE46 NO47 SJ47 PL48 ' +
  'DE49 PE51 MX52 CU53 AR54 BR55 CL56 CO57 VE58 MY60 AU61 CX61 CC61 ID62 PH63 NZ64 SG65 TH66 JP81 KR82 VN84 CN86 ' +
  'TR90 IN91 PK92 AF93 LK94 MM95 IR98 SS211 MA212 EH212 DZ213 TN216 LY218 GM220 SN221 MR222 ML223 GN224 CI225 ' +
  'BF226 NE227 TG228 BJ229 MU230 LR231 SL232 GH233 NG234 TD235 CF236 CM237 CV238 ST239 GQ240 GA241 CG242 CD243 ' +
  'AO244 GW245 IO246 SC248 SD249 RW250 ET251 SO252 DJ253 KE254 TZ255 UG256 BI257 MZ258 ZM260 MG261 RE262 YT262 ' +
  'ZW263 NA264 MW265 LS266 BW267 SZ268 KM269 SH290 ER291 AW297 FO298 GL299 GI350 PT351 LU352 IE353 IS354 AL355 ' +
  'MT356 CY357 FI358 AX358 BG359 LT370 LV371 EE372 MD373 AM374 BY375 AD376 MC377 SM378 UA380 RS381 ME382 XK383 ' +
  'HR385 SI386 BA387 MK389 CZ420 SK421 LI423 FK500 BZ501 GT502 SV503 HN504 NI505 CR506 PA507 PM508 HT509 GP590 ' +
  'BL590 MF590 BO591 GY592 EC593 GF594 PY595 MQ596 SR597 UY598 CW599 BQ599 TL670 NF672 BN673 NR674 PG675 TO676 ' +
  'SB677 VU678 FJ679 PW680 WF681 CK682 NU683 WS685 KI686 NC687 TV688 PF689 TK690 FM691 MH692 KP850 HK852 MO853 ' +
  'KH855 LA856 BD880 TW886 MV960 LB961 JO962 SY963 IQ964 KW965 SA966 YE967 OM968 PS970 AE971 IL972 BH973 QA974 ' +
  'BT975 MN976 NP977 TJ992 TM993 AZ994 GE995 KG996 UZ998';

/** Each country's code and its country code, "+45". */
export const dialCodes: Record<string, string> = Object.fromEntries(list.split(' ').map((c) => [c.slice(0, 2), `+${c.slice(2)}`]));

/** The country shown for a country code: the first with it, or undefined when no country has it. */
export const regionOf = (code: string) => Object.keys(dialCodes).find((r) => dialCodes[r] === code);

const codes = new Set(Object.values(dialCodes));

/** The country code at the start of a number's digits, with digits after it (the longest that is one:
 * +358 before +35), or undefined. */
export const codeAt = (digits: string) =>
  [3, 2, 1]
    .filter((n) => digits.length > n)
    .map((n) => `+${digits.slice(0, n)}`)
    .find((c) => codes.has(c));

/** A country's flag, of the two letters of its code. */
export const flagOf = (region: string) => String.fromCodePoint(...[...region].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

const names = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([locale], { type: 'region' }) : null;
const english = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

/** A country's name in the editor's language. */
export const countryName = (region: string) => names?.of(region) ?? region;

/** The countries in the order of their names, each with its name, its code and the words it is also
 * found by in a search (its country code, its code, its name in English). */
export function countries() {
  return Object.keys(dialCodes)
    .map((region) => ({
      region,
      name: countryName(region),
      code: dialCodes[region],
      words: `${dialCodes[region]} ${region} ${english?.of(region) ?? ''}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
