// What is wrong when a form cannot be saved, also in the check before the website is updated (check.ts).
export const check = {
  /** What a value must be, when it is another kind (a file edited by hand). */
  kinds: {
    list: 'must be a list',
    object: 'must be a group of fields',
    number: 'must be a number',
    boolean: 'must be on or off',
    text: 'must be text',
  },
  address: 'Write the address with letters or digits',
  onlyDigits: 'Write only digits',
  digits: (n: number) => (n === 1 ? 'Write 1 digit' : `Write ${n} digits`),
  fillIn: (label: string) => `Fill in "${label}."`,
  /** A label and what is wrong with its value. */
  wrong: (label: string, problem: string) => `${label}: ${problem}.`,
  notAnOption: (label: string, value: string) => `${label}: "${value}" isn’t one of the choices.`,
  /** A label and a problem that is a sentence of its own. */
  inField: (label: string, problem: string) => `${label}: ${problem}`,
  cannotBeHere: (name: string) => `"${name}" can’t be on this page.`,
  atMost: (name: string, max: number) =>
    max === 1 ? `There can only be one "${name}" on the page.` : `There can be at most ${max} "${name}" on the page.`,
  /** A block or picture in the text of a field (a "Banner"'s), which may not have it or not so many (Field.template). */
  cannotBeInText: (name: string) => `"${name}" can’t be in the text.`,
  atMostInText: (name: string, max: number) =>
    max === 1 ? `There can only be one "${name}" in the text.` : `There can be at most ${max} "${name}" in the text.`,
  /** A list with more items than it may have (Field.maxItems). */
  atMostItems: (label: string, max: number) => `There can be at most ${max} in "${label}."`,
  mustBeOnPage: (name: string) => `"${name}" must be on the page.`,
  mustBeShown: (name: string) => `"${name}" must be shown on the page.`,
  recordShape: 'A file’s tags need "src" (the file’s address) and the lists "categories" and "removed".',
  recordOverlap: (tag: string) => `The tag "${tag}" is both chosen and removed.`,
  recordDuplicate: (src: string) => `Another file of tags is for ${src}.`,
};
