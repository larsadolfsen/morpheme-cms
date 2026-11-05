// File access for the theme coverage: reads Material's CSS chain and a theme's own CSS, and builds the source of
// the virtual module `virtual:theme-coverage`. Exposes materialCssOf, themeOwnCss, coverageModule.
// Uses site/theme.mjs (themeFolder, STANDARD_THEME), site/themeParts.mjs and site/themeCoverage.mjs.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STANDARD_THEME, themeFolder } from './theme.mjs';
import { THEME_PARTS } from './themeParts.mjs';
import { themeCoverage } from './themeCoverage.mjs';

/** Material's CSS files that carry the parts' classes, in this order. */
const MATERIAL_FILES = ['base.css', 'ui.css', 'components.css', 'global.css'];

/** A relative `@import './x.css';`, `@import "../x.css";` or `@import url(./x.css);`. */
const IMPORT = /@import\s+(?:url\(\s*)?(['"]?)(\.{1,2}\/[^'")\s;]+)\1\s*\)?[^;]*;/g;

/**
 * Material's CSS (base, ui, components, global) as one text.
 * @param {string} stylesDir
 * @returns {string}
 */
export function materialCssOf(stylesDir) {
  return MATERIAL_FILES.map((f) => readFileSync(join(stylesDir, f), 'utf8')).join('\n');
}

/**
 * A theme's own CSS: the file and its relative @imports, depth-first, each file once. A package import is skipped.
 * @param {string} globalCssFile
 * @returns {string}
 */
export function themeOwnCss(globalCssFile) {
  const seen = new Set();
  const texts = [];
  const read = (file) => {
    const path = resolve(file);
    if (seen.has(path)) return;
    seen.add(path);
    let css;
    try {
      css = readFileSync(path, 'utf8');
    } catch (error) {
      throw new Error(`Cannot read ${path}: ${error.message}`);
    }
    texts.push(css);
    for (const match of css.matchAll(IMPORT)) read(join(dirname(path), match[2]));
  };
  read(globalCssFile);
  return texts.join('\n');
}

/**
 * The source of `virtual:theme-coverage`: `null` for the standard theme, else `{ theme, parts }`.
 * @param {string} theme
 * @returns {string}
 */
export function coverageModule(theme) {
  if (theme === STANDARD_THEME) return 'export default null;';
  const materialCss = materialCssOf(fileURLToPath(new URL('../theme/styles/', import.meta.url)));
  const themeCss = themeOwnCss(join(process.cwd(), themeFolder(theme), 'styles', 'global.css'));
  const parts = themeCoverage({ materialCss, themeCss, parts: THEME_PARTS });
  return `export default ${JSON.stringify({ theme, parts })};`;
}
