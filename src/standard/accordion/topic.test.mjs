// Tests the placeholder of the shared text of "Expandable list" (topic.mjs): both {topic} and the old one are read, {topic} is written. language-ok
// Run: node --test src/standard/accordion/topic.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { partValues } from '../../partValues.mjs';
import { filledLink, upgradeMore } from './topic.mjs';

const OLD = 'Read more about {emne}'; // language-ok: a text a site saved before the rename
const NEW = 'Read more about {topic}';
const part = { at: 'accordion', names: ['more'], defaults: { more: 'Read more about {topic}' }, upgradeValues: upgradeMore };

test('a stored text with the old placeholder renders', () => {
  assert.equal(filledLink(OLD, 'prices'), 'Read more about prices');
});

test('a stored text with {topic} renders', () => {
  assert.equal(filledLink(NEW, 'prices'), 'Read more about prices');
});

test('a text with no placeholder stays, and another name stays as it is', () => {
  assert.equal(filledLink('Read more', 'x'), 'Read more');
  assert.equal(filledLink('Read {other}', 'x'), 'Read {other}');
});

test('the value is put in as it is, even with $ in it', () => {
  assert.equal(filledLink(NEW, 'a $& b'), 'Read more about a $& b');
});

test('the form shows {topic} for a stored old placeholder', () => {
  assert.deepEqual(partValues({ accordion: { more: OLD } }, part), { more: NEW });
});

test('the form shows a stored {topic} as it is, and the default when nothing is stored', () => {
  assert.deepEqual(partValues({ accordion: { more: NEW } }, part), { more: NEW });
  assert.deepEqual(partValues({}, part), { more: 'Read more about {topic}' });
});

test('a second save changes nothing: what the form wrote reads and writes back the same', () => {
  const first = partValues({ accordion: { more: OLD } }, part);
  // The save puts the form's values in the file, as usePartForm does.
  const written = { accordion: { ...first } };
  assert.deepEqual(partValues(written, part), first);
  assert.equal(JSON.stringify({ accordion: { ...partValues(written, part) } }), JSON.stringify(written));
  assert.equal(upgradeMore(upgradeMore({ more: OLD })).more, NEW);
});

test('only the exact placeholder is replaced, every time it occurs, and other values are not touched', () => {
  assert.equal(upgradeMore({ more: '{emne} and {emne}' }).more, '{topic} and {topic}'); // language-ok
  assert.equal(upgradeMore({ more: '{emnet}' }).more, '{emnet}'); // language-ok
  const same = { more: NEW };
  assert.equal(upgradeMore(same), same);
});

test('a name that holds a placeholder is not filled again', () => {
  assert.equal(filledLink('Read more about {topic}', '{topic}'), 'Read more about {topic}');
});
