// A unit's finding on a part of the theme (lib/accessibility.mjs): a theme value (contrast, target size) is classified, never failed. It is printed here and measured into the
// theme's accessibility score by `check:contrast` (`morpheme accessibility`); only the base theme (0.22.3) is hard-checked for it. A finding the one rule (`kindOf`) does not
// place as a theme value is our code and a problem, as before.
import { kindOf } from '../../../lib/accessibility.mjs';
import { activeTheme } from '../../theme-statement.mjs';
import { problems } from './context.mjs';

/** Prints `message` as a theme value, or adds it to the problems when it is our code's. @param {string} criterion @param {string} part @param {string} message */
export function shortfall(criterion, part, message) {
  if (kindOf({ criterion }, activeTheme()) === 'theme') console.log(`theme value ${criterion} (${part}), measured, not failed: ${message}`);
  else problems.push(message);
}
