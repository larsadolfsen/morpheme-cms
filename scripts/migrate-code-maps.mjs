// Makes lib/migrate-code-maps.mjs, the old-name maps that lib/migrate-code.mjs rewrites a site's own themes and apps with (docs/superpowers/specs/2026-11-20-material-3-names-design.md,
// Migration 2). The Worker's update cannot read files, so the maps are a module, made from the three sources and kept equal to them (`--check`, run by the test):
//   tokens6   scripts/renamed-tokens.json (contract 6 and the token rename of 0.19.6: old custom property -> new);
//   tokens7   contract 7's custom properties (docs/superpowers/plans/mo-names/map.json, `properties`: old -> new);
//   classes7  contract 7's classes (the same file, `classes`: old -> new, only those with a new name);
//   m3        scripts/m3-names.json: `tokens`, `classes` and `props` (the names of Material 3, contract 8).
// Run: node scripts/migrate-code-maps.mjs [--check]. This file and the maps module keep the old names on purpose (check:token-names does not read the module).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const read = (p) => JSON.parse(readFileSync(here(p), 'utf8'));

/** The maps made from the sources. */
export function makeMaps() {
  const c7 = read('../docs/superpowers/plans/mo-names/map.json');
  const only = (entries) =>
    Object.fromEntries(Object.entries(entries).flatMap(([old, e]) => (typeof e.new === 'string' ? [[old, e.new]] : [])));
  const m3 = read('./m3-names.json');
  return {
    tokens6: read('./renamed-tokens.json'),
    tokens7: only(c7.properties),
    classes7: only(c7.classes),
    m3: { tokens: m3.tokens, classes: m3.classes, props: m3.props },
  };
}

const HEADER = `// Made by scripts/migrate-code-maps.mjs from scripts/renamed-tokens.json, docs/superpowers/plans/mo-names/map.json and scripts/m3-names.json: do not edit.
// The old names that lib/migrate-code.mjs rewrites (it keeps old names on purpose: check:token-names does not read this file).
`;

export const render = () => `${HEADER}export default ${JSON.stringify(makeMaps(), null, 1)};\n`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = here('../lib/migrate-code-maps.mjs');
  if (process.argv.includes('--check')) {
    let now = '';
    try {
      now = readFileSync(file, 'utf8');
    } catch {}
    if (now !== render()) {
      console.error('lib/migrate-code-maps.mjs is out of date. Run: node scripts/migrate-code-maps.mjs');
      process.exit(1);
    }
    console.log('lib/migrate-code-maps.mjs is up to date.');
  } else {
    writeFileSync(file, render());
    console.log('Wrote lib/migrate-code-maps.mjs');
  }
}
