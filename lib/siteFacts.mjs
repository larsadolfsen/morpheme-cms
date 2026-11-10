// What a site's own files tell the site settings (lib/siteSettings.mjs): which of the two files folders exist, the address
// of every page, and the text of the contact page. Read at build time, in Node. Never throws: a folder or a file that is
// missing, or a standard-pages.json that is not JSON, gives nothing.
// Exposes detectFacts. Depends on: node:fs.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** The folders `folders.files` can be without the site saying so: the old Danish one and the standard. */
const FILES_FOLDERS = ['public/filer', 'public/files']; // language-ok: the old Danish folder, found in a live site

const isDirectory = (path) => statSync(path, { throwIfNoEntry: false })?.isDirectory() ?? false;
const readText = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
};
const frontMatter = (text) => text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
// The same reading of a front matter field as astro.mjs's.
const field = (fm, name) => fm.match(new RegExp(`^${name}: *"?(.*?)"?\\s*$`, 'm'))?.[1] ?? '';

/** The .md files in a folder, by their paths in it (none when the folder is missing). */
const markdown = (dir) => {
  try {
    return readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .map((f) => f.replaceAll('\\', '/'))
      .filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
};

/**
 * @param {string} [root] The site's root.
 * @param {{ pages?: string }} [folders] The site's folders (config.folders); the pages' folder is `pages`.
 * @returns {{ dirs: string[]; pageAddresses: string[]; contactText: string }}
 */
export function detectFacts(root = process.cwd(), folders = {}) {
  const pagesFolder = join(root, folders.pages ?? 'src/content/pages');
  const pages = markdown(pagesFolder).map((f) => {
    const text = readText(join(pagesFolder, f));
    return { address: field(frontMatter(text), 'path') || `/${f.slice(0, -3)}/`, text };
  });

  let contact = '';
  try {
    const standard = JSON.parse(readText(join(root, 'src/data/standard-pages.json')));
    if (typeof standard?.contact === 'string') contact = standard.contact;
  } catch {}

  return {
    dirs: FILES_FOLDERS.filter((d) => isDirectory(join(root, d))),
    pageAddresses: pages.map((p) => p.address),
    contactText: contact ? (pages.find((p) => p.address === contact)?.text ?? '') : '',
  };
}
