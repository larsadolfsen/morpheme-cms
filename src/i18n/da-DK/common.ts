// What many parts of the editor say: the buttons, the editor's own parts on the start screen, the
// messages after a save, and dates and times.
export const common = {
  save: 'Gem',
  saveChanges: 'Gem ændringer',
  saving: 'Gemmer…',
  deleting: 'Sletter…',
  cancel: 'Annuller',
  close: 'Luk',
  /** The handle at the top of a sheet on a phone (SheetTitle), for screen readers. */
  sheetTaller: 'Gør arket højere',
  sheetSmaller: 'Gør arket lavere',
  /** The frame around a block as it looks on the site (Preview). */
  preview: 'Forhåndsvisning',
  edit: 'Rediger',
  remove: 'Fjern',
  delete: 'Slet',
  search: 'Søg',
  /** The label of a search in a list: "Søg i sider". */
  searchIn: (what: string) => `Søg i ${what.toLowerCase()}`,
  moveUp: 'Flyt op',
  moveDown: 'Flyt ned',
  notInUse: 'Ikke i brug',
  noMatch: 'Ingen resultater.',
  notSaved: (error: string) => `Kunne ikke gemme: ${error}`,
  backTo: (to: string) => `Tilbage til ${to}`,
  /** The swatch of a colour field (ColorField), for screen readers. */
  pickColor: (name: string) => `${name}: vælg farve`,
  notAColor: 'Skriv farven som # og seks tegn, fx #a3345a.',
  /** The country code before a phone number (PhoneField): its button, for screen readers, and its sheet. */
  phoneCode: {
    label: (country: string, code: string) => `Landekode: ${country}, ${code}. Vælg et andet land`,
    title: 'Vælg land',
    search: 'Søg i landene',
  },
  /** The sheet a colour is picked in (ColorField). */
  colorSheet: {
    /** The field with the shades, for screen readers, and where it is in it. */
    shade: 'Mætning og lysstyrke',
    shadeValue: (saturation: string, brightness: string) => `Mætning ${saturation}, lysstyrke ${brightness}`,
    hue: 'Farvetone',
    before: 'Før',
    after: 'Ny',
    code: 'Farvekode',
    swatches: 'Farver på hjemmesiden',
    use: 'Brug farven',
  },
  /** The theme's date picker (DatePicker in ui.tsx), in the editor's language: its fixed texts. */
  datePicker: {
    select: 'Vælg dato',
    selectRange: 'Vælg datoer',
    enter: 'Skriv dato',
    enterRange: 'Skriv datoer',
    date: 'Dato',
    start: 'Startdato',
    end: 'Slutdato',
    format: 'dd.mm.åååå',
    wrongFormat: 'Skriv datoen som dd.mm.åååå.',
    notAllowed: 'Datoen kan ikke vælges.',
    endBeforeStart: 'Slutdatoen er før startdatoen.',
    previousMonth: 'Forrige måned',
    nextMonth: 'Næste måned',
    previousYear: 'Forrige år',
    nextYear: 'Næste år',
    chooseMonth: 'Vælg måned',
    chooseYear: 'Vælg år',
    toInput: 'Skift til at skrive',
    toCalendar: 'Skift til kalenderen',
    cancel: 'Annuller',
    ok: 'OK',
  },
  /** The theme's time picker (TimePicker in ui.tsx), in the editor's language: its fixed texts, and the name of the time
   * beside a date (a date and a time). */
  timePicker: {
    time: 'Tidspunkt',
    select: 'Vælg tidspunkt',
    enter: 'Skriv tidspunkt',
    hour: 'Time',
    minute: 'Minut',
    format: 'tt.mm',
    wrong: 'Skriv et tidspunkt mellem 00.00 og 23.59.',
    format12: 't.mm AM/PM',
    wrong12: 'Skriv et tidspunkt mellem 1.00 og 12.59.',
    period: 'Før eller efter middag',
    toInput: 'Skift til at skrive',
    toDial: 'Skift til urskiven',
    cancel: 'Annuller',
    ok: 'OK',
  },
  /** A carousel (Carousel), and each of its items, for screen readers. */
  carousel: {
    name: 'karrusel',
    item: 'element',
    of: (n: number, all: number) => `${n} af ${all}`,
  },
  /** A check in a list of checks (CheckList), for screen readers before its text: fine or not. */
  check: { ok: 'I orden', notOk: 'Kan forbedres', score: (ok: number, all: number) => `${ok} af ${all} i orden` },
  /** The editor's own parts (not the site's collections). */
  parts: {
    company: 'Virksomheden',
    header: 'Header',
    lists: 'Lister',
    blocks: 'Standardblokke',
    media: 'Filer',
    /** How the site looks (#udseende, Library.tsx Theme): the theme, the colours, the logo and icon, and the site's own
     * parts there (appearance in src/site/editor.ts: "Standardsider"). */
    appearance: 'Udseende',
    /** The themes installed (#udseende/temaer, Library.tsx Themes), the first row under "Udseende". */
    themes: 'Temaer',
    /** The icon packs installed, to choose the one the site draws its icons with (#udseende/ikonpakker, IconPacks). */
    iconPacks: 'Ikonpakker',
    colors: 'Farver',
    brand: 'Logo og ikon',
    blockSettings: 'Blokindstillinger',
    /** The apps that come with the site (AppList.tsx, #apps). */
    apps: 'Apps',
    /** The parts the editor and the site are built of (#udseende/dele: Parts.tsx, BlockParts.tsx). */
    editorParts: 'Dele',
    /** Under Indstillinger: the redirects and the site's own parts (#seo, Library.tsx Seo). */
    seo: 'Søgemaskineoptimering',
    redirects: 'Videresendelser',
    account: 'Konto',
    /** The settings of the whole site (#indstillinger, Library.tsx Settings), opened by the gear in the top bar. */
    settings: 'Indstillinger',
    /** Under Indstillinger: R2 caching (#avanceret, Advanced.tsx). */
    advanced: 'Avanceret',
    /** Under Indstillinger: the licences of what the site and the editor are made with (#licenser, Licenses.tsx). */
    licenses: 'Licenser',
  },
  /** Right after saving and deleting; the site is rebuilt in 1-2 minutes (deploy.ts). */
  saved: 'Gemt. Du får besked, når hjemmesiden er opdateret.',
  deleted: 'Slettet. Du får besked, når hjemmesiden er opdateret.',
  /** "i dag kl. 13.42", "i går kl. 9.05", "1. okt. kl. 13.42" (when.ts). */
  today: 'i dag',
  yesterday: 'i går',
  at: (day: string, time: string) => `${day} kl. ${time}`,
  /** A month heading without a date (Sheet.tsx). */
  noDate: 'Uden dato',
};
