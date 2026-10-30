// The text and its toolbar (MarkdownEditor.tsx).
export const text = {
  /** The toolbar's name, for screen readers. */
  tools: 'Værktøjer til teksten',
  bold: 'Fed',
  italic: 'Kursiv',
  link: 'Link',
  /** The page's own heading, at the top of its text (a page's, not a blog post's). */
  pageHeading: 'Overskrift (H1)',
  heading: 'Overskrift',
  subheading: 'Underoverskrift',
  paragraph: 'Almindelig tekst',
  bulletList: 'Punktliste',
  orderedList: 'Nummereret liste',
  quote: 'Citat',
  insert: 'Indsæt',
  image: 'Billede',
  undo: 'Fortryd',
  redo: 'Gentag',
  /** The kinds of text as one button, when the toolbar is too short. */
  kind: 'Teksttype',
  kindIs: (kind: string) => `Teksttype: ${kind}`,
  /** The menu over a selection. */
  selection: 'Markeret tekst',
  /** The colours a selection can have there (packages/editor/lib/text-colors.mjs), by the names under "Farver". */
  color: 'Farve',
  colors: { accent: 'Accentfarve', muted: 'Stille tekst' },
  noColor: 'Ingen farve',
  /** The sheet of a link (LinkSheet.tsx). */
  linkTo: 'Linket går til',
  linkPage: 'Side',
  linkAddress: 'Anden adresse',
  linkAddressHint: 'En e-mail eller et telefonnummer bliver også et link.',
  linkPosts: 'Blogindlæg',
  insertLink: 'Indsæt link',
  removeLink: 'Fjern link',
  /** A block's card. */
  hiddenOnPage: 'Skjult på siden',
  showOnPage: 'Vis på siden',
  hideOnPage: 'Skjul på siden',
};
