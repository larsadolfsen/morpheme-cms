// A unit's finding on a part of the theme (lib/accessibility.mjs): a theme value (target size) is classified, never failed; contrast is the site's colours (the colour
// editor's, owner 26 Nov 2026) and is printed for Material's demo colours only, never failed, and in no score. A theme value is measured into the theme's accessibility score by `check:contrast`
// (`morpheme accessibility`); only the base theme (0.22.3) is hard-checked for it. A finding the one rule (`kindOf`) does not place as either is our code and a problem, as before.
import { kindOf } from '../../../lib/accessibility.mjs';
import { activeTheme, isMaterialTheme } from '../../theme-statement.mjs';
import { problems } from './context.mjs';

/** Prints `message` as a theme value or a colour, or adds it to the problems when it is our code's. @param {string} criterion @param {string} part @param {string} message */
export function shortfall(criterion, part, message) {
  const kind = kindOf({ criterion }, activeTheme());
  if (kind === 'theme') console.log(`theme value ${criterion} (${part}), measured, not failed: ${message}`);
  else if (kind === 'colour') {
    // Material's demo colours are printed; another theme's are the site's own and are not printed. A colour never fails (owner, 26 Nov 2026: only the base theme adheres to WCAG).
    if (isMaterialTheme()) console.log(`colour ${criterion} (${part}), the colour editor's, not failed: ${message}`);
  } else problems.push(message);
}
