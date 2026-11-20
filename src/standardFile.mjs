// The file of a standard page ("Settings" › "Appearance" › "Default pages"), found by the address the setting gives it:
// the page whose `path` (or, without one, whose file name) is that address. Used where a field links to a standard page's file
// (Field.edit.page, fields.tsx), so no file name is written in code.
import { readFields, splitFrontmatter } from './frontmatter.mjs';

const slugOf = (path, folder) => path.slice(folder.length + 1).replace(/(\/index)?\.(md|json)$/, '');

/** The path of the file of the standard page `key`, or undefined when the setting has no address for it or no page has it.
 * `settings`: the text of the setting's file (config.standardPages); `folder`: the pages' folder (config.folders.pages). */
export function standardFileOf(files, settings, folder, key) {
  let address;
  try {
    address = JSON.parse(files.find((f) => f.path === settings)?.text ?? '{}')[key];
  } catch {
    return undefined;
  }
  if (!address) return undefined;
  return files.find((f) => {
    if (!f.path.startsWith(`${folder}/`) || !f.path.endsWith('.md')) return false;
    return String(readFields(splitFrontmatter(f.text).yaml).path ?? `/${slugOf(f.path, folder)}/`) === address;
  })?.path;
}
