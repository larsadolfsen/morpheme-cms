// The CMS's demo site: a made-up site about Morpheme itself, with pages, blog posts, pictures and settings of its
// own, and nothing of any real site's. It is the starter (starter/, the site a new site begins with) with demo/ laid on
// top: demo/ holds only what differs (its pages and posts, the data files it changes, its src/site/ parts, its logo,
// icons and pictures), so the two cannot drift apart. demoSite() puts it in a folder of its own with one of the site's
// themes, ready to build: the pictures of the themes are taken of it (theme-screenshots.mjs), so a theme is never shown
// with a site's own content. `morpheme check:demo` builds it with the standard theme and checks its content
// (check-demo.mjs), so it keeps up with the CMS.
import { cpSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { STANDARD_THEME, themeFolder } from '@morpheme/cms/site/theme.mjs';

const STARTER = fileURLToPath(new URL('../starter/', import.meta.url));
const DEMO = fileURLToPath(new URL('../demo/', import.meta.url));

/** The demo site in a new folder, with the theme (a folder in the site's src/themes/, or the standard theme) as its theme,
 * the site's packages and its pictures' smaller sizes (`morpheme images`), from the site at `root`. Its folder;
 * the caller deletes it. */
export function demoSite(theme = STANDARD_THEME, root = process.cwd()) {
  // In the site's .morpheme/ (git-ignored), not the system's temporary folder: Astro takes a file in a folder that has
  // no folder in common with the site's root (the CMS's theme) as one in the root. Not in node_modules/ either, where Node
  // runs no TypeScript.
  const cache = join(root, '.morpheme/demo');
  mkdirSync(cache, { recursive: true });
  const dir = mkdtempSync(join(cache, `${theme}-`));
  // The starter's site without its pages (the demo has its own, at other addresses), then the demo over it.
  const content = join(STARTER, 'src/content');
  cpSync(STARTER, dir, {
    recursive: true,
    filter: (from) => !(from + sep).startsWith(content + sep) && !relative(STARTER, from).startsWith('node_modules'),
  });
  cpSync(DEMO, dir, { recursive: true });
  if (theme !== STANDARD_THEME) cpSync(join(root, themeFolder(theme)), join(dir, 'src/themes', theme), { recursive: true });
  writeFileSync(join(dir, 'src/data/theme.json'), `${JSON.stringify({ theme }, null, 2)}\n`);
  // The site's packages: its node_modules/ (a junction, which Windows makes without the rights a symbolic link needs). The
  // starter's package.json names them, as a site's does, which Astro reads to know which packages to build with the site.
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'), 'junction');
  for (const script of ['responsive-images', 'video-thumbnails'])
    execFileSync(process.execPath, [fileURLToPath(new URL(`${script}.mjs`, import.meta.url))], { cwd: dir, stdio: 'inherit' });
  return dir;
}
