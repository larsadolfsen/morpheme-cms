// Tests for src/widgets.ts: the widgets of the CMS and of the apps installed, by their full ids, and the check of an
// app's widgets. Run: node --test src/widgets.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allWidgets, widgetGroups, widgetsWithoutComponent } from './widgets.ts';

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

test('widgetGroups: the CMS group comes first, then one group per app in the order the apps first appear', () => {
  const widgets = new Map([
    ['booking:today', { label: 'Today' }],
    ['cms:continue', { label: 'Continue' }],
    ['booking:week', { label: 'Week' }],
    ['shop:orders', { label: 'Orders' }],
    ['cms:status', { label: 'Status' }],
  ]);
  const groups = widgetGroups(widgets, (source) => `Label of ${source}`);
  assert.deepEqual(
    groups.map((g) => g.source),
    ['cms', 'booking', 'shop'],
  );
  assert.deepEqual(
    groups.map((g) => g.label),
    ['Label of cms', 'Label of booking', 'Label of shop'],
  );
});

test('widgetGroups: the items keep the map order, with their full id and definition', () => {
  const continueWidget = { label: 'Continue' };
  const status = { label: 'Status' };
  const widgets = new Map([
    ['cms:status', status],
    ['cms:continue', continueWidget],
  ]);
  const [cms] = widgetGroups(widgets, (s) => s);
  assert.deepEqual(cms.items, [
    { id: 'cms:status', definition: status },
    { id: 'cms:continue', definition: continueWidget },
  ]);
});

test('widgetGroups: an app without widgets in the map has no group, and no group is empty', () => {
  assert.deepEqual(
    widgetGroups(new Map(), (s) => s),
    [],
  );
  const onlyApp = widgetGroups(new Map([['booking:today', { label: 'Today' }]]), (s) => s);
  assert.deepEqual(
    onlyApp.map((g) => g.source),
    ['booking'],
  );
  assert.ok(onlyApp.every((g) => g.items.length > 0));
});

test('widgetGroups: without CMS widgets there is no CMS group', () => {
  const groups = widgetGroups(new Map([['shop:orders', { label: 'Orders' }]]), (s) => s);
  assert.deepEqual(
    groups.map((g) => g.source),
    ['shop'],
  );
});

test('widgetGroups: an app with two widgets gives one group with both, in order', () => {
  const widgets = new Map([
    ['booking:today', { label: 'Today' }],
    ['booking:week', { label: 'Week' }],
  ]);
  const groups = widgetGroups(widgets, (s) => s);
  assert.equal(groups.length, 1);
  assert.deepEqual(
    groups[0].items.map((i) => i.id),
    ['booking:today', 'booking:week'],
  );
});
