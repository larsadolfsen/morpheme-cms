// A temporary copy of a site, with files added to it, for a check that needs a page the site does not have (check:screens,
// check:themes): the copy is made in the site's own `.astro/` (git-ignored in every site, and on the same disk as the site, as
// buildOutDir is), the files are written there, the site is built from it, and the whole folder is deleted again in a `finally`, so a
// crash or a stray commit can never leave a page in the real site. node_modules is not copied but linked. Nothing here writes to the site itself.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { binOf } from './bin.mjs';

/** What is not copied: what is built from the site, other tools' folders and what is only the site's history. */
export const NOT_COPIED = new Set(['node_modules', 'dist', '.astro', '.morpheme', '.git', '.wrangler', '.claude']);

/** Copies the site at `root` (without NOT_COPIED) to a new folder in `<root>/.astro/test-site/` and writes `files` (path from the site's root → text) there. @returns {string} the copy's folder */
export function copySite(root, files = {}) {
  const copy = tempFolder(root);
  try {
    fillCopy(root, copy, files);
  } catch (error) {
    rmSync(copy, { recursive: true, force: true });
    throw error;
  }
  return copy;
}

const tempFolder = (root) => {
  const parent = join(root, '.astro', 'test-site');
  mkdirSync(parent, { recursive: true });
  return mkdtempSync(join(parent, 'site-'));
};

function fillCopy(root, copy, files) {
  // One entry of the site's folder at a time: cpSync refuses to copy a folder into itself, and the copy is inside the site's.
  for (const name of readdirSync(root)) if (!NOT_COPIED.has(name)) cpSync(join(root, name), join(copy, name), { recursive: true });
  // The site's packages are looked for in the copy's own root (site/theme.mjs reads node_modules there), so it is a link to the site's.
  if (existsSync(join(root, 'node_modules'))) symlinkSync(realpathSync(join(root, 'node_modules')), join(copy, 'node_modules'), 'junction');
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(copy, path)), { recursive: true });
    writeFileSync(join(copy, path), text);
  }
}

/** Builds a copy of the site at `root` with `files` added. The caller deletes it with `remove()` (also when `build` threw: nothing is left then). @returns {{ copy: string, dist: string, remove: () => void }} */
export function buildTestSite(root, files) {
  const copy = copySite(root, files);
  const remove = () => rmSync(copy, { recursive: true, force: true });
  try {
    const dist = join(copy, 'dist');
    execFileSync(process.execPath, [binOf('astro', 'astro', copy), 'build', '--outDir', dist], {
      cwd: copy,
      stdio: 'pipe',
      maxBuffer: 64 * 1024 * 1024,
    });
    return { copy, dist, remove };
  } catch (error) {
    remove();
    throw error;
  }
}

/**
 * Builds a copy of the site at `root` with `files` added, runs `use({ copy, dist })` on the built copy and deletes the copy, also when
 * the build or `use` fails.
 * @template T
 * @param {string} root
 * @param {Record<string, string>} files
 * @param {(site: { copy: string, dist: string }) => Promise<T> | T} use
 * @returns {Promise<T>}
 */
export async function withTestSite(root, files, use) {
  const built = buildTestSite(root, files);
  try {
    return await use({ copy: built.copy, dist: built.dist });
  } finally {
    built.remove();
  }
}
