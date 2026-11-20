/**
 * Which sections of an entry form are offered: one that has no field to show is left out (a post's "Post settings"
 * has none since the status moved to Publish, Unpublish and Schedule). The text and the versions are not decided here.
 * Exposes `sectionsWithFields`. Used by EntryForm.tsx.
 */

/**
 * The ids of the sections that have at least one field shown.
 * @template {{ name: string }} F
 * @param {F[]} fields every field of the collection
 * @param {(name: string) => string} sectionOf the section a field is in
 * @param {(field: F) => boolean} isShown whether the form draws the field
 * @returns {Set<string>}
 */
export const sectionsWithFields = (fields, sectionOf, isShown) => new Set(fields.filter((f) => isShown(f)).map((f) => sectionOf(f.name)));
