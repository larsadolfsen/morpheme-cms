// The accessibility statement of a theme in a site's checks (lib/accessibility.mjs): `statementOf(theme)` reads its accessibility.json, `activeStatement()` the
// theme in use's (`src/data/theme.json`). Run from the site's root, as the checks are. The standard theme, Material (id `saturn`), is this package's `theme/`; another
// theme is `src/themes/<theme>/` (what `themeFolder` in site/theme.mjs says; it is not imported here, so the unit tests, which run outside a site, can load this file).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readStatement } from '../lib/accessibility.mjs';

const STANDARD_THEME = 'saturn';

/** The theme's statement, and where the messages say it is. @param {string} theme */
export function statementOf(theme) {
  const folder = theme === STANDARD_THEME ? fileURLToPath(new URL('../theme', import.meta.url)) : join(process.cwd(), 'src/themes', theme);
  const where = theme === STANDARD_THEME ? 'theme/accessibility.json' : `src/themes/${theme}/accessibility.json`;
  return { statement: readStatement(folder), where };
}

export const activeTheme = () => JSON.parse(readFileSync(join(process.cwd(), 'src/data/theme.json'), 'utf8')).theme;
export const activeStatement = () => statementOf(activeTheme());

/** Whether the theme in use is Material, the standard theme. Only Material follows Material 3's values exactly (owner, 21 Nov 2026); another theme has its own design and is checked for the contract and WCAG 2.2 AA. */
export const isMaterialTheme = () => activeTheme() === STANDARD_THEME;
