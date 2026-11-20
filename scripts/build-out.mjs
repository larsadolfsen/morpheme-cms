// The folder a check builds the site into. It lives inside the project (in .astro/, which a site's .gitignore already
// has), never in os.tmpdir(): Astro renames files from .astro/.prerender/ into the out dir, and rename fails with EXDEV
// when the temp folder is on another device than the project (a CI runner's /tmp, a tmpfs).
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';

/** A fresh, empty folder in `<root>/.astro/`; the caller removes it afterwards. */
export const buildOutDir = (root, label) => {
  const parent = join(root, '.astro', 'check-out');
  mkdirSync(parent, { recursive: true });
  return mkdtempSync(join(parent, `${label}-`));
};
