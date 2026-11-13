// Owner rule (14 Nov): with a pack that is not Phosphor's, nothing draws a Phosphor glyph. The system's packs must not hold
// Phosphor's own file for any icon (but the logos listed, with their reason), and the virtual set of all icons (allIconsModule)
// holds only the pack's icons when Phosphor is not the pack in use.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { allIconsModule } from './theme.mjs';

const PHOSPHOR = 'node_modules/@phosphor-icons/core/assets/';
const text = (f) => readFileSync(f, 'utf8').trim();
/** Phosphor's own glyphs a pack may hold, by pack: X's logo, which neither Material Symbols, Material Design Icons nor Lucide has (PHOSPHOR_FILL_ICONS). */
const ALLOWED = { 'material-symbols': ['x-logo'], lucide: ['x-logo'] };

for (const pack of ['material-symbols', 'lucide']) {
  test(`the ${pack} pack holds no Phosphor glyph but the allowed logos`, () => {
    const found = [];
    for (const file of readdirSync(`icons/${pack}`).filter((f) => f.endsWith('.svg'))) {
      const name = file.slice(0, -'.svg'.length);
      const mine = text(`icons/${pack}/${file}`);
      for (const own of [`${PHOSPHOR}regular/${name}.svg`, `${PHOSPHOR}fill/${name}-fill.svg`, `${PHOSPHOR}fill/${name}.svg`])
        if (existsSync(own) && text(own) === mine) found.push(name);
      // A logo drawn from Phosphor's filled icon is the same drawing in another file: its viewBox is Phosphor's.
      if (mine.includes('viewBox="0 0 256 256"')) found.push(name);
    }
    const unexpected = [...new Set(found)].filter((n) => !ALLOWED[pack].includes(n));
    assert.deepEqual(unexpected, [], `Phosphor glyphs in the ${pack} pack: add Material mappings in site/icons.mjs and run npm run icons`);
  });
}

test('the set of all icons holds none of Phosphor’s own when only the pack’s are asked for', () => {
  const folder = `${PHOSPHOR}regular/`;
  const icons = { house: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M1 1"/></svg>' };
  const themed = JSON.parse(
    allIconsModule(folder, icons, true)
      .replace(/^export const allIcons = /, '')
      .replace(/;$/, ''),
  );
  assert.deepEqual(Object.keys(themed), [`/node_modules/@phosphor-icons/core/assets/regular/house.svg`]);
  const all = JSON.parse(
    allIconsModule(folder, icons)
      .replace(/^export const allIcons = /, '')
      .replace(/;$/, ''),
  );
  assert.ok(Object.keys(all).length > 1000);
});
