// Tests of sectionInView and spyLine (section-in-view.mjs): which of a form's sections is marked while the page scrolls.

import test from 'node:test';
import assert from 'node:assert/strict';
import { sectionInView, spyLine } from './section-in-view.mjs';

const order = ['content', 'status', 'seo'];

test('the last section whose top is above the line is in view', () => {
  assert.equal(sectionInView(order, { content: -500, status: 100, seo: 900 }, 300), 'status');
  assert.equal(sectionInView(order, { content: -500, status: -100, seo: 200 }, 300), 'seo');
});

test('with every top below the line, the first section with a top is in view', () => {
  assert.equal(sectionInView(order, { content: 400, status: 600, seo: 900 }, 300), 'content');
});

test('a section without a top (not drawn) is skipped', () => {
  assert.equal(sectionInView(order, { status: 500, seo: 900 }, 300), 'status');
  assert.equal(sectionInView(order, { content: -50, status: undefined, seo: 100 }, 300), 'seo');
});

test('no tops at all: nothing is in view', () => {
  assert.equal(sectionInView(order, {}, 300), undefined);
  assert.equal(sectionInView([], { content: 0 }, 300), undefined);
});

test('the order given decides, not the tops', () => {
  assert.equal(sectionInView(['seo', 'content'], { content: -10, seo: 20 }, 300), 'content');
});

test('the line is a third of the screen, or near its bottom at the bottom of the page', () => {
  assert.equal(spyLine(900, false), 300);
  assert.equal(spyLine(900, true), 804);
});
