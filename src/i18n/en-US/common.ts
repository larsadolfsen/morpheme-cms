// What many parts of the editor say: the buttons, the editor's own parts on the start screen, the
// messages after a save, and dates and times.
export const common = {
  save: 'Save',
  saveChanges: 'Save changes',
  saving: 'Saving…',
  deleting: 'Deleting…',
  cancel: 'Cancel',
  close: 'Close',
  /** The handle at the top of a sheet on a phone (SheetTitle), for screen readers. */
  sheetTaller: 'Make the sheet taller',
  sheetSmaller: 'Make the sheet shorter',
  /** The frame around a block as it looks on the site (Preview). */
  preview: 'Preview',
  edit: 'Edit',
  remove: 'Remove',
  delete: 'Delete',
  search: 'Search',
  /** The label of a search in a list: "Search pages". */
  searchIn: (what: string) => `Search ${what.toLowerCase()}`,
  moveUp: 'Move up',
  moveDown: 'Move down',
  notInUse: 'Not in use',
  noMatch: 'No results',
  notSaved: (error: string) => `Couldn’t save: ${error}`,
  backTo: (to: string) => `Back to ${to}`,
  /** The swatch of a colour field (ColorField), for screen readers. */
  pickColor: (name: string) => `${name}: pick a color`,
  /** The lock on the source color in the generator (ColorTiles), a toggle: on while it is locked. */
  lockColor: (name: string) => `Lock ${name.toLowerCase()}`,
  notAColor: 'Write the color as # and 6 characters, for example, #a3345a.',
  /** The country code before a phone number (PhoneField): its button, for screen readers, and its sheet. */
  phoneCode: {
    label: (country: string, code: string) => `Country code: ${country}, ${code}. Pick another country`,
    title: 'Pick a country',
    search: 'Search countries',
  },
  /** The sheet a colour is picked in (ColorField). */
  colorSheet: {
    /** The field with the shades, for screen readers, and where it is in it. */
    shade: 'Saturation and brightness',
    shadeValue: (saturation: string, brightness: string) => `Saturation ${saturation}, brightness ${brightness}`,
    hue: 'Hue',
    before: 'Before',
    after: 'New',
    code: 'Color code',
    swatches: 'Colors on the website',
    use: 'Use color',
    /** Takes the color and locks it (the source color in the generator, ColorTiles). */
    useAndLock: 'Use and lock',
  },
  /** The theme's date picker (DatePicker in ui.tsx), in the editor's language: its fixed texts. */
  datePicker: {
    select: 'Select date',
    selectRange: 'Select dates',
    enter: 'Enter date',
    enterRange: 'Enter dates',
    date: 'Date',
    start: 'Start date',
    end: 'End date',
    format: 'mm/dd/yyyy',
    wrongFormat: 'Enter the date as mm/dd/yyyy.',
    notAllowed: 'The date can’t be picked.',
    endBeforeStart: 'The end date is before the start date.',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    chooseMonth: 'Select month',
    chooseYear: 'Select year',
    toInput: 'Switch to typing',
    toCalendar: 'Switch to the calendar',
    cancel: 'Cancel',
    ok: 'OK',
  },
  /** The theme's time picker (TimePicker in ui.tsx), in the editor's language: its fixed texts, and the name of the time
   * beside a date (a date and a time). */
  timePicker: {
    time: 'Time',
    select: 'Select time',
    enter: 'Enter time',
    hour: 'Hour',
    minute: 'Minute',
    format: 'hh:mm',
    wrong: 'Enter a time between 00:00 and 23:59.',
    format12: 'h:mm AM/PM',
    wrong12: 'Enter a time between 1:00 and 12:59.',
    period: 'AM or PM',
    toInput: 'Switch to typing',
    toDial: 'Switch to the clock',
    cancel: 'Cancel',
    ok: 'OK',
  },
  /** A carousel (Carousel), and each of its items, for screen readers. */
  carousel: {
    name: 'carousel',
    item: 'item',
    of: (n: number, all: number) => `${n} of ${all}`,
  },
  /** A check in a list of checks (CheckList), for screen readers before its text: fine or not. */
  check: { ok: 'Fine', notOk: 'Could be better', score: (ok: number, all: number) => `${ok} of ${all} fine` },
  /** The editor's own parts (not the site's collections). */
  parts: {
    company: 'Business',
    header: 'Header',
    footer: 'Footer',
    lists: 'Dynamic lists',
    blocks: 'Block templates',
    media: 'Files',
    /** How the site looks (#appearance, Library.tsx Theme): the theme, the colours, the logo and icon, and the site's own
     * parts there (appearance in packages/editor/defaults/editor.ts: "Default pages"). */
    appearance: 'Appearance',
    /** The themes installed (#appearance/themes, Library.tsx Themes), the first row under "Appearance". */
    themes: 'Themes',
    /** The store's themes, to install and update them (#appearance/theme-store, ThemeStoreScreen.tsx), the first row under Appearance. */
    themeStore: 'Theme store',
    /** The icon packs installed, to choose the one the site draws its icons with (#appearance/icon-packs, IconPacks). */
    iconPacks: 'Icon packs',
    /** How the site moves, Material 3's motion schemes (#appearance/motion, MotionSchemes in Library.tsx). */
    motion: 'Motion',
    /** The block drawn in a column beside the text of the pages (#appearance/side-column, SideColumn.tsx). */
    sideColumn: 'Side column',
    colors: 'Colors',
    brand: 'Logo and icon',
    blockSettings: 'Block settings',
    /** The apps that come with the site (AppList.tsx, #apps). */
    apps: 'Apps',
    /** The parts the editor and the site are built of (#developer/parts: Parts.tsx, BlockParts.tsx). */
    editorParts: 'Parts',
    /** Under Indstillinger: the redirects and the site's own parts (#seo, Library.tsx Seo). */
    seo: 'Search engine optimization',
    redirects: 'Redirects',
    account: 'Account',
    /** The screen the cog at the bottom of the main drawer opens (#settings), and the first part of the path to a setting (placeOf in site.ts). */
    settings: 'Settings',
    /** Under Settings: the developer screens, the parts and the caching (#developer, Library.tsx Developer). */
    developer: 'Developer',
    /** Under Developer: R2 caching and the build settings (#developer/caching, Advanced.tsx). */
    caching: 'Caching and builds',
    /** Under Indstillinger: the assistants connected to the site (#assistants, Assistants.tsx). */
    assistants: 'Assistants',
    /** Under Indstillinger: the licences of what the site and the editor are made with (#licenses, Licenses.tsx). */
    licenses: 'Licenses',
    /** Under Indstillinger: the CMS's version and its updates (#morpheme). */
    morpheme: 'Morpheme',
  },
  /** Right after a save, with what it changed (savedText in deploy.ts); the site is rebuilt in 1-2 minutes. */
  saved: (change: string) => `${change}. You’ll get a message when the website is updated.`,
  /** "today at 1.42 pm", "yesterday at 9.05 am", "Oct 1 at 1.42 pm" (when.ts). */
  today: 'today',
  yesterday: 'yesterday',
  at: (day: string, time: string) => `${day} at ${time}`,
  /** A month heading without a date (Sheet.tsx). */
  noDate: 'No date',
};
