// Run: node --test lib/google-result.test.mjs
// Tests src/googleResult.mjs: the title, description and address line of a page's Google result and the bold keyword parts.
// Depends on node:test, node:assert/strict and ../src/googleResult.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boldParts, pageTitle, searchedAs, searchCrumbs } from '../src/googleResult.mjs';

const site = { name: 'Morpheme', description: 'The site.' };

test('a page title gets the site name after it', () => {
  assert.equal(pageTitle({ title: 'About', front: false, siteName: 'Morpheme' }), 'About | Morpheme');
});

test('the page title is trimmed before the site name is added', () => {
  assert.equal(pageTitle({ title: '  About ', front: false, siteName: 'Morpheme' }), 'About | Morpheme');
});

test('the front page title has no site name', () => {
  assert.equal(pageTitle({ title: 'Welcome', front: true, siteName: 'Morpheme' }), 'Welcome');
});

test('without a title the site name is the title', () => {
  assert.equal(pageTitle({ title: '', front: false, siteName: 'Morpheme' }), 'Morpheme');
});

test('a blank title on the front page is the site name', () => {
  assert.equal(pageTitle({ title: '   ', front: true, siteName: 'Morpheme' }), 'Morpheme');
});

test('the SEO title is the result title when it is set', () => {
  assert.equal(searchedAs({ title: 'About', seoTitle: 'Our story', site }).title, 'Our story');
});

test('a blank SEO title falls back to the page title', () => {
  assert.equal(searchedAs({ title: 'About', seoTitle: '  ', site }).title, 'About | Morpheme');
});

test('without any title the result title is the site name', () => {
  assert.equal(searchedAs({ title: '', site }).title, 'Morpheme');
});

test('the SEO description is the result description when it is set', () => {
  const result = searchedAs({ title: 'A', seoDescription: 'Google text', description: 'Short', site });
  assert.equal(result.description, 'Google text');
});

test('the page description is used when the SEO description is blank', () => {
  const result = searchedAs({ title: 'A', seoDescription: '', description: ' Short ', site });
  assert.equal(result.description, 'Short');
});

test('the site description is used when the page has no description', () => {
  assert.equal(searchedAs({ title: 'A', site }).description, 'The site.');
});

test('the address line is https, the domain and the path parts', () => {
  assert.equal(searchCrumbs('morpheme.example', '/blog/my-post/'), 'https://morpheme.example › blog › my-post');
  assert.equal(searchCrumbs('morpheme.example', '/app-store/'), 'https://morpheme.example › app-store');
});

test('the front page address line is only https and the domain', () => {
  assert.equal(searchCrumbs('morpheme.example', '/'), 'https://morpheme.example');
});

test('an empty path gives only https and the domain', () => {
  assert.equal(searchCrumbs('morpheme.example', ''), 'https://morpheme.example');
});

test('the keyword is bold in the text, case-insensitive', () => {
  assert.deepEqual(boldParts('The App Store gives', 'app store'), [
    { text: 'The ', bold: false },
    { text: 'App Store', bold: true },
    { text: ' gives', bold: false },
  ]);
});

test('every occurrence is bold and keeps its own case', () => {
  assert.deepEqual(boldParts('app store and APP STORE', 'App Store'), [
    { text: 'app store', bold: true },
    { text: ' and ', bold: false },
    { text: 'APP STORE', bold: true },
  ]);
});

test('an empty or blank keyword gives one plain part', () => {
  assert.deepEqual(boldParts('anything', ''), [{ text: 'anything', bold: false }]);
  assert.deepEqual(boldParts('anything', '  '), [{ text: 'anything', bold: false }]);
  assert.deepEqual(boldParts('anything'), [{ text: 'anything', bold: false }]);
});

test('regex characters in the keyword match literally', () => {
  assert.deepEqual(boldParts('a.b', '.'), [
    { text: 'a', bold: false },
    { text: '.', bold: true },
    { text: 'b', bold: false },
  ]);
});

test('a path without a leading slash still gives its parts', () => {
  assert.equal(searchCrumbs('morpheme.example', 'about'), 'https://morpheme.example › about');
});
