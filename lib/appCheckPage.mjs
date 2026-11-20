// An app's test page: `check-page.md` in the app's folder (docs/app-contract.md, "The app's test page"). It is a page in the site's
// own format (front matter and the blocks as blockHtml writes them) that holds the app's blocks with valid props, so the screen
// checks (check:screens, check:themes) draw them as the author intends, on a temporary page of their own that is never saved or
// published. An app without the file gets its blocks inserted with their default values, and a warning that names the app.
// No dependencies but blocks.mjs; the screen checks (scripts/editor-screens.mjs) and the tests use it.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { blockHtml, blocksIn } from './blocks.mjs';

export const APP_CHECK_PAGE = 'check-page.md';

/** The types of the blocks an app has: the folders in its blocks/ that have an index.tsx (the folder's name is the block's type). @param {string} appFolder @returns {string[]} */
export function appBlockTypes(appFolder) {
  const dir = join(appFolder, 'blocks');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory() && existsSync(join(dir, name, 'index.tsx')))
    .sort();
}

/**
 * The test page of an app: its own check-page.md, or a page made with its blocks at their default values.
 * `problems` fail the check (a test page that is not valid), `warnings` only say something (no test page, a block it leaves out).
 * @param {string} appFolder the app's folder (src/apps/<id>)
 * @param {string} id the app's id, which every message names
 * @returns {{ id: string, source: 'check-page.md' | 'default values', text: string, types: string[], problems: string[], warnings: string[] } | null} null for an app without blocks
 */
export function appCheckPage(appFolder, id) {
  const types = appBlockTypes(appFolder);
  if (!types.length) return null;
  const file = join(appFolder, APP_CHECK_PAGE);
  const problems = [];
  const warnings = [];
  if (!existsSync(file)) {
    warnings.push(
      `app ${id}: no ${APP_CHECK_PAGE}, so its blocks (${types.join(', ')}) are checked with default values. Add ${APP_CHECK_PAGE} to the app's folder with each block and valid props.`,
    );
    const text = `---\ntitle: "Check ${id}"\n---\n\n# Check ${id}\n\n${types.map((t) => blockHtml(t)).join('\n\n')}\n`;
    return { id, source: 'default values', text, types, problems, warnings };
  }
  const text = readFileSync(file, 'utf8');
  const used = blocksIn(text).map((b) => b.type);
  if (!text.startsWith('---\n')) problems.push(`app ${id}: ${APP_CHECK_PAGE} has no front matter (--- … ---) with a title.`);
  if (!used.length) problems.push(`app ${id}: ${APP_CHECK_PAGE} has no block.`);
  // The page is the app's: a block that is not one of its blocks is not what the page is for.
  for (const type of new Set(used))
    if (!types.includes(type))
      problems.push(`app ${id}: ${APP_CHECK_PAGE} has the block "${type}", which the app does not have (its blocks: ${types.join(', ')}).`);
  for (const type of types)
    if (!used.includes(type)) warnings.push(`app ${id}: ${APP_CHECK_PAGE} leaves out the block "${type}", so it is not checked.`);
  return { id, source: APP_CHECK_PAGE, text, types, problems, warnings };
}
