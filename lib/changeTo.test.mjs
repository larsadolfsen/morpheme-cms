// Tests for lib/changeTo.mjs: "Change to" between List, Segmented list, Steps, FAQ list, Cards and Table. Run: node --test lib/changeTo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHANGE_TYPES, changeTo, plainOf, targets } from './changeTo.mjs';

const TITLE = { list: 'title', segmented: 'title', steps: 'title', faq: 'question', cards: 'title' };
const TEXT = { list: 'text', segmented: 'text', steps: 'text', faq: 'answer', cards: 'text' };

/** Two items of a block of `type`, the first with a text. */
const sample = (type) =>
  type === 'table'
    ? {
        rows: [
          ['Opening hours', 'Mon–Fri'],
          ['Parking', ''],
        ],
        header: false,
      }
    : { items: [{ [TITLE[type]]: 'Opening hours', [TEXT[type]]: 'Mon–Fri' }, { [TITLE[type]]: 'Parking' }] };

/** The titles and texts of a block's items (the Table's body rows). */
function shown(type, props) {
  if (type === 'table') {
    const body = props.header === false ? props.rows : props.rows.slice(1);
    return body.map(([title, text = '']) => [title, text]);
  }
  return props.items.map((i) => [i[TITLE[type]], i[TEXT[type]] ?? '']);
}

test('every pair of the six: the titles and texts move over', () => {
  for (const from of CHANGE_TYPES) {
    for (const to of CHANGE_TYPES) {
      if (from === to) continue;
      const out = changeTo(from, to, sample(from));
      assert.deepEqual(
        shown(to, out),
        [
          ['Opening hours', 'Mon–Fri'],
          ['Parking', ''],
        ],
        `${from} → ${to}`,
      );
    }
  }
});

test('every pair, there and back with nothing edited: the block is as it was', () => {
  const rich = {
    list: {
      items: [{ icon: 'clock', iconColor: 'secondary', title: 'Opening hours', text: 'Mon–Fri', href: '/contact/' }, { title: 'Parking' }],
    },
    segmented: {
      eyebrow: 'Visit',
      heading: 'Info',
      only: 2,
      items: [
        { icon: 'clock', title: 'Opening hours', text: 'Mon–Fri', buttons: [{ label: 'Call', href: 'tel:1' }] },
        { title: 'Parking' },
      ],
    },
    steps: { heading: 'How', items: [{ title: 'Order', text: 'Online' }, { title: 'Pay' }] },
    faq: {
      items: [{ question: 'Open?', answer: 'Yes, **Mon–Fri**.\n\n- [Call](tel:1)\n- Mail' }, { question: 'Parking?' }],
      button: 'More',
      buttonHref: '/faq/',
    },
    cards: {
      design: 'outlined',
      items: [
        { title: 'Tea', subhead: 'Hot', text: 'Green', image: '/i/tea.jpg', alt: 'A cup', href: '/tea/', buttons: [{ label: 'Buy' }] },
        { title: 'Video', video: 'https://youtu.be/x', icon: 'play' },
      ],
    },
    table: {
      rows: [
        ['Name', 'Price', 'Size'],
        ['Tea', '4', 'S'],
        ['Cake', '', 'L'],
      ],
      striped: true,
      columns: [{}, { align: 'right' }],
    },
  };
  for (const a of CHANGE_TYPES) {
    for (const b of CHANGE_TYPES) {
      if (a === b) continue;
      const back = changeTo(b, a, changeTo(a, b, rich[a]));
      if (a === 'table') {
        for (const key of ['rows', 'header', 'striped', 'columns'])
          assert.deepEqual(back[key], rich.table[key], `${a} → ${b} → ${a}: ${key}`);
      } else {
        assert.deepEqual(back.items, rich[a].items, `${a} → ${b} → ${a}`);
        for (const [key, value] of Object.entries(rich[a])) assert.deepEqual(back[key], value, `${a} → ${b} → ${a}: ${key}`);
      }
    }
  }
});

