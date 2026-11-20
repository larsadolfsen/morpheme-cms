// Owner rule (14 Nov): with a pack that is not Phosphor's, nothing draws a Phosphor glyph. The system's packs must not hold
// Phosphor's own file for any icon (but the logos listed, with their reason), and the virtual set of all icons (allIconsModule)
// holds only the pack's icons when Phosphor is not the pack in use.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// theme.mjs imports this package by its name, which only works from an installed copy: point the name at this folder.
const PACKAGE = '@morphemecms/cms/';
const pkg = new URL('../', import.meta.url);
registerHooks({
  resolve: (specifier, context, next) =>
    specifier.startsWith(PACKAGE) ? next(new URL(specifier.slice(PACKAGE.length), pkg).href, context) : next(specifier, context),
});
const { allIconsModule } = await import('./theme.mjs');

const PHOSPHOR = 'node_modules/@phosphor-icons/core/assets/';
const text = (f) => readFileSync(f, 'utf8').trim();

for (const pack of ['material-symbols', 'lucide']) {
  test(`the ${pack} pack holds no Phosphor glyph`, () => {
    const found = [];
    for (const file of readdirSync(`icons/${pack}`).filter((f) => f.endsWith('.svg'))) {
      const name = file.slice(0, -'.svg'.length);
      const mine = text(`icons/${pack}/${file}`);
      for (const own of [`${PHOSPHOR}regular/${name}.svg`, `${PHOSPHOR}fill/${name}-fill.svg`, `${PHOSPHOR}fill/${name}.svg`])
        if (existsSync(own) && text(own) === mine) found.push(name);
      // The same drawing in another file: its viewBox is Phosphor's.
      if (mine.includes('viewBox="0 0 256 256"')) found.push(name);
    }
    const unexpected = [...new Set(found)];
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

const OFFICIAL_X =
  'M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z';

for (const pack of ['material-symbols', 'lucide']) {
  test(`the ${pack} pack draws X's official logo, centred in a square, in the text's colour`, () => {
    const svg = text(`icons/${pack}/x-logo.svg`);
    assert.ok(svg.includes(`d="${OFFICIAL_X}"`), 'the official path, unchanged');
    assert.match(svg, /viewBox="-13\.5 0 1227 1227"/);
    assert.ok(!/#[0-9a-f]{3,6}|white|black/i.test(svg.replace(OFFICIAL_X, '')), 'no fixed colour');
  });
}
