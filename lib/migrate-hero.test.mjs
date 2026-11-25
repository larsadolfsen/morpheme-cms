// Tests for lib/migrate-hero.mjs: a Banner (type "hero") of 0.15, 0.16 or 0.17 is migrated by 0.18's migrateMarkdown alone, to the
// text 0.17's migrate and then 0.18's migrate gave. Run: node --test lib/migrate-hero.test.mjs
//
// How the expected texts were derived (19 Nov 2026): lib/fixtures/hero-migration.json holds each case's `input` (what a 0.15 or 0.16
// site has: the Banner block, with a Buttons block that has an elevated button) and its `expected` text. `expected` was made by
// extracting `lib` of the tag v0.17.0 (git archive), running that migrateMarkdown on `input`, then this branch's migrateMarkdown on the
// result (what the editor did before: 0.17's migrate, then 0.18's). It is a fixture, not computed here, so 0.17's code is not needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blocksIn } from './blocks.mjs';
import { migrateMarkdown } from './migrate-content.mjs';

const cases = JSON.parse(readFileSync(new URL('./fixtures/hero-migration.json', import.meta.url), 'utf8'));
const hasHero = (text) => blocksIn(text, true).some((b) => b.type === 'hero');

// A Banner that migrates leaves no "hero" block, which is what check:content fails on (src/registry.tsx, "The block … no longer exists").
for (const name of ['alone', 'top015', 'topBehind016', 'ownHeadingPicture', 'altPicture']) {
  test(`${name}: migrated by 0.18 alone, the text of 0.17 then 0.18, no hero left, and stable`, () => {
    const { input, expected } = cases[name];
    assert.ok(hasHero(input));
    const migrated = migrateMarkdown(input);
    assert.equal(migrated, expected);
    assert.ok(!hasHero(migrated));
    assert.equal(migrateMarkdown(migrated), migrated);
  });
}

test('the image behind the front page’s Banner does not stay on the H1 (0.18 has no page top image)', () => {
  const migrated = migrateMarkdown(cases.topBehind016.input);
  assert.ok(!migrated.includes('data-picture'));
});

test('data-picture and data-alt of a Banner under an H2 stay on its marker; a decorative image has no data-alt', () => {
  assert.match(migrateMarkdown(cases.altPicture.input), /data-picture="\/images\/a.jpg" data-alt="A \[field\]"/);
  const decorative = migrateMarkdown(cases.ownHeadingPicture.input);
  assert.match(decorative, /data-picture="\/images\/a.jpg" data-width="full"/);
  assert.doesNotMatch(decorative, /data-alt/);
});

// What 0.17 did with a Banner that is not alone in its section, has no heading of its own, or is hidden: it stayed a Banner block
// (0.17 still had the block). The text is the same now; check:content still names it, and the owner removes it by hand.
for (const name of ['notAlone', 'noHeading', 'hidden']) {
  test(`${name}: left as 0.17 left it`, () => {
    const { input, expected } = cases[name];
    assert.equal(migrateMarkdown(input), expected);
    assert.ok(hasHero(expected));
  });
}

// Sara's tesy.md: a Banner with no text and no H1 migrates to nothing (the block goes, the rest of the page stays), whether it sits
// under an H1 or in the middle of the page, and also when it is hidden; running it again changes nothing.
for (const [name, input, expected] of [
  ['empty under an H1', '# Page\n\n<div data-block="hero" data-props="{}"></div>\n\nText\n', '# Page\n\nText\n'],
  [
    'empty with a blank text',
    '# Page\n\nText\n\n<div data-block="hero" data-props="{&quot;text&quot;:&quot; &quot;}"></div>\n\n## Two\n',
    '# Page\n\nText\n\n## Two\n',
  ],
  ['empty and not alone', '## One\n\n<div data-block="hero" data-props="{&quot;hidden&quot;:true}"></div>\n\ntext\n', '## One\n\ntext\n'],
]) {
  test(`${name}: removed, the rest of the page kept`, () => {
    assert.ok(hasHero(input));
    const migrated = migrateMarkdown(input);
    assert.equal(migrated, expected);
    assert.ok(!hasHero(migrated));
    assert.equal(migrateMarkdown(migrated), migrated);
  });
}