test('a block keeps every prop, and the items the keys the new block does not draw', () => {
  const list = {
    hidden: true,
    items: [{ icon: 'clock', title: 'Opening hours', text: 'Mon–Fri', href: '/contact' }, { title: 'Parking' }],
  };
  const steps = changeTo('list', 'steps', list);
  assert.deepEqual(steps, list);
  const faq = changeTo('steps', 'faq', steps);
  assert.deepEqual(faq, {
    hidden: true,
    items: [{ icon: 'clock', question: 'Opening hours', answer: 'Mon–Fri', href: '/contact' }, { question: 'Parking' }],
  });
  const table = changeTo('faq', 'table', faq);
  assert.deepEqual(table.rows, [
    ['Opening hours', 'Mon–Fri'],
    ['Parking', ''],
  ]);
  assert.equal(table.header, false);
  assert.deepEqual(table.items, faq.items);
  const back = changeTo('table', 'list', table);
  assert.deepEqual(back.items, list.items);
  assert.deepEqual(back.rows, table.rows);
  assert.equal(back.header, false);
});

test('Cards → List → Cards keeps the subhead, image, alt, video and buttons', () => {
  const cards = {
    items: [
      {
        title: 'Tea',
        subhead: 'Hot',
        text: 'Green',
        image: '/i/tea.jpg',
        alt: 'A cup',
        video: 'https://youtu.be/x',
        buttons: [{ label: 'Buy' }],
      },
    ],
  };
  const list = changeTo('cards', 'list', cards);
  assert.deepEqual(list.items[0].subhead, 'Hot');
  assert.deepEqual(changeTo('list', 'cards', list), cards);
});

test('a FAQ answer is plain text in another block, its Markdown back when the text was not edited', () => {
  const faq = { items: [{ question: 'Open?', answer: 'Yes, **Mon–Fri**, see [the map](/map/).' }] };
  const list = changeTo('faq', 'list', faq);
  assert.deepEqual(list.items[0], { title: 'Open?', text: 'Yes, Mon–Fri, see the map.', answer: faq.items[0].answer });
  assert.deepEqual(changeTo('list', 'faq', list), faq);
  const edited = { items: [{ ...list.items[0], text: 'Only on Mondays.' }] };
  assert.deepEqual(changeTo('list', 'faq', edited), { items: [{ question: 'Open?', answer: 'Only on Mondays.' }] });
  // A plain answer keeps nothing extra.
  assert.deepEqual(changeTo('faq', 'steps', { items: [{ question: 'Q', answer: 'A' }] }), { items: [{ title: 'Q', text: 'A' }] });
});

test('plain text of Markdown: formatting dropped, a list one item per line', () => {
  assert.equal(plainOf('**Bold** and *it* and _it_ and `code`'), 'Bold and it and it and code');
  assert.equal(plainOf('See [the map](/map/)\n\n- One\n- Two\n1. Three'), 'See the map\nOne\nTwo\nThree');
  assert.equal(plainOf('snake_case_word 2 * 3 = 6'), 'snake_case_word 2 * 3 = 6');
});

test('a text with line breaks is one line in a Table cell, and the item’s own text when it comes back unedited', () => {
  const steps = { items: [{ title: 'Order', text: 'Online\nor by phone' }] };
  const table = changeTo('steps', 'table', steps);
  assert.deepEqual(table.rows, [['Order', 'Online or by phone']]);
  assert.deepEqual(changeTo('table', 'steps', table).items, steps.items);
  const edited = { ...table, rows: [['Order', 'In the shop']] };
  assert.deepEqual(changeTo('table', 'steps', edited).items, [{ title: 'Order', text: 'In the shop' }]);
});

