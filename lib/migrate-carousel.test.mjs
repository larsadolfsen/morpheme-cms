// Tests the migration of a Cards carousel (`phone: 'carousel'`) to the Carousel block (lib/migrate-carousel.mjs, wired as FORMER.cards in blocks.mjs).
// Run: node --test lib/migrate-carousel.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockHtml, migratedBlock, parseBlock } from './blocks.mjs';
import { carouselOf } from './migrate-carousel.mjs';
import { migrateMarkdown } from './migrate-content.mjs';

const items = [
  { icon: 'favorite', title: 'About', text: 'Who I am.' },
  { icon: 'forum', title: 'Contact', text: 'How to find me.', href: '/contact/' },
  { icon: 'school', title: 'Courses', text: 'What I teach.', buttons: [{ label: 'Sign up', to: 'page', kind: 'filled' }], divider: true },
];
const read = (props) => parseBlock(blockHtml('cards', props));

test('an Uncontained Cards carousel is a Carousel with the layout `uncontained`, its items cards and its variant, colour and header', () => {
  assert.deepEqual(read({ phone: 'carousel', design: 'filled', color: 'primary', header: 'Cards', items }), {
    type: 'carousel',
    props: {
      layout: 'uncontained',
      header: 'Cards',
      design: 'filled',
      color: 'primary',
      items: items.map((c) => ({ media: 'icon', card: true, ...c })),
    },
  });
});

test('a layout that was set keeps its name; the multi-aspect ratio layout has card items too, the others have none', () => {
  const photos = [
    { image: 'a.jpg', alt: 'A', aspect: '16:9', title: 'A' },
    { image: 'b.jpg', title: 'B' },
  ];
  const multi = read({ phone: 'carousel', layout: 'multi-aspect-ratio', media: 'image', items: photos });
  assert.deepEqual(multi, {
    type: 'carousel',
    props: {
      layout: 'uncontained',
      multiAspectRatio: true,
      items: [
        { card: true, image: 'a.jpg', alt: 'A', aspect: '16:9', title: 'A' },
        { card: true, image: 'b.jpg', title: 'B' },
      ],
    },
  });
  for (const layout of ['multi-browse', 'hero', 'full-screen']) {
    const b = read({ phone: 'carousel', layout, media: 'image', items: photos });
    assert.equal(b.type, 'carousel');
    assert.equal(b.props.layout, layout);
    assert.ok(b.props.items.every((c) => !('card' in c)));
  }
  // M3's two designs are settings of their layout.
  const center = read({ phone: 'carousel', layout: 'hero-center', media: 'image', items: photos });
  assert.equal(center.props.layout, 'hero');
  assert.equal(center.props.centerAligned, true);
  assert.ok(center.props.items.every((c) => !('card' in c)));
});

test("the block's media is on each item, and the fields of the other media are dropped", () => {
  const video = read({
    phone: 'carousel',
    layout: 'hero',
    media: 'video',
    items: [{ video: 'https://youtu.be/x', image: 'x.jpg', icon: 'favorite', title: 'V' }],
  });
  assert.deepEqual(video.props.items, [{ media: 'video', video: 'https://youtu.be/x', title: 'V' }]);
  const none = read({ phone: 'carousel', media: 'none', items: [{ title: 'N', icon: 'favorite' }] });
  assert.deepEqual(none.props.items, [{ media: 'none', card: true, title: 'N' }]);
});

test('a stored header is carried, an empty one is not, and the image ratio stays', () => {
  assert.equal(read({ phone: 'carousel', header: '  ', items }).props.header, undefined);
  assert.equal(read({ phone: 'carousel', media: 'image', ratio: '16:9', items: [{ image: 'a.jpg', title: 'A' }] }).props.ratio, '16:9');
});

test("a Cards block that is a grid keeps everything but the carousel's settings", () => {
  const grid = { design: 'elevated', items };
  assert.deepEqual(read(grid), { type: 'cards', props: grid });
  assert.deepEqual(read({ ...grid, phone: '', layout: 'hero', header: 'Old' }), { type: 'cards', props: grid });
});

test("the first forms of Cards that were a carousel are read as a Carousel too (old `design`, the first version's `kind`)", () => {
  const old = read({ phone: 'carousel', design: 'image', items: [{ image: 'a.jpg', title: 'A', text: 'T' }] });
  assert.deepEqual(old, {
    type: 'carousel',
    props: { layout: 'uncontained', items: [{ card: true, image: 'a.jpg', title: 'A', text: 'T' }] },
  });
  const kind = read({ phone: 'carousel', kind: 'elevated', items: [{ media: 'icon', icon: 'x', title: 'A' }] });
  assert.equal(kind.type, 'carousel');
  assert.equal(kind.props.design, 'elevated');
});

test('an elevated button of a card item is a tonal one, as on Cards', () => {
  const b = read({ phone: 'carousel', items: [{ icon: 'x', title: 'A', buttons: [{ label: 'Go', kind: 'elevated' }] }] });
  assert.equal(b.props.items[0].buttons[0].kind, 'tonal');
});

test('it is idempotent: a Carousel block is read as it is written, and the Markdown is rewritten once', () => {
  const html = blockHtml('cards', { phone: 'carousel', layout: 'hero', media: 'image', items: [{ image: 'a.jpg', title: 'A' }] });
  const once = migratedBlock(html);
  assert.equal(once.type, 'carousel');
  const written = blockHtml(once.type, once.props);
  assert.equal(migratedBlock(written), null);
  assert.deepEqual(parseBlock(written), once);
  const markdown = `Text\n\n${html}\n\nMore\n`;
  const migrated = migrateMarkdown(markdown);
  assert.ok(migrated.includes('data-block="carousel"'));
  assert.equal(migrateMarkdown(migrated), migrated);
});

test('carouselOf leaves other blocks and other types alone', () => {
  const list = { type: 'list', props: { items: [] } };
  assert.equal(carouselOf(list), list);
});
