/**
 * Tests for the Appstore's categories (categoryOf, CATEGORIES, SUBCATEGORIES, LEGACY_CATEGORIES).
 * Run with `node --test lib/storeCategories.test.mjs` (part of npm test).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, SUBCATEGORIES, LEGACY_CATEGORIES, categoryOf } from './storeCategories.mjs';

test('has the 13 main categories, alphabetical', () => {
  assert.deepEqual(CATEGORIES, [
    'analytics',
    'appearance',
    'booking',
    'connectors',
    'email',
    'forms',
    'languages',
    'payments',
    'privacy',
    'security',
    'seo',
    'shop',
    'social',
  ]);
  assert.deepEqual([...CATEGORIES].sort(), CATEGORIES);
});

test('every main category has a list of subcategories; only seo has any (links, redirects)', () => {
  assert.deepEqual(Object.keys(SUBCATEGORIES), CATEGORIES);
  for (const [id, list] of Object.entries(SUBCATEGORIES)) assert.deepEqual(list, id === 'seo' ? ['links', 'redirects'] : []);
});

test('every legacy id maps to a main category, and its subcategory is listed for it', () => {
  for (const { category, subcategory } of Object.values(LEGACY_CATEGORIES)) {
    assert.ok(CATEGORIES.includes(category));
    if (subcategory) assert.ok(SUBCATEGORIES[category].includes(subcategory));
  }
});

test('keeps a main category', () => {
  for (const id of CATEGORIES) assert.deepEqual(categoryOf(id), { category: id });
});

test('maps a legacy id to its new one', () => {
  assert.deepEqual(categoryOf('newsletter'), { category: 'email' });
  assert.deepEqual(categoryOf('payment'), { category: 'payments' });
  assert.deepEqual(categoryOf('design'), { category: 'appearance' });
});

test('maps the old types redirects and links to subcategories of seo', () => {
  assert.deepEqual(categoryOf('redirects'), { category: 'seo', subcategory: 'redirects' });
  assert.deepEqual(categoryOf('links'), { category: 'seo', subcategory: 'links' });
  assert.deepEqual(categoryOf('seo', 'redirects'), { category: 'seo', subcategory: 'redirects' });
  assert.deepEqual(categoryOf('seo', 'links'), { category: 'seo', subcategory: 'links' });
  // A subcategory given with the category wins over the one a legacy id implies.
  assert.deepEqual(categoryOf('redirects', 'links'), { category: 'seo', subcategory: 'links' });
  assert.deepEqual(categoryOf('seo'), { category: 'seo' });
});

test('drops the old content id and unknown ids', () => {
  assert.deepEqual(categoryOf('content'), {});
  assert.deepEqual(categoryOf('nonsense'), {});
  assert.deepEqual(categoryOf(''), {});
  assert.deepEqual(categoryOf('toString'), {});
  assert.deepEqual(categoryOf('__proto__', 'x'), {});
});

test('accepts only text as a category and never throws', () => {
  for (const x of [undefined, null, 1, true, {}, [], ['seo'], () => 'seo']) {
    assert.deepEqual(categoryOf(x), {});
    assert.deepEqual(categoryOf(x, 'x'), {});
  }
});

test('drops a subcategory that is not listed', () => {
  assert.deepEqual(categoryOf('seo', 'sitemap'), { category: 'seo' });
  assert.deepEqual(categoryOf('payment', 'cards'), { category: 'payments' });
  assert.deepEqual(categoryOf(undefined, 'sitemap'), {});
});

test('keeps a subcategory listed for its own category', () => {
  const lists = { seo: ['sitemap'], payments: ['cards', 'invoices'] };
  assert.deepEqual(categoryOf('seo', 'sitemap', lists), { category: 'seo', subcategory: 'sitemap' });
  // A legacy id is mapped first, then its subcategory is looked up under the new id.
  assert.deepEqual(categoryOf('payment', 'cards', lists), { category: 'payments', subcategory: 'cards' });
});

test('drops a subcategory of another category, or one that is not text', () => {
  const lists = { seo: ['sitemap'], payments: ['cards'] };
  assert.deepEqual(categoryOf('payments', 'sitemap', lists), { category: 'payments' });
  assert.deepEqual(categoryOf('forms', 'sitemap', lists), { category: 'forms' });
  assert.deepEqual(categoryOf('seo', 1, lists), { category: 'seo' });
  assert.deepEqual(categoryOf('seo', ['sitemap'], lists), { category: 'seo' });
  assert.deepEqual(categoryOf('seo', undefined, lists), { category: 'seo' });
});

test('does not read inherited keys of the lists', () => {
  assert.deepEqual(categoryOf('seo', 'constructor', {}), { category: 'seo' });
  assert.deepEqual(categoryOf('seo', 'x', { seo: 'x' }), { category: 'seo' });
});
