// "Videresendelser" (Redirects.tsx, redirects.ts).
export const redirects = {
  notLoaded: (error: string) => `Kunne ikke hente videresendelserne: ${error}`,
  noFrom: 'Skriv den adresse, der skal sende videre.',
  noTo: 'Skriv den adresse, der skal sendes videre til.',
  toSelf: 'En adresse kan ikke sende videre til sig selv.',
  pageHas: (from: string) => `Der er en side med adressen ${from}. Giv i stedet siden en ny adresse.`,
  alreadyRedirects: (from: string) => `Der findes allerede en videresendelse fra ${from}. Rediger den i listen.`,
  /** Deleting one; `via`: how many other addresses send on through it. */
  deleteAsk: (from: string, via: number) => `Slet videresendelsen fra ${from}? Adressen viser derefter "Siden findes ikke".`,
  /** redirects.ts: the addresses that come back to one, joined by arrows. */
  loop: (addresses: string) => `Videresendelserne ville sende i ring (${addresses}).`,
  /** checkSite.ts: a redirect that sends on through another, before the site is built. */
  chain: (from: string, to: string, end: string) =>
    `${from} sender videre til ${to}, som selv sender videre til ${end}. Send den direkte til ${end}.`,
  chainRule: (line: string, flat: string) => `Reglen "${line}" sender videre gennem en anden. Skriv den som "${flat}".`,
  count: (n: number) => `${n} ${n === 1 ? 'adresse' : 'adresser'}`,
  /** The row under "Videresendelser" with all the redirects, and its screen's title. */
  all: 'Alle videresendelser',
  new: 'Ny videresendelse',
  intro: 'Adresser, der sender besøgende videre til en anden side.',
  searchLabel: 'Søg i videresendelserne',
  /** The orders of the two lists (Redirects.tsx): by address, by the page it sends to, by visits, by the last visit. */
  sorts: { az: 'A–Å', za: 'Å–A', page: 'Efter side', visits: 'Flest besøg først', last: 'Senest besøgt først' },
  /** The funnel over the redirects that shows only those to one page or post. */
  pageFilter: 'Vis efter side',
  /** Over the posts among its choices. */
  postsGroup: 'Blogindlæg',
  loading: 'Henter videresendelserne',
  /** None, or none matching the search. */
  none: (query: string) => `Ingen videresendelser${query ? ` med "${query}"` : ''}.`,
  from: 'Fra',
  fromHint: 'Fx /gammel-side/.',
  to: 'Til',
  toHint: 'Fx /om-os/ eller / for forsiden.',
  /** Where it sends to; `noPage`: an address of the site no page in the editor has. */
  sendsTo: (name: string, noPage: boolean) => `Sender til ${name}${noPage ? ' (ikke en side i editoren)' : ''}.`,
  deleteRedirect: 'Slet videresendelse',
  /** "Ikke fundet": the addresses visitors came to that do not exist (notFound.ts). */
  missing: {
    /** Its row under "Videresendelser" and its screen's title. */
    title: 'Ikke fundet',
    intro: 'Adresser, som besøgende har prøvet at åbne, men som ikke findes.',
    searchLabel: 'Søg i adresserne',
    loading: 'Henter adresserne',
    notLoaded: (error: string) => `Kunne ikke hente adresserne, der ikke findes: ${error}`,
    /** The site does not keep them (yet). */
    notKept: 'Hjemmesiden registrerer endnu ikke adresser, der ikke findes.',
    none: (query: string) => (query ? `Ingen adresser med "${query}".` : 'Ingen adresser endnu.'),
    /** Under the address in the list: how many visits, and the last (when.ts). */
    seen: (n: number, last: string) => `${n === 1 ? 'Ét besøg' : `${n} besøg`}, senest ${last}`,
    /** In the sheet; `from`: where the last visitor came from (a page, another site), or ''. */
    details: (n: number, first: string, last: string, from: string) =>
      `${n === 1 ? `Besøgt én gang, ${last}` : `Besøgt ${n} gange, første gang ${first} og senest ${last}`}.${from ? ` Den seneste kom fra ${from}.` : ''}`,
    sendOn: 'Send videre',
    forget: 'Fjern fra listen',
    forgotten: 'Fjernet fra listen.',
    notForgotten: (error: string) => `Kunne ikke fjerne adressen fra listen: ${error}`,
  },
  /** The commits, in the site's language (siteT). */
  commit: {
    add: (from: string, to: string) => `Editor: videresend ${from} til ${to}`,
    change: (from: string, to: string) => `Editor: ${from} sender nu videre til ${to}`,
    delete: (from: string) => `Editor: slet videresendelsen fra ${from}`,
  },
};
