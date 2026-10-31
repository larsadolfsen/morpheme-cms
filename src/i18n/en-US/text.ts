// The text and its toolbar (MarkdownEditor.tsx).
export const text = {
  /** The toolbar's name, for screen readers. */
  tools: 'Tools for the text',
  bold: 'Bold',
  italic: 'Italic',
  link: 'Link',
  /** The page's own heading, at the top of its text (a page's, not a blog post's). */
  pageHeading: 'Heading (H1)',
  heading: 'Heading',
  subheading: 'Subheading',
  paragraph: 'Normal text',
  bulletList: 'Bulleted list',
  orderedList: 'Numbered list',
  quote: 'Quote',
  insert: 'Insert',
  image: 'Image',
  undo: 'Undo',
  redo: 'Redo',
  /** The kinds of text as one button, when the toolbar is too short. */
  kind: 'Text style',
  kindIs: (kind: string) => `Text style: ${kind}`,
  /** The menu over a selection. */
  selection: 'Selected text',
  /** The colours a selection can have there (packages/editor/lib/text-colors.mjs), by the names under "Farver". */
  color: 'Color',
  colors: { accent: 'Accent color', muted: 'Muted text' },
  noColor: 'No color',
  /** The sheet of a link (LinkSheet.tsx). */
  linkTo: 'The link goes to',
  linkPage: 'Page',
  linkAddress: 'Other address',
  linkAddressHint: 'An email or a phone number becomes a link too.',
  linkPosts: 'Blog posts',
  insertLink: 'Insert link',
  removeLink: 'Remove link',
  /** A block's card. */
  hiddenOnPage: 'Hidden on the page',
  showOnPage: 'Show on the page',
  hideOnPage: 'Hide on the page',
};
