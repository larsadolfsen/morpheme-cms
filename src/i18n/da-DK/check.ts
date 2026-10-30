// What is wrong when a form cannot be saved, also in the check before the build (check.ts).
export const check = {
  /** What a value must be, when it is another kind (a file edited by hand). */
  kinds: {
    list: 'skal være en liste',
    object: 'skal være en gruppe af felter',
    number: 'skal være et tal',
    boolean: 'skal være til eller fra',
    text: 'skal være en tekst',
  },
  address: 'Skriv adressen med bogstaver eller tal',
  onlyDigits: 'Skriv kun tal',
  digits: (n: number) => `Skriv ${n} cifre`,
  fillIn: (label: string) => `Udfyld "${label}".`,
  /** A label and what is wrong with its value. */
  wrong: (label: string, problem: string) => `${label}: ${problem}.`,
  notAnOption: (label: string, value: string) => `${label}: "${value}" er ikke et af valgene.`,
  /** A label and a problem that is a sentence of its own. */
  inField: (label: string, problem: string) => `${label}: ${problem}`,
  cannotBeHere: (name: string) => `"${name}" kan ikke stå på denne side.`,
  atMost: (name: string, max: number) =>
    max === 1 ? `Der kan kun være én "${name}" på siden.` : `Der kan højst være ${max} "${name}" på siden.`,
  /** A block or picture in the text of a field (a "Banner"'s), which may not have it or not so many (Field.template). */
  cannotBeInText: (name: string) => `"${name}" kan ikke stå i teksten.`,
  atMostInText: (name: string, max: number) =>
    max === 1 ? `Der kan kun være én "${name}" i teksten.` : `Der kan højst være ${max} "${name}" i teksten.`,
  /** A list with more items than it may have (Field.maxItems). */
  atMostItems: (label: string, max: number) => `Der kan højst være ${max} i "${label}".`,
  mustBeOnPage: (name: string) => `"${name}" skal stå på siden.`,
  mustBeShown: (name: string) => `"${name}" skal vises på siden.`,
};
