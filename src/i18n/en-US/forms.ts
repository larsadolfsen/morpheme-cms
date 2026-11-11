// The forms and their fields (fields.tsx, EntryForm.tsx, DataForm.tsx, SectionsField.tsx, PagePicker.tsx, schema.ts).
export const forms = {
  nothingToSave: 'There are no changes to save',
  deleteOne: (what: string) => `Delete ${what}`,
  addOne: (what: string) => `Add ${what}`,
  text: 'Text',
  /** The sections of a page's or a post's form, in its navigation drawer (EntryForm.tsx): its name, the text, and the
   * first, with a page's title, status and template (a post's status). */
  sections: { title: 'Sections', content: 'Content', pageSettings: 'Page settings', postSettings: 'Post settings' },
  otherFields: 'Other fields',
  seo: 'Search engines',
  /** The section after it: the picture, title and description when the page is shared, under a preview of how a link
   * to it looks (SharePreview in ui.tsx). */
  share: 'Social media',
  sharePreview: 'How a link to the page looks when it is shared',
  /** A list of links (LinkList.tsx: social media's profiles): the FAB and the sheet's title for a new one, what the list
   * says without one, the field's name and what is under it (`found`: the network known by the address), its buttons,
   * and what is wrong. */
  links: {
    add: 'Add link',
    none: 'No links yet. Add one with the + button.',
    address: 'Address',
    hint: 'Paste the address of a profile, like https://www.facebook.com/…',
    found: (network: string) => `${network} profile`,
    addButton: 'Add',
    done: 'Done',
    remove: 'Remove link',
    noAddress: 'Write an address',
    twice: 'The link is already in the list',
  },
  /** The preview of the Google result at the top of "Search engines" (SearchPreview.tsx): the name of its tabs, the tabs and
   * what a screen reader says of the result. */
  searchPreview: {
    on: 'Google result on',
    mobile: 'Mobile',
    desktop: 'Desktop',
    result: 'Preview of the Google result',
  },
  /** What a tag's page says about itself when it is shared without a Google description (the site's text, Category.astro). */
  tagShared: (n: number, name: string) => `${n} ${n === 1 ? 'post' : 'posts'} about ${name.toLowerCase()}.`,
  /** The SEO rating at the top of "Search engines" (seo.ts): its heading and what each check says; `post`: a
   * blog post (its title is its H1), else a page; `n`: how many (headings, characters). */
  seoRating: {
    title: 'SEO rating',
    noH1: 'The text has no main heading',
    oneH1: 'The text has one main heading',
    manyH1: (n: number) => `The text has ${n} main headings, but should have only one`,
    h1First: 'The main heading is at the top of the text',
    h1NotFirst: 'The main heading isn’t at the top of the text',
    noTitle: (post: boolean) => `There’s no Google title, so the ${post ? "post's" : "page's"} title is used`,
    longTitle: (n: number) => `The Google title has ${n} characters, so Google may cut it off after about 60`,
    goodTitle: (n: number) => `The Google title has a good length (${n} characters)`,
    /** `short`: there is a "Short description", used instead. */
    noDescription: (short: boolean) =>
      `There’s no Google description, so ${short ? 'the short description' : "the website's general description"} is used`,
    noDescriptionFrom: (what: string) => `There’s no Google description, so ${what} is used`,
    fromIntro: 'the introduction',
    fromCount: 'a text with the number of posts',
    shortDescription: (n: number) => `The Google description is short (${n} characters), so there is room for more`,
    longDescription: (n: number) => `The Google description is long (${n} characters), so Google may cut it off`,
    goodDescription: (n: number) => `The Google description has a good length (${n} characters)`,
    keywordInH1: (word: string, post: boolean, found: boolean) =>
      `The keyword "${word}" is ${found ? '' : 'not '}in the ${post ? 'title' : 'main heading'}`,
    keywordInText: (word: string, found: boolean) => `The keyword "${word}" is ${found ? '' : 'not '}in the first paragraph`,
    /** "Hide from search engines (noindex)" is ticked. */
    noindex: (post: boolean) => `The ${post ? 'post' : 'page'} is hidden from Google`,
    /** "Canonical URL" is a page the editor does not know. */
    noCanonical: 'The original page (the page Google should list) points to a page that doesn’t exist',
    allAlt: 'All pictures have an alt text',
    noAlt: (n: number) => `${n} ${n === 1 ? 'picture has' : 'pictures have'} no alt text`,
    goodLinks: (n: number): string => (n === 1 ? 'The link has a descriptive text' : 'The links have descriptive text'),
    /** The first link whose text is only "click here", "read more" and the like. */
    vagueLink: (text: string) => `The link "${text}" doesn’t say where it leads`,
    /** How to do better, under a check that is not fine when it is folded out. */
    fixNoH1: 'Write the page’s heading at the top of the text, as a Heading.',
    fixManyH1: 'Make the others Heading or Subheading.',
    fixH1First: 'Move the main heading up, so it comes first in the text.',
    fixTitle: 'Write a Google title of at most about 60 characters.',
    fixDescription: 'Write a Google description of about 140–155 characters.',
    fixKeywordInH1: (post: boolean) => `Use the keyword in the ${post ? 'title' : 'main heading'}.`,
    fixKeywordInText: 'Use the keyword in the first paragraph.',
    fixNoindex: (post: boolean) => `Uncheck Hide from search engines if the ${post ? 'post' : 'page'} should be found.`,
    fixCanonical: 'Choose a page that exists, or choose No page.',
    fixAlt: 'Tap each picture, choose Edit, and describe it in the Alt text field.',
    fixLink: 'Write what the link leads to, for example, "See the prices."',
  },
  /** Over the places that use an entry (a tag), DataForm.tsx. */
  usedOn: 'Used on',
  address: 'URL',
  writeAddress: 'Write the address with letters or digits.',
  /** A page or post that is published in steps (EntryForm.tsx): a draft, the live version and changes waiting. `post`: a blog post, else a page. */
  versions: {
    publish: 'Publish',
    publishChanges: 'Publish changes',
    schedule: 'Schedule',
    cancelSchedule: 'Cancel schedule',
    scheduleTitle: 'Choose when it goes live',
    scheduleText: (post: boolean) =>
      `The ${post ? 'post' : 'page'} goes on the website at this time, and until then the website shows the version it has. The website updates within an hour of the time.`,
    scheduleTime: 'Date',
    scheduleNeedsFuture: 'Choose a date and time that has not passed.',
    scheduleWithAddress: 'Save the new address first, then schedule.',
    /** The line under the title, and the message after scheduling; `when`: "Nov 20 at 8:00 AM". */
    scheduledLine: (when: string) => `Scheduled · ${when}`,
    savedScheduled: (when: string) => `Scheduled. It goes on the website ${when}.`,
    scheduledCancelled: (what: string) => `Schedule for ${what} cancelled`,
    unpublish: 'Unpublish',
    discardChanges: 'Discard changes',
    /** The top bar's line under the title. */
    draftLine: 'Draft',
    waitingLine: 'Unpublished changes',
    publishedLine: (when: string) => `Published · Changed ${when}`,
    /** After saving changes to a published page: the website keeps the version it has. */
    savedWaiting: 'Changes saved. The website shows the published version until you publish.',
    unpublishTitle: (post: boolean) => `Unpublish this ${post ? 'post' : 'page'}?`,
    unpublishText: (post: boolean) =>
      `The ${post ? 'post' : 'page'} leaves the website and becomes a draft. Changes that wait to be published stay.`,
    discardTitle: 'Discard the changes?',
    discardText: (post: boolean) => `The ${post ? 'post' : 'page'} goes back to the version on the website. You can’t undo this.`,
    addressWaiting: 'Publish or discard the changes before you change the address.',
    standardPage: 'This page is chosen as a standard page, so it must stay published.',
    /** Names of what changed, for the message after a save (`what`: the page or post). */
    published: (what: string) => `${what} published`,
    unpublished: (what: string) => `${what} unpublished`,
    discarded: (what: string) => `Changes to ${what} discarded`,
    /** The commits. */
    commit: {
      saveChanges: (singular: string, what: string) => `Editor: save changes to ${singular} ${what}`,
      schedule: (singular: string, what: string, at: string) => `Editor: schedule ${singular} ${what} for ${at}`,
      cancelSchedule: (singular: string, what: string) => `Editor: cancel the schedule of ${singular} ${what}`,
      publish: (singular: string, what: string) => `Editor: publish ${singular} ${what}`,
      unpublish: (singular: string, what: string) => `Editor: unpublish ${singular} ${what}`,
      discard: (singular: string, what: string) => `Editor: discard changes to ${singular} ${what}`,
    },
  },
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
    /** The page is a standard page ("Front page", "Blog page" …, chosen `where`: "Udseende › Standardsider")
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
  /** Under a page's templates while the side-panel ones are greyed: the link to Appearance › Side column. */
  chooseSideColumn: 'Choose a block for the side column',
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
