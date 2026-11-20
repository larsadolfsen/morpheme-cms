// The demo's Typography page shows each type style with the numbers the browser gives it (demo/public/demo-type.js). This puts the script in that
// page's built HTML only (run by scripts/demo-build.mjs after astro builds, never by the starter or a site). It is a same-origin script,
// which the pages' Content-Security-Policy already allows ('self'), so nothing is loosened.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** @param {string} site the demo site's folder @returns {number} pages that got the script (1, or 0 when the demo has no Typography page) */
export function addTypeView(site) {
  const file = join(site, 'dist/typography/index.html');
  if (!existsSync(file)) return 0;
  const html = readFileSync(file, 'utf8');
  if (!html.includes('</body>') || html.includes('/demo-type.js')) return 0;
  writeFileSync(file, html.replace('</body>', '<script src="/demo-type.js" defer></script></body>'));
  return 1;
}
