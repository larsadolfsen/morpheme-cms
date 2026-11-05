// Tests for src/fabScreens.ts: the start screen's FAB menu and the create actions of a list. Run: node --test src/fabScreens.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { START_FAB, listFab } from './fabScreens.ts';

const standard = { value: 'standard', label: 'Standard' };
const mailchimp = { value: 'mailchimp', label: 'Mailchimp' };

test('the start screen makes a page or a blog post', () => {
  assert.deepEqual(START_FAB, ['pages', 'blog']);
});

test('a list without kinds, or with one, has one action named after its create label', () => {
  assert.deepEqual(listFab({ id: 'pages', create: 'New page' }, []), [{ label: 'New page', href: '#ny/pages' }]);
  assert.deepEqual(listFab({ id: 'popups', create: 'New promotion' }, [standard]), [{ label: 'New promotion', href: '#ny/popups' }]);
});

test('a list of several kinds has one action per kind', () => {
  assert.deepEqual(listFab({ id: 'popups', create: 'New promotion' }, [standard, mailchimp]), [
    { label: 'Standard', href: '#ny/popups/standard' },
    { label: 'Mailchimp', href: '#ny/popups/mailchimp' },
  ]);
});

test('a list that cannot make entries has no action', () => {
  assert.deepEqual(listFab({ id: 'orders' }, []), []);
  assert.deepEqual(listFab({ id: 'orders' }, [standard, mailchimp]), []);
});
