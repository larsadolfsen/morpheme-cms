// Tests of the pure parts of the screen reader check (scripts/announce.mjs, scripts/allowlist.mjs). Run: node --test scripts/announce.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeAllowlist } from './allowlist.mjs';
import { BLOCK_PAGES, announceWalks, badName, blockPagesLeft, isAuthored, judgeWindow, nameProblem, speech } from './announce.mjs';
import { blockPages, demoBlockPages } from './demo-blocks.mjs';

test('a name that is an icon, punctuation, a role, a file or an id is bad', () => {
  assert.equal(nameProblem('', 'button'), 'no-name');
  assert.equal(nameProblem('more_vert', 'button'), 'icon-name');
  assert.equal(nameProblem('arrowBack Back', 'button'), 'icon-name');
  assert.equal(nameProblem('…', 'button'), 'bad-name');
  assert.equal(nameProblem('Button', 'button'), 'bad-name');
  assert.equal(nameProblem('photo.jpg', 'link'), 'bad-name');
  assert.equal(nameProblem('3f2b8c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f', 'link'), 'bad-name');
  assert.equal(nameProblem('Remove Contact', 'button'), null);
  assert.equal(nameProblem('Save', 'button'), null);
  assert.equal(badName('Add tag', 'button'), null);
});

const at = (t, text, region, extra = {}) => ({ t, kind: 'live', text, urgency: 'polite', region, inserted: false, ...extra });

test('a step that must be announced needs a text from a region that was there before', () => {
  assert.deepEqual(judgeWindow([], { expect: { urgent: false } }), ['no-announcement']);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1, { unreachable: true })], { expect: { urgent: false } }), ['no-announcement']);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1, { inserted: true })], { expect: { urgent: false } }), ['no-announcement']);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1)], { expect: { urgent: false } }), []);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1)], {}), []);
});

test('a step may say what must be said', () => {
  const expect = { urgent: false, text: /block \d+ of \d+, selected/ };
  assert.deepEqual(judgeWindow([at(1, 'Notice, block 2 of 3, selected', 1)], { expect }), []);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1)], { expect }), ['wrong-announcement']);
  assert.deepEqual(judgeWindow([], { expect }), ['no-announcement']);
});

test('the same text from two regions within a second is said twice, from one region it is not', () => {
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1), at(300, 'Saved', 2)]), ['double-announcement']);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1), at(300, 'Saved', 1)]), []);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1), at(2000, 'Saved', 2)]), []);
});

test('an error must be urgent and a status must not', () => {
  assert.deepEqual(judgeWindow([at(1, 'Not saved', 1)], { expect: { urgent: true } }), ['wrong-urgency']);
  assert.deepEqual(judgeWindow([at(1, 'Not saved', 1, { urgency: 'urgent' })], { expect: { urgent: false } }), ['wrong-urgency']);
  assert.deepEqual(judgeWindow([at(1, 'Not saved', 1, { urgency: 'urgent' })], { expect: { urgent: true } }), []);
});

test('the speech of a node: heading level, name, role and states', () => {
  const node = (role, name, props = []) => ({
    role: { value: role },
    name: { value: name },
    properties: props.map(([n, v]) => ({ name: n, value: { value: v } })),
  });
  assert.equal(speech(node('heading', 'Pages', [['level', 1]])).text, 'Heading level 1, Pages');
  assert.equal(speech(node('button', 'More', [['expanded', true]])).text, 'More, button, expanded');
  assert.equal(speech(node('button', '')).text, '(no name), button');
});

