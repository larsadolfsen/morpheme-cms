// Tests pageH1 in sections.mjs: a page's H1 is the first "# …" line of its text outside code, wherever it is.
// Run with `node --test packages/editor/src/*.test.mjs` (part of npm run check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageH1 } from './sections.mjs';

test('an H1 on the first line, as before', () => {
  assert.deepEqual(pageH1('# Title\n\nText'), { heading: 'Title', html: undefined, rest: 'Text' });
});

test('blank lines above the H1 are skipped', () => {
  const found = pageH1('\n \n# Title\n\n\nText');
  assert.equal(found.heading, 'Title');
  assert.equal(found.rest, 'Text');
});

test('an H1 after some text: the text stays, without the H1', () => {
  const found = pageH1('Intro\n\n# Title\n\nMore\n\n## Section');
  assert.equal(found.heading, 'Title');
  assert.equal(found.rest, 'Intro\n\nMore\n\n## Section');
});

test('an H1 after a heading is found too', () => {
  const found = pageH1('## Section\n\ntext\n\n# Title');
  assert.equal(found.heading, 'Title');
  assert.equal(found.rest, '## Section\n\ntext');
});

test('only the first H1 counts, the next stays in the text', () => {
  const found = pageH1('# One\n\n# Two\n\ntext');
  assert.equal(found.heading, 'One');
  assert.equal(found.rest, '# Two\n\ntext');
});

test('an H1 line in a code fence is not a heading', () => {
  const found = pageH1('```\n# not a heading\n```\n\n# Real');
  assert.equal(found.heading, 'Real');
  assert.equal(found.rest, '```\n# not a heading\n```');
  assert.equal(pageH1('~~~\n# code\n~~~').heading, undefined);
});

test('without an H1: no heading, the text as it is', () => {
  assert.deepEqual(pageH1('## Only\n\ntext'), { heading: undefined, rest: '## Only\n\ntext' });
  assert.deepEqual(pageH1(undefined), { heading: undefined, rest: '' });
});

test('an H2 or "#tag" is not an H1', () => {
  assert.equal(pageH1('## Two\n\n#tag').heading, undefined);
});

test('the heading is plain text: bold, links and escapes are gone', () => {
  assert.equal(pageH1('Intro\n\n# A **bold** [link](/x) title').heading, 'A bold link title');
});

test('Windows line endings are kept in the rest', () => {
  const found = pageH1('Intro\r\n\r\n# Title\r\n\r\nMore');
  assert.equal(found.heading, 'Title');
  assert.equal(found.rest, 'Intro\r\n\r\nMore');
});
