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
  /** Under the field when nothing fits what is typed. */
  empty: (query: string) => `Nothing found for “${query}”`,
  /** Read aloud when the results change. */
  none: 'Nothing found',
  count: (n: number) => (n === 1 ? '1 result' : `${n} results`),
  /** The group names of the results (the group of an action). */
  groups: {
    go: 'Go to',
    pages: 'Pages and posts',
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
