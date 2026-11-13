// The lists an owner makes (lib/ownList.mjs, src/ownLists.ts, src/OwnListSheet.tsx): the names of the fixed fields, the words of an entry, and
// `Edit list`.
export const ownList = {
  icon: 'Icon',
  title: 'Title',
  text: 'Body text',
  image: 'Image',
  href: 'Link',
  tags: 'Tags',
  addTag: 'Add tag',
  createTag: 'Create a tag',
  create: 'Add item',
  singular: 'Item',
  /** What a list is called in a commit message and a change. */
  list: 'list',
  /** The button on the Lists screen, and the title of its dialog. */
  new: 'New list',
  make: 'Create',
  nameNeeded: 'Give the list a name with letters or numbers.',
  nameTaken: 'A list with this name exists. Choose another name.',
  edit: 'Edit list',
  delete: 'Delete list',
  menu: 'List menu',
  name: 'Name',
  fields: 'Fields',
  titleOn: 'The title is always on.',
  /** Under a field that was switched off: its data is still in the items. */
  held: (n: number) => `The data in ${n} ${n === 1 ? 'item' : 'items'} stays until you remove it.`,
  removeData: 'Remove data',
  removeDataAsk: (field: string, n: number) => `Remove ${field.toLowerCase()} from ${n} ${n === 1 ? 'item' : 'items'} for good?`,
  /** `Delete list` is refused while a page or an app reads the list. */
  used: (n: number) => `The list is used on ${n} ${n === 1 ? 'page' : 'pages'}. Remove it from there first.`,
  deleteAsk: (label: string, n: number) => `Delete ${label} and its ${n} ${n === 1 ? 'item' : 'items'}?`,
};
