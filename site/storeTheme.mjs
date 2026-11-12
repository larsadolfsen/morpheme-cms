// Keeps a store theme's CSS to imports from the CMS and its own files, which is all that is there on a site that
// installs it. Exposes storeImportProblems, the problems in one CSS file's imports. Depends on node:path only.
import { posix } from 'node:path';

/** What is wrong with the imports in a store theme's CSS file.
 * @param {string} css the file's text
 * @param {string} file its path in the theme, e.g. 'styles/global.css'
 * @returns {string[]}
 */
export function storeImportProblems(css, file) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // One pass over both forms, so the targets come in the order they appear in the text.
  const targets = [];
  const targetRe = /@import\s+(['"])(.*?)\1|url\(\s*(['"]?)(.*?)\3\s*\)/g;
  let match;
  while ((match = targetRe.exec(text))) targets.push(match[2] !== undefined ? match[2] : match[4].trim());

  return targets
    .filter((target) => {
      if (target.startsWith('data:')) return false;
      if (target.startsWith('@morphemecms/cms/')) return false;
      if (target.startsWith('./') || target.startsWith('../')) {
        const joined = posix.normalize(posix.join(posix.dirname(file), target));
        if (joined !== '..' && !joined.startsWith('../')) return false;
      }
      return true;
    })
    .map((target) => `${file}: a theme in the store may only import from @morphemecms/cms and its own files, not "${target}".`);
}
