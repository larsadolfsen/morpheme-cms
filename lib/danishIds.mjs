// The Danish words that scripts/check-language.mjs looks for in ids, routes, placeholders and paths: the Danish id words.
// Exposes DANISH_IDS, DANISH_ROUTE_SEGMENTS, DANISH_STOP_WORDS (data, pure). Allow-listed in the check: the words are Danish on purpose.

/**
 * Danish words that are never English, as whole lower-case tokens. Seeded from the keys of MOVED and RENAMED in
 * src/movedRoutes.mjs, the rows of docs/superpowers/specs/2026-11-10-english-ids-design.md and the spec's word list.
 * Left out because they are English too, or too short to match safely: side, ny, om, dele, hold, alle, ikke.
 * Add a word when a new Danish id is found; keep it only if it is Danish and never English.
 */
export const DANISH_IDS = new Set(
  [
    // The old editor addresses (the keys of MOVED and RENAMED).
    'tema udseende indstillinger maaling promovering kategori kategorier mobilmenu virksomheden blokke filer privatliv lister',
    'videresendelser blokvalg avanceret licenser temaer farver ikonpakker bevaegelse sidekolonne vaerdier standardsider',
    'udtalelser samtykker betaling vurdering udvikler butik konto notifikationer slettet kontakt privatlivssider',
    'reservefarver sociale medier interne fundet',
    // Names in the rows of the inventory: page names, placeholders, keyword words, the stored view value.
    'forside privatlivspolitik ikoner emne navn antal adresse hvad valg blok slags liste priser blogside vej',
  ]
    .join(' ')
    .split(' '),
);

/**
 * Danish words that are English too ("ny" is the abbreviation of New York), so they count only as a whole folder or
 * file name in a path, or as a segment of a quoted URL path such as `/ny/about/`.
 */
export const DANISH_ROUTE_SEGMENTS = new Set(['ny']);

/** A quoted string with one of these as a whole word is Danish text (the weaker rule, for scripts/, lib/ and worker/); none of them is English. */
export const DANISH_STOP_WORDS = ['ikke', 'uden', 'blev', 'ingen', 'fejl', 'findes', 'mangler'];
