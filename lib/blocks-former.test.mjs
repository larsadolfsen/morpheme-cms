// Tests the blocks that have become another (FORMER in blocks.mjs): a "List" with each row on its own surface (`design: segmented`) and a "Segmented
// list" whose rows are always open are a "List" with the design `card`; a "Segmented list" that folds out and an "Accordion" are a "List - Expand" with
// the design `card`; any other "List" stays a list. Run: node --test lib/blocks-former.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockHtml, blocksIn, parseBlock, splitBlocks } from './blocks.mjs';

const items = [{ title: 'One', text: 'First', href: '/a' }, { title: 'Two' }];

test('a segmented List is a List with the design segmented', () => {
  const b = parseBlock(blockHtml('list', { heading: 'H', design: 'segmented', items }));
  assert.deepEqual(b, { type: 'list', props: { heading: 'H', items, design: 'segmented' } });
});

test('a List with the design segmented is read as it is written, in the same order of its props', () => {
  const props = { items, design: 'segmented', maxRows: 3 };
  assert.deepEqual(parseBlock(blockHtml('list', props)), { type: 'list', props });
});

test('a Segmented list whose rows are always open is a List with the design segmented; its row buttons, never drawn there, go with `show` and `only`', () => {
  const rows = [{ title: 'One', buttons: [{ label: 'More', href: '/m/' }] }, { title: 'Two' }];
  assert.deepEqual(parseBlock(blockHtml('segmented', { heading: 'H', show: 'all', only: true, maxRows: 2, button: 'All', items: rows })), {
    type: 'list',
    props: { heading: 'H', maxRows: 2, button: 'All', design: 'segmented', items: [{ title: 'One' }, { title: 'Two' }] },
  });
});

test('a Segmented list that folds out is a List - Expand with the design segmented, with all its settings and rows', () => {
  const rows = [{ title: 'One', text: 'First', href: '/a/', buttons: [{ label: 'More', href: '/m/' }] }];
  assert.deepEqual(parseBlock(blockHtml('segmented', { heading: 'H', only: false, maxRows: 4, columns: false, items: rows })), {
    type: 'expand',
    props: { heading: 'H', maxRows: 4, columns: false, design: 'segmented', only: false, items: rows },
  });
  assert.deepEqual(parseBlock(blockHtml('segmented', { show: '', items: rows })), {
    type: 'expand',
    props: { design: 'segmented', items: rows },
  });
  assert.deepEqual(parseBlock(blockHtml('segmented', { from: 'testimonials', howMany: 3, button: 'All' })), {
    type: 'expand',
    props: { from: 'testimonials', howMany: 3, button: 'All', design: 'segmented' },
  });
});

test('a List - Expand is read as it is written', () => {
  const props = { design: 'segmented', items };
  assert.deepEqual(parseBlock(blockHtml('expand', props)), { type: 'expand', props });
});

test('a standard List stays a List, with or without an empty design', () => {
  assert.deepEqual(parseBlock(blockHtml('list', { items })), { type: 'list', props: { items } });
  assert.deepEqual(parseBlock(blockHtml('list', { design: '', items })), { type: 'list', props: { items } });
});

test('it is read the same everywhere a text is read', () => {
  const html = `<p>x</p>${blockHtml('list', { design: 'segmented', items })}`;
  assert.deepEqual(
    blocksIn(html).map((x) => x.type),
    ['list'],
  );
  assert.deepEqual(
    splitBlocks(html, ['list'])
      .filter((p) => p.type)
      .map((p) => p.props.design),
    ['segmented'],
  );
  assert.equal(splitBlocks(html, ['segmented']).filter((p) => p.type).length, 0);
});

test('a hidden segmented List stays hidden', () => {
  assert.equal(splitBlocks(blockHtml('list', { design: 'segmented', hidden: true, items }), ['list']).filter((p) => p.type).length, 0);
});

test('Links are a List: a group is a heading row followed by a row for each of its pages', () => {
  const groups = [
    { title: 'Learn', href: '/learn/', paths: ['/a/', '/b/'] },
    { title: 'Help', paths: ['/c/'] },
  ];
  assert.deepEqual(parseBlock(blockHtml('links', { heading: 'Find it', groups })), {
    type: 'list',
    props: {
      heading: 'Find it',
      items: [{ title: 'Learn', href: '/learn/' }, { href: '/a/' }, { href: '/b/' }, { title: 'Help' }, { href: '/c/' }],
    },
  });
});

test('Points with icon are a List: icon, heading, text and page are a row; the link text goes', () => {
  const items = [
    { icon: 'train', title: 'Fast', text: 'Quick', href: '/a/', more: 'Read more' },
    { icon: 'clock', title: 'On time', text: 'Always' },
  ];
  assert.deepEqual(parseBlock(blockHtml('points', { eyebrow: 'E', heading: 'H', intro: 'I', items })), {
    type: 'list',
    props: {
      eyebrow: 'E',
      heading: 'H',
      intro: 'I',
      items: [
        { icon: 'train', title: 'Fast', text: 'Quick', href: '/a/' },
        { icon: 'clock', title: 'On time', text: 'Always' },
      ],
    },
  });
});

