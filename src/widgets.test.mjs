// Tests for src/widgets.ts: the widgets of the CMS and of the apps installed, by their full ids, and the check of an
// app's widgets. Run: node --test src/widgets.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allWidgets, widgetsWithoutComponent } from './widgets.ts';

const Today = () => null;
const booking = { id: 'booking', widgets: { today: { label: 'Today', hint: 'Bookings today', icon: {}, component: Today } } };
const cms = { continue: { label: 'Continue', hint: 'Pages edited last', icon: {}, component: Today } };

test('without apps and without CMS widgets there are no widgets', () => {
  assert.equal(allWidgets([], []).size, 0);
});

test('the CMS widgets are given the id cms:<key>', () => {
  const ids = [...allWidgets([], [], cms).keys()];
  assert.deepEqual(ids, ['cms:continue']);
  assert.equal(allWidgets([], [], cms).get('cms:continue'), cms.continue);
});

test('a widget of an installed app has the id <app>:<key>', () => {
  const all = allWidgets([booking], ['booking']);
  assert.equal(all.get('booking:today'), booking.widgets.today);
});

test('a widget of an app that is not installed is left out', () => {
  assert.equal(allWidgets([booking], []).has('booking:today'), false);
  assert.equal(allWidgets([booking], ['other']).has('booking:today'), false);
});

test('the widgets of the CMS come before those of the apps', () => {
  const ids = [...allWidgets([booking], ['booking'], cms).keys()];
  assert.deepEqual(ids, ['cms:continue', 'booking:today']);
});

test('an app without widgets adds none', () => {
  assert.equal(allWidgets([{ id: 'plain' }], ['plain']).size, 0);
  assert.equal(allWidgets([{ id: 'plain' }], ['plain'], cms).size, 1);
});

test('a widget without a component is named with its app and key', () => {
  const broken = { id: 'booking', widgets: { today: { label: 'Today', hint: 'x', icon: {} }, week: booking.widgets.today } };
  assert.deepEqual(widgetsWithoutComponent([broken, booking, { id: 'plain' }]), [{ app: 'booking', key: 'today' }]);
});
