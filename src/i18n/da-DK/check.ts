import type { Messages } from '../en-US';

export const check: Messages['check'] = {
  kinds: {
    list: 'skal være en liste',
    object: 'skal være en gruppe af felter',
    number: 'skal være et tal',
    boolean: 'skal være til eller fra',
    text: 'skal være tekst',
  },
  address: 'Skriv adressen med bogstaver eller tal',
  onlyDigits: 'Skriv kun tal',
  digits: (n) => (n === 1 ? 'Skriv 1 ciffer' : `Skriv ${n} cifre`),
  fillIn: (label) => `Udfyld "${label}".`,
  wrong: (label, problem) => `${label}: ${problem}.`,
  notAnOption: (label, value) => `${label}: "${value}" er ikke et af valgene.`,
  inField: (label, problem) => `${label}: ${problem}`,
  cannotBeHere: (name) => `"${name}" kan ikke stå på denne side.`,
  atMost: (name, max) => (max === 1 ? `Der kan kun være én "${name}" på siden.` : `Der kan højst være ${max} "${name}" på siden.`),
  cannotBeInText: (name) => `"${name}" kan ikke stå i teksten.`,
  atMostInText: (name, max) => (max === 1 ? `Der kan kun være én "${name}" i teksten.` : `Der kan højst være ${max} "${name}" i teksten.`),
  atMostItems: (label, max) => `Der kan højst være ${max} i "${label}".`,
  mustBeOnPage: (name) => `"${name}" skal stå på siden.`,
  mustBeShown: (name) => `"${name}" skal vises på siden.`,
  recordShape: 'En fils tags skal have "src" (filens adresse) og listerne "categories" og "removed".',
  recordOverlap: (tag) => `Tagget "${tag}" er både valgt og fjernet.`,
  recordDuplicate: (src) => `En anden fil med tags gælder også ${src}.`,
};
