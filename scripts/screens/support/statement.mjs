// A unit's finding on a part of the theme (lib/accessibility.mjs): the theme in use may name it in its accessibility.json as a shortfall, and then the unit lets it
// through (and prints it); otherwise it is a problem, as before. The units run in shards, none sees the whole theme, so `check:screens` never calls a name stale: that is
// `check:contrast`'s, which measures every part.
import { activeStatement } from '../../theme-statement.mjs';
import { problems } from './context.mjs';

let named;
/** Whether the theme in use names `criterion` and `part`. */
const names = (criterion, part) =>
  (named ??= new Set(activeStatement().statement.fallsShort.map((e) => `${e.criterion} ${e.part}`))).has(`${criterion} ${part}`);

/** Adds `message` to the problems unless the theme in use names this criterion and part as a shortfall. @param {string} criterion @param {string} part @param {string} message */
export function shortfall(criterion, part, message) {
  if (names(criterion, part)) console.log(`falls short of ${criterion} (${part}), named in the theme's accessibility.json: ${message}`);
  else problems.push(message);
}
