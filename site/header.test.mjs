import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { headerOf, sortedNav } from './header.mjs';

test('no file', () => {
  assert.deepEqual(headerOf(undefined), { button: null, phone: true, menuSide: 'start' });
});

test('button off', () => {
  assert.equal(headerOf({ button: { enabled: false, to: 'booking' } }).button, null);
});

test('button on', () => {
  assert.deepEqual(headerOf({ button: { enabled: true, to: 'booking', label: 'Book an appointment' } }).button, {
    to: 'booking',
    label: 'Book an appointment',
  });
});

test('phone number on by default, off when turned off', () => {
  assert.equal(headerOf({ button: { enabled: true, to: 'booking' } }).phone, true);
  assert.equal(headerOf({ button: { enabled: false, phone: false } }).phone, false);
  assert.equal(headerOf({ button: { enabled: true, phone: false, to: 'booking' } }).button?.phone, undefined);
});

test('menu at the end', () => {
  assert.equal(headerOf({ menuSide: 'end' }).menuSide, 'end');
});

test('wrong menu side', () => {
  assert.equal(headerOf({ menuSide: 'middle' }).menuSide, 'start');
});

test('wrong shapes', () => {
  assert.deepEqual(headerOf('x'), { button: null, phone: true, menuSide: 'start' });
  assert.equal(headerOf({ button: 'x' }).button, null);
});

test('sortedNav sorts the sub-items in Danish order and keeps the items in order', () => {
  const items = [
    { label: 'About', href: '/about/' },
    {
      label: 'Behandlinger',
      href: '/b/',
      children: [
        { label: '\u00d8re', href: '/b/oe/' },
        { label: 'Arm', href: '/b/a/' },
        { label: 'Zone', href: '/b/z/' },
      ],
    },
  ];
  const sorted = sortedNav(items);
  assert.deepEqual(
    sorted.map((i) => i.label),
    ['About', 'Behandlinger'],
  );
  assert.deepEqual(
    sorted[1].children.map((c) => c.label),
    ['Arm', 'Zone', '\u00d8re'],
  );
  assert.deepEqual(
    items[1].children.map((c) => c.label),
    ['\u00d8re', 'Arm', 'Zone'],
  );
});