test('the allowlist matching: a finding it does not hold and an entry that found nothing are both problems', () => {
  const list = makeAllowlist({ file: new URL('x-allowlist.json', import.meta.url), field: 'problem', label: 'x', collectEnv: 'X_COLLECT' });
  const found = list.keysOf([{ problem: 'no-name', selector: 'button.a' }], '#home', 'computer');
  const allowed = list.allowedKeys([
    { problem: 'tab-state', selector: 'button.b', places: ['#home'], viewports: ['computer', 'phone'], reason: 'r' },
  ]);
  const { unexpected, stale } = list.compare(found, allowed);
  assert.deepEqual(unexpected, ['no-name on #home (computer): button.a']);
  assert.equal(stale.length, 2);
  const entries = list.entriesOf(new Set([...found, ...list.keysOf([{ problem: 'no-name', selector: 'button.a' }], '#home', 'phone')]));
  assert.deepEqual(entries, [
    { problem: 'no-name', selector: 'button.a', places: ['#home'], viewports: ['phone', 'computer'], reason: 'TODO' },
  ]);
});

test('the name walk reads the editor screens and one Blocks page per block, never the other content (owner, 21 Nov 2026)', () => {
  for (const hash of [
    '',
    'settings',
    '#developer/parts/ui',
    'licenses/editions%2F0.19',
    'list/pages',
    'new/pages',
    'blocks/buttons',
    'appearance/themes/saturn',
  ])
    assert.equal(announceWalks(hash), true, hash);
  for (const hash of [
    'src/content/pages/home.md',
    '#src/content/pages/typography.md',
    'src/content/blog/every-save-is-a-version.md',
    'src/content/pages/zz-check-page.md',
    'src/content/pages/blocks.md',
    'src/data/categories/seo.json',
    'src/data/popups/booking-bar.json',
    'src%2Fcontent%2Fpages%2Fabout.md',
  ])
    assert.equal(announceWalks(hash), false, hash);
  assert.equal(announceWalks('src/content/pages/blocks-cards.md'), true);
  assert.equal(announceWalks('#src/content/pages/blocks-cards.md?block=2'), true);
});

test('every block has its Blocks page in the walk, and the pages left are walked after the links', () => {
  const { pages } = demoBlockPages();
  assert.deepEqual(
    BLOCK_PAGES.toSorted(),
    Object.keys(pages)
      .map((slug) => `src/content/pages/blocks-${slug}.md`)
      .toSorted(),
  );
  assert.equal(BLOCK_PAGES.length, Object.keys(blockPages).length);
  for (const hash of BLOCK_PAGES) assert.equal(announceWalks(hash), true, hash);
  assert.deepEqual(blockPagesLeft([]), BLOCK_PAGES);
  assert.deepEqual(blockPagesLeft(['settings', ...BLOCK_PAGES.slice(1)]), [BLOCK_PAGES[0]]);
  assert.deepEqual(blockPagesLeft(BLOCK_PAGES.map((h) => `#${h}`)), []);
});

test("a link or text in a text area is the site owner's; the text area and the editor's islands in it are not", () => {
  // A small stand-in for the DOM: an element with its attributes and parent, and `closest` as the browser has it.
  const el = (attrs = {}, parent = null) => ({
    attrs,
    parentElement: parent,
    getAttribute: (name) => attrs[name] ?? null,
    closest(selector) {
      const wanted = selector.split(',').map((s) => s.trim());
      for (let node = this; node; node = node.parentElement)
        if (wanted.some((w) => (w === '[contenteditable]' ? 'contenteditable' in node.attrs : node.attrs.role === 'textbox'))) return node;
      return null;
    },
  });
  const screen = el();
  const prose = el({ role: 'textbox', contenteditable: 'true' }, screen);
  const link = el({}, el({}, prose));
  const card = el({ contenteditable: 'false' }, prose);
  const handle = el({}, card);
  const inlineText = el({ role: 'textbox', contenteditable: 'true' }, card);
  const typed = el({}, inlineText);
  const field = el({ role: 'textbox' }, screen);
  assert.equal(isAuthored(link), true);
  assert.equal(isAuthored(typed), true);
  assert.equal(isAuthored(el({}, field)), true);
  assert.equal(isAuthored(prose), false);
  assert.equal(isAuthored(card), false);
  assert.equal(isAuthored(handle), false);
  assert.equal(isAuthored(inlineText), false);
  assert.equal(isAuthored(el({}, screen)), false);
});
