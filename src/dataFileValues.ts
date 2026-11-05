// A JSON file in a form: its fields, its values in the form (from its text) and its data again (to save), the same for one
// file on its own screen (DataForm.tsx) and several on one (useDataFiles.ts, Appearance › Header). Exposes fieldsOf,
// listOnly, valuesOf, dataOf and dataFileIn. Uses check.ts (withDefaults, clean) and schema.ts.
import { entryData, type Collection, type DataFile, type Field } from './schema';
import { clean, withDefaults } from './check';
import type { RepoFile } from './github';

/** A single file's fields: its own ("Aktiveret") and, when it is a list (the menus), the list's field after them. */
export const fieldsOf = (dataFile: DataFile): Field[] => (dataFile.root ? [...dataFile.fields, dataFile.root] : dataFile.fields);

/** A file that is only a list, without fields of its own beside it (a menu with "Aktiveret" is not). */
export const listOnly = (dataFile?: DataFile) => !!dataFile?.root && !dataFile.fields.length;

/** A file's values in the form: its data (with the defaults of fields it has none for; an entry of a list as the list has
 * it now, entryData), or a list under the field's name. */
export function valuesOf(text: string, fields: Field[], dataFile: DataFile | undefined, collection: Collection, files: RepoFile[]) {
  if (listOnly(dataFile)) return { [dataFile!.root!.name]: JSON.parse(text) } as Record<string, unknown>;
  return withDefaults(fields, collection.kind === 'folder' && !dataFile ? entryData(collection, text, files) : JSON.parse(text));
}

/** The values as they are saved (clean): a file that is only a list as the list itself. */
export function dataOf(fields: Field[], values: Record<string, unknown>, dataFile?: DataFile): unknown {
  const data = clean(fields, values);
  return listOnly(dataFile) ? data[dataFile!.root!.name] : data;
}

/** A single file as the site has it; an optional one (the header's) that the site has not got yet as an empty one, which
 * the first save makes. */
export const dataFileIn = (files: RepoFile[], dataFile: DataFile): RepoFile | undefined =>
  files.find((f) => f.path === dataFile.file) ?? (dataFile.optional ? { path: dataFile.file, oid: '', text: '{}\n' } : undefined);
