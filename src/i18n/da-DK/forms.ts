// The forms and their fields (fields.tsx, EntryForm.tsx, DataForm.tsx, SectionsField.tsx, PagePicker.tsx, schema.ts).
export const forms = {
  nothingToSave: 'Der er ingen ændringer at gemme.',
  deleteOne: (what: string) => `Slet ${what}`,
  addOne: (what: string) => `Tilføj ${what}`,
  text: 'Tekst',
  /** The sections of a page's or a post's form, in its navigation drawer (EntryForm.tsx): its name, the text and the status. */
  sections: { title: 'Afsnit', content: 'Indhold', status: 'Status' },
  otherFields: 'Andre felter',
  seo: 'Søgemaskiner',
  /** The section after it: the picture, title and description when the page is shared, under a preview of how a link
   * to it looks (SharePreview in ui.tsx). */
  share: 'Sociale medier',
  sharePreview: 'Sådan ser et link til siden ud, når det deles',
  /** What a tag's page says about itself when it is shared without a Google description (the site's text, Category.astro). */
  tagShared: (n: number, name: string) => `${n} indlæg om ${name.toLowerCase()}.`,
  /** The SEO rating at the top of "Søgemaskiner" (seo.ts): its heading and what each check says; `post`: a
   * blog post (its title is its H1), else a page; `n`: how many (headings, characters). */
  seoRating: {
    title: 'SEO-vurdering',
    noH1: 'Teksten har ingen overskrift (H1).',
    oneH1: 'Teksten har én overskrift (H1).',
    manyH1: (n: number) => `Teksten har ${n} overskrifter (H1), men bør kun have én.`,
    h1First: 'Overskriften (H1) står øverst i teksten.',
    h1NotFirst: 'Overskriften (H1) står ikke øverst i teksten.',
    noTitle: (post: boolean) => `Der er ingen Google-titel, så ${post ? 'indlæggets' : 'sidens'} titel bruges.`,
    longTitle: (n: number) => `Google-titlen har ${n} tegn, så Google kan skære den af efter ca. 60.`,
    goodTitle: (n: number) => `Google-titlen har en god længde (${n} tegn).`,
    /** `short`: there is a "Kort beskrivelse", used instead. */
    noDescription: (short: boolean) =>
      `Der er ingen Google-beskrivelse, så ${short ? 'den korte beskrivelse' : 'hjemmesidens fælles beskrivelse'} bruges.`,
    noDescriptionFrom: (what: string) => `Der er ingen Google-beskrivelse, så ${what} bruges.`,
    fromIntro: 'indledningen',
    fromCount: 'en tekst med antallet af indlæg',
    shortDescription: (n: number) => `Google-beskrivelsen er kort (${n} tegn), så der er plads til mere.`,
    longDescription: (n: number) => `Google-beskrivelsen er lang (${n} tegn), så Google kan skære den af.`,
    goodDescription: (n: number) => `Google-beskrivelsen har en god længde (${n} tegn).`,
    keywordInH1: (word: string, post: boolean, found: boolean) =>
      `Søgeordet "${word}" står ${found ? '' : 'ikke '}i ${post ? 'titlen' : 'overskriften (H1)'}.`,
    keywordInText: (word: string, found: boolean) => `Søgeordet "${word}" står ${found ? '' : 'ikke '}i første afsnit.`,
    /** "Skjul for søgemaskiner (noindex)" is ticked. */
    noindex: (post: boolean) => `${post ? 'Indlægget' : 'Siden'} er skjult for Google.`,
    /** "Canonical URL" is a page the editor does not know. */
    noCanonical: 'Canonical URL peger på en side, der ikke findes.',
    allAlt: 'Alle billeder har en alternativ tekst.',
    noAlt: (n: number) => `${n} ${n === 1 ? 'billede' : 'billeder'} har ingen alternativ tekst.`,
    goodLinks: (n: number): string => (n === 1 ? 'Linket har en beskrivende tekst.' : 'Linkene har beskrivende tekst.'),
    /** The first link whose text is only "klik her", "læs mere" and the like. */
    vagueLink: (text: string) => `Linket "${text}" siger ikke, hvor det fører hen.`,
    /** How to do better, under a check that is not fine when it is folded out. */
    fixNoH1: 'Skriv sidens overskrift øverst i teksten, og gør den til Overskrift (H1).',
    fixManyH1: 'Gør de andre til Overskrift eller Underoverskrift.',
    fixH1First: 'Flyt overskriften (H1) op, så den står først i teksten.',
    fixTitle: 'Skriv en Google-titel på højst ca. 60 tegn.',
    fixDescription: 'Skriv en Google-beskrivelse på ca. 140-155 tegn.',
    fixKeywordInH1: (post: boolean) => `Brug søgeordet i ${post ? 'titlen' : 'overskriften (H1)'}.`,
    fixKeywordInText: 'Brug søgeordet i første afsnit.',
    fixNoindex: (post: boolean) =>
      `Fjern fluebenet ved Skjul for søgemaskiner (noindex), hvis ${post ? 'indlægget' : 'siden'} skal kunne findes.`,
    fixCanonical: 'Vælg en side, der findes, eller vælg Ingen side.',
    fixAlt: 'Skriv en alternativ tekst til hvert billede (tryk på billedet › Rediger).',
    fixLink: 'Skriv, hvad linket fører til, fx "Se priserne".',
  },
  /** Over the places that use an entry (a tag), DataForm.tsx. */
  usedOn: 'Bruges på',
  address: 'Adresse',
  writeAddress: 'Skriv adressen med bogstaver eller tal.',
  /** The commits; `what` is a name or a file name in quotation marks. */
  commit: {
    create: (create: string, what: string) => `Editor: ${create.toLowerCase()} ${what}`,
    edit: (what: string) => `Editor: ret ${what}`,
    editOne: (singular: string, what: string) => `Editor: ret ${singular} ${what}`,
    move: (singular: string, from: string, to: string) => `Editor: flyt ${singular} fra ${from} til ${to}`,
  },
  /** A blog post or page (EntryForm.tsx); `post`: a blog post, else a page. */
  entry: {
    titleNeedsLetters: 'Titlen skal have bogstaver eller tal.',
    /** Planlagt (scheduled), with a time that has passed. */
    scheduledPast: 'Tidspunktet er allerede passeret. Vælg et senere tidspunkt, eller vælg Udgivet.',
    /** The page is a standard page ("Forside", "Blogside" …, chosen `where`: "Indstillinger › Udseende › Standardsider")
     * and was made Kladde or Planlagt. */
    standardPage: (label: string, where: string) =>
      `Siden er valgt som ${label} under ${where} og skal være udgivet. Vælg en anden side dér først.`,
    redirectsNotLoaded: (error: string) => `Kunne ikke hente videresendelserne: ${error}`,
    takenTitle: (address: string) => `Adressen ${address} er optaget`,
    /** The address sends visitors on to `name`, and `via` other addresses send on through it. */
    takenText: (address: string, name: string, via: number, post: boolean) =>
      `Den sender i dag besøgende videre til ${name}. Fjerner du videresendelsen, kommer de til ${post ? 'dette indlæg' : 'denne side'} i stedet.`,
    freeAndSave: 'Fjern videresendelsen og gem',
    pickOther: 'Vælg en anden adresse',
    otherTitle: 'En anden adresse',
    otherText: (post: boolean) => `Skriv den adresse, ${post ? 'indlægget' : 'siden'} skal have.`,
    /** An address that is taken (`reason`), and what to do: another address, or (a new one) another title. */
    taken: (reason: string, typed: boolean, post: boolean) =>
      `${reason} ${typed ? 'Vælg en anden adresse' : `Giv ${post ? 'indlægget' : 'siden'} en anden titel`}.`,
    fileExists: (name: string) => `Der findes allerede en fil med navnet ${name}.md. Vælg en anden adresse.`,
    empty: (post: boolean) => `${post ? 'Et tomt blogindlæg' : 'En tom side'} kan ikke gemmes.`,
    movedTitle: 'Der er oprettet en videresendelse',
    movedText: (address: string, old: string, post: boolean, where: string) =>
      `${post ? 'Indlægget' : 'Siden'} har fået adressen ${address}. Den gamle adresse, ${old}, sender nu videre hertil.`,
    ok: 'OK',
    seeRedirects: 'Se videresendelser',
  },
  /** An entry of a folder or a single file (DataForm.tsx). */
  nameNeedsLetters: 'Navnet skal have bogstaver eller tal.',
  /** The fields (fields.tsx). */
  fromTitle: 'Dannes ud fra titlen, første gang siden gemmes.',
  noIcon: 'Intet ikon',
  pickIcon: 'Vælg et ikon',
  noIconYet: 'Intet ikon endnu',
  changeIcon: 'Skift ikon',
  hideIcons: 'Skjul ikonerne',
  fixedPages: 'Standardsider',
  pages: 'Sider',
  choose: 'Vælg …',
  /** Nothing chosen, as a choice in the list. */
  noChoice: 'Ingen',
  /** A value that is not among the choices (a removed page). */
  missing: (value: string) => `${value} (findes ikke)`,
  changeImage: 'Skift billede',
  pickImage: 'Vælg billede',
  add: 'Tilføj',
  noneFound: 'Ingen resultater.',
  removeOne: (what: string) => `Fjern ${what}`,
  /** An item of a list or the menu, when the field has no `singular`. */
  item: 'punkt',
  theItem: 'punktet',
  numbered: (what: string, n: number) => `${what} ${n}`,
  itemTitle: 'Punkt',
  empty: '(tom)',
  removeQuestion: (what: string) => `Fjern ${what}?`,
  removeWithChildren: (what: string, n: number) => `Fjern ${what}? Punkterne under det (${n}) fjernes også.`,
  showChildrenOf: (name: string) => `Vis punkterne under ${name}`,
  hideChildrenOf: (name: string) => `Skjul punkterne under ${name}`,
  editOne: (name: string) => `Rediger ${name}`,
  /** Picking a page (PagePicker.tsx). */
  pickPage: 'Vælg side',
  pickPageEllipsis: 'Vælg side …',
  noPage: 'Ingen side',
  searchPages: 'Søg i siderne',
  noPages: 'Ingen resultater.',
  /** The filter of the pages by whether the menu links to them, and its choices. */
  menuFilter: 'Menu',
  menuShown: { all: 'Alle', in: 'I menuen', out: 'Ikke i menuen' },
};
