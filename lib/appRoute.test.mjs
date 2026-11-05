// Tests for appRouteOf (lib/appRoute.mjs).
import { test } from 'node:test';
import { deepEqual } from 'node:assert/strict';
import { appRouteOf, INFO_KEY, SETTINGS_KEY } from './appRoute.mjs';

test('apps/cms-version', () => {
  deepEqual(appRouteOf('apps/cms-version', 'cms-version'), { tab: 'settings' });
});

test('apps/cms-version/om', () => {
  deepEqual(appRouteOf('apps/cms-version/om', 'cms-version'), { tab: 'information' });
});

test('apps/cms-version/settings', () => {
  deepEqual(appRouteOf('apps/cms-version/settings', 'cms-version'), { tab: 'settings' });
});

test('apps/cms-version/settings/variant', () => {
  deepEqual(appRouteOf('apps/cms-version/settings/variant', 'cms-version'), {
    tab: 'settings',
    page: 'variant',
  });
});

test('apps/cms-version/settings/a/b', () => {
  deepEqual(appRouteOf('apps/cms-version/settings/a/b', 'cms-version'), null);
});

test('apps/cms-version/other', () => {
  deepEqual(appRouteOf('apps/cms-version/other', 'cms-version'), null);
});

test('apps/calendly', () => {
  deepEqual(appRouteOf('apps/calendly', 'cms-version'), null);
});

test('apps/cms-version-2', () => {
  deepEqual(appRouteOf('apps/cms-version-2', 'cms-version'), null);
});

test('empty string', () => {
  deepEqual(appRouteOf('', 'cms-version'), null);
});