test('an Accordion is a List - Expand with the design segmented: label is the heading, href and text stay', () => {
  const rows = [
    { label: 'Prices', href: '/prices/', text: 'Our prices' },
    { label: 'Contact', href: '/contact/', text: '  ' },
  ];
  assert.deepEqual(parseBlock(blockHtml('accordion', { heading: 'Topics', intro: 'Hi', items: rows })), {
    type: 'expand',
    props: {
      heading: 'Topics',
      intro: 'Hi',
      design: 'segmented',
      items: [
        { title: 'Prices', text: 'Our prices', href: '/prices/' },
        { title: 'Contact', href: '/contact/' },
      ],
    },
  });
});

test("an Accordion with links to more pages is a List - Expand: the links are the row's buttons", () => {
  const items = [
    {
      label: 'Prices',
      href: '/prices/',
      more: [
        { label: 'Hourly', href: '/prices/hourly/' },
        { label: 'Fixed', href: '/prices/fixed/' },
      ],
    },
    { label: 'Contact', more: [] },
  ];
  assert.deepEqual(parseBlock(blockHtml('accordion', { items })), {
    type: 'expand',
    props: {
      design: 'segmented',
      items: [
        {
          title: 'Prices',
          href: '/prices/',
          buttons: [
            { label: 'Hourly', href: '/prices/hourly/' },
            { label: 'Fixed', href: '/prices/fixed/' },
          ],
        },
        { title: 'Contact' },
      ],
    },
  });
});

test('Testimonials: the carousel layout is Cards, List stays, and no layout stays none', () => {
  assert.deepEqual(parseBlock(blockHtml('testimonials', { layout: 'slider', show: 'front' })), {
    type: 'testimonials',
    props: { show: 'front', layout: 'cards' },
  });
  assert.deepEqual(parseBlock(blockHtml('testimonials', { layout: 'list', filter: false })), {
    type: 'testimonials',
    props: { layout: 'list', filter: false },
  });
  assert.deepEqual(parseBlock(blockHtml('testimonials', { show: 'front' })), { type: 'testimonials', props: { show: 'front' } });
});

test('a List row that was a small heading is a plain row with the same title and page', () => {
  const items = [
    { title: 'Learn', heading: true, href: '/learn/' },
    { title: 'A', text: 'T' },
    { title: 'Help', heading: true },
  ];
  assert.deepEqual(parseBlock(blockHtml('list', { items })), {
    type: 'list',
    props: { items: [{ title: 'Learn', href: '/learn/' }, { title: 'A', text: 'T' }, { title: 'Help' }] },
  });
  assert.deepEqual(parseBlock(blockHtml('list', { design: 'segmented', items }))?.props.items[2], { title: 'Help' });
});

test("Cards from before: the block's design is its one media, Standard stays Outlined, and the accent background is a filled card in the primary colour", () => {
  // No design, no background: an icon card, outlined, as the new form says it too: read as it is.
  const standard = { items: [{ icon: 'heart', title: 'A', text: 'T', href: '/a/' }] };
  assert.deepEqual(parseBlock(blockHtml('cards', standard)), { type: 'cards', props: standard });
  const image = parseBlock(blockHtml('cards', { design: 'image', items: [{ icon: 'x', image: 'x.jpg', title: 'A', text: 'T' }] }));
  assert.deepEqual(image, { type: 'cards', props: { media: 'image', items: [{ title: 'A', text: 'T', image: 'x.jpg' }] } });
  const icon = parseBlock(blockHtml('cards', { design: 'icon', items: [{ icon: 'heart', title: 'A', text: 'T' }] }));
  assert.deepEqual(icon, { type: 'cards', props: { items: [{ icon: 'heart', title: 'A', text: 'T' }] } });
  const text = parseBlock(blockHtml('cards', { design: 'text', background: 'accent', heading: 'H', items: [{ title: 'A', text: 'T' }] }));
  assert.deepEqual(text, {
    type: 'cards',
    props: { heading: 'H', design: 'filled', color: 'primary', media: 'none', items: [{ title: 'A', text: 'T' }] },
  });
  const plain = parseBlock(blockHtml('cards', { design: 'text', background: '', items: [{ title: 'A', text: 'T' }] }));
  assert.deepEqual(plain, { type: 'cards', props: { media: 'none', items: [{ title: 'A', text: 'T' }] } });
});

