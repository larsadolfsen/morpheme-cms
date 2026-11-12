import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { alignClass, alignHtml, alignOf, rehypeAlign } from './text-align.mjs';

test('an alignment line is written and read back', () => {
  assert.equal(alignHtml('center'), '<div data-align="center"></div>');
  assert.equal(alignHtml('left'), '');
  assert.equal(alignHtml(null), '');
  assert.equal(alignOf(alignHtml('right')), 'right');
  assert.equal(alignOf('<div data-align="left"></div>'), null);
  assert.equal(alignOf('<div data-align="center" onclick="x"></div>'), null);
  assert.equal(alignClass('center'), 'text-align-center');
  assert.equal(alignClass('left'), '');
});

test('the site puts the class on the block after the line and drops the line', async () => {
  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeAlign)
      .use(rehypeStringify)
      .process('<div data-align="center"></div>\n\nHello **you**\n\nPlain\n\n<div data-align="right"></div>\n\n### Title'),
  );
  assert.equal(html, '<p class="text-align-center">Hello <strong>you</strong></p>\n<p>Plain</p>\n<h3 class="text-align-right">Title</h3>');
});
