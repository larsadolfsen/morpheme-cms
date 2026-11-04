// The forms and their fields (fields.tsx, EntryForm.tsx, DataForm.tsx, SectionsField.tsx, PagePicker.tsx, schema.ts).
export const forms = {
  nothingToSave: 'There are no changes to save',
  deleteOne: (what: string) => `Delete ${what}`,
  addOne: (what: string) => `Add ${what}`,
  text: 'Text',
  /** The sections of a page's or a post's form, in its navigation drawer (EntryForm.tsx): its name, the text and the status. */
  sections: { title: 'Sections', content: 'Content', status: 'Status' },
  otherFields: 'Other fields',
  seo: 'Search engines',
  /** The section after it: the picture, title and description when the page is shared, under a preview of how a link
   * to it looks (SharePreview in ui.tsx). */
  share: 'Social media',
  sharePreview: 'How a link to the page looks when it is shared',
  /** What a tag's page says about itself when it is shared without a Google description (the site's text, Category.astro). */
  tagShared: (n: number, name: string) => `${n} ${n === 1 ? 'post' : 'posts'} about ${name.toLowerCase()}.`,
  /** The SEO rating at the top of "Søgemaskiner" (seo.ts): its heading and what each check says; `post`: a
   * blog post (its title is its H1), else a page; `n`: how many (headings, characters). */
  seoRating: {
    title: 'SEO rating',
    noH1: 'The text has no heading (H1)',
    oneH1: 'The text has one heading (H1)',
    manyH1: (n: number) => `The text has ${n} headings (H1), but should have only one`,
    h1First: 'The heading (H1) is at the top of the text',
    h1NotFirst: 'The heading (H1) isn’t at the top of the text',
    noTitle: (post: boolean) => `There’s no Google title, so the ${post ? "post's" : "page's"} title is used`,
    longTitle: (n: number) => `The Google title has ${n} characters, so Google may cut it off after about 60`,
    goodTitle: (n: number) => `The Google title has a good length (${n} characters)`,
    /** `short`: there is a "Kort beskrivelse", used instead. */
    noDescription: (short: boolean) =>
      `There’s no Google description, so ${short ? 'the short description' : "the website's general description"} is used`,
    noDescriptionFrom: (what: string) => `There’s no Google description, so ${what} is used`,
    fromIntro: 'the introduction',
    fromCount: 'a text with the number of posts',
    shortDescription: (n: number) => `The Google description is short (${n} characters), so there is room for more`,
    longDescription: (n: number) => `The Google description is long (${n} characters), so Google may cut it off`,
    goodDescription: (n: number) => `The Google description has a good length (${n} characters)`,
    keywordInH1: (word: string, post: boolean, found: boolean) =>
      `The keyword "${word}" is ${found ? '' : 'not '}in the ${post ? 'title' : 'heading (H1)'}`,
    keywordInText: (word: string, found: boolean) => `The keyword "${word}" is ${found ? '' : 'not '}in the first paragraph`,
    /** "Skjul for søgemaskiner (noindex)" is ticked. */
    noindex: (post: boolean) => `The ${post ? 'post' : 'page'} is hidden from Google`,
    /** "Canonical URL" is a page the editor does not know. */
    noCanonical: 'The canonical URL (the page Google should list) points to a page that doesn’t exist',
    allAlt: 'All pictures have an alt text',
    noAlt: (n: number) => `${n} ${n === 1 ? 'picture has' : 'pictures have'} no alt text`,
    goodLinks: (n: number): string => (n === 1 ? 'The link has a descriptive text' : 'The links have descriptive text'),
    /** The first link whose text is only "klik her", "læs mere" and the like. */
    vagueLink: (text: string) => `The link "${text}" doesn’t say where it leads`,
    /** How to do better, under a check that is not fine when it is folded out. */
    fixNoH1: 'Write the page’s heading at the top of the text, as a Heading.',
    fixManyH1: 'Make the others Heading or Subheading.',
    fixH1First: 'Move the heading (H1) up, so it comes first in the text.',
    fixTitle: 'Write a Google title of at most about 60 characters.',
    fixDescription: 'Write a Google description of about 140–155 characters.',
    fixKeywordInH1: (post: boolean) => `Use the keyword in the ${post ? 'title' : 'heading (H1)'}.`,
    fixKeywordInText: 'Use the keyword in the first paragraph.',
    fixNoindex: (post: boolean) => `Uncheck Hide from search engines (noindex) if the ${post ? 'post' : 'page'} should be found.`,
    fixCanonical: 'Choose a page that exists, or choose No page.',
    fixAlt: 'Tap each picture, choose Edit, and write an alt text.',
    fixLink: 'Write what the link leads to, for example, "See the prices."',
  },
  /** Over the places that use an entry (a tag), DataForm.tsx. */
  usedOn: 'Used on',
  address: 'Address',
  writeAddress: 'Write the address with letters or digits.',
  /** The commits; `what` is a name or a file name in quotation marks. */
  commit: {
    create: (create: string, what: string) => `Editor: ${create.toLowerCase()} ${what}`,
    edit: (what: string) => `Editor: edit ${what}`,
    editOne: (singular: string, what: string) => `Editor: edit ${singular} ${what}`,
    move: (singular: string, from: string, to: string) => `Editor: move ${singular} from ${from} to ${to}`,
  },
  /** A blog post or page (EntryForm.tsx); `post`: a blog post, else a page. */
  entry: {
    titleNeedsLetters: 'The title must have letters or digits.',
    /** Planlagt (scheduled), with a time that has passed. */
    scheduledPast: 'The time has already passed. Choose a later time, or choose Published.',
    /** The page is a standard page ("Forside", "Blogside" …, chosen `where`: "Udseende › Standardsider")
     * and was made Kladde or Planlagt. */
    standardPage: (label: string, where: string) =>
      `The page is chosen as ${label} under ${where} and must be published. Choose another page there first.`,
    redirectsNotLoaded: (error: string) => `Couldn’t load the redirects: ${error}`,
    takenTitle: (address: string) => `The address ${address} is taken`,
    /** The address sends visitors on to `name`, and `via` other addresses send on through it. */
    takenText: (address: string, name: string, via: number, post: boolean) =>
      `It currently sends visitors on to ${name}. If you remove the redirect, they come to ${post ? 'this post' : 'this page'} instead.`,
    freeAndSave: 'Remove the redirect and save',
    pickOther: 'Choose another address',
    otherTitle: 'Another address',
    otherText: (post: boolean) => `Write the address the ${post ? 'post' : 'page'} should have.`,
    /** An address that is taken (`reason`), and what to do: another address, or (a new one) another title. */
    taken: (reason: string, typed: boolean, post: boolean) =>
      `${reason} ${typed ? 'Choose another address' : `Give the ${post ? 'post' : 'page'} another title`}.`,
    fileExists: (name: string) => `There’s already a file named ${name}.md. Choose another address.`,
    empty: (post: boolean) => `${post ? 'An empty blog post' : 'An empty page'} can’t be saved.`,
    movedTitle: 'Redirect created',
    movedText: (address: string, old: string, post: boolean, where: string) =>
      `The ${post ? 'post' : 'page'} now has the address ${address}. The old address, ${old}, now redirects here.`,
    ok: 'OK',
    seeRedirects: 'See redirects',
  },
  /** An entry of a folder or a single file (DataForm.tsx). */
  nameNeedsLetters: 'The name must have letters or digits.',
  /** The fields (fields.tsx). */
  fromTitle: 'Created from the title the first time you save the page.',
  noIcon: 'No icon',
  pickIcon: 'Choose an icon',
  noIconYet: 'No icon yet',
  changeIcon: 'Change icon',
  hideIcons: 'Hide the icons',
  fixedPages: 'Default pages',
  pages: 'Pages',
  choose: 'Choose…',
  /** Nothing chosen, as a choice in the list. */
  noChoice: 'None',
  /** A value that is not among the choices (a removed page). */
  missing: (value: string) => `${value} (doesn’t exist)`,
  changeImage: 'Change picture',
  pickImage: 'Choose picture',
  add: 'Add',
  noneFound: 'No results',
  removeOne: (what: string) => `Remove ${what}`,
  /** An item of a list or the menu, when the field has no `singular`. */
  item: 'item',
  theItem: 'the item',
  numbered: (what: string, n: number) => `${what} ${n}`,
  itemTitle: 'Item',
  empty: '(empty)',
  removeQuestion: (what: string) => `Remove ${what}?`,
  removeWithChildren: (what: string, n: number) =>
    `Remove ${what}? ${n === 1 ? 'The item' : `The ${n} items`} under it will be removed too.`,
  showChildrenOf: (name: string) => `Show the items under ${name}`,
  hideChildrenOf: (name: string) => `Hide the items under ${name}`,
  editOne: (name: string) => `Edit ${name}`,
  /** Picking a page (PagePicker.tsx). */
  pickPage: 'Choose page',
  pickPageEllipsis: 'Choose page…',
  noPage: 'No page',
  searchPages: 'Search the pages',
  noPages: 'No results',
  /** The filter of the pages by whether the menu links to them, and its choices. */
  menuFilter: 'Menu',
  menuShown: { all: 'All', in: 'In the menu', out: 'Not in the menu' },
};