test('Table matching: a moved row keeps its icon, an edited title loses it, a removed row drops its kept item', () => {
  const list = {
    items: [
      { icon: 'clock', title: 'Hours', text: 'Mon–Fri' },
      { icon: 'car', title: 'Parking', text: 'Free' },
      { icon: 'wifi', title: 'Wi-Fi' },
    ],
  };
  const table = changeTo('list', 'table', list);
  const edited = {
    ...table,
    rows: [
      ['Parking', 'Free'],
      ['Hours!', 'Mon–Fri'],
      ['New', ''],
    ],
  };
  assert.deepEqual(changeTo('table', 'list', edited).items, [
    { icon: 'car', title: 'Parking', text: 'Free' },
    { title: 'Hours!', text: 'Mon–Fri' },
    { title: 'New' },
  ]);
});

test('Table → List → Table: the header row and the cells from column 3 on come back', () => {
  const table = {
    rows: [
      ['Name', 'Price', 'Size'],
      ['Tea', '4', 'S'],
      ['Cake', '5', 'L'],
    ],
  };
  const list = changeTo('table', 'list', table);
  assert.deepEqual(list.items, [
    { title: 'Tea', text: '4' },
    { title: 'Cake', text: '5' },
  ]);
  const moved = { ...list, items: [list.items[1], list.items[0], { title: 'Pie' }] };
  const back = changeTo('list', 'table', moved);
  assert.equal(back.header, undefined);
  assert.deepEqual(back.rows, [
    ['Name', 'Price', 'Size'],
    ['Cake', '5', 'L'],
    ['Tea', '4', 'S'],
    ['Pie', '', ''],
  ]);
});

test('a block made into a Table: one column when no item has a text, no header row', () => {
  const out = changeTo('steps', 'table', { items: [{ title: 'Order' }, { title: 'Pay' }] });
  assert.deepEqual(out.rows, [['Order'], ['Pay']]);
  assert.equal(out.header, false);
  assert.deepEqual(changeTo('steps', 'table', { items: [] }).rows, [['']]);
});

test('a row titled by its page: the shown title moves, and the link is kept', () => {
  const titleOf = (item) => (item.href === '/contact/' ? 'Contact' : undefined);
  const list = { items: [{ href: '/contact/', text: 'Call us' }] };
  assert.deepEqual(changeTo('list', 'steps', list, titleOf).items, [{ title: 'Contact', text: 'Call us', href: '/contact/' }]);
  assert.deepEqual(changeTo('list', 'segmented', list, titleOf).items, list.items);
  const table = changeTo('list', 'table', list, titleOf);
  assert.deepEqual(table.rows, [['Contact', 'Call us']]);
  assert.deepEqual(changeTo('table', 'list', table, titleOf).items, list.items);
});

test('a block saved before is not changed by itself, and a change to the same block changes nothing', () => {
  const list = { items: [{ title: 'A' }] };
  assert.deepEqual(changeTo('list', 'list', list), list);
  assert.deepEqual(changeTo('list', 'gallery', list), list);
  assert.notEqual(changeTo('list', 'steps', list), list);
  assert.deepEqual(list, { items: [{ title: 'A' }] });
});

test('targets: the other five; three while reading a list; none when locked; the template’s limits', () => {
  assert.deepEqual(targets('list', {}), ['segmented', 'steps', 'faq', 'cards', 'table']);
  assert.deepEqual(targets('table', { rows: [] }), ['list', 'segmented', 'steps', 'faq', 'cards']);
  assert.deepEqual(targets('list', { from: 'blog' }), ['segmented', 'faq']);
  assert.deepEqual(targets('faq', { from: 'blog' }), ['list', 'segmented']);
  assert.deepEqual(targets('list', {}, { locked: ['list'] }), []);
  assert.deepEqual(targets('list', {}, { stays: true }), []);
  assert.deepEqual(targets('gallery', {}), []);
  assert.deepEqual(targets('list', {}, { blocks: ['list', 'steps', 'table'] }), ['steps', 'table']);
  assert.deepEqual(targets('list', {}, { max: { steps: 1, faq: 2 }, have: { steps: 1, faq: 1 } }), ['segmented', 'faq', 'cards', 'table']);
});
