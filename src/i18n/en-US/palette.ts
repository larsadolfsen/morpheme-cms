// The command palette (CommandPalette.tsx): the search over the editor's actions, the places in the main menu and the pages and posts
// (docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md, section 7).
export const palette = {
  /** The top bar's search button: its name, and its tooltip with the key. */
  open: 'Search',
  /** The field's name and placeholder, and the view's name. */
  label: 'Search actions and pages',
  back: 'Close search',
  clear: 'Clear',
  /** The group names before typing. */
  recent: 'Recent',
  suggested: 'Suggested',
  /** The searches typed before, shown before typing (kept in this browser only), and the button after each. */
  recentSearches: 'Recent searches',
  removeSearch: (query: string) => `Remove “${query}” from recent searches`,
  /** The last row of a query's first results, which shows all of them. */
  allResults: (query: string) => `All search results for “${query}”`,
  allResultsCount: (n: number) => (n === 1 ? '1 result' : `${n} results`),
  /** The filter chips under the field. */
  filtersLabel: 'Filter results',
  filters: { actions: 'Actions', pages: 'Pages', posts: 'Posts', images: 'Images', files: 'Files' },
  /** Under the field when nothing fits what is typed. */
  empty: (query: string) => `Nothing found for “${query}”`,
  /** Read aloud when the results change. */
  none: 'Nothing found',
  /** The actions that clear what this browser kept of the search, and that show the keys. */
  clearRecent: 'Clear recent actions',
  shortcuts: 'Keyboard shortcuts',
  count: (n: number) => (n === 1 ? '1 result' : `${n} results`),
  /** The group names of the results (the group of an action). */
  groups: {
    go: 'Go to',
    pages: 'Pages and posts',
    files: 'Images and files',
    page: 'Page',
    text: 'Text',
    insert: 'Insert',
    section: 'Section',
    block: 'Block',
    table: 'Table',
    image: 'Image',
    list: 'List',
    setting: 'Settings',
    app: 'Apps',
  },
};
