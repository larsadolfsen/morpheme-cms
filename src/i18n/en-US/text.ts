// The text and its toolbar (MarkdownEditor.tsx).
export const text = {
  /** The toolbar's name, for screen readers. */
  tools: 'Tools for the text',
  bold: 'Bold',
  italic: 'Italic',
  link: 'Link',
  /** The page's own heading, at the top of its text (a page's, not a blog post's). */
  pageHeading: 'Main heading',
  heading: 'Heading',
  subheading: 'Subheading',
  /** The text styles are Material 3's body scale; Body large is the plain paragraph. */
  bodyLarge: 'Body large',
  bodyMedium: 'Body medium',
  bodySmall: 'Body small',
  label: 'Label',
  checkList: 'Check list',
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
  /** The button at the end of the toolbar when its tools do not fit on one line: the second line shown or hidden. */
  moreTools: 'Show more tools',
  fewerTools: 'Show fewer tools',
  /** The menu over a selection. */
  selection: 'Selected text',
  /** The colours a selection can have there (packages/editor/lib/text-colors.mjs), by the names under "Colors". */
  color: 'Color',
  colors: { accent: 'Primary', muted: 'On surface variant' },
  noColor: 'No color',
  /** The button for the settings of a section (an H2 and what follows it), and its sheet's colour choices (packages/editor/lib/section-marker.mjs). */
  sectionSettings: 'Section settings',
  sectionColor: 'Section color',
  sectionColors: { none: 'None', surface: 'Surface', primary: 'Primary', secondary: 'Secondary', tertiary: 'Tertiary' },
  /** A section's background picture and its width, in the same sheet. */
  sectionPicture: 'Background picture',
  sectionPictureAlt: 'Picture description',
  sectionPictureAltHint: 'Leave it empty for a picture that is only decoration.',
  sectionWidth: 'Width',
  sectionWidthFull: 'Full width',
  sectionWidthText: 'Like the text',
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
  /** Shown in an empty line of the text, under the pointer or the cursor. */
  typeHere: 'Write text here…',
  /** On an empty page, under the text (editor.css, --editor-empty-text). */
  emptyHint: 'Type text, or tap Insert to add a block.',
};
