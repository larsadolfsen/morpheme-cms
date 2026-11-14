// The lists an owner makes (lib/ownList.mjs, src/ownLists.ts, src/OwnListEdit.tsx): the names of the fixed fields, the words of an entry, and
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
  /** Under a new list's name on the Lists screen: it is kept as a waiting version until its page is saved. */
  notSavedYet: 'Not saved yet',
  nameNeeded: 'Give the list a name with letters or numbers.',
  nameTaken: 'A list with this name exists. Choose another name.',
  edit: 'Edit list',
  delete: 'Delete list',
  name: 'Name',
  fields: 'Fields',
  addField: 'Add field',
  /** What an empty list's page says, above its `Add field` button. */
  noFields: 'This list has no fields yet. Add the first one.',
  /** On the edit page of a locked list (its fields are fixed, the testimonials'). */
  fixedFields: 'The fields of this list are fixed.',
  /** A field's name in `Edit list` (the kind's name until the owner changes it). */
  fieldName: 'Field name',
  shown: 'Shown',
  /** Under a field that was switched off: its data is still in the items. */
  held: (n: number) => `The data in ${n} ${n === 1 ? 'item' : 'items'} stays until you remove it.`,
  moveFieldUp: (name: string) => `Move ${name.toLowerCase()} up`,
  moveFieldDown: (name: string) => `Move ${name.toLowerCase()} down`,
  addKind: (kind: string) => `Add ${kind.toLowerCase()}`,
  fieldTools: 'Fields you can add',
  removeField: 'Remove field',
  removeData: 'Remove data',
  removeDataAsk: (field: string, n: number) => `Remove ${field.toLowerCase()} from ${n} ${n === 1 ? 'item' : 'items'} for good?`,
  /** `Delete list` is refused while a page or an app reads the list. */
  used: (n: number) => `The list is used on ${n} ${n === 1 ? 'page' : 'pages'}. Remove it from there first.`,
  deleteAsk: (label: string, n: number) => `Delete ${label} and its ${n} ${n === 1 ? 'item' : 'items'}?`,
};
