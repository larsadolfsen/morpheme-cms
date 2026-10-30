import type { Messages } from '../da-DK';

export const check: Messages['check'] = {
  kinds: {
    list: 'must be a list',
    object: 'must be a group of fields',
    number: 'must be a number',
    boolean: 'must be on or off',
    text: 'must be a text',
  },
  address: 'Write the address with letters or digits',
  onlyDigits: 'Write only digits',
  digits: (n) => `Write ${n} digits`,
  fillIn: (label) => `Fill in "${label}".`,
  wrong: (label, problem) => `${label}: ${problem}.`,
  notAnOption: (label, value) => `${label}: "${value}" is not one of the choices.`,
  inField: (label, problem) => `${label}: ${problem}`,
  cannotBeHere: (name) => `"${name}" cannot be on this page.`,
  atMost: (name, max) =>
    max === 1 ? `There can only be one "${name}" on the page.` : `There can be at most ${max} "${name}" on the page.`,
  cannotBeInText: (name) => `"${name}" cannot be in the text.`,
  atMostInText: (name, max) =>
    max === 1 ? `There can only be one "${name}" in the text.` : `There can be at most ${max} "${name}" in the text.`,
  atMostItems: (label, max) => `There can be at most ${max} in "${label}".`,
  mustBeOnPage: (name) => `"${name}" must be on the page.`,
  mustBeShown: (name) => `"${name}" must be shown on the page.`,
};
