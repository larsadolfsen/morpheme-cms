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
  /** The text styles are Material 3's body scale; Body medium is the plain paragraph. */
  bodyLarge: 'Body large',
  bodyMedium: 'Body medium',
  bodySmall: 'Body small',
  label: 'Label',
  checkList: 'Checklist',
  bulletList: 'Bullet list',
  orderedList: 'Numbered list',
  quote: 'Quote',
  insert: 'Insert',
  /** The bar's Insert button: it inserts a block (an image on a blog post). It is never in the ⋮ menu. */
  insertBlock: 'Insert block',
  image: 'Image',
  /** Insert: a line between two parts of the text, written as --- in the Markdown. */
  divider: 'Divider',
  dividerAdded: 'Divider added',
  dividerAddAbove: 'Add above',
  dividerAddBelow: 'Add below',
  /** A selected image's tool on the bar that crops it (image tools spec, section 4). */
  crop: 'Crop',
  undo: 'Undo',
  redo: 'Redo',
  /** Text style: the heading levels and the text styles as one button of the bar. */
  kind: 'Text style',
  kindIs: (kind: string) => `Text style: ${kind}`,
  list: 'List',
  listIs: (kind: string) => `List: ${kind}`,
  /** The alignment of a paragraph or a smaller heading, as one button with a menu (packages/editor/lib/text-align.mjs). */
  alignment: 'Alignment',
  alignmentIs: (kind: string) => `Alignment: ${kind}`,
  alignLeft: 'Align left',
  alignCenter: 'Align center',
  alignRight: 'Align right',
  /** The two groups of the bar, for screen readers: the tools for the text under the cursor, and the main tools; `more` is the name of the ⋮ button. */
  more: 'More',
  /** The name of the text area of a page, a post or a section, for screen readers. */
  textField: 'Text',
  textTools: 'Text tools',
  pageTools: 'Page tools',
  /** The colours a selection can have there (packages/editor/lib/text-colors.mjs), by the names under "Colors". */
  color: 'Color',
  colors: { accent: 'Primary', muted: 'On surface variant' },
  noColor: 'No color',
  /** The button for the settings of a section (an H2 and what follows it), and its sheet's colour choices (packages/editor/lib/section-marker.mjs). */
  sectionSettings: 'Section settings',
  sectionColor: 'Section color',
  sectionColors: { none: 'None', surface: 'Surface', primary: 'Primary', secondary: 'Secondary', tertiary: 'Tertiary' },
  /** A section's background image and its width, in the same sheet. */
  sectionImage: 'Background image',
  sectionImageAlt: 'Alt text',
  sectionImageAltHint: 'Leave it empty for an image that is only decoration.',
  sectionWidth: 'Width',
  sectionWidthFull: 'Full width',
  sectionWidthText: 'Like the text',
  /** The sheet of a link (LinkSheet.tsx). */
  linkTo: 'The link goes to',
  linkPage: 'Page',
  linkAddress: 'Other URL',
  linkAddressHint: 'An email or a phone number becomes a link too.',
  linkPosts: 'Blog posts',
  insertLink: 'Insert link',
  removeLink: 'Remove link',
  /** A block's card. */
  hiddenOnPage: 'Hidden',
  showOnPage: 'Show',
  hideOnPage: 'Hide',
  /** Selecting several blocks of the page (MarkdownEditor.tsx): the bar's count, its rows, and the question before they are removed. */
  moveApart: 'Select blocks that are next to each other to move them',
  moveLocked: 'A locked block is in the way',
  moveAtTop: 'This block is already first',
  moveAtBottom: 'This block is already last',
  dragOff: 'Drag is off while several blocks are selected',
  blockSettings: 'Block settings',
  /** The block's menu: the row whose submenu turns the block into another list block (Change type), and that submenu's header. */
  changeTo: 'Change type',
  /** The name of the header of a submenu for screen readers: where it goes. */
  backToMenu: (level: string) => `${level}, back to menu`,
  /** The palette's action for one block: Change to <block>, which names the block it becomes (as the snackbar does). */
  changeToBlock: (name: string) => `Change to ${name}`,
  /** The snackbar after Change type, with Undo; it names the block it became. */
  changedTo: (name: string) => `Changed to ${name}`,
  blocksSelected: (count: number) => (count === 1 ? '1 block selected' : `${count} blocks selected`),
  /** Said when a block is selected, moved, added or removed (the editor's announcer; `place` of `of` counts the blocks of the page). */
  blockSelected: (name: string, place: number, of: number) => `${name}, block ${place} of ${of}, selected`,
  selected: (name: string) => `${name}, selected`,
  blockAdded: (name: string, place: number, of: number) => `${name} added, block ${place} of ${of}`,
  blockMoved: (name: string, place: number, of: number) => `${name} moved to block ${place} of ${of}`,
  blocksMoved: (count: number, up: boolean) => `${count} blocks moved ${up ? 'up' : 'down'}`,
  /** What a removal says, and where the focus is after it. */
  blockRemoved: (name: string) => `${name} removed`,
  blocksRemoved: (count: number) => `${count} blocks removed`,
  focusInText: 'Focus is in the text.',
  focusInTools: 'Focus is on the text tools.',
  /** The text area's description the first time it gets focus on a page. */
  toolsHint: 'Alt+F10 moves to the formatting tools',
  clearBlockSelection: (count: number) => `Clear selection, ${count === 1 ? '1 block selected' : `${count} blocks selected`}`,
  selectBlock: 'Select',
  selectAllBlocks: 'Select all',
  duplicateBlock: 'Duplicate',
  removeBlocks: (count: number, names: string[], kept: string[]) =>
    `Remove ${count} ${count === 1 ? 'block' : 'blocks'}${names.length > 0 && names.length <= 5 ? ` (${names.join(', ')})` : ''}?${kept.length ? ` ${kept.join(', ')} ${kept.length === 1 ? 'stays' : 'stay'}, as the page needs ${kept.length === 1 ? 'it' : 'them'}.` : ''} Undo brings ${count === 1 ? 'it' : 'them'} back.`,
  /** The name of a block when the page has more than one of its kind ("Image 2 of 3"), so a screen reader can tell the cards and handles apart. */
  blockOf: (name: string, place: number, of: number) => `${name} ${place} of ${of}`,
  /** The handle on a block: dragging it moves the block (Move up and Move down do it with the keyboard). */
  dragBlock: (name: string) => `Drag ${name} to move it`,
  /** Shown in an empty line of the text, under the pointer or the cursor. */
  typeHere: 'Write text here…',
  /** On an empty page, under the text (editor.css, --mo-comp-editor-empty-text). */
  emptyHint: 'Type text, or tap Insert to add a block.',
};
