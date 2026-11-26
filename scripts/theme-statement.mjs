// The accessibility statement of a theme in a site's checks (lib/accessibility.mjs): `statementOf(theme)` reads its accessibility.json, `activeStatement()` the
// theme in use's (`src/data/theme.json`). Run from the site's root, as the checks are. The standard theme, Material (id `saturn`), is this package's `theme/`; another
// theme is `src/themes/<theme>/` (what `themeFolder` in site/theme.mjs says; it is not imported here, so the unit tests, which run outside a site, can load this file).
// The statement is a measured result, never a gate: no check fails on it (spec 2026-11-25-themes-classified-design.md).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readStatement } from '../lib/accessibility.mjs';

const STANDARD_THEME = 'saturn';

/** The folder of a theme's files and where the messages say its statement is. @param {string} theme */
export function statementPlace(theme) {
  const standard = theme === STANDARD_THEME;
  return {
    folder: standard ? fileURLToPath(new URL('../theme', import.meta.url)) : join(process.cwd(), 'src/themes', theme),
    where: standard ? 'theme/accessibility.json' : `src/themes/${theme}/accessibility.json`,
  };
}

/** The theme's statement (`null` when it has none: not measured), and where the messages say it is. @param {string} theme */
export function statementOf(theme) {
  const { folder, where } = statementPlace(theme);
  return { statement: readStatement(folder), where };
}

export const activeTheme = () => JSON.parse(readFileSync(join(process.cwd(), 'src/data/theme.json'), 'utf8')).theme;
export const activeStatement = () => statementOf(activeTheme());

/** Whether the theme in use is Material, the standard theme. Only Material follows Material 3's values exactly (owner, 21 Nov 2026): that is M3 fidelity, a hard check for Material only, not WCAG. */
export const isMaterialTheme = () => activeTheme() === STANDARD_THEME;
