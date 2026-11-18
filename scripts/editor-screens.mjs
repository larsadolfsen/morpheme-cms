// Opens every screen of the editor (/editor/) in a browser, on a phone and on a computer, and fails
// when one breaks: an error on the page, something its Content-Security-Policy stopped, an empty app, or a link to an
// address with nothing on it, or an icon that is not found (drawn as the question mark, data-icon-missing: Svg in
// packages/editor/src/icon.tsx), there or on one of the built site's pages. An icon drawn from Material Symbols instead
// of the icon pack (data-icon-fallback) is only listed, with where it is: it does not fail.
// The screens are found as the editor's own links: from the start screen (the drawer's links are in the page also while it is
// closed) and "Parts", #developer/parts, "Themes", #appearance/themes, "Search engine optimization", #seo, "Appstore", #settings/appstore, and "Apps", #apps, which the menu no longer links to; Connectors and Plugins, #installed/connectors and #installed/plugins, are its rows), and
// from each screen it opens, two steps down. GitHub is answered from the files in this repository, so it needs no login
// and changes nothing. It runs on the built site: npm run build && npm run check:screens (or on another
// folder with a built site, its path after the command: packages/editor/scripts/check-themes.mjs).
// It also checks the menu and Settings (#settings, the cog at the bottom of the menu): Settings lists exactly Appearance,
// Assistants, Block settings, Caching and builds, Components, Morpheme and Privacy, A-Z by their names; the drawer's first level has the three sections (Content, Business, Globals), the
// start screen, the rows under the "Apps" label (Store, Connectors, Plugins and Themes, each with an icon) and the cog, which is the last item at the bottom of the drawer and of the collapsed rail (and on a phone,
// of the modal drawer) and is marked on Settings' screens only; and "Morpheme" (#morpheme) shows its status as text, has
// an action on every list row, and its Update button and its connection to the store work.
//
// This file is the runner: it opens the browser (scripts/screens/support/context.mjs), collects the units and runs the ones of its
// shard. The units themselves are in scripts/screens/<area>.mjs, one file per area; each file exports `register(unit)`, which calls
// `unit(name, run)` for its units. A new unit goes in its area's file and nowhere else, so two pull requests that add different units
// never touch the same lines. The files are read in alphabetical order, and the units are numbered in the order of
// scripts/screens/order.txt (the units as they were numbered when the file was split; never edit it: a unit that is not in it is
// numbered after those that are, in the order of the files), so a shard K/N keeps the same units from run to run.
import { readFileSync, readdirSync } from 'node:fs';
import {
  AREAS_ARG,
  LIST_ONLY,
  ONLY,
  SHARD,
  SHARDS,
  browser,
  fallbackIcon,
  fallbackOn,
  opened,
  problems,
  server,
} from './screens/support/context.mjs';
import { coreSite } from './screens/support/shared.mjs';
import { AREAS, CORE_UNITS } from './screens/support/areas.mjs';
import { assignShards, readTimes } from './screens/support/balance.mjs';

/** Each area's file, in alphabetical order (support/ is a folder, so it is not one of them). */
const areaDir = new URL('./screens/', import.meta.url);
const files = readdirSync(areaDir)
  .filter((f) => f.endsWith('.mjs'))
  .sort();
const units = [];
let area = '';
const unit = (name, run) => units.push({ name, run, area });
for (const file of files) {
  area = file.replace(/\.mjs$/, '');
  (await import(new URL(file, areaDir).href)).register(unit);
}

// The units of the first numbering keep their place (the order of order.txt); the others follow, in the order they were registered.
const frozen = new Map(
  readFileSync(new URL('order.txt', areaDir), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((name, i) => [name, i]),
);
const place = (u) => frozen.get(u.name) ?? Infinity;
units.sort((a, b) => (place(a) === place(b) ? 0 : place(a) < place(b) ? -1 : 1));

/** The units a selection (--areas) keeps: the core units and the units of the named areas. Null runs everything: no --areas, `all`, or
 * a selection that cannot be read (an unknown area, a core unit that does not exist), as the job `changes` does when in doubt. */
function selectedUnits() {
  if (AREAS_ARG === null || AREAS_ARG === 'all') return null;
  const wanted = AREAS_ARG === 'none' ? [] : AREAS_ARG.split(',');
  const known = new Set(units.map((u) => u.name));
  const bad = [...wanted.filter((a) => !AREAS.includes(a)), ...CORE_UNITS.filter((n) => !known.has(n))];
  if (!AREAS_ARG || bad.length) {
    console.log(`The selection "${AREAS_ARG}" cannot be read (${bad.join(', ') || 'empty'}): every unit runs.`);
    return null;
  }
  const keep = new Set(units.filter((u) => CORE_UNITS.includes(u.name) || wanted.includes(u.area)));
  console.log(`Selection: core set and ${wanted.length ? wanted.join(', ') : 'no area'}: ${keep.size} of ${units.length} units.`);
  return keep;
}
const selected = selectedUnits();

/** One part of the checks that a shard runs whole or leaves out. The units are numbered in the order above (a selection keeps each
 * unit's number). The selected units (all of them without a selection) are dealt to the shards by their measured time
 * (scripts/screens/unit-times.json, support/balance.mjs), or by index % N when there are no times, so each selected unit runs in
 * exactly one shard and together the shards run all of them. */
const chosen = units.filter((u) => !selected || selected.has(u));
const times = readTimes();
const dealt = assignShards(
  chosen.map((u) => u.name),
  SHARDS,
  times,
);
const shardOf = new Map(chosen.map((u, i) => [u, dealt[i]]));
if (SHARDS > 1)
  console.log(times ? 'Units dealt to the shards by their measured time.' : 'No unit times: units dealt to the shards by number.');
const numbers = new Map(units.map((u, i) => [u, i]));
for (const u of chosen) {
  const { name, run } = u;
  const number = numbers.get(u);
  if (ONLY ? name !== ONLY : shardOf.get(u) !== SHARD - 1) continue;
  if (LIST_ONLY) {
    console.log(`UNIT ${number} ${name}`);
    continue;
  }
  const started = Date.now();
  await run();
  console.log(`unit ${number} ${name}: ${Math.round((Date.now() - started) / 1000)} s`);
}

await browser?.close();
server.close();
if (coreSite) (await coreSite).server.close();
for (const [name, places] of fallbackOn) {
  const shown = [...places].slice(0, 3).join(', ');
  console.log(`${shown}${places.size > 3 ? ` and ${places.size - 3} more places` : ''}: ${fallbackIcon(name)}`);
}
if (problems.length) {
  console.error(`${problems.length} errors in the editor or on the site:\n${[...new Set(problems)].join('\n')}`);
  process.exit(1);
}
console.log(`${opened.size} screens in the editor open without errors, on a phone and on a computer, and all icons exist.`);