test("Cards of the first Material 3 version: the type is the design, and the first card's media is the block's", () => {
  const first = parseBlock(
    blockHtml('cards', {
      kind: 'elevated',
      items: [
        { media: 'video', video: 'https://youtu.be/abc', title: 'A', text: 'T' },
        { media: 'image', image: 'x.jpg', title: 'B', text: 'T' },
      ],
    }),
  );
  assert.deepEqual(first, {
    type: 'cards',
    props: {
      design: 'elevated',
      media: 'video',
      items: [
        { video: 'https://youtu.be/abc', title: 'A', text: 'T' },
        { title: 'B', text: 'T' },
      ],
    },
  });
  const filled = parseBlock(
    blockHtml('cards', { kind: 'filled', color: 'tertiary', items: [{ media: 'icon', icon: 'heart', title: 'A', text: 'T' }] }),
  );
  assert.deepEqual(filled, {
    type: 'cards',
    props: { design: 'filled', color: 'tertiary', items: [{ icon: 'heart', title: 'A', text: 'T' }] },
  });
});

test('A card with a page and buttons keeps the page (a card with a page is one link)', () => {
  const both = parseBlock(
    blockHtml('cards', {
      items: [{ media: 'icon', title: 'A', text: 'T', href: '/a/', buttons: [{ label: 'Go', to: 'page', href: '/b/' }] }],
    }),
  );
  assert.deepEqual(both, { type: 'cards', props: { items: [{ title: 'A', text: 'T', href: '/a/' }] } });
});

test('Cards in the new form are read as they are', () => {
  const props = {
    design: 'elevated',
    media: 'video',
    items: [
      { video: 'https://youtu.be/abc', title: 'A', subhead: 'S', text: 'T' },
      { title: 'B', buttons: [{ label: 'Go', to: 'page', href: '/b/' }] },
    ],
  };
  assert.deepEqual(parseBlock(blockHtml('cards', props)), { type: 'cards', props });
  const filled = { design: 'filled', color: 'secondary', items: [{ icon: 'heart', title: 'A' }] };
  assert.deepEqual(parseBlock(blockHtml('cards', filled)), { type: 'cards', props: filled });
});

test('An old Standard card (v0.16.0: design, background) opens as Outlined, the old colored background as Filled in the primary container, and both save back the same', () => {
  const standard = parseBlock(
    blockHtml('cards', { design: 'icon', background: '', items: [{ icon: 'heart', title: 'A', text: 'T', href: '/a/' }] }),
  );
  // No design: Outlined; an icon: the block's default media.
  assert.deepEqual(standard, { type: 'cards', props: { items: [{ icon: 'heart', title: 'A', text: 'T', href: '/a/' }] } });
  const colored = parseBlock(blockHtml('cards', { design: 'text', background: 'accent', items: [{ title: 'A', text: 'T' }] }));
  assert.deepEqual(colored, {
    type: 'cards',
    props: { design: 'filled', color: 'primary', media: 'none', items: [{ title: 'A', text: 'T' }] },
  });
  // Saved back, the same form is read as it is.
  for (const read of [standard, colored]) assert.deepEqual(parseBlock(blockHtml('cards', read.props)), read);
});

test('A saved elevated button (a choice Buttons, Cards and Price cards no longer offer) is read as tonal, and the other kinds stay', () => {
  const buttons = parseBlock(
    blockHtml('buttons', {
      items: [{ label: 'A', kind: 'elevated' }, { label: 'B', kind: 'filled' }, { label: 'C' }],
    }),
  );
  assert.deepEqual(
    buttons.props.items.map((b) => b.kind),
    ['tonal', 'filled', undefined],
  );
  for (const type of ['cards', 'pricecards']) {
    const block = parseBlock(blockHtml(type, { items: [{ title: 'A', buttons: [{ label: 'Go', kind: 'elevated' }] }] }));
    assert.equal(block.props.items[0].buttons[0].kind, 'tonal', type);
  }
  // A cards design `elevated` is a card, not a button: unchanged.
  assert.equal(parseBlock(blockHtml('cards', { design: 'elevated', items: [{ title: 'A' }] })).props.design, 'elevated');
});

test('a FAQ list is a List - Expand marked as a FAQ in the design segmented: each question is a heading, each answer the text, the rest stays', () => {
  const rows = [{ question: 'Open?', answer: 'Yes, **Mon–Fri**.' }, { question: 'Parking?' }];
  assert.deepEqual(
    parseBlock(blockHtml('faq', { heading: 'H', only: false, columns: false, button: 'More', buttonHref: '/faq/', items: rows })),
    {
      type: 'expand',
      props: {
        heading: 'H',
        only: false,
        columns: false,
        button: 'More',
        buttonHref: '/faq/',
        design: 'segmented',
        faq: true,
        items: [{ title: 'Open?', text: 'Yes, **Mon–Fri**.' }, { title: 'Parking?' }],
      },
    },
  );
});

test('a FAQ list that reads its rows from a list keeps what it has and is a List - Expand marked as a FAQ', () => {
  assert.deepEqual(parseBlock(blockHtml('faq', { from: 'blog', howMany: 3 })), {
    type: 'expand',
    props: { from: 'blog', howMany: 3, design: 'segmented', faq: true },
  });
});
