// A list item is as many lines as it has text (List.tsx; Material 3, Lists: one-line 56 dp, two-line 72 dp, three-line 88 dp). React components cannot be
// imported by `node --test`, so this reads the source: the part decides its lines from text that is really there (null, false, an empty or blank text
// and a non-breaking space are none), and the editor's pages list gives no supporting text when it has nothing to say in it. `check:screens` measures the
// real rows (`checkListItemLines`: 56 dp and centred for a headline alone, 72 dp and more with a supporting text).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const list = read('./List.tsx');
const library = read('../../src/Library.tsx');

test('ListItem counts a blank or non-breaking supporting text as no line', () => {
  assert.match(list, /const shown = \(v: ReactNode\) => .*v\.trim\(\) === ''/, 'shown() does not treat a blank text as none');
  assert.match(
    list,
    /const n: ListItemLines = lines \?\? \(shown\(subhead\) && shown\(supporting\)/,
    'the lines come from shown(), not `!== undefined`',
  );
  assert.doesNotMatch(list, /supporting !== undefined/, 'an empty supporting text reserves a second line again');
});

test('the pages list reserves no second line with a non-breaking space', () => {
  assert.doesNotMatch(library, /['"`]\\u00a0['"`]/, 'Library.tsx fills a row with a non-breaking space to keep its height');
  assert.match(
    library,
    /if \(!address && !status && !line\) return undefined;/,
    'a row with nothing under its name gets no supporting text',
  );
});
